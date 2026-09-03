import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const AEM_TARGET = "https://p6-ap-author.samsung.com";

// Custom dev hostname so the app runs under a *.samsung.com origin.
// Map it to localhost in your hosts file:
//   127.0.0.1   automation.samsung.com
const APP_HOST = "automation.samsung.com";
const APP_PORT = 5173;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: APP_PORT,
    strictPort: true,
    // Permit the custom Host header (Vite blocks unknown hosts by default).
    allowedHosts: [APP_HOST],
    // HMR socket targets the custom HTTP host.
    hmr: { host: APP_HOST, protocol: "ws" },
    proxy: {
      // Same-origin dev proxy to Samsung AEM. The browser forbids setting a
      // cross-origin `Cookie:` header, so the client sends the parsed jar on
      // `x-replay-cookie` and we promote it to a real `Cookie` here.
      "/aem": {
        target: AEM_TARGET,
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/aem/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const replay = req.headers["x-replay-cookie"];
            if (typeof replay === "string" && replay) {
              proxyReq.setHeader("cookie", replay);
              proxyReq.removeHeader("x-replay-cookie");
            }
            // AEM validates same-origin requests.
            proxyReq.setHeader("origin", AEM_TARGET);
            if (!proxyReq.getHeader("referer")) {
              proxyReq.setHeader("referer", `${AEM_TARGET}/`);
            }
          });
        },
      },
    },
  },
  preview: {
    host: true,
    port: APP_PORT,
    strictPort: true,
    allowedHosts: [APP_HOST],
  },
});
