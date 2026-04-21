import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error";
  padding?: "sm" | "md" | "lg";
}

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const variants = {
    default: "bg-surface border-border",
    success: "bg-success-light border-success/30",
    warning: "bg-warning-light border-warning/30",
    error: "bg-error-light border-error/30",
  };

  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`rounded-card border ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
