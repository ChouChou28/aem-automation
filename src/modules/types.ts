import type { LucideIcon } from "lucide-react";
import type { Cookie } from "@/lib/cookies";
import type { RunLogger } from "@/store/activity-log";

export type FieldType = "text" | "select" | "checkbox";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  options?: FieldOption[];
  defaultValue?: string | boolean;
  /** Mark the field as required for client-side validation. */
  required?: boolean;
  /** Optional extra validation; return an error string when invalid. */
  validate?: (value: string) => string | undefined;
  /** Restrict this field to specific flow ids. Omit to show for every flow. */
  flows?: string[];
}

export interface FlowConfig {
  id: string;
  label: string;
}

export type FormValues = Record<string, string | boolean>;

export interface RunContext {
  flowId: string;
  values: FormValues;
  targetUrl: string;
  cookies: Cookie[];
  injectCookies: boolean;
  logger: RunLogger;
  signal: AbortSignal;
}

export type ResultRow = Record<string, unknown>;

export interface RunOutcome {
  status: "success" | "error" | "stopped";
  result: ResultRow[];
}

/** A module's business logic: do the work, return rows, throw to fail. */
export type ModuleHandler = (ctx: RunContext) => Promise<ResultRow[]>;

export interface ModuleConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  targetUrl: string;
  flows: FlowConfig[];
  fields: FieldConfig[];
  /** File name (without extension) used when exporting results to Excel. */
  exportName: string;
  run: (ctx: RunContext) => Promise<RunOutcome>;
}
