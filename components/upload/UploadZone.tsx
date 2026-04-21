"use client";

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";

interface UploadZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

type State =
  | { status: "idle" }
  | { status: "dragging" }
  | { status: "selected"; file: File }
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

export function UploadZone({ onFile, disabled = false }: UploadZoneProps) {
  const [state, setState] = useState<State>({ status: "idle" });
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If the parent finishes/fails (disabled goes false) while we still have a
  // file selected, stay in "selected" so the user can retry.
  const prevDisabled = useRef(disabled);
  useEffect(() => {
    if (prevDisabled.current && !disabled && fileRef.current) {
      setState({ status: "selected", file: fileRef.current });
    }
    prevDisabled.current = disabled;
  }, [disabled]);

  function handleFile(file: File) {
    const err = preflight(file);
    if (err) {
      setState({ status: "error", message: err });
      return;
    }
    fileRef.current = file;
    setState({ status: "selected", file });
  }

  function handleBegin() {
    if (state.status !== "selected" || disabled) return;
    onFile(state.file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled)
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
  const isSelected = state.status === "selected";

  const zoneStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "560px",
    padding: "3.5rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    border: isDragging
      ? "2px solid #F2A413"
      : "2px dashed #4B7DBF",
    borderRadius: "4px",
    backgroundColor: isDragging ? "#FEF3D6" : "#F0EFE9",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.7 : 1,
    transition: "border-color 0.15s, background-color 0.15s",
    userSelect: "none",
  };

  const primaryTextStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: "1rem",
    color: "#1A1A1A",
    margin: 0,
  };

  const secondaryTextStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 400,
    fontSize: "0.875rem",
    color: "#6B6B6B",
    margin: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "560px" }}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload a PDF — drag and drop or press Enter to browse"
        style={zoneStyle}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {isSelected ? (
          <>
            <p style={primaryTextStyle}>
              {(state as { status: "selected"; file: File }).file.name}
            </p>
            <p style={secondaryTextStyle}>Click to choose a different file</p>
          </>
        ) : (
          <>
            <p style={primaryTextStyle}>
              {isDragging ? "Release to upload" : "Drop your PDF here"}
            </p>
            <p style={secondaryTextStyle}>or click to browse — up to 50 MB</p>
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

      {/* CTA button */}
      <div>
        <button
          onClick={() => {
            if (isSelected && !disabled) handleBegin();
            else if (!disabled) inputRef.current?.click();
          }}
          disabled={disabled}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            color: "#1A1A1A",
            backgroundColor: disabled ? "#D9D6CC" : "#F2A413",
            border: "none",
            borderRadius: "4px",
            padding: "14px 32px",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.backgroundColor = "#D97F0A";
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.backgroundColor = "#F2A413";
          }}
        >
          {disabled ? "Processing…" : "Get Started — Upload a PDF"}
        </button>
      </div>

      {/* Error */}
      {state.status === "error" && (
        <p
          role="alert"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
            color: "#D93B48",
            margin: 0,
          }}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
