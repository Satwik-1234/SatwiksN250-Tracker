'use client';

import React from 'react';

/** Plays after a successful PIN: tail-lights flash, N250 slides in from the side, then the greeting. */
export const UnlockAnimation: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const done = React.useRef(onDone);
  React.useEffect(() => {
    done.current = onDone;
  });
  React.useEffect(() => {
    try {
      navigator.vibrate?.([30, 60, 30]);
    } catch {
      /* unsupported */
    }
    const t = setTimeout(() => done.current(), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="unlock" role="status" aria-label="Unlocked. Let's ride." onClick={onDone}>
      <div className="unlock-tail" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
      <div className="unlock-brand font-display" aria-hidden="true">
        <i /><i /><i />
        N250
      </div>
      <p className="unlock-hello">Welcome back, Satwik</p>
      <p className="unlock-ride font-display">Let&apos;s ride.</p>
    </div>
  );
};
