"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadSession, saveSession } from "@/lib/pdf/session-store";
import { StepSidebar } from "./StepSidebar";
import { MetadataStep } from "./steps/MetadataStep";
import { AltTextStep } from "./steps/AltTextStep";
import type { RemediationSession } from "@/lib/pdf/types";

interface WizardStep {
  id: string;
  label: string;
}

function computeSteps(session: RemediationSession): WizardStep[] {
  const steps: WizardStep[] = [{ id: "metadata", label: "Document Metadata" }];

  const flaggedImages = session.analysis.images.filter((i) => !i.hasAlt);
  if (flaggedImages.length > 0) steps.push({ id: "alt-text", label: "Image Alt Text" });

  steps.push({ id: "reading-order", label: "Reading Order" });
  steps.push({ id: "contrast", label: "Color Contrast" });

  const flaggedFields = session.analysis.formFields.filter((f) => !f.hasAccessibleName);
  if (flaggedFields.length > 0) steps.push({ id: "form-fields", label: "Form Fields" });

  const flaggedTables = session.analysis.tables.filter((t) => !t.hasHeaders);
  if (flaggedTables.length > 0) steps.push({ id: "table-headers", label: "Table Headers" });

  return steps;
}

function countIssues(session: RemediationSession) {
  const { metadata, images, formFields, tables, hasStructureTree } = session.analysis;
  let total = 0;
  if (!metadata.title) total++;
  if (!metadata.author) total++;
  if (!metadata.language) total++;
  total += images.filter((i) => !i.hasAlt).length;
  if (!hasStructureTree) total++;
  total += formFields.filter((f) => !f.hasAccessibleName).length;
  total += tables.filter((t) => !t.hasHeaders).length;
  return total;
}

function countResolved(session: RemediationSession) {
  const { fixes, analysis } = session;
  let resolved = 0;
  if (fixes.metadata) {
    if (fixes.metadata.title) resolved++;
    if (fixes.metadata.author) resolved++;
    if (fixes.metadata.language) resolved++;
  }
  resolved += Object.keys(fixes.altText).length;
  if (fixes.contrastConfirmed) resolved++;
  resolved += Object.keys(fixes.formFields).length;
  if (fixes.tablesAcknowledged) resolved++;
  return resolved;
}

// Placeholder for steps not yet implemented in Phase 3
function ComingSoonStep({ label, stepIndex, onNext, onBack }: { label: string; stepIndex: number; onNext: () => void; onBack: () => void }) {
  return (
    <div style={{ maxWidth: "560px" }}>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4B7DBF", margin: "0 0 0.5rem" }}>
        Step {stepIndex + 1}
      </p>
      <h2 style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "1.75rem", color: "#1A1A1A", margin: "0 0 1rem", lineHeight: 1.2 }}>
        {label}
      </h2>
      <div style={{ backgroundColor: "#F0EFE9", border: "1px solid #D9D6CC", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.9375rem", color: "#6B6B6B", margin: 0 }}>
          This step is coming in Phase 4. Click Continue to proceed.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" }}>
        <button
          onClick={onNext}
          style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 500, fontSize: "1rem", color: "#FFFFFF", backgroundColor: "#4B7DBF", border: "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer" }}
        >
          Continue
        </button>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", color: "#6B6B6B", cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export function WizardShell() {
  const router = useRouter();
  const [session, setSessionState] = useState<RemediationSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [steps, setSteps] = useState<WizardStep[]>([]);

  useEffect(() => {
    const s = loadSession();
    if (!s) { router.replace("/"); return; }
    setSessionState(s);
    setSteps(computeSteps(s));
    const savedIndex = s.currentStep
      ? computeSteps(s).findIndex((st) => st.id === s.currentStep)
      : 0;
    setCurrentIndex(Math.max(0, savedIndex));
  }, [router]);

  const updateSession = useCallback((updates: Partial<RemediationSession>) => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      saveSession(next);
      return next;
    });
  }, []);

  function goBack() {
    if (currentIndex === 0) {
      router.push("/");
    } else {
      setCurrentIndex((i) => i - 1);
    }
  }

  function advance(updatedSession?: Partial<RemediationSession>) {
    if (updatedSession) updateSession(updatedSession);
    setSessionState((prev) => {
      if (!prev) return prev;
      const currentStepId = steps[currentIndex]?.id ?? "";
      const completedSteps = Array.from(new Set([...(prev.completedSteps ?? []), currentStepId]));
      const next = { ...prev, ...updatedSession, completedSteps };
      if (steps[currentIndex + 1]) {
        next.currentStep = steps[currentIndex + 1].id;
      }
      saveSession(next);
      return next;
    });
    if (currentIndex + 1 < steps.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.push("/complete");
    }
  }

  if (!session || steps.length === 0) return null;

  const currentStep = steps[currentIndex];
  const flaggedImages = session.analysis.images.filter((i) => !i.hasAlt);
  const totalIssues = countIssues(session);
  const resolvedIssues = countResolved(session);

  function renderStep() {
    if (!session || !currentStep) return null;

    switch (currentStep.id) {
      case "metadata":
        return (
          <MetadataStep
            initial={session.analysis.metadata}
            onSave={(data) => advance({ fixes: { ...session.fixes, metadata: data } })}
            onSkip={() => advance()}
            onBack={goBack}
          />
        );
      case "alt-text":
        return (
          <AltTextStep
            images={flaggedImages}
            existingFixes={session.fixes.altText}
            stepIndex={currentIndex}
            onSave={(fixes) => advance({ fixes: { ...session.fixes, altText: fixes } })}
            onSkip={() => advance()}
            onBack={goBack}
          />
        );
      default:
        return (
          <ComingSoonStep
            label={currentStep.label}
            stepIndex={currentIndex}
            onNext={() => advance()}
            onBack={goBack}
          />
        );
    }
  }

  return (
    <div style={{ display: "flex", height: currentStep.id === "alt-text" ? "100vh" : undefined, minHeight: currentStep.id === "alt-text" ? undefined : "100vh", overflow: currentStep.id === "alt-text" ? "hidden" : undefined, backgroundColor: "#FFFFFF" }}>
      {/* Skip nav */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          zIndex: 100,
          backgroundColor: "#4B7DBF",
          color: "#FFFFFF",
          padding: "8px 16px",
          fontFamily: "DM Sans, sans-serif",
          textDecoration: "none",
          borderRadius: "0 0 8px 8px",
        }}
        onFocus={(e) => { e.currentTarget.style.left = "1rem"; }}
        onBlur={(e) => { e.currentTarget.style.left = "-9999px"; }}
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <StepSidebar
        steps={steps}
        currentStepIndex={currentIndex}
        completedStepIds={session.completedSteps ?? []}
        resolvedCount={resolvedIssues}
        totalCount={totalIssues}
      />

      {/* Main panel */}
      <main
        id="main-content"
        style={{
          flex: 1,
          padding: currentStep.id === "alt-text" ? "0" : "3rem 4rem",
          overflowY: currentStep.id === "alt-text" ? "hidden" : "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ARIA live region announces step changes */}
        <div role="status" aria-live="polite" className="sr-only">
          {currentStep.label} — step {currentIndex + 1} of {steps.length}
        </div>

        {renderStep()}
      </main>
    </div>
  );
}

