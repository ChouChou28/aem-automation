// Guard against duplicate injection when a newly saved target is already open.
if (!globalThis.__AEM_COOKIE_BRIDGE_LOADED__) {
  globalThis.__AEM_COOKIE_BRIDGE_LOADED__ = true;
  const bridgeOrigin = window.location.origin;

  function toPage(payload) {
    window.postMessage(payload, bridgeOrigin);
  }

  function announce() {
    toPage({ source: "aem-cookie-bridge-ready" });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "AEM_COOKIES" && Array.isArray(message.cookies)) {
      toPage({ source: "aem-cookie-bridge", cookies: message.cookies });
      sendResponse({ ok: true });
    }
    return true;
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== bridgeOrigin) return;
    const source = event.data?.source;
    if (source === "aem-cookie-bridge-ping") {
      announce();
      return;
    }
    if (source === "aem-cookie-bridge-request") {
      chrome.runtime.sendMessage({ type: "GET_COOKIES" }, (response) => {
        if (chrome.runtime.lastError) {
          toPage({ source: "aem-cookie-bridge-error", error: chrome.runtime.lastError.message });
        } else if (response?.ok) {
          toPage({ source: "aem-cookie-bridge", cookies: response.cookies });
        } else {
          toPage({ source: "aem-cookie-bridge-error", error: response?.error || "Failed to read cookies" });
        }
      });
    }
  });

  announce();
}
