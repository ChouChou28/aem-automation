import type { LucideIcon } from "lucide-react";
import type {
  FieldConfig,
  FlowConfig,
  ModuleConfig,
  ModuleHandler,
  RunContext,
  RunOutcome,
} from "@/modules/types";

export interface CreateModuleOptions {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  targetUrl: string;
  flows: FlowConfig[];
  fields: FieldConfig[];
  preview?: ModuleConfig["preview"];
  exportName?: string;
  /** Module-specific work. Receives a logger + parsed cookies, returns rows. */
  handler: ModuleHandler;
}

/**
 * The single base flow. Every module is built from this factory, so cloning a
 * module is just: copy a file under `modules/`, tweak the config + handler, and
 * register it in `modules/registry.ts`.
 *
 * The factory owns the shared lifecycle (cookie injection, navigation log,
 * abort handling, error reporting); a module only supplies its `handler`.
 */
export function createModule(opts: CreateModuleOptions): ModuleConfig {
  const run = async (ctx: RunContext): Promise<RunOutcome> => {
    const { logger, injectCookies, cookies, targetUrl, signal, flowId } = ctx;
    const flowLabel = opts.flows.find((f) => f.id === flowId)?.label ?? flowId;

    logger.info(`Starting "${opts.label}" — flow: ${flowLabel}`);

    if (injectCookies) {
      if (cookies.length) {
        logger.step(`Injecting ${cookies.length} cookie(s) before navigation`);
      } else {
        logger.warn("Cookie injection enabled but no cookies were loaded");
      }
    }

    logger.step(`Navigating to ${targetUrl}`);

    try {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const result = await opts.handler(ctx);
      logger.success(`Done — ${result.length} row(s) ready to export`);
      return { status: "success", result };
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        logger.warn("Run stopped by user");
        return { status: "stopped", result: [] };
      }
      logger.error("Run failed", (err as Error).message);
      return { status: "error", result: [] };
    }
  };

  return {
    id: opts.id,
    label: opts.label,
    icon: opts.icon,
    description: opts.description,
    targetUrl: opts.targetUrl,
    flows: opts.flows,
    fields: opts.fields,
    preview: opts.preview,
    exportName: opts.exportName ?? opts.id,
    run,
  };
}

/** Cooperative cancellation point for handlers running long loops. */
export function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
}

/** Small await helper so simulated steps feel like real network latency. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
