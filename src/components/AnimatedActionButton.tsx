'use client';

import React, { useState } from 'react';

interface AnimatedActionButtonProps {
  label: string;
  onClick: () => void;
  // Optional SVG path for custom icons, defaults to an arrow
  iconPath?: React.ReactNode; 
  className?: string;
}

export const AnimatedActionButton: React.FC<AnimatedActionButtonProps> = ({ 
  label, 
  onClick, 
  iconPath,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      onClick();
    }, 1200); // 1.2s to match CSS animation duration
  };

  return (
    <div 
      className={`animated-action-container ${isAnimating ? 'is-animating' : ''} ${className}`} 
      onClick={handleClick} 
      role="button" 
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Left side: animated card + POS terminal */}
      <div className="animated-action-left">
        {/* Credit card */}
        <div className="animated-action-card">
          <div className="animated-action-card-line" />
          <div className="animated-action-card-buttons" />
        </div>
        {/* POS Terminal */}
        <div className="animated-action-post">
          <div className="animated-action-post-line" />
          <div className="animated-action-screen">
            <div className="animated-action-dollar">₹</div>
          </div>
          <div className="animated-action-numbers" />
          <div className="animated-action-numbers-line2" />
        </div>
      </div>

      {/* Right side: label + arrow */}
      <div className="animated-action-right">
        <span className="animated-action-label">{label}</span>
        <svg
          className="animated-action-arrow"
          xmlns="http://www.w3.org/2000/svg"
          width="512" height="512"
          viewBox="0 0 451.846 451.847"
        >
          {iconPath || (
            <path
              d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z"
              fill="#93c5fd"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
