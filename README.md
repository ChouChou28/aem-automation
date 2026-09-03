# Samsung AEM Automation

A React + Vite control panel that clones the Samsung AEM automation desktop tool.
Cookie-authenticated API calls, per-run activity log, and one-click Excel export —
built around a **clonable module architecture** so new automations are config + a handler.

## Stack

- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind v4** (`@tailwindcss/vite`, CSS-first `@theme`)
- **shadcn-style** UI primitives on Radix (`src/components/ui`)
- **React Router v7**, object-based config (`src/router.tsx`)
- **Zustand** for the activity log + settings stores
- **xlsx** (SheetJS) for Excel export

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

## How it fits together

```
src/
  modules/          ← the clonable flows (the interesting part)
    base.ts         · createModule() — the single base flow + lifecycle
    types.ts        · ModuleConfig / RunContext / field + flow types
    model-management.ts, promotions.ts, b2c-seo.ts
    registry.ts     · the list everything derives from
  components/        ← UI (selector, panel, tabs, cookie bar, log view)
    ui/             · shadcn primitives
  lib/               ← cookies (txt/json/cURL), api (cookie fetch), excel
  store/             ← activity-log + settings (zustand)
  router.tsx         ← object-based routes; modules are /module/:moduleId
```

## Add a new module (clone the base flow)

1. Copy `src/modules/model-management.ts` to e.g. `src/modules/inventory.ts`.
2. Tweak the `createModule({...})` config (id, label, icon, `targetUrl`, `flows`,
   `fields`) and write its `handler` — it receives parsed cookies + a logger and
   returns the result rows that become the Excel export.
3. Register it in `src/modules/registry.ts`.

The module selector, routes, dynamic form, activity log and Excel export all read
from the registry — no other wiring needed.

## Cookie auth & the browser limitation

The browser forbids setting a `Cookie:` header on a cross-origin `fetch`, so the
client (`src/lib/api.ts`) authenticates with `credentials: "include"` and forwards
the parsed jar on `x-replay-cookie` for a same-origin dev proxy / backend to replay.
When the live AEM endpoint is unreachable from the browser, handlers fall back to a
clearly-logged **simulated** record so the log + export flow stays demonstrable.
Cookies are loaded from a `cookies.txt` (Netscape), a JSON export, or a pasted cURL.

> Visual reference: the provided screenshot. The Figma file requires auth and could
> not be read programmatically; the design tokens in `src/index.css` approximate the
> dark mock and can be retuned against Figma.
