import { Activity, Table2, Cookie as CookieIcon, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivityLog, type RunStatus } from "@/store/activity-log";
import { useSettings } from "@/store/settings";

const statusText: Record<RunStatus, string> = {
  idle: "Ready",
  running: "Running",
  success: "Completed",
  error: "Failed",
  stopped: "Stopped",
};

const statusTone: Record<RunStatus, string> = {
  idle: "text-muted-foreground",
  running: "text-primary",
  success: "text-success",
  error: "text-destructive",
  stopped: "text-amber-600",
};

function Stat({
  icon,
  label,
  value,
  tone,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
  iconClass?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 shadow-sm">
      <div
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-primary",
          iconClass
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("truncate text-sm font-semibold", tone)}>{value}</p>
      </div>
    </div>
  );
}

export function StatCards() {
  const status = useActivityLog((s) => s.status);
  const resultCount = useActivityLog((s) => s.result.length);
  const logCount = useActivityLog((s) => s.logs.length);
  const cookies = useSettings((s) => s.cookies);

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <Stat
        icon={<Activity className="size-5" />}
        label="Run status"
        value={statusText[status]}
        tone={statusTone[status]}
        iconClass={cn(
          status === "success" && "bg-success/10 text-success",
          status === "error" && "bg-destructive/10 text-destructive",
          status === "stopped" && "bg-amber-500/10 text-amber-600"
        )}
      />
      <Stat
        icon={<Table2 className="size-5" />}
        label="Result rows"
        value={String(resultCount)}
      />
      <Stat
        icon={<CookieIcon className="size-5" />}
        label="Cookies loaded"
        value={String(cookies.length)}
      />
      <Stat
        icon={<ScrollText className="size-5" />}
        label="Log entries"
        value={String(logCount)}
      />
    </div>
  );
}
