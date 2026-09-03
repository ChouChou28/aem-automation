import { Navigate, useParams } from "react-router-dom";
import { AutomationPanel } from "@/components/automation-panel";
import { EmptyModules } from "@/pages/empty-modules";
import { defaultModuleId, getModule } from "@/modules/registry";

export function ModulePage() {
  const { moduleId } = useParams();
  const module = getModule(moduleId);

  if (!module) {
    // Unknown id: bounce to the first module, or show the empty state.
    return defaultModuleId ? (
      <Navigate to={`/module/${defaultModuleId}`} replace />
    ) : (
      <EmptyModules />
    );
  }

  // Key by id so flow + form state reset cleanly when switching modules.
  return <AutomationPanel key={module.id} module={module} />;
}
