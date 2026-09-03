import { NavLink } from "react-router-dom";
import { Blocks, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { modules } from "@/modules/registry";

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <div className="grid size-9 place-items-center rounded-lg bg-white text-sidebar shadow-sm">
          <Blocks className="size-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">AEM Operations</p>
          <p className="text-xs text-white/50">Automation workspace</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5" aria-label="Modules">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Workspace
        </p>
        <div className="space-y-1">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <NavLink
                key={module.id}
                to={`/module/${module.id}`}
                className={({ isActive }) => cn(
                  "group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                  isActive ? "bg-white text-sidebar shadow-sm" : "text-white/65 hover:bg-white/8 hover:text-white"
                )}
              >
                {({ isActive }) => <>
                  <Icon className={cn("size-[18px]", isActive ? "text-accent" : "text-white/45 group-hover:text-white/80")} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{module.label}</span>
                  <ChevronRight className={cn("size-4 transition-transform", isActive && "translate-x-0.5")} aria-hidden="true" />
                </>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="m-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-white/80">
          <ShieldCheck className="size-4 text-emerald-400" aria-hidden="true" />
          Internal tool
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-white/45">Authenticated requests to Samsung AEM.</p>
      </div>
    </aside>
  );
}
