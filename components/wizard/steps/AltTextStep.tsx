"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Checkbox } from "@/components/ui/Checkbox";
import { getStoredFile } from "@/lib/pdf/session-store";
import type { RemediationSession } from "@/lib/pdf/types";

type ImageEntry = RemediationSession["analysis"]["images"][number];

interface AltTextStepProps {
  images: ImageEntry[];
  existingFixes: Record<string, string>;
  stepIndex: number;
  onSave: (fixes: Record<string, string>) => void;
  onSkip: () => void;
}

function ImageCard({
  image, value, isDecorative, onChange, onDecorativeChange,
}: {
  image: ImageEntry;
  value: string;
  isDecorative: boolean;
  onChange: (v: string) => void;
  onDecorativeChange: (v: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnail, setThumbnail] = useState("");
  const [loadingThumb, setLoadingThumb] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function render() {
      setLoadingThumb(true);
      try {
        const file = getStoredFile();
        if (!file) return;
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data }).promise;
        const page = await pdf.getPage(image.pageIndex + 1);
        const vp = page.getViewport({ scale: 1 });
        const scale = 320 / vp.width;
        const scaled = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = Math.round(scaled.width);
        canvas.height = Math.round(scaled.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport: scaled }).promise;
        if (!cancelled) setThumbnail(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        // preview unavailable
      } finally {
        if (!cancelled) setLoadingThumb(false);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [image.pageIndex]);

  async function handleSuggest() {
    if (!thumbnail) return;
    setSuggesting(true);
    setSuggestionError("");
    try {
      const res = await fetch("/api/suggest-alt-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: thumbnail.split(",")[1], mimeType: "image/jpeg" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      onChange(data.suggestion);
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : "Failed to generate suggestion.");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div style={{ border: "1px solid #E4E4E7", borderRadius: "12px", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
      <div style={{ backgroundColor: "#F7F7F8", borderBottom: "1px solid #E4E4E7", minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {loadingThumb && (
          <div style={{ position: "absolute" }}>
            <Spinner size="md" label="Rendering PDF page" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          aria-label={"Preview of page " + String(image.pageIndex + 1)}
          style={{ maxWidth: "100%", display: loadingThumb ? "none" : "block" }}
        />
        {!loadingThumb && !thumbnail && (
          <p style={{ color: "#6B6B6B", fontSize: "0.875rem", padding: "1rem" }}>Preview unavailable</p>
        )}
      </div>
      <div style={{ padding: "1.25rem" }}>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.75rem", color: "#6B6B6B", margin: "0 0 0.875rem" }}>
          Page {image.pageIndex + 1}
        </p>
        <Checkbox
          id={"decorative-" + image.id}
          label="This image is decorative (no alt text needed)"
          description="Use this for visual elements like dividers or backgrounds that do not convey meaning."
          checked={isDecorative}
          onChange={(e) => onDecorativeChange(e.target.checked)}
        />
        {!isDecorative && (
          <div style={{ marginTop: "1rem" }}>
            <label
              htmlFor={"alt-" + image.id}
              style={{ display: "block", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "6px" }}
            >
              Describe this image for someone who cannot see it{" "}
              <span style={{ color: "#DC2626" }} aria-hidden="true">*</span>
            </label>
            <textarea
              id={"alt-" + image.id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              aria-required="true"
              placeholder="e.g. Bar chart showing enrollment growth from 2020 to 2024."
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E4E4E7", fontFamily: "DM Sans, sans-serif", fontSize: "0.9375rem", color: "#1A1A1A", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }}
            />
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Button variant="ghost" size="sm" onClick={handleSuggest} loading={suggesting} disabled={suggesting || !thumbnail}>
                {suggesting ? "Suggesting..." : "Suggest alt text with AI"}
              </Button>
              {suggestionError && (
                <p role="alert" style={{ fontSize: "0.8125rem", color: "#DC2626", margin: 0 }}>{suggestionError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AltTextStep({ images, existingFixes, stepIndex, onSave, onSkip }: AltTextStepProps) {
  const [fixes, setFixes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const img of images) init[img.id] = existingFixes[img.id] ?? img.currentAlt ?? "";
    return init;
  });
  const [decorative, setDecorative] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const img of images) init[img.id] = existingFixes[img.id] === "";
    return init;
  });
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { headingRef.current?.focus(); }, []);

  const allHandled = images.every(
    (img) => decorative[img.id] || (fixes[img.id]?.trim().length ?? 0) > 0
  );

  function handleSave() {
    const result: Record<string, string> = {};
    for (const img of images) result[img.id] = decorative[img.id] ? "" : (fixes[img.id] ?? "");
    onSave(result);
  }

  return (
    <div style={{ maxWidth: "600px" }}>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#7C3AED", margin: "0 0 0.5rem" }}>
        Step {stepIndex + 1}
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "1.75rem", color: "#1A1A1A", margin: "0 0 0.75rem", lineHeight: 1.2, outline: "none" }}
      >
        Image Alt Text
      </h2>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "1rem", color: "#6B6B6B", margin: "0 0 0.5rem", lineHeight: 1.6 }}>
        Alt text lets screen readers describe images to people who cannot see them. Without it, users hear only the word image with no context.
      </p>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", color: "#6B6B6B", margin: "0 0 2rem" }}>
        {images.length} image{images.length !== 1 ? "s" : ""} need{images.length === 1 ? "s" : ""} attention
      </p>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.25rem" }}>
        {images.map((img) => (
          <ImageCard
            key={img.id}
            image={img}
            value={fixes[img.id] ?? ""}
            isDecorative={decorative[img.id] ?? false}
            onChange={(v) => setFixes((prev) => ({ ...prev, [img.id]: v }))}
            onDecorativeChange={(v) => setDecorative((prev) => ({ ...prev, [img.id]: v }))}
          />
        ))}
      </div>
      <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: "0.75rem" }}>
        <Button onClick={handleSave} disabled={!allHandled}>Save and Continue</Button>
        <button
          onClick={onSkip}
          style={{ background: "none", border: "none", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", color: "#6B6B6B", cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}
