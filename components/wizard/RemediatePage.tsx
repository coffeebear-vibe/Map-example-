"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession } from "@/lib/pdf/session-store";
import type { RemediationSession } from "@/lib/pdf/types";

// Phase 2 placeholder — replaced by the full wizard in Phase 3.
export function RemediatePage() {
  const router = useRouter();
  const [session, setSession] = useState<RemediationSession | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) return null;

  const { file, analysis } = session;
  const flaggedImages = analysis.images.filter((i) => !i.hasAlt);
  const flaggedFields = analysis.formFields.filter((f) => !f.hasAccessibleName);
  const flaggedTables = analysis.tables.filter((t) => !t.hasHeaders);

  const issues = [
    !analysis.metadata.title && "Missing document title",
    !analysis.metadata.author && "Missing author",
    !analysis.metadata.language && "Missing language",
    flaggedImages.length > 0 && `${flaggedImages.length} image(s) missing alt text`,
    !analysis.hasStructureTree && "No accessibility structure tree detected",
    flaggedFields.length > 0 && `${flaggedFields.length} form field(s) missing accessible labels`,
    flaggedTables.length > 0 && `${flaggedTables.length} table(s) missing headers`,
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FAFAF8",
        fontFamily: "'DM Sans', sans-serif",
        color: "#1A1A1A",
      }}
    >
      {/* Nav */}
      <header
        style={{
          borderBottom: "1px solid #D9D6CC",
          padding: "1.5rem 4rem",
          backgroundColor: "#FAFAF8",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "1rem" }}>
          PDF Accessibility Guide
        </span>
      </header>

      <main id="main-content" style={{ padding: "4rem" }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#6B6B6B",
            marginBottom: "0.5rem",
          }}
        >
          Analysis complete
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: "2.25rem",
            lineHeight: 1.2,
            margin: "0 0 0.5rem",
          }}
        >
          {file.name}
        </h1>
        <p style={{ color: "#6B6B6B", marginBottom: "3rem" }}>
          {(file.size / 1024 / 1024).toFixed(2)} MB
          {file.isScanned && " · Scanned document — some steps may be limited"}
        </p>

        {/* Issue summary */}
        <div
          style={{
            borderTop: "2px solid #1A1A1A",
            paddingTop: "2rem",
            maxWidth: "560px",
          }}
        >
          <h2
            style={{ fontWeight: 600, fontSize: "1.125rem", marginBottom: "1.25rem" }}
          >
            {issues.length === 0
              ? "No issues found — your PDF looks accessible!"
              : `${issues.length} issue${issues.length !== 1 ? "s" : ""} to fix`}
          </h2>

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2.5rem" }}>
            {issues.map((issue) => (
              <li
                key={issue}
                style={{
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #D9D6CC",
                  fontSize: "0.9375rem",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: "#D93B48", fontWeight: 600, flexShrink: 0 }}>
                  ✗
                </span>
                {issue}
              </li>
            ))}
          </ul>

          <p
            style={{
              fontSize: "0.8125rem",
              color: "#6B6B6B",
              backgroundColor: "#F0EFE9",
              border: "1px solid #D9D6CC",
              borderRadius: "4px",
              padding: "1rem",
            }}
          >
            <strong>Phase 3 coming next:</strong> the full guided wizard will
            walk you through each fix one at a time.
          </p>

          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: "1.5rem",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "#1A1A1A",
              backgroundColor: "transparent",
              border: "1px solid #D9D6CC",
              borderRadius: "4px",
              padding: "10px 24px",
              cursor: "pointer",
            }}
          >
            ← Upload a different PDF
          </button>
        </div>
      </main>
    </div>
  );
}
