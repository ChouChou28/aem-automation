const COOKIE_DOMAIN = "p6-ap-author.samsung.com";
const APP_URL_MATCH = "http://automation.samsung.com/*";

const statusEl = document.getElementById("status");

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = kind;
}

/** Read every samsung.com (and subdomain) cookie, incl. HttpOnly. */
async function collectCookies() {
  const cookies = await chrome.cookies.getAll({ domain: COOKIE_DOMAIN });
  // Shape matches the app's JSON cookie parser (EditThisCookie-like).
  return cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
    expirationDate: c.expirationDate,
    session: c.session,
  }));
}

async function findAppTab() {
  const tabs = await chrome.tabs.query({ url: APP_URL_MATCH });
  return tabs[0];
}

document.getElementById("sync").addEventListener("click", async () => {
  try {
    setStatus("Collecting cookies…");
    const jar = await collectCookies();
    if (jar.length === 0) {
      setStatus("No samsung.com cookies found. Are you logged in?", "err");
      return;
    }
    const tab = await findAppTab();
    if (!tab) {
      await navigator.clipboard.writeText(JSON.stringify(jar, null, 2));
      setStatus(
        `App tab not open. Copied ${jar.length} cookies as JSON — paste via "Edit Cookies".`,
        "ok"
      );
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { type: "AEM_COOKIES", cookies: jar });
    setStatus(`✓ Sent ${jar.length} cookies to the app.`, "ok");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
});

document.getElementById("copy").addEventListener("click", async () => {
  try {
    const jar = await collectCookies();
    await navigator.clipboard.writeText(JSON.stringify(jar, null, 2));
    setStatus(`Copied ${jar.length} cookies as JSON to clipboard.`, "ok");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
});

document.getElementById("download").addEventListener("click", async () => {
  try {
    const jar = await collectCookies();
    const blob = new Blob([JSON.stringify(jar, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "samsung-cookies.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${jar.length} cookies.`, "ok");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
});
