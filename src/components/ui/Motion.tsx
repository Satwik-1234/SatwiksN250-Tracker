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


const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [110 + r * Math.sin(a), 110 - r * Math.cos(a)] as const;
};
const arcPath = (from: number, to: number, r: number) => {
  const [x1, y1] = pt(from, r);
  const [x2, y2] = pt(to, r);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

/** Full tachometer: 0 to 10, redline from 8, needle swings to the stop and back. */
export const Tachometer = () => (
  <svg viewBox="0 0 220 200" style={{ width: 260 }} aria-hidden="true">
    <path d={arcPath(-120, 120, 84)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="7" strokeLinecap="round" />
    <path d={arcPath(48, 120, 84)} fill="none" stroke="rgba(226,35,26,0.55)" strokeWidth="7" strokeLinecap="round" />
    <path className="arc" d={arcPath(-120, 120, 84)} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    {Array.from({ length: 11 }, (_, i) => {
      const deg = -120 + i * 24;
      const [x1, y1] = pt(deg, 70);
      const [x2, y2] = pt(deg, 78);
      const [tx, ty] = pt(deg, 58);
      const red = i >= 8;
      return (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={red ? '#e2231a' : '#fff'} strokeWidth="2.5" />
          <text x={tx} y={ty + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={red ? '#e2231a' : 'rgba(255,255,255,0.8)'}>{i}</text>
        </g>
      );
    })}
    <text x="110" y="150" textAnchor="middle" fontSize="9" letterSpacing="2" fill="rgba(255,255,255,0.5)">x1000 RPM</text>
    <g className="needle"><line x1="110" y1="110" x2="110" y2="38" stroke="#e2231a" strokeWidth="3.5" strokeLinecap="round" /></g>
    <circle cx="110" cy="110" r="8" fill="#15171c" stroke="#e2231a" strokeWidth="3" />
  </svg>
);

/** Tail-light strips on both screen edges. */
export const SideTail = () => (
  <>
    <span className="side-tail is-left" aria-hidden="true" />
    <span className="side-tail is-right" aria-hidden="true" />
  </>
);

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
    const off = setTimeout(() => setShow(false), 2700);
    return () => {
      cancelAnimationFrame(on);
      clearTimeout(off);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="ignition" aria-hidden="true" onClick={() => setShow(false)}>
      <SideTail />
      <Tachometer />
      <div className="lamp-row">
        {['#e2231a', '#f5a524', '#e2231a', '#3b82f6', '#2fbf71', '#f5a524'].map((c, i) => (
          <span key={i} style={{ background: c, color: c, animationDelay: `${0.25 + i * 0.05}s` }} />
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- local static asset */}
      <img className="brand h-9 w-auto" src="/n250-logo.png" alt="" />
    </div>
  );
};
