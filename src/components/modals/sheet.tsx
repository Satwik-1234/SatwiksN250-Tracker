'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/** Shared bottom-sheet shell: grab handle on phones, centred card on desktop. */
export const ModalSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden border border-[var(--color-border)] animate-sheet-up sm:animate-fade-up max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0">
          <div>
            <h2 className="text-[17px] font-semibold text-ink-1">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-2">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:bg-surface-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const sheetInput =
  'w-full h-11 px-3 border border-[var(--color-border)] rounded-[10px] text-[15px] text-ink-1 bg-surface outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10 transition placeholder-ink-3';

export const SheetField: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-[13px] font-medium text-ink-2">{label}</label>
      {hint && <span className="text-[12px] text-ink-3">{hint}</span>}
    </div>
    {children}
  </div>
);

/** A row of selectable pills — one choice, asphalt when active. */
export const ChipSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`h-9 px-3 rounded-full text-[13px] font-medium transition-colors ${
          value === o.value ? 'bg-slate-900 text-white' : 'bg-surface border border-[var(--color-border)] text-ink-2 hover:bg-surface-2'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);
