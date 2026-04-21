"use client";

import {
  useState,
  useRef,
  useEffect,
  HTMLAttributes,
  ReactNode,
} from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  id: string;
}

export function Tooltip({ content, children, id }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface border border-border text-text-secondary text-xs font-bold leading-none hover:bg-accent-light hover:text-accent hover:border-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        aria-label="More information"
      >
        ?
      </button>

      {open && (
        <div
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-50"
        >
          <div className="bg-[#1a1a1a] text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-lg">
            {content}
          </div>
          <div className="w-2 h-2 bg-[#1a1a1a] rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
        </div>
      )}
    </div>
  );
}
