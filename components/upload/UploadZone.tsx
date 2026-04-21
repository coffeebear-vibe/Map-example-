"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface UploadZoneProps {
  onFile: (file: File) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "dragging" }
  | { status: "checking" }
  | { status: "error"; message: string; detail?: string };

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function UploadZone({ onFile }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  function preflight(file: File): string | null {
    if (!file.type && !file.name.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files are supported. Please choose a .pdf file.";
    }
    if (file.type && file.type !== "application/pdf") {
      return "Only PDF files are supported. Please choose a .pdf file.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Files must be under 50 MB.`;
    }
    return null;
  }

  function handleFile(file: File) {
    const err = preflight(file);
    if (err) {
      setState({ status: "error", message: err });
      return;
    }
    setState({ status: "checking" });
    // Small delay so the checking state is perceptible, then hand off
    setTimeout(() => onFile(file), 400);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setState((s) => (s.status === "dragging" ? s : { status: "dragging" }));
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setState((s) => (s.status === "dragging" ? { status: "idle" } : s));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
    else setState({ status: "idle" });
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = "";
  }

  const isDragging = state.status === "dragging";
  const isChecking = state.status === "checking";

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF — drag and drop or press Enter to browse"
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
          "relative w-full max-w-lg rounded-2xl border-2 border-dashed",
          "flex flex-col items-center justify-center gap-5 px-8 py-14",
          "transition-all duration-200 cursor-pointer select-none",
          isDragging
            ? "border-accent bg-accent-light scale-[1.01]"
            : "border-border bg-surface hover:border-accent hover:bg-accent-light/40",
          isChecking ? "pointer-events-none opacity-80" : "",
        ].join(" ")}
      >
        {/* Icon */}
        <div
          className={`flex items-center justify-center w-16 h-16 rounded-2xl transition-colors ${
            isDragging ? "bg-accent text-white" : "bg-border text-text-secondary"
          }`}
          aria-hidden="true"
        >
          {isChecking ? (
            <Spinner size="md" />
          ) : (
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 28h20M16 4v16M8 12l8-8 8 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="text-center">
          {isChecking ? (
            <p className="text-base font-medium text-text-primary">
              Checking your PDF&hellip;
            </p>
          ) : (
            <>
              <p className="text-base font-medium text-text-primary mb-1">
                {isDragging
                  ? "Drop your PDF here"
                  : "Drag your PDF here, or click to browse"}
              </p>
              <p className="text-sm text-text-secondary">
                PDF files only &bull; Maximum 50 MB
              </p>
            </>
          )}
        </div>

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

      {/* Error message */}
      {state.status === "error" && (
        <div
          role="alert"
          className="w-full max-w-lg rounded-input border border-error/30 bg-error-light px-5 py-4 flex gap-3"
        >
          <div className="mt-0.5 shrink-0 text-error" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-error">{state.message}</p>
            {state.detail && (
              <p className="text-sm text-error/80 mt-0.5">{state.detail}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
