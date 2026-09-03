import { toast } from "sonner";
import { Terminal, FileSpreadsheet } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActivityLog, type LogLevel } from "@/store/activity-log";
import { exportToExcel } from "@/lib/excel";

const levelVariant: Record<LogLevel, BadgeProps["variant"]> = { info: "info", step: "muted", success: "success", warn: "warn", error: "error" };
const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false });

export function ActivityLogView({ exportName }: { exportName: string }) {
  const { logs, result } = useActivityLog();
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">{logs.length} events · {result.length} rows</p>
      <Button variant="outline" size="sm" disabled={result.length === 0} onClick={() => { exportToExcel(result, exportName); toast.success(`Exported ${result.length} row(s) to Excel`); }}>
        <FileSpreadsheet />Export
      </Button>
    </div>
    <ScrollArea className="h-[400px] rounded-lg border border-slate-800 bg-[#111827] text-slate-200">
      {logs.length === 0 ? <div className="flex h-[400px] flex-col items-center justify-center gap-3 px-6 text-center text-slate-400">
        <span className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/5"><Terminal className="size-5" aria-hidden="true" /></span>
        <div><p className="text-sm font-medium text-slate-300">Waiting for a run</p><p className="mt-1 text-xs">Events will appear here in real time.</p></div>
      </div> : <ul className="divide-y divide-white/5 font-mono text-xs" aria-live="polite">
        {logs.map((entry) => <li key={entry.id} className="flex gap-2.5 px-3 py-2.5">
          <span className="shrink-0 text-slate-500">{formatTime(entry.ts)}</span>
          <Badge variant={levelVariant[entry.level]} className="h-fit shrink-0">{entry.level}</Badge>
          <span className="break-words text-slate-200">{entry.message}{entry.detail && <span className="text-slate-400"> — {entry.detail}</span>}</span>
        </li>)}
      </ul>}
    </ScrollArea>
  </div>;
}
