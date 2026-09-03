import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parseCookieFile, parseCurl, type Cookie } from "@/lib/cookies";

export interface SettingsState {
  cookieFileName: string;
  cookieRaw: string;
  cookies: Cookie[];
  injectCookies: boolean;

  /** Load raw cookie text (from file/textarea) and re-parse the jar. */
  loadCookieText: (raw: string, fileName?: string) => void;
  /** Set an already-parsed jar directly (e.g. from the browser extension). */
  setCookies: (cookies: Cookie[], fileName?: string) => void;
  /** Parse a pasted cURL command into the jar. */
  importCurl: (curl: string) => number;
  /** Clear the loaded cookie jar. */
  clearCookies: () => void;
  setInjectCookies: (v: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      cookieFileName: "cookies.txt",
      cookieRaw: "",
      cookies: [],
      injectCookies: true,

      loadCookieText: (raw, fileName) =>
        set({
          cookieRaw: raw,
          cookies: parseCookieFile(raw),
          ...(fileName ? { cookieFileName: fileName } : {}),
        }),

      setCookies: (cookies, fileName = "extension-cookies.json") =>
        set({
          cookies,
          cookieRaw: JSON.stringify(cookies, null, 2),
          cookieFileName: fileName,
        }),

      importCurl: (curl) => {
        const cookies = parseCurl(curl);
        set({ cookies, cookieRaw: JSON.stringify(cookies, null, 2) });
        return cookies.length;
      },

      clearCookies: () =>
        set({ cookies: [], cookieRaw: "", cookieFileName: "cookies.txt" }),

      setInjectCookies: (injectCookies) => set({ injectCookies }),
    }),
    { name: "aem-automation-settings" }
  )
);
