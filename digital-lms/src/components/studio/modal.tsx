"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudioModal({
  open,
  title,
  description,
  children,
  onClose,
  canClose = true,
  closeBlockedHint,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  canClose?: boolean;
  closeBlockedHint?: string;
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(canClose);
  const closeHint = !canClose ? closeBlockedHint : undefined;

  useEffect(() => {
    onCloseRef.current = onClose;
    canCloseRef.current = canClose;
  }, [onClose, canClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

    const nodes = focusables();
    (nodes[0] || panelRef.current)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (canCloseRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      prev?.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-blue-950/45 backdrop-blur-[2px]"
        aria-label={canClose ? "Close dialog" : closeHint || "Copy the password before closing"}
        onClick={() => {
          if (canClose) onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-[81] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-blue-100 bg-white shadow-2xl sm:rounded-3xl",
          "outline-none"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-5">
          <div>
            <h2 id={titleId} className="font-serif text-2xl text-blue-950">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-sm text-stone-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              if (canClose) onClose();
            }}
            disabled={!canClose}
            aria-label={canClose ? "Close" : closeHint || "Copy the password before closing"}
            title={!canClose ? closeHint : undefined}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
