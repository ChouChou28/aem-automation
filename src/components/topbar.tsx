import { NavLink, useParams } from "react-router-dom";
import { Blocks } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModule, modules } from "@/modules/registry";
import { useActivityLog, type RunStatus } from "@/store/activity-log";
import { CookieControls } from "@/components/cookie-controls";

const statusMeta: Record<RunStatus, { label: string; className: string }> = {
  idle: { label: "Ready", className: "bg-secondary text-muted-foreground" },
  running: { label: "Running", className: "bg-primary/8 text-primary" },
  success: { label: "Completed", className: "bg-success/10 text-success" },
  error: { label: "Failed", className: "bg-destructive/10 text-destructive" },
  stopped: { label: "Stopped", className: "bg-warning/10 text-amber-700" },
};

export function Topbar() {
  const { moduleId } = useParams();
  const module = getModule(moduleId);
  const status = useActivityLog((state) => state.status);
  const meta = statusMeta[status];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex min-h-[72px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground lg:hidden">
            <Blocks className="size-[18px]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Automation workspace</p>
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{module?.label ?? "AEM Operations"}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className={cn("hidden h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold sm:flex", meta.className)} aria-live="polite">
            <span className={cn("size-1.5 rounded-full bg-current", status === "running" && "animate-pulse")} />
            {meta.label}
          </div>
          <CookieControls />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden" aria-label="Modules">
        {modules.map((item) => {
          const Icon = item.icon;
          return <NavLink key={item.id} to={`/module/${item.id}`} className={({ isActive }) => cn("flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors", isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="size-4" aria-hidden="true" />{item.label}
          </NavLink>;
        })}
      </nav>
    </header>
  );
}
