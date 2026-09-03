# AEM Cookie Bridge

Reads Samsung AEM cookies, including HttpOnly cookies, and securely sends them
to the configured Automation app tab.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension/` directory.
4. Pin the extension for quick access.

## Configure and use

1. Sign in to Samsung AEM in the same Chrome profile.
2. Open the extension popup.
3. Enter the Automation app URL and click **Save**. The default is
   `http://automation.samsung.com:3000`; localhost and other HTTP/HTTPS origins
   are supported after granting site access.
4. Open or reload the app at the saved URL.
5. Use **Sync** in the app or **Send cookies to app** in the extension.

The popup also supports copying or downloading the current cookie collection.

## How it works

- The service worker reads cookies for `p6-ap-author.samsung.com` through the
  privileged `chrome.cookies` API.
- The configured target is stored in `chrome.storage.local`.
- Saving a target registers `content.js` only for that origin and injects it
  immediately when a matching tab is already open.
- Other origins require an explicit Chrome site-access grant.
- Chrome automatically removes extension-local storage and registered content
  scripts when the extension is uninstalled.

Cookies are session credentials and expire. Re-sync after an authentication
failure. Never share exported cookie files.
