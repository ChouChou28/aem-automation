import { create } from "zustand";

export type LogLevel = "info" | "step" | "success" | "warn" | "error";
export type RunStatus = "idle" | "running" | "success" | "error" | "stopped";

export interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  message: string;
  detail?: string;
}

export interface ActivityLogState {
  status: RunStatus;
  moduleId?: string;
  logs: LogEntry[];
  /** Tabular result of the most recent run — fed to the Excel exporter. */
  result: Record<string, unknown>[];

  log: (level: LogLevel, message: string, detail?: string) => void;
  setStatus: (status: RunStatus) => void;
  setResult: (rows: Record<string, unknown>[]) => void;
  startRun: (moduleId: string) => void;
  clear: () => void;
}

let seq = 0;
const nextId = () => `${Date.now()}-${seq++}`;

export const useActivityLog = create<ActivityLogState>((set) => ({
  status: "idle",
  moduleId: undefined,
  logs: [],
  result: [],

  log: (level, message, detail) =>
    set((s) => ({
      logs: [{ id: nextId(), ts: Date.now(), level, message, detail }, ...s.logs],
    })),

  setStatus: (status) => set({ status }),
  setResult: (rows) => set({ result: rows }),

  startRun: (moduleId) =>
    set({ moduleId, status: "running", logs: [], result: [] }),

  clear: () => set({ logs: [], result: [], status: "idle" }),
}));

/** A scoped logger handed to a module runner so it never touches the store. */
export interface RunLogger {
  info: (msg: string, detail?: string) => void;
  step: (msg: string, detail?: string) => void;
  success: (msg: string, detail?: string) => void;
  warn: (msg: string, detail?: string) => void;
  error: (msg: string, detail?: string) => void;
}

export function createLogger(): RunLogger {
  const log = useActivityLog.getState().log;
  return {
    info: (m, d) => log("info", m, d),
    step: (m, d) => log("step", m, d),
    success: (m, d) => log("success", m, d),
    warn: (m, d) => log("warn", m, d),
    error: (m, d) => log("error", m, d),
  };
}
