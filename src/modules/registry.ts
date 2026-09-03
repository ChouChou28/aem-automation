import type { ModuleConfig } from "@/modules/types";
import { promotionsModule } from "@/modules/promotions";

/**
 * Module registry.
 *
 * To add a module: build it with `createModule(...)` in a file under
 * `src/modules/`, import it here, and push it into `modules`. The sidebar,
 * routes, forms, activity log and Excel export all derive from this list, so no
 * other wiring is required.
 */
export const modules: ModuleConfig[] = [promotionsModule];

export const moduleMap: Record<string, ModuleConfig> = Object.fromEntries(
  modules.map((m) => [m.id, m])
);

export function getModule(id: string | undefined): ModuleConfig | undefined {
  return id ? moduleMap[id] : undefined;
}

export const defaultModuleId: string | undefined = modules[0]?.id;
