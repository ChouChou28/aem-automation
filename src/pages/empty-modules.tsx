import { PackagePlus, FileCode2, ListPlus, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: FileCode2,
    title: "Create a module file",
    body: "Add src/modules/<name>.ts and build it with createModule({ ... }).",
  },
  {
    icon: ListPlus,
    title: "Register it",
    body: "Import the module in src/modules/registry.ts and push it into modules[].",
  },
  {
    icon: Rocket,
    title: "Done",
    body: "The sidebar, routes, form, activity log and Excel export wire up automatically.",
  },
];

export function EmptyModules() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card className="flex flex-col items-center gap-6 p-10 text-center shadow-soft">
        <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <PackagePlus className="size-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight">
            No modules yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Modules have been cleared. Add one to start building automation
            flows — the rest of the app derives from the registry.
          </p>
        </div>

        <div className="grid w-full gap-3 text-left sm:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-xl border border-border bg-muted/30 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-card text-primary shadow-soft">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
