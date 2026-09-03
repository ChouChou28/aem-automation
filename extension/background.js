// Service worker: the only place with chrome.cookies access. Content scripts
// relay page requests here and forward the result back to the app page.
// Filter by domain (not url) so we return only the AEM host-scoped cookies —
// the same 7 the popup's "Send" button collects, not the hundreds of
// .samsung.com analytics cookies the browser would also send.
const COOKIE_DOMAIN = "p6-ap-author.samsung.com";

function mapCookie(c) {
  return {
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
    expirationDate: c.expirationDate,
    session: c.session,
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "GET_COOKIES") {
    chrome.cookies
      .getAll({ domain: COOKIE_DOMAIN })
      .then((cookies) => sendResponse({ ok: true, cookies: cookies.map(mapCookie) }))
      .catch((err) =>
        sendResponse({ ok: false, error: String((err && err.message) || err) })
      );
    return true; // async response
  }
});
