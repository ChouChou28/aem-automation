import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Cookie as CookieIcon, RefreshCw, Link2, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { useBridge } from "@/store/bridge";
import { requestCookieSync } from "@/hooks/use-cookie-bridge";

export function CookieControls() {
  const cookies = useSettings((state) => state.cookies);
  const importCurl = useSettings((state) => state.importCurl);
  const clearCookies = useSettings((state) => state.clearCookies);
  const available = useBridge((state) => state.available);
  const lastSync = useBridge((state) => state.lastSync);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [syncing, setSyncing] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!syncing) return;
    setSyncing(false);
    if (syncTimer.current) clearTimeout(syncTimer.current);
  }, [lastSync]); // eslint-disable-line react-hooks/exhaustive-deps

  function sync() {
    setSyncing(true); requestCookieSync();
    syncTimer.current = setTimeout(() => setSyncing(false), 4000);
  }

  function apply() {
    if (draft.trim()) toast.success(`Imported ${importCurl(draft)} cookies from cURL`);
    setDraft(""); setOpen(false);
  }

  const hasCookies = cookies.length > 0;
  return <div className="relative flex items-center gap-2">
    <span className={cn("flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold", hasCookies ? "border-success/20 bg-success/8 text-success" : "border-warning/20 bg-warning/8 text-amber-700")} title={`${cookies.length} cookies loaded`}>
      <CookieIcon className="size-3.5" aria-hidden="true" /><span>{cookies.length}</span><span className="hidden md:inline">cookies</span>
    </span>
    <Button size="sm" onClick={sync} loading={syncing} disabled={!available} aria-label="Sync cookies from browser extension" title={available ? "Sync cookies from browser extension" : "Extension not detected — import cURL instead"}>
      {!syncing && <RefreshCw />}<span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync"}</span>
    </Button>
    <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="dialog"><Link2 /><span className="hidden md:inline">Import</span></Button>

    {open && <>
      <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label="Close import dialog" />
      <Card role="dialog" aria-modal="true" aria-labelledby="curl-title" className="fixed inset-x-4 top-24 z-50 mx-auto w-auto max-w-lg p-4 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[440px]">
        <div className="mb-3 flex items-start justify-between gap-3"><div><h2 id="curl-title" className="text-sm font-semibold">Import authentication</h2><p className="mt-1 text-xs text-muted-foreground">Paste a cURL command containing the Cookie header.</p></div><Button variant="ghost" size="icon" className="-mr-2 -mt-2" onClick={() => setOpen(false)} aria-label="Close"><X /></Button></div>
        <textarea autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} rows={6} spellCheck={false} placeholder="curl 'https://p6-ap-author.samsung.com/...' -H 'cookie: ...'" className="w-full resize-y rounded-md border border-input bg-muted/30 p-3 font-mono text-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" disabled={!hasCookies} onClick={() => { clearCookies(); toast.success("Cleared loaded cookies"); }} className="text-muted-foreground hover:text-destructive"><Trash2 />Clear current</Button>
          <Button size="sm" onClick={apply} disabled={!draft.trim()}><Save />Apply</Button>
        </div>
      </Card>
    </>}
  </div>;
}
