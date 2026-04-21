"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
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
  onBack: () => void;
}

// ── PDF Viewer (right panel) ──────────────────────────────────────────────────

interface PdfViewerProps {
  pdfPageIndex: number;   // actual 0-based PDF page to render
  slotIndex: number;      // position in allPages array (for nav display)
  totalSlots: number;     // total pages with images
  activeBbox: ImageEntry["bbox"];
  onSlotChange: (slot: number) => void;
  onThumbnailReady: (pdfPageIndex: number, url: string) => void;
}

const RENDER_SCALE = 2;

function PdfViewer({ pdfPageIndex, slotIndex, totalSlots, activeBbox, onSlotChange, onThumbnailReady }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState<{ w: number; h: number; pdfH: number } | null>(null);

  // Auto-scroll to center the highlighted image when it changes
  useEffect(() => {
    if (!activeBbox || !pageSize || !scrollAreaRef.current || !canvasRef.current) return;
    const container = scrollAreaRef.current;
    const canvas = canvasRef.current;
    const displayScale = container.clientWidth / pageSize.w;
    const canvasY = (pageSize.pdfH - activeBbox.y - activeBbox.height) * RENDER_SCALE;
    const canvasH = activeBbox.height * RENDER_SCALE;
    const cssY = canvasY * displayScale;
    const cssH = canvasH * displayScale;
    const target = cssY + cssH / 2 - container.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [activeBbox, pageSize]);

  // Render page to canvas
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function render() {
      try {
        const file = getStoredFile();
        if (!file) return;
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data }).promise;
        const page = await pdf.getPage(pdfPageIndex + 1);
        const vp = page.getViewport({ scale: RENDER_SCALE });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (cancelled) return;
        const url = canvas.toDataURL("image/jpeg", 0.9);
        onThumbnailReady(pdfPageIndex, url);
        const naturalVp = page.getViewport({ scale: 1 });
        const pdfH = naturalVp.viewBox[3];
        setPageSize({ w: vp.width, h: vp.height, pdfH });
      } catch {
        // render failed
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [pdfPageIndex, onThumbnailReady]);

  // Overlay rect for active image
  function overlayStyle(): CSSProperties | null {
    if (!activeBbox || !pageSize) return null;
    // Canvas intrinsic size = pageSize.w × pageSize.h (at RENDER_SCALE)
    // CSS may shrink the canvas to fit the panel, so use % to stay aligned
    const canvasX = activeBbox.x * RENDER_SCALE;
    const canvasY = (pageSize.pdfH - activeBbox.y - activeBbox.height) * RENDER_SCALE;
    const canvasW = activeBbox.width * RENDER_SCALE;
    const canvasH = activeBbox.height * RENDER_SCALE;
    return {
      position: "absolute",
      left: `${(canvasX / pageSize.w) * 100}%`,
      top: `${(canvasY / pageSize.h) * 100}%`,
      width: `${(canvasW / pageSize.w) * 100}%`,
      height: `${(canvasH / pageSize.h) * 100}%`,
      backgroundColor: "rgba(75, 125, 191, 0.15)",
      border: "2px solid #4B7DBF",
      boxShadow: "0 0 0 3px rgba(75, 125, 191, 0.25)",
      borderRadius: "3px",
      pointerEvents: "none",
    };
  }

  const overlay = overlayStyle();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Page nav */}
      {totalSlots > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid #D9D6CC", flexShrink: 0 }}>
          <button
            onClick={() => onSlotChange(slotIndex - 1)}
            disabled={slotIndex === 0}
            aria-label="Previous page"
            style={{ border: "1px solid #D9D6CC", borderRadius: "6px", backgroundColor: "#FFFFFF", padding: "4px 10px", cursor: slotIndex === 0 ? "default" : "pointer", color: slotIndex === 0 ? "#D9D6CC" : "#1A1A1A", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem" }}
          >
            ←
          </button>
          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.8125rem", color: "#6B6B6B" }}>
            Page {slotIndex + 1} of {totalSlots}
          </span>
          <button
            onClick={() => onSlotChange(slotIndex + 1)}
            disabled={slotIndex >= totalSlots - 1}
            aria-label="Next page"
            style={{ border: "1px solid #D9D6CC", borderRadius: "6px", backgroundColor: "#FFFFFF", padding: "4px 10px", cursor: slotIndex >= totalSlots - 1 ? "default" : "pointer", color: slotIndex >= totalSlots - 1 ? "#D9D6CC" : "#1A1A1A", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem" }}
          >
            →
          </button>
        </div>
      )}

      {/* Canvas area — scrollable */}
      <div ref={scrollAreaRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", backgroundColor: "#E8E6E0", position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <Spinner size="md" label="Rendering page" />
          </div>
        )}
        <div style={{ position: "relative", width: "100%" }}>
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%" }}
            aria-hidden="true"
          />
          {overlay && <div style={overlay} aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}

// ── Image input row (left panel) ──────────────────────────────────────────────

function ImageInput({
  image,
  globalIndex,
  total,
  indexOnPage,
  countOnPage,
  value,
  isDecorative,
  isActive,
  thumbnail,
  onChange,
  onDecorativeChange,
  onFocus,
}: {
  image: ImageEntry;
  globalIndex: number;
  total: number;
  indexOnPage: number;
  countOnPage: number;
  value: string;
  isDecorative: boolean;
  isActive: boolean;
  thumbnail: string;
  onChange: (v: string) => void;
  onDecorativeChange: (v: boolean) => void;
  onFocus: () => void;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");

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

  const label = countOnPage > 1
    ? `Image ${globalIndex + 1} of ${total} (image ${indexOnPage + 1} of ${countOnPage} on this page)`
    : `Image ${globalIndex + 1} of ${total}`;

  return (
    <div
      onClick={onFocus}
      style={{
        border: isActive ? "2px solid #4B7DBF" : "2px solid #D9D6CC",
        borderRadius: "10px",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        cursor: "default",
        boxShadow: isActive ? "0 0 0 3px rgba(75, 125, 191, 0.15)" : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Header */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #D9D6CC", display: "flex", alignItems: "center", gap: "0.625rem", backgroundColor: isActive ? "#EBF2FB" : "#FAFAF8" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.625rem", height: "1.625rem", borderRadius: "50%", backgroundColor: isActive ? "#4B7DBF" : "#D9D6CC", color: "#FFFFFF", fontFamily: "DM Sans, sans-serif", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0, transition: "background-color 0.15s" }}>
          {globalIndex + 1}
        </span>
        <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A" }}>
          {label}
        </span>
      </div>

      {/* Controls */}
      <div style={{ padding: "1rem" }}>
        <Checkbox
          id={"decorative-" + image.id}
          label="This image is decorative (no alt text needed)"
          description="Use for dividers, decorative borders, or background images that convey no meaning."
          checked={isDecorative}
          onChange={(e) => onDecorativeChange(e.target.checked)}
        />
        {!isDecorative && (
          <div style={{ marginTop: "0.875rem" }}>
            <label
              htmlFor={"alt-" + image.id}
              style={{ display: "block", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "6px" }}
            >
              Describe this image for someone who cannot see it{" "}
              <span style={{ color: "#D93B48" }} aria-hidden="true">*</span>
            </label>
            <textarea
              id={"alt-" + image.id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              rows={3}
              aria-required="true"
              placeholder="e.g. Photo of the USC campus at dusk, with students walking between palm trees."
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #D9D6CC", fontFamily: "DM Sans, sans-serif", fontSize: "0.9375rem", color: "#1A1A1A", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }}
            />
            <div style={{ marginTop: "0.625rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Button variant="ghost" size="sm" onClick={handleSuggest} loading={suggesting} disabled={suggesting || !thumbnail}>
                {suggesting ? "Suggesting..." : "Suggest alt text with AI"}
              </Button>
              {suggestionError && (
                <p role="alert" style={{ fontSize: "0.8125rem", color: "#D93B48", margin: 0 }}>{suggestionError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main step ─────────────────────────────────────────────────────────────────

export function AltTextStep({ images, existingFixes, stepIndex, onSave, onSkip, onBack }: AltTextStepProps) {
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
  const [activeId, setActiveId] = useState<string>(images[0]?.id ?? "");
  const [viewerSlot, setViewerSlot] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);

  // All unique PDF page indices that have images, in order
  const allPages = Array.from(new Set(images.map((img) => img.pageIndex))).sort((a, b) => a - b);
  const totalSlots = allPages.length;

  useEffect(() => { headingRef.current?.focus(); }, []);

  const activeImage = images.find((img) => img.id === activeId);

  function focusImage(img: ImageEntry) {
    setActiveId(img.id);
    const slot = allPages.indexOf(img.pageIndex);
    if (slot >= 0) setViewerSlot(slot);
  }

  const handleThumbnailReady = useCallback((pdfPageIndex: number, url: string) => {
    setThumbnails((prev) => ({ ...prev, [pdfPageIndex]: url }));
  }, []);

  const currentPdfPage = allPages[viewerSlot] ?? allPages[0];

  const allHandled = images.every(
    (img) => decorative[img.id] || (fixes[img.id]?.trim().length ?? 0) > 0
  );

  function handleSave() {
    const result: Record<string, string> = {};
    for (const img of images) result[img.id] = decorative[img.id] ? "" : (fixes[img.id] ?? "");
    onSave(result);
  }

  // Group for display — show page label before first image of each page
  const groups: { pageIndex: number; images: ImageEntry[] }[] = [];
  for (const img of images) {
    const last = groups[groups.length - 1];
    if (last && last.pageIndex === img.pageIndex) {
      last.images.push(img);
    } else {
      groups.push({ pageIndex: img.pageIndex, images: [img] });
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Left panel — scrollable inputs */}
      <div
        style={{
          width: "50%",
          overflowY: "auto",
          borderRight: "1px solid #D9D6CC",
          padding: "2.5rem 2.5rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4B7DBF", margin: "0 0 0.5rem" }}>
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
          Alt text lets screen readers describe images to people who cannot see them.
        </p>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", color: "#6B6B6B", margin: "0 0 1.5rem" }}>
          {images.length} image{images.length !== 1 ? "s" : ""} need{images.length === 1 ? "s" : ""} attention
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", flex: 1 }}>
          {groups.map((group) => {
            let globalOffset = 0;
            for (const g of groups) {
              if (g.pageIndex === group.pageIndex) break;
              globalOffset += g.images.length;
            }
            return (
              <div key={group.pageIndex}>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.625rem" }}>
                  Page {group.pageIndex + 1}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {group.images.map((img, i) => (
                    <ImageInput
                      key={img.id}
                      image={img}
                      globalIndex={globalOffset + i}
                      total={images.length}
                      indexOnPage={i}
                      countOnPage={group.images.length}
                      value={fixes[img.id] ?? ""}
                      isDecorative={decorative[img.id] ?? false}
                      isActive={activeId === img.id}
                      thumbnail={thumbnails[img.pageIndex] ?? ""}
                      onChange={(v) => setFixes((prev) => ({ ...prev, [img.id]: v }))}
                      onDecorativeChange={(v) => setDecorative((prev) => ({ ...prev, [img.id]: v }))}
                      onFocus={() => focusImage(img)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid #D9D6CC" }}>
          <Button onClick={handleSave} disabled={!allHandled}>Save and Continue</Button>
          <button
            onClick={onSkip}
            style={{ background: "none", border: "none", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", color: "#6B6B6B", cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            Skip this step
          </button>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", color: "#6B6B6B", cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Right panel — sticky PDF viewer */}
      <div style={{ width: "50%", position: "sticky", top: 0, height: "100vh", backgroundColor: "#F0EFE9" }}>
        <PdfViewer
          pdfPageIndex={currentPdfPage}
          slotIndex={viewerSlot}
          totalSlots={totalSlots}
          activeBbox={activeImage?.bbox ?? null}
          onSlotChange={(slot) => {
            setViewerSlot(slot);
            const pdfPage = allPages[slot] ?? allPages[0];
            const firstOnPage = images.find((img) => img.pageIndex === pdfPage);
            if (firstOnPage) setActiveId(firstOnPage.id);
          }}
          onThumbnailReady={handleThumbnailReady}
        />
      </div>
    </div>
  );
}
