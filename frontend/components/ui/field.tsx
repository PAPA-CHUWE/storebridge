import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type FieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  error?: string;
};

/** A labelled input with its error message wired up for assistive technology. */
export function Field({ id, label, error, className, ...props }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint",
          "transition-colors hover:border-faint focus-visible:border-teal focus-visible:outline-offset-0",
          "aria-invalid:border-danger",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
