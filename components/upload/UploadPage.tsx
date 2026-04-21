"use client";

import { UploadZone } from "./UploadZone";

export function UploadPage() {
  function handleFile(file: File) {
    // Phase 2: run analysis and route to /remediate
    console.log("File accepted:", file.name);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <header className="border-b border-rule px-16 py-6 flex items-center">
        <span className="font-sans font-semibold text-ink text-base tracking-tight">
          PDF Accessibility Guide
        </span>
      </header>

      {/* Hero */}
      <main
        id="main-content"
        className="flex-1 px-16 py-24"
      >
        <div className="max-w-2xl">
          <h1
            className="font-display font-bold text-ink leading-tight"
            style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
          >
            Make your PDF accessible
            <br />
            to everyone.
          </h1>

          <p
            className="mt-6 font-sans text-muted leading-relaxed"
            style={{ fontSize: "1.125rem", maxWidth: "480px" }}
          >
            Upload a PDF and we&rsquo;ll walk you through every fix, one step
            at a time. No technical knowledge required.
          </p>

          <div className="mt-10">
            <UploadZone onFile={handleFile} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-rule py-5 px-16">
        <p className="font-sans text-sm text-muted">
          Files processed locally &nbsp;&middot;&nbsp; WCAG 2.2 Level AA
          &nbsp;&middot;&nbsp; Built for librarians and admins
        </p>
      </footer>
    </div>
  );
}
