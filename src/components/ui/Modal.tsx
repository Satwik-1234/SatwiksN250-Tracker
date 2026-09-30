'use client';

import React, { useCallback, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible dialog primitive.
 *
 * Replaces the hand-rolled `fixed inset-0` overlays that were scattered across
 * eight components. Those were plain divs: no Escape handler, no focus trap, no
 * `role="dialog"`, and no backdrop dismissal - a keyboard user who opened a
 * modal was trapped behind it with no announced way out.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** `sm` | `md` | `lg` | `xl` — controls the max width. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Set false for forms that must be completed or cancelled deliberately. */
  dismissible?: boolean;
  labelledBy?: string;
}

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
} as const;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  size = 'md',
  dismissible = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const headingId = useId();

  // Escape to dismiss. Bound to the document because focus may be anywhere.
  useEffect(() => {
    if (!isOpen || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, dismissible, onClose]);

  // Move focus into the dialog on open and restore it on close, so keyboard
  // users are not left tabbing through the page behind the overlay.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  // Keep Tab inside the dialog.
  const trapFocus = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;

    const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Prevent the page behind the dialog from scrolling.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        // Only a press that both starts and ends on the backdrop dismisses, so
        // a text selection that drags outside the panel does not close it.
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className={`bg-white w-full ${SIZES[size]} sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-up flex flex-col max-h-[92vh] sm:max-h-[88vh] outline-none`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">{icon}</div>}
            <span id={headingId} className="font-semibold text-slate-900 text-sm truncate">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">{children}</div>

        {footer && <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

export const ModalIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">{children}</div>
);

export const ModalCloseButton = ({ onClose }: { onClose: () => void }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Close dialog"
    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </button>
);

export { X as ModalX };
