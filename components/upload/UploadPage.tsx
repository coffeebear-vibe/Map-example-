"use client";

import { useRouter } from "next/navigation";
import { UploadZone } from "./UploadZone";

export function UploadPage() {
  const router = useRouter();

  function handleFile(file: File) {
    // In Phase 2 we'll run analysis here; for now just log
    console.log("File received:", file.name, file.size);
    // router.push("/remediate") will go here after Phase 2
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center px-6 py-16"
      >
        {/* Logo / wordmark */}
        <div className="mb-12 flex items-center gap-3" aria-label="PDF Accessibility Fixer">
          <div
            className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 15l4-4 3 3 5-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold text-text-primary tracking-tight">
            PDF Accessibility Fixer
          </span>
        </div>

        {/* Hero */}
        <div className="text-center max-w-xl mb-12">
          <h1 className="text-4xl font-semibold text-text-primary leading-tight mb-4 text-balance">
            Make your PDF accessible{" "}
            <span className="text-accent">to everyone</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed text-balance">
            Upload a PDF and we&rsquo;ll walk you through every fix, one step
            at a time. No technical knowledge required.
          </p>
        </div>

        {/* Upload zone */}
        <UploadZone onFile={handleFile} />

        {/* Supporting info */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {[
            { icon: "🔒", text: "Files are processed locally" },
            { icon: "✅", text: "Targets WCAG 2.2 Level AA" },
            { icon: "⚡", text: "Takes 5–10 minutes per document" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 text-sm text-text-secondary"
            >
              <span aria-hidden="true">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-text-secondary border-t border-border">
        <p>
          Guided accessibility remediation &mdash; built for librarians, school
          admins, and nonprofit staff
        </p>
      </footer>
    </div>
  );
}
