import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FieldConfig, FormValues } from "@/modules/types";

interface DynamicFieldsProps {
  fields: FieldConfig[];
  flowId: string;
  values: FormValues;
  errors?: Record<string, string>;
  resolvingFields?: string[];
  onChange: (name: string, value: string | boolean) => void;
}

/** Returns the fields valid for the active flow (used for render + validation). */
export function visibleFields(fields: FieldConfig[], flowId: string) {
  return fields.filter((f) => !f.flows || f.flows.includes(flowId));
}

/** Renders a module's fields, filtered to those valid for the active flow. */
export function DynamicFields({
  fields,
  flowId,
  values,
  errors = {},
  resolvingFields = [],
  onChange,
}: DynamicFieldsProps) {
  const visible = visibleFields(fields, flowId);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {visible.map((field) => {
        const error = errors[field.name];
        const resolving = resolvingFields.includes(field.name);
        return (
          <div key={field.name} className={cn("flex flex-col gap-2", field.fullWidth && "md:col-span-2")}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive" aria-hidden="true">*</span>}
            </Label>
            <Input
              id={field.name}
              placeholder={field.placeholder}
              readOnly={field.readOnly}
              aria-busy={resolving || undefined}
              aria-invalid={Boolean(error)}
              aria-describedby={field.hint || error || resolving ? `${field.name}-message` : undefined}
              value={String(values[field.name] ?? "")}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={cn(
                field.readOnly && "bg-muted/50 text-muted-foreground",
                resolving && "animate-pulse",
                error && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {resolving && !error && (
              <p id={`${field.name}-message`} className="text-xs text-muted-foreground" role="status">
                Resolving model informationâ€¦
              </p>
            )}
            {field.hint && !error && !resolving && (
              <p id={`${field.name}-message`} className="text-xs text-muted-foreground">{field.hint}</p>
            )}
            {error && <p id={`${field.name}-message`} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
