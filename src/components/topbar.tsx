"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { modules } from "@/modules/registry";
import { useActivityLog, type RunStatus } from "@/store/activity-log";
import { useSettings } from "@/store/settings";
import { useBridge } from "@/store/bridge";

const statusMeta: Record<RunStatus, { label: string; className: string }> = {
  idle: { label: "Ready", className: "bg-secondary text-muted-foreground" },
  running: { label: "Running", className: "bg-primary/8 text-primary" },
  success: { label: "Completed", className: "bg-success/10 text-success" },
  error: { label: "Failed", className: "bg-destructive/10 text-destructive" },
  stopped: { label: "Stopped", className: "bg-warning/10 text-amber-700" },
};

export function Topbar() {
  const pathname = usePathname();
  const status = useActivityLog((state) => state.status);
  const meta = statusMeta[status];
  const cookieCount = useSettings((state) => state.cookies.length);
  const bridgeAvailable = useBridge((state) => state.available);
  const onAccessPage = pathname === "/access";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex min-h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:hidden">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground lg:hidden">
            <Blocks className="size-[18px]" aria-hidden="true" />
          </div>
          <p className="truncate text-sm font-semibold tracking-tight">AEM Operations</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!onAccessPage && <div className={cn("flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-semibold", meta.className)} aria-live="polite">
            <span className={cn("size-1.5 rounded-full bg-current", status === "running" && "animate-pulse")} />
            {meta.label}
          </div>}
          <Link href="/access" className={cn("flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", onAccessPage ? "border-primary/30 bg-primary/[0.05] text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground")} aria-label={`${cookieCount} authentication cookies loaded`}>
            <KeyRound className="size-4" aria-hidden="true" />
            <span className={cn("size-1.5 rounded-full", cookieCount > 0 ? "bg-success" : bridgeAvailable ? "bg-warning" : "bg-muted-foreground")} />
            <span className="hidden sm:inline">{cookieCount > 0 ? `${cookieCount} cookies` : "Access"}</span>
          </Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden" aria-label="Modules">
        {modules.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === `/module/${item.id}`;
          return <Link key={item.id} href={`/module/${item.id}`} className={cn("flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors", isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="size-4" aria-hidden="true" />{item.label}
          </Link>;
        })}
        <Link href="/access" className={cn("flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors", onAccessPage ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
          <KeyRound className="size-4" aria-hidden="true" />Access
        </Link>
      </nav>
    </header>
  );
}
