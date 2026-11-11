'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface AnimatedActionButtonProps {
  label: string;
  onClick: () => void;
  /** Optional leading icon; defaults to a plus. */
  icon?: React.ElementType;
  /** Kept for backwards compatibility with older call sites; unused. */
  iconPath?: React.ReactNode;
  variant?: 'primary' | 'accent';
  className?: string;
}

/**
 * The app's primary action button. It used to play a 1.2s card-swipe
 * animation before running the action; it now responds immediately.
 */
export const AnimatedActionButton: React.FC<AnimatedActionButtonProps> = ({
  label,
  onClick,
  icon: Icon = Plus,
  variant = 'primary',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`btn ${variant === 'accent' ? 'btn-accent' : 'btn-primary'} ${className}`}
  >
    <Icon className="h-4 w-4" strokeWidth={2.25} />
    <span>{label}</span>
  </button>
);
