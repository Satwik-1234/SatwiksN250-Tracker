'use client';

import React, { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Animates a number from 0 to `value` once, like a trip meter rolling up. */
export function useCountUp(value: number, duration = 1100, delay = 0): number {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value) || value === 0 || prefersReducedMotion()) {
      const id = requestAnimationFrame(() => setShown(Number.isFinite(value) ? value : 0));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now + delay;
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);

  return shown;
}

export const CountUp = ({
  value,
  decimals = 0,
  prefix = '',
  duration,
  delay,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  duration?: number;
  delay?: number;
}) => {
  const shown = useCountUp(value, duration, delay);
  return (
    <>
      {prefix}
      {shown.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </>
  );
};

/** Fades and lifts its children into place the first time they scroll into view. */
export const Reveal = ({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
};

/** Short branded intro, shown once per browser session. */
export const LaunchSplash = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem('n250_splash_seen') === '1';
      sessionStorage.setItem('n250_splash_seen', '1');
    } catch {
      seen = true;
    }
    if (seen || prefersReducedMotion()) return;
    const on = requestAnimationFrame(() => setShow(true));
    const off = setTimeout(() => setShow(false), 1400);
    return () => {
      cancelAnimationFrame(on);
      clearTimeout(off);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="splash" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- local static asset */}
      <img src="/n250-logo.png" alt="" />
      <span className="splash-line" />
    </div>
  );
};
