# AEM Cookie Bridge (Chrome extension)

Reads `samsung.com` cookies — **including HttpOnly** auth cookies that
`document.cookie` can't see — and sends them to the Automation app in one click.

## Install (unpacked)

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. **Load unpacked** → select this `extension/` folder
4. Pin the extension for quick access

## Use

1. Log in to Samsung AEM in the same Chrome profile.
2. Open the app at `http://automation.samsung.com:5173`.
3. Get cookies into the app either way:
   - **From the app:** click **Sync cookies** in the Cookies card (enabled once the
     extension is detected). The app asks the extension and loads the result.
   - **From the extension:** click the toolbar icon → **Send to Automation app**.
   - If the app tab isn't open, use **Copy JSON** / **Download .json** and load via
     the app's **Edit Cookies** / **Browse** buttons.

## How it works

- `chrome.cookies.getAll({ domain: "samsung.com" })` returns all cookies for
  `samsung.com` and its subdomains (incl. `p6-ap-author.samsung.com`), HttpOnly
  included — this is the privileged API a normal web page does not have.
- The popup (or, for the in-app button, `background.js`) reads the cookies and
  `content.js` (injected only on `automation.samsung.com`) `window.postMessage`s
  them to the app page. Content scripts can't call `chrome.cookies`, so the in-app
  **Sync cookies** flow is: app page → `content.js` → `background.js` → back.
- The app verifies the origin + a `source: "aem-cookie-bridge"` marker, then loads
  the jar (see `src/hooks/use-cookie-bridge.ts`).

## Notes

- Host access is limited to `*.samsung.com`; the content script runs only on
  `automation.samsung.com`.
- Cookies are session credentials — they expire (AEM token ~1h); re-sync on 401.
