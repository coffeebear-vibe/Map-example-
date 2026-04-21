interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function Spinner({
  size = "md",
  label = "Loading…",
  className = "",
}: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-[3px]",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <div
        className={`${sizes[size]} animate-spin rounded-full border-accent border-t-transparent`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
