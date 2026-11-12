'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';

type Mode = 'light' | 'dark';

const STORAGE_KEY = 'n250_theme';

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/** Reads the theme that is actually showing right now. */
const effectiveMode = (): Mode => {
  if (typeof document === 'undefined') return 'light';
  const forced = document.documentElement.dataset.theme as Mode | undefined;
  if (forced === 'light' || forced === 'dark') return forced;
  return systemPrefersDark() ? 'dark' : 'light';
};

const apply = (mode: Mode) => {
  document.documentElement.dataset.theme = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode — the choice just won't persist */
  }
};

export const ThemeToggle: React.FC<{ variant?: 'rail' | 'bar' }> = ({ variant = 'rail' }) => {
  const [mode, setMode] = React.useState<Mode>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setMode(effectiveMode());
    });
  }, []);

  const toggle = () => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    apply(next);
    setMode(next);
  };

  // Avoid a wrong icon flashing before we know the real theme.
  const Icon = !mounted ? Sun : mode === 'dark' ? Sun : Moon;
  const label = mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  if (variant === 'bar') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-text-2)] active:bg-[var(--color-surface-2)]"
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="w-full flex items-center gap-3 h-9 px-3 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
    >
      <Icon className="h-4 w-4 text-white/40" />
      <span className="flex-1 text-left">{mounted && mode === 'dark' ? 'Light theme' : 'Dark theme'}</span>
    </button>
  );
};

/** Inline script string that applies the saved theme before first paint (no flash). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
