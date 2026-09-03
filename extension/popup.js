const COOKIE_DOMAIN = "p6-ap-author.samsung.com";
const DEFAULT_TARGET_URL = "http://automation.samsung.com:3000";
const statusEl = document.getElementById("status");
const targetInput = document.getElementById("target-url");
const saveButton = document.getElementById("save-target");

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.className = kind;
}

function normalizeTarget(rawUrl) {
  const url = new URL(rawUrl.trim());
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Use an http:// or https:// URL.");
  url.hash = "";
  return url.href.replace(/\/$/, "");
}

function originPattern(rawUrl) {
  return `${new URL(rawUrl).origin}/*`;
}

async function getTargetUrl() {
  const stored = await chrome.storage.local.get("targetUrl");
  return stored.targetUrl || DEFAULT_TARGET_URL;
}

async function collectCookies() {
  const cookies = await chrome.cookies.getAll({ domain: COOKIE_DOMAIN });
  return cookies.map((cookie) => ({
    name: cookie.name, value: cookie.value, domain: cookie.domain,
    path: cookie.path, secure: cookie.secure, httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite, expirationDate: cookie.expirationDate,
    session: cookie.session,
  }));
}

async function findAppTab(targetUrl) {
  const tabs = await chrome.tabs.query({ url: originPattern(targetUrl) });
  return tabs.find((tab) => tab.id);
}

async function injectBridge(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
}

async function saveTarget() {
  try {
    saveButton.disabled = true;
    const targetUrl = normalizeTarget(targetInput.value);
    const granted = await chrome.permissions.request({ origins: [originPattern(targetUrl)] });
    if (!granted) throw new Error("Site access was not granted.");

    const response = await chrome.runtime.sendMessage({ type: "CONFIGURE_TARGET", targetUrl });
    if (!response?.ok) throw new Error(response?.error || "Could not configure target.");
    await chrome.storage.local.set({ targetUrl });

    const tab = await findAppTab(targetUrl);
    if (tab?.id) await injectBridge(tab.id);
    targetInput.value = targetUrl;
    setStatus(tab ? "Target saved and connected." : "Target saved. Open the app to connect.", "ok");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "err");
  } finally {
    saveButton.disabled = false;
  }
}

document.getElementById("sync").addEventListener("click", async () => {
  try {
    setStatus("Collecting cookies…");
    const [cookies, targetUrl] = await Promise.all([collectCookies(), getTargetUrl()]);
    if (cookies.length === 0) throw new Error("No AEM cookies found. Sign in to Samsung AEM first.");
    const tab = await findAppTab(targetUrl);
    if (!tab?.id) throw new Error(`App tab not found at ${new URL(targetUrl).origin}`);
    await injectBridge(tab.id);
    await chrome.tabs.sendMessage(tab.id, { type: "AEM_COOKIES", cookies });
    setStatus(`Sent ${cookies.length} cookies to the app.`, "ok");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "err");
  }
});

document.getElementById("copy").addEventListener("click", async () => {
  try {
    const cookies = await collectCookies();
    await navigator.clipboard.writeText(JSON.stringify(cookies, null, 2));
    setStatus(`Copied ${cookies.length} cookies.`, "ok");
  } catch (error) { setStatus(String(error?.message || error), "err"); }
});

document.getElementById("download").addEventListener("click", async () => {
  try {
    const cookies = await collectCookies();
    const url = URL.createObjectURL(new Blob([JSON.stringify(cookies, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "samsung-cookies.json"; anchor.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${cookies.length} cookies.`, "ok");
  } catch (error) { setStatus(String(error?.message || error), "err"); }
});

saveButton.addEventListener("click", saveTarget);
targetInput.addEventListener("keydown", (event) => { if (event.key === "Enter") saveTarget(); });

getTargetUrl().then((targetUrl) => { targetInput.value = targetUrl; });
