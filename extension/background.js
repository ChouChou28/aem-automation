const COOKIE_DOMAIN = "p6-ap-author.samsung.com";
const DEFAULT_TARGET_URL = "http://automation.samsung.com:3000";
const CONTENT_SCRIPT_ID = "aem-cookie-bridge-target";

function mapCookie(cookie) {
  return {
    name: cookie.name, value: cookie.value, domain: cookie.domain,
    path: cookie.path, secure: cookie.secure, httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite, expirationDate: cookie.expirationDate,
    session: cookie.session,
  };
}

function targetPattern(rawUrl) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Target URL must use http:// or https://");
  }
  return `${url.origin}/*`;
}

async function registerTarget(rawUrl) {
  await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] }).catch(() => {});
  await chrome.scripting.registerContentScripts([{
    id: CONTENT_SCRIPT_ID,
    matches: [targetPattern(rawUrl)],
    js: ["content.js"],
    runAt: "document_idle",
    persistAcrossSessions: true,
  }]);
}

async function initializeTarget() {
  const stored = await chrome.storage.local.get("targetUrl");
  const targetUrl = stored.targetUrl || DEFAULT_TARGET_URL;
  if (!stored.targetUrl) await chrome.storage.local.set({ targetUrl });
  await registerTarget(targetUrl);
}

chrome.runtime.onInstalled.addListener(() => { initializeTarget().catch(console.error); });
chrome.runtime.onStartup.addListener(() => { initializeTarget().catch(console.error); });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_COOKIES") {
    chrome.cookies.getAll({ domain: COOKIE_DOMAIN })
      .then((cookies) => sendResponse({ ok: true, cookies: cookies.map(mapCookie) }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }

  if (message?.type === "CONFIGURE_TARGET") {
    registerTarget(message.targetUrl)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }
});
