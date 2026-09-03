import { KeyRound } from "lucide-react";
import { CookieManager } from "@/components/cookie-controls";

export function AccessPage() {
  return <div className="space-y-5">
    <section className="flex items-start gap-3.5 border-b border-border pb-5">
      <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary shadow-sm">
        <KeyRound className="size-5" aria-hidden="true" />
      </div>
      <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Workspace access</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Authentication</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Manage the credentials used for Samsung AEM automation requests.</p></div>
    </section>
    <CookieManager />
  </div>;
}
