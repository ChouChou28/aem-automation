"use client";

import { redirect, useParams } from "next/navigation";
import { AutomationPanel } from "@/components/automation-panel";
import { EmptyModules } from "@/views/empty-modules";
import { defaultModuleId, getModule } from "@/modules/registry";

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const module = getModule(moduleId);

  if (!module) {
    // Unknown id: bounce to the first module, or show the empty state.
    return defaultModuleId ? (
      redirect(`/module/${defaultModuleId}`)
    ) : (
      <EmptyModules />
    );
  }

  // Key by id so flow + form state reset cleanly when switching modules.
  return <AutomationPanel key={module.id} module={module} />;
}
