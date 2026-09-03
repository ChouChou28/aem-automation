// Bridge between the app page and the extension.
//
//   popup  ──(AEM_COOKIES)──►  content  ──postMessage──►  app page
//   app page ──(request)──► content ──► background ──► content ──► app page
//
// Runs in the isolated content-script world but shares the page's window.
const ORIGIN = window.location.origin;

function toPage(payload) {
  window.postMessage(payload, ORIGIN);
}

function announce() {
  toPage({ source: "aem-cookie-bridge-ready" });
}

// 1) Cookies pushed from the popup's "Send to app" button.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "AEM_COOKIES" && Array.isArray(msg.cookies)) {
    toPage({ source: "aem-cookie-bridge", cookies: msg.cookies });
    sendResponse({ ok: true });
  }
  return true;
});

// 2) Requests originating from the app's in-page "Sync cookies" button.
window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== ORIGIN) return;
  const src = event.data && event.data.source;

  if (src === "aem-cookie-bridge-ping") {
    announce();
    return;
  }

  if (src === "aem-cookie-bridge-request") {
    chrome.runtime.sendMessage({ type: "GET_COOKIES" }, (resp) => {
      if (chrome.runtime.lastError) {
        toPage({
          source: "aem-cookie-bridge-error",
          error: chrome.runtime.lastError.message,
        });
        return;
      }
      if (resp && resp.ok) {
        toPage({ source: "aem-cookie-bridge", cookies: resp.cookies });
      } else {
        toPage({
          source: "aem-cookie-bridge-error",
          error: (resp && resp.error) || "Failed to read cookies",
        });
      }
    });
  }
});

// Let the app know the bridge is present.
announce();
