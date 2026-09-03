"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSettings } from "@/store/settings";
import { useBridge } from "@/store/bridge";
import { useActivityLog } from "@/store/activity-log";
import { parseCookieFile, type Cookie } from "@/lib/cookies";

const ORIGIN = () => window.location.origin;

/** Set while a sync was triggered by an auth failure (to log when it lands). */
let authResyncPending = false;
let activeCookieSync: Promise<Cookie[] | null> | null = null;
let resolveCookieSync: ((cookies: Cookie[] | null) => void) | null = null;

/** Ask the extension (if installed) to push the current samsung.com cookies. */
export function requestCookieSync() {
  window.postMessage({ source: "aem-cookie-bridge-request" }, ORIGIN());
}

/** Request fresh cookies and wait for the bridge response. Concurrent callers share one sync. */
function waitForCookieSync(): Promise<Cookie[] | null> {
  if (activeCookieSync) return activeCookieSync;
  activeCookieSync = new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      resolveCookieSync = null;
      activeCookieSync = null;
      resolve(null);
    }, 5000);
    resolveCookieSync = (cookies) => {
      window.clearTimeout(timeout);
      resolveCookieSync = null;
      activeCookieSync = null;
      resolve(cookies);
    };
    requestCookieSync();
  });
  return activeCookieSync;
}

/**
 * React to an API authentication failure: silently re-sync cookies from the
 * extension (no popup). If the extension isn't available, notify the user.
 */
export async function handleAuthFailure(): Promise<Cookie[] | null> {
  if (useBridge.getState().available) {
    toast.info("Authentication failed — re-syncing cookies…");
    useActivityLog.getState().log("warn", "Authentication failed — re-syncing cookies");
    authResyncPending = true;
    // Don't let a stale flag mislabel a later manual sync.
    setTimeout(() => (authResyncPending = false), 8000);
    return waitForCookieSync();
  } else {
    toast.error("Authentication failed", {
      description:
        "Cookie bridge extension not available — sync manually or paste a fresh cURL.",
    });
    useActivityLog
      .getState()
      .log("error", "Authentication failed — cookie bridge not available");
    return null;
  }
}

interface BridgeMessage {
  source: string;
  cookies?: unknown[];
}

function asBridgeMessage(data: unknown): BridgeMessage | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as BridgeMessage;
  return typeof d.source === "string" ? d : null;
}

/**
 * Single mount-point that wires the AEM Cookie Bridge extension to the app:
 *   - listens for cookies pushed from its content script
 *   - tracks whether the extension is present
 * Call this once near the root.
 */
export function useCookieBridgeListener() {
  const setCookies = useSettings((s) => s.setCookies);
  const { setAvailable, setLastSync } = useBridge();

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;

      const msg = asBridgeMessage(event.data);
      if (!msg) return;

      if (msg.source === "aem-cookie-bridge-ready") {
        setAvailable(true);
        requestCookieSync();
        return;
      }
      if (msg.source === "aem-cookie-bridge" && Array.isArray(msg.cookies)) {
        const jar = parseCookieFile(JSON.stringify(msg.cookies));
        setCookies(jar);
        setLastSync(jar.length);
        setAvailable(true);
        resolveCookieSync?.(jar);
        toast.success(`Synced ${jar.length} cookies from the extension`);
        if (authResyncPending) {
          authResyncPending = false;
          useActivityLog
            .getState()
            .log(
              "success",
              `Cookies re-synced (${jar.length}) after authentication failure`
            );
        }
      }
    }

    window.addEventListener("message", onMessage);
    // In case the content script loaded before this listener mounted.
    window.postMessage({ source: "aem-cookie-bridge-ping" }, window.location.origin);

    return () => window.removeEventListener("message", onMessage);
  }, [setCookies, setAvailable, setLastSync]);
}
