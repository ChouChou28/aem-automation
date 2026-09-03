"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GitBranch, Play, Square, Trash2, SlidersHorizontal, ScrollText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { DynamicFields, visibleFields } from "@/components/dynamic-fields";
import { ActivityLogView } from "@/components/activity-log-view";
import { useSettings } from "@/store/settings";
import { useActivityLog, createLogger } from "@/store/activity-log";
import { cn } from "@/lib/utils";
import type { FormValues, ModuleConfig } from "@/modules/types";

function initialValues(module: ModuleConfig): FormValues {
  return Object.fromEntries(module.fields.map((field) => [field.name, field.defaultValue ?? (field.type === "checkbox" ? false : "")]));
}

function SectionHeading({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="flex items-start gap-3">
    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-primary">{icon}</span>
    <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p></div>
  </div>;
}

export function AutomationPanel({ module }: { module: ModuleConfig }) {
  const [flowId, setFlowId] = useState(module.flows[0].id);
  const [values, setValues] = useState<FormValues>(() => initialValues(module));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resolvingFields, setResolvingFields] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const settings = useSettings();
  const { status, startRun, setStatus, setResult, clear } = useActivityLog();
  const running = status === "running";
  const previewDependencyKey = useMemo(
    () => module.preview?.dependencies.map((name) => String(values[name] ?? "").trim()).join("\u0000") ?? "",
    [module.preview, values]
  );

  useEffect(() => {
    const preview = module.preview;
    if (!preview) return;

    const hasAllDependencies = preview.dependencies.every(
      (name) => String(values[name] ?? "").trim().length > 0
    );
    if (!hasAllDependencies) {
      setResolvingFields([]);
      setValues((current) => {
        const next = { ...current };
        for (const target of preview.targets) next[target] = "";
        return next;
      });
      return;
    }

    const controller = new AbortController();
    setResolvingFields(preview.targets);
    setValues((current) => {
      const next = { ...current };
      for (const target of preview.targets) next[target] = "";
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      for (const target of preview.targets) delete next[target];
      return next;
    });
    const timer = window.setTimeout(async () => {
      try {
        const resolved = await preview.resolve(values, settings.cookies, controller.signal);
        if (!controller.signal.aborted) {
          setValues((current) => {
            const next = { ...current };
            for (const [name, value] of Object.entries(resolved)) {
              if (value !== undefined) next[name] = value;
            }
            return next;
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const target = preview.targets[0];
          setErrors((current) => ({
            ...current,
            [target]: error instanceof Error ? error.message : "Unable to resolve preview",
          }));
        }
      } finally {
        if (!controller.signal.aborted) setResolvingFields([]);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [module.preview, previewDependencyKey, settings.cookies]);

  const setValue = (name: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => current[name] ? { ...current, [name]: "" } : current);
  };

  function validate() {
    const next: Record<string, string> = {};
    for (const field of visibleFields(module.fields, flowId)) {
      const value = String(values[field.name] ?? "").trim();
      if (field.required && !value) next[field.name] = `${field.label} is required`;
      else if (value && field.validate) {
        const message = field.validate(value);
        if (message) next[field.name] = message;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onStart() {
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    const controller = new AbortController();
    abortRef.current = controller;
    startRun(module.id);
    const outcome = await module.run({ flowId, values, targetUrl: module.targetUrl, cookies: settings.cookies, injectCookies: settings.injectCookies, logger: createLogger(), signal: controller.signal });
    setResult(outcome.result); setStatus(outcome.status); abortRef.current = null;
    if (outcome.status === "success") toast.success(`${module.label} completed`, { description: `${outcome.result.length} row(s) ready to export.` });
    else if (outcome.status === "stopped") toast.warning("Run stopped");
    else if (outcome.status === "error") toast.error("Run failed", { description: "See the activity log for details." });
  }

  return <div className="space-y-5">
    <section className="pb-1">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{module.label}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{module.description}</p>
    </section>

    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6"><SectionHeading icon={<SlidersHorizontal className="size-4" />} title="Request configuration" description="Choose a workflow and provide the required request details." /></div>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><GitBranch className="size-4 text-muted-foreground" aria-hidden="true" />Workflow</div>
            <RadioGroup value={flowId} onValueChange={setFlowId} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {module.flows.map((flow) => {
                const active = flow.id === flowId;
                return <label key={flow.id} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3.5 text-sm transition-[border-color,background-color] duration-200", active ? "border-primary/45 bg-primary/[0.04]" : "border-border hover:bg-muted")}>
                  <RadioGroupItem value={flow.id} /><span className="font-medium">{flow.label}</span>{active && <span className="ml-auto text-xs font-medium text-primary">Selected</span>}
                </label>;
              })}
            </RadioGroup>
          </div>
          <div className="h-px bg-border" />
          <DynamicFields fields={module.fields} flowId={flowId} values={values} errors={errors} resolvingFields={resolvingFields} onChange={setValue} />
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button variant="ghost" onClick={clear} disabled={running}><Trash2 />Clear activity</Button>
          <div className="flex gap-2">
            {running && <Button variant="destructive" onClick={() => abortRef.current?.abort()} className="flex-1 sm:flex-none"><Square />Stop run</Button>}
            <Button variant="success" loading={running} onClick={onStart} className="flex-1 sm:min-w-32"><>{!running && <Play />}{running ? "Running…" : "Run workflow"}{!running && <ArrowRight />}</></Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4"><SectionHeading icon={<ScrollText className="size-4" />} title="Activity" description="Live request progress and exportable results." /></div>
        <div className="p-4"><ActivityLogView exportName={module.exportName} /></div>
      </Card>
    </div>
  </div>;
}
