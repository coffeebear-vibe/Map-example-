import type { RemediationSession } from "./types";

const KEY = "pdf-remediation-session";

// The File object can't go in sessionStorage — keep it in memory.
// If the user refreshes, they'll need to re-upload (acceptable for MVP).
let _file: File | null = null;

export function storeSession(session: RemediationSession, file: File): void {
  _file = file;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  }
}

export function loadSession(): RemediationSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RemediationSession;
  } catch {
    return null;
  }
}

export function saveSession(session: RemediationSession): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  }
}

export function getStoredFile(): File | null {
  return _file;
}

export function clearSession(): void {
  _file = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(KEY);
  }
}
