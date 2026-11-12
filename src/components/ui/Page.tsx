'use client';

import React from 'react';
import { Search } from 'lucide-react';

/** Page title row: every screen starts with the same heading and one primary action. */
export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div className="min-w-0">
      <h1 className="page-title text-ink-1">{title}</h1>
      {subtitle && <p className="text-[15px] text-ink-2 mt-1.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export interface StatItem {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
}

/** One card, 2 columns on phones and up to 4 on desktop, hairline dividers. */
export const StatStrip = ({ items }: { items: StatItem[] }) => (
  <div
    className={`card overflow-hidden grid grid-cols-2 gap-px bg-[var(--color-border)] ${
      items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
    }`}
  >
    {items.map((item, i) => (
      <div
        key={item.label}
        className={`bg-surface px-5 py-4 min-w-0 ${
          items.length % 2 === 1 && i === items.length - 1 ? 'col-span-2 lg:col-span-1' : ''
        }`}
      >
        <div className="text-[13px] text-ink-2 truncate">{item.label}</div>
        <div className="mt-1 flex items-baseline gap-1 min-w-0">
          <span className="font-display text-[26px] leading-none font-semibold text-ink-1 tabular truncate">{item.value}</span>
          {item.unit && <span className="text-[13px] text-ink-2 shrink-0">{item.unit}</span>}
        </div>
        {item.hint && <div className="mt-0.5 text-xs text-ink-3 truncate">{item.hint}</div>}
      </div>
    ))}
  </div>
);

/** Filter chip. One selected style across the whole app. */
export const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`h-8 px-3 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-[var(--color-text-1)] text-white'
        : 'bg-surface border border-[var(--color-border)] text-ink-2 hover:bg-surface-2 hover:text-ink-1'
    }`}
  >
    {children}
  </button>
);

/** Horizontally scrollable chip row that bleeds to the screen edge on phones. */
export const ChipRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">{children}</div>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 pl-9 pr-3 bg-surface border border-[var(--color-border)] rounded-[10px] text-sm text-ink-1 placeholder-[var(--color-text-3)] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
    />
  </div>
);

export const EmptyState = ({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) => (
  <div className="card px-6 py-12 text-center">
    <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center mx-auto">
      <Icon className="h-5 w-5 text-ink-3" />
    </div>
    <p className="mt-3 text-[15px] font-semibold text-ink-1">{title}</p>
    {body && <p className="mt-1 text-sm text-ink-2 max-w-sm mx-auto">{body}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
