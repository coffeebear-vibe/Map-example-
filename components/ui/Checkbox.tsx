"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  id: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className = "", ...props }, ref) => {
    const descId = description ? `${id}-desc` : undefined;

    return (
      <div className={`flex gap-3 ${className}`}>
        <div className="flex items-start pt-0.5">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-describedby={descId}
            className={[
              "w-4.5 h-4.5 mt-0.5 rounded cursor-pointer",
              "border-2 border-border",
              "text-accent",
              "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              "checked:bg-accent checked:border-accent",
            ].join(" ")}
            style={{ width: "1.125rem", height: "1.125rem" }}
            {...props}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor={id}
            className="text-sm font-medium text-text-primary leading-snug cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p id={descId} className="text-xs text-text-secondary leading-snug">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
