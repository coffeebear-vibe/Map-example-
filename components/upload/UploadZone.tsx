"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface UploadZoneProps {
  onFile: (file: File) => void;
}

type State =
  | { status: "idle" }
  | { status: "dragging" }
  | { status: "selected"; file: File }
  | { status: "checking" }
  | { status: "error"; message: string };

const MAX_BYTES = 50 * 1024 * 1024;

function preflight(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    (!file.type && file.name.toLowerCase().endsWith(".pdf"));
  if (!isPdf) return "Only PDF files are supported. Please choose a .pdf file.";
  if (file.size > MAX_BYTES)
    return `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Files must be under 50 MB.`;
  return null;
}

export function UploadZone({ onFile }: UploadZoneProps) {
  const [state, setState] = useState<State>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const err = preflight(file);
    if (err) {
      setState({ status: "error", message: err });
      return;
    }
    setState({ status: "selected", file });
  }

  function handleBegin() {
    if (state.status !== "selected") return;
    setState({ status: "checking" });
    setTimeout(() => onFile((state as { status: "selected"; file: File }).file), 400);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (state.status !== "checking")
      setState((s) => (s.status === "dragging" ? s : { status: "dragging" }));
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    setState((s) => (s.status === "dragging" ? { status: "idle" } : s));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
    else setState({ status: "idle" });
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  const isDragging = state.status === "dragging";
  const isChecking = state.status === "checking";
  const isSelected = state.status === "selected";

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: "560px" }}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={isChecking ? -1 : 0}
        aria-label="Upload a PDF — drag and drop or press Enter to browse"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isChecking && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isChecking) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={[
          "w-full py-14 px-8 flex flex-col items-center justify-center gap-2",
          "border-2 cursor-pointer select-none transition-colors duration-150",
          "rounded-[4px]",
          isDragging
            ? "border-solid border-accent bg-[#FEF3D6]"
            : isSelected
            ? "border-solid border-primary bg-surface"
            : "border-dashed border-primary bg-surface",
          isChecking ? "pointer-events-none opacity-70" : "",
        ].join(" ")}
      >
        {isChecking ? (
          <p className="font-sans font-medium text-ink text-base">
            Checking your PDF&hellip;
          </p>
        ) : isSelected ? (
          <>
            <p className="font-sans font-medium text-ink text-base">
              {(state as { status: "selected"; file: File }).file.name}
            </p>
            <p className="font-sans text-sm text-muted">
              Click to choose a different file
            </p>
          </>
        ) : (
          <>
            <p className="font-sans font-medium text-ink text-base">
              {isDragging ? "Release to upload" : "Drop your PDF here"}
            </p>
            <p className="font-sans text-sm text-muted">
              or click to browse — up to 50 MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onInputChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* CTA — shown only when file is selected */}
      {isSelected && (
        <button
          onClick={handleBegin}
          className="self-start font-sans font-semibold text-ink text-base px-8 py-3.5 bg-accent hover:bg-accent-hover transition-colors duration-150 rounded-[4px] border-0"
          style={{ boxShadow: "none" }}
        >
          Begin accessibility check
        </button>
      )}

      {/* Error */}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-error font-sans">
          {state.message}
        </p>
      )}
    </div>
  );
}
