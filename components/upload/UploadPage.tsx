"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "./UploadZone";
import { analyzePdf } from "@/lib/pdf/analyze";
import { storeSession } from "@/lib/pdf/session-store";

type PageState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "error"; message: string };

export function UploadPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>({ status: "idle" });

  async function handleFile(file: File) {
    setPageState({ status: "analyzing" });
    try {
      const session = await analyzePdf(file);

      if (session.file.isPasswordProtected) {
        setPageState({
          status: "error",
          message:
            "This PDF is password protected. Remove the password in your PDF viewer and try again.",
        });
        return;
      }

      storeSession(session, file);
      router.push("/remediate");
    } catch (err) {
      console.error("Analysis failed:", err);
      setPageState({
        status: "error",
        message:
          "Something went wrong while reading this PDF. Please try again or use a different file.",
      });
    }
  }

  const isAnalyzing = pageState.status === "analyzing";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FAFAF8" }}
    >
      {/* Nav */}
      <header
        className="flex items-center"
        style={{
          borderBottom: "1px solid #D9D6CC",
          padding: "1.5rem 4rem",
          backgroundColor: "#FAFAF8",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            color: "#1A1A1A",
            letterSpacing: "-0.01em",
          }}
        >
          PDF Accessibility Guide
        </span>
      </header>

      {/* Hero */}
      <main id="main-content" className="flex-1" style={{ padding: "6rem 4rem" }}>
        <div style={{ maxWidth: "42rem" }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 700,
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              color: "#1A1A1A",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Make your PDF accessible
            <br />
            to everyone.
          </h1>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: "1.125rem",
              color: "#6B6B6B",
              lineHeight: 1.65,
              marginTop: "1.5rem",
              maxWidth: "480px",
            }}
          >
            Upload a PDF and we&rsquo;ll walk you through every fix, one step
            at a time. No technical knowledge required.
          </p>

          <div style={{ marginTop: "2.5rem" }}>
            <UploadZone onFile={handleFile} disabled={isAnalyzing} />
          </div>

          {/* Analyzing overlay message */}
          {isAnalyzing && (
            <p
              role="status"
              aria-live="polite"
              style={{
                marginTop: "1.25rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9375rem",
                color: "#6B6B6B",
              }}
            >
              Analysing your PDF — this takes a few seconds&hellip;
            </p>
          )}

          {/* Error */}
          {pageState.status === "error" && (
            <p
              role="alert"
              style={{
                marginTop: "1.25rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9375rem",
                color: "#D93B48",
              }}
            >
              {pageState.message}
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #D9D6CC", padding: "1.25rem 4rem" }}>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
            color: "#6B6B6B",
            margin: 0,
          }}
        >
          Files processed locally &nbsp;&middot;&nbsp; WCAG 2.2 Level AA
          &nbsp;&middot;&nbsp; Built for librarians and admins
        </p>
      </footer>
    </div>
  );
}
