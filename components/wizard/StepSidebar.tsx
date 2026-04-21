interface Step {
  id: string;
  label: string;
}

interface StepSidebarProps {
  steps: Step[];
  currentStepIndex: number;
  completedStepIds: string[];
  resolvedCount: number;
  totalCount: number;
}

export function StepSidebar({
  steps,
  currentStepIndex,
  completedStepIds,
  resolvedCount,
  totalCount,
}: StepSidebarProps) {
  return (
    <aside
      aria-label="Remediation steps"
      style={{
        width: "280px",
        flexShrink: 0,
        borderRight: "1px solid #E4E4E7",
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        padding: "2rem 0",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 1.5rem 2rem", borderBottom: "1px solid #E4E4E7" }}>
        <span
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: "#1A1A1A",
          }}
        >
          PDF Accessibility Guide
        </span>
      </div>

      {/* Step list */}
      <nav aria-label="Step navigation">
        <ol style={{ listStyle: "none", margin: 0, padding: "1.5rem 0" }}>
          {steps.map((step, index) => {
            const isCompleted = completedStepIds.includes(step.id);
            const isCurrent = index === currentStepIndex;
            const isUpcoming = !isCompleted && !isCurrent;

            return (
              <li key={step.id}>
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    padding: "0.625rem 1.5rem",
                    backgroundColor: isCurrent ? "#EDE9FE" : "transparent",
                    borderLeft: isCurrent
                      ? "3px solid #7C3AED"
                      : "3px solid transparent",
                  }}
                >
                  {/* Step number / checkmark */}
                  <div
                    aria-hidden="true"
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: isCompleted
                        ? "#16A34A"
                        : isCurrent
                        ? "#7C3AED"
                        : "#F7F7F8",
                      color: isCompleted || isCurrent ? "#FFFFFF" : "#6B6B6B",
                      border: isUpcoming ? "1px solid #E4E4E7" : "none",
                    }}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </div>

                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: isCurrent ? 600 : 400,
                      color: isCompleted
                        ? "#16A34A"
                        : isCurrent
                        ? "#7C3AED"
                        : "#6B6B6B",
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Issues counter */}
      <div
        style={{
          marginTop: "auto",
          padding: "1.25rem 1.5rem",
          borderTop: "1px solid #E4E4E7",
        }}
      >
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.8125rem",
            color: "#6B6B6B",
            margin: 0,
          }}
        >
          <span
            style={{ fontWeight: 600, color: "#7C3AED" }}
          >
            {resolvedCount} of {totalCount}
          </span>{" "}
          issues resolved
        </p>
      </div>
    </aside>
  );
}
