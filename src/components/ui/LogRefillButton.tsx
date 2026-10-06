'use client';

import React from 'react';

interface LogRefillButtonProps {
  onClick: () => void;
}

export const LogRefillButton: React.FC<LogRefillButtonProps> = ({ onClick }) => {
  return (
    <div className="log-refill-container" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      {/* Left side: animated card + POS terminal */}
      <div className="log-refill-left">
        {/* Credit card */}
        <div className="log-refill-card">
          <div className="log-refill-card-line" />
          <div className="log-refill-card-buttons" />
        </div>
        {/* POS Terminal */}
        <div className="log-refill-post">
          <div className="log-refill-post-line" />
          <div className="log-refill-screen">
            <div className="log-refill-dollar">₹</div>
          </div>
          <div className="log-refill-numbers" />
          <div className="log-refill-numbers-line2" />
        </div>
      </div>

      {/* Right side: label + arrow */}
      <div className="log-refill-right">
        <span className="log-refill-label">Log Refill</span>
        <svg
          className="log-refill-arrow"
          xmlns="http://www.w3.org/2000/svg"
          width="512" height="512"
          viewBox="0 0 451.846 451.847"
        >
          <path
            d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z"
            fill="#93c5fd"
          />
        </svg>
      </div>
    </div>
  );
};
