import React from 'react';
import './RoadCard.css';

interface RoadCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export const RoadCard: React.FC<RoadCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="card">
      <div className="shadow flex flex-col justify-center h-full">
        <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
        {subtitle && <span className="text-slate-400 text-xs mt-1">{subtitle}</span>}
      </div>
    </div>
  );
};
