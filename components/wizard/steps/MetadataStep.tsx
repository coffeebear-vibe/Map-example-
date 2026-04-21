"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
  { value: "de", label: "German (Deutsch)" },
  { value: "it", label: "Italian (Italiano)" },
  { value: "pt", label: "Portuguese (Português)" },
  { value: "zh", label: "Chinese (中文)" },
  { value: "ja", label: "Japanese (日本語)" },
  { value: "ko", label: "Korean (한국어)" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "ru", label: "Russian (Русский)" },
  { value: "nl", label: "Dutch (Nederlands)" },
  { value: "sv", label: "Swedish (Svenska)" },
  { value: "pl", label: "Polish (Polski)" },
  { value: "vi", label: "Vietnamese (Tiếng Việt)" },
  { value: "tl", label: "Tagalog" },
];

interface MetadataStepProps {
  initial: { title: string | null; author: string | null; language: string | null };
  onSave: (data: { title: string; author: string; language: string }) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function MetadataStep({ initial, onSave, onSkip, onBack }: MetadataStepProps) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [author, setAuthor] = useState(initial.author ?? "");
  const [language, setLanguage] = useState(initial.language ?? "en");

  const canSave = title.trim().length > 0 && author.trim().length > 0 && language.length > 0;

  return (
    <div style={{ maxWidth: "560px" }}>
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.8125rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "#4B7DBF",
          margin: "0 0 0.5rem",
        }}
      >
        Step 1
      </p>
      <h2
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontWeight: 600,
          fontSize: "1.75rem",
          color: "#1A1A1A",
          margin: "0 0 0.75rem",
          lineHeight: 1.2,
        }}
      >
        Document Metadata
      </h2>
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "1rem",
          color: "#6B6B6B",
          margin: "0 0 2rem",
          lineHeight: 1.6,
        }}
      >
        Screen readers announce these details when someone opens your PDF — without them,
        users with visual disabilities hear "Untitled document" with no context.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <Input
            id="doc-title"
            label="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            aria-required="true"
            helperText="The full, descriptive title of this document — what it's about."
            placeholder="e.g. 2024 Annual Report — Accessibility Edition"
          />
        </div>

        <div>
          <Input
            id="doc-author"
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            aria-required="true"
            helperText="The person, team, or organization responsible for this document."
            placeholder="e.g. Office of Accessibility, Acme University"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            htmlFor="doc-language"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1A1A1A",
            }}
          >
            Document Language{" "}
            <span style={{ color: "#D93B48" }} aria-hidden="true">*</span>
          </label>
          <select
            id="doc-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
            aria-required="true"
            aria-describedby="doc-language-helper"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #D9D6CC",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "1rem",
              color: "#1A1A1A",
              backgroundColor: "#FFFFFF",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6B6B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              paddingRight: "40px",
              cursor: "pointer",
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <p
            id="doc-language-helper"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.75rem",
              color: "#6B6B6B",
              margin: 0,
            }}
          >
            Screen readers use this to select the correct voice and pronunciation.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "0.75rem",
        }}
      >
        <Button onClick={() => onSave({ title: title.trim(), author: author.trim(), language })} disabled={!canSave}>
          Save &amp; Continue
        </Button>
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
  );
}

