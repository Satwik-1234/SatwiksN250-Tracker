'use client';

import React, { useId } from 'react';

/**
 * Form field primitives.
 *
 * The previous `Field` helper rendered `<label>` as a *sibling* of the input
 * with no `htmlFor` and no wrapping, so every control was programmatically
 * unlabelled: screen readers announced "edit text" instead of "Odometer
 * Reading", and clicking the label text did not focus the field. These versions
 * generate an id and wire `htmlFor`/`aria-describedby` automatically.
 */

export const inputCls =
  'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white transition-shadow placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400';

interface FieldProps {
  label: string;
  children: React.ReactNode | ((props: { id: string; 'aria-describedby'?: string }) => React.ReactNode);
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  children,
  hint,
  error,
  required,
  className = '',
  htmlFor,
}) => {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {typeof children === 'function'
        ? children({ id, 'aria-describedby': describedBy })
        : children}
      {hint && !error && (
        <p id={hintId} className="text-[11px] text-slate-400 font-mono mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-red-600 font-medium mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

/** Convenience wrapper for the common `<input>` case. */
export const TextField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  min,
  step,
  max,
  className,
  hint,
  error,
  disabled,
  inputMode,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'number' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  /** Accepts strings so `type="date"` inputs can pass a `YYYY-MM-DD` bound. */
  min?: number | string;
  max?: number | string;
  step?: number;
  className?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) => (
  <Field label={label} hint={hint} error={error} required={required}>
    {({ id, 'aria-describedby': describedBy }) => (
      <input
        id={id}
        aria-describedby={describedBy}
        type={type}
        inputMode={inputMode}
        required={required}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} ${className ?? ''}`}
      />
    )}
  </Field>
);

/** Convenience wrapper for the common `<select>` case. */
export const SelectField = ({
  label,
  value,
  onChange,
  options,
  required,
  className,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
  hint?: string;
  error?: string;
}) => (
  <Field label={label} hint={hint} error={error} required={required}>
    {({ id, 'aria-describedby': describedBy }) => (
      <select
        id={id}
        aria-describedby={describedBy}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} ${className ?? ''}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )}
  </Field>
);
