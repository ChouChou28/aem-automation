"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Cable, CheckCircle2, Cookie, FileKey2, RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { useBridge } from "@/store/bridge";
import { requestCookieSync } from "@/hooks/use-cookie-bridge";

export function CookieManager() {
  const cookies = useSettings((state) => state.cookies);
  const cookieFileName = useSettings((state) => state.cookieFileName);
  const importCurl = useSettings((state) => state.importCurl);
  const clearCookies = useSettings((state) => state.clearCookies);
  const available = useBridge((state) => state.available);
  const lastSync = useBridge((state) => state.lastSync);
  const [draft, setDraft] = useState("");
  const [syncing, setSyncing] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!syncing) return;
    setSyncing(false);
    if (syncTimer.current) clearTimeout(syncTimer.current);
  }, [lastSync]); // eslint-disable-line react-hooks/exhaustive-deps

  function sync() {
    if (!available) {
      toast.error("Cookie Bridge is not connected", { description: "Open the extension and save this app URL first." });
      return;
    }
    setSyncing(true);
    requestCookieSync();
    syncTimer.current = setTimeout(() => setSyncing(false), 4000);
  }

  function applyCurl() {
    const count = importCurl(draft);
    if (!count) {
      toast.error("No cookies found", { description: "Copy the request as cURL with its Cookie header included." });
      return;
    }
    setDraft("");
    toast.success(`Imported ${count} cookies`);
  }

  const authenticated = cookies.length > 0;
  return <div className="space-y-5">
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg", authenticated ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground")}>
            {authenticated ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <ShieldCheck className="size-5" aria-hidden="true" />}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Session status</p>
            <h2 className="mt-1 text-lg font-semibold">{authenticated ? "Authentication ready" : "Authentication required"}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{authenticated ? `${cookies.length} cookies are available for authenticated AEM requests.` : "Connect the browser extension or import a fresh authenticated request."}</p>
          </div>
        </div>
        <Button variant="success" onClick={sync} loading={syncing} disabled={!available} className="sm:min-w-36">
          {!syncing && <RefreshCw />}{syncing ? "Syncing…" : "Sync session"}
        </Button>
      </div>
      <div className="grid border-t border-border bg-muted/35 sm:grid-cols-3 sm:divide-x sm:divide-y-0 divide-border">
        <StatusItem icon={<Cable />} label="Cookie Bridge" value={available ? "Connected" : "Not detected"} positive={available} />
        <StatusItem icon={<Cookie />} label="Cookies loaded" value={String(cookies.length)} positive={authenticated} />
        <StatusItem icon={<FileKey2 />} label="Credential source" value={authenticated ? cookieFileName : "None"} positive={authenticated} />
      </div>
    </Card>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6"><h3 className="text-sm font-semibold">Import from cURL</h3><p className="mt-1 text-xs text-muted-foreground">Fallback method when the browser extension is unavailable.</p></div>
        <div className="p-5 sm:p-6">
          <label htmlFor="curl-import" className="text-sm font-medium">Authenticated cURL command</label>
          <textarea id="curl-import" value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} spellCheck={false} placeholder="curl 'https://p6-ap-author.samsung.com/...' -H 'cookie: ...'" className="mt-2 w-full resize-y rounded-md border border-input bg-muted/20 p-3 font-mono text-xs leading-relaxed outline-none transition-shadow focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" />
          <p className="mt-2 text-xs text-muted-foreground">Cookie values stay in this browser and are only sent through the local AEM proxy.</p>
          <div className="mt-4 flex justify-end"><Button onClick={applyCurl} disabled={!draft.trim()}><Save />Import credentials</Button></div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4"><h3 className="text-sm font-semibold">Session controls</h3><p className="mt-1 text-xs text-muted-foreground">Manage locally stored authentication data.</p></div>
        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs font-semibold text-foreground">Future-ready authentication</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">This page is structured to support a direct login flow when AEM authentication becomes available.</p></div>
          <Button variant="outline" className="w-full text-destructive hover:text-destructive" disabled={!authenticated} onClick={() => { clearCookies(); toast.success("Local session cleared"); }}><Trash2 />Clear local session</Button>
        </div>
      </Card>
    </div>
  </div>;
}

function StatusItem({ icon, label, value, positive }: { icon: React.ReactNode; label: string; value: string; positive: boolean }) {
  return <div className="flex min-w-0 items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 sm:border-b-0">
    <span className={cn("[&_svg]:size-4", positive ? "text-success" : "text-muted-foreground")} aria-hidden="true">{icon}</span>
    <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="truncate text-sm font-semibold" title={value}>{value}</p></div>
  </div>;
}
