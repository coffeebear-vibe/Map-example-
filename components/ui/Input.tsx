"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  id: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className = "", ...props }, ref) => {
    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary tracking-wide"
        >
          {label}
          {props.required && (
            <span className="text-error ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-required={props.required}
          aria-invalid={!!error}
          className={[
            "w-full px-3.5 py-2.5 rounded-input text-base text-text-primary",
            "border bg-bg",
            "transition-colors",
            "placeholder:text-text-secondary",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
            error
              ? "border-error focus-visible:ring-error"
              : "border-border focus-visible:border-accent",
            className,
          ].join(" ")}
          {...props}
        />

        {helperText && !error && (
          <p id={helperId} className="text-xs text-text-secondary">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
