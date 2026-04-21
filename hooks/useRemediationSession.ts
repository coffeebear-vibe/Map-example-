"use client";

import { useState, useEffect } from "react";
import {
  loadSession,
  storeSession,
  saveSession,
  clearSession,
  getStoredFile,
} from "@/lib/pdf/session-store";
import type { RemediationSession } from "@/lib/pdf/types";

export function useRemediationSession() {
  const [session, setSessionState] = useState<RemediationSession | null>(null);

  useEffect(() => {
    setSessionState(loadSession());
  }, []);

  function setSession(s: RemediationSession, file: File) {
    storeSession(s, file);
    setSessionState(s);
  }

  function updateSession(updates: Partial<RemediationSession>) {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      saveSession(next);
      return next;
    });
  }

  return {
    session,
    setSession,
    updateSession,
    clearSession,
    file: getStoredFile(),
  };
}
