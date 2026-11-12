import React from 'react';

/**
 * Telltale pictograms in the style of a motorcycle cluster: bold line symbols
 * that read at a glance and glow when lit. Drawn on a 24px grid, they take the
 * current text colour, so a lamp's colour is just its CSS `color`.
 */
type IconProps = { className?: string };

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ className, children }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Service: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </Svg>
);

const TyrePressure: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M5.2 19.5C3.2 16 3.4 9 7.2 6c2.8-2 6.8-2 9.6 0 3.8 3 4 10 2 13.5" />
    <path d="M3.8 19.5H7M17 19.5h3.2" />
    <path d="M8.2 17.2c-.9-2.6-.6-6 1.6-7.6 1.4-1 3-1 4.4 0 2.2 1.6 2.5 5 1.6 7.6" />
    <path d="M12 10.8v3.2M12 16.3h.01" strokeWidth="2.1" />
  </Svg>
);

const brake = (letter: string): React.FC<IconProps> => {
  const Brake: React.FC<IconProps> = ({ className }) => (
    <Svg className={className}>
      <circle cx="12" cy="11" r="4.4" />
      <path d="M5.4 6.6a7.8 7.8 0 0 0 0 8.8M18.6 6.6a7.8 7.8 0 0 1 0 8.8" />
      <path d="M12 8.9v2.7M12 13.4h.01" strokeWidth="2" />
      <text x="12" y="22.4" fontSize="6.6" fontWeight="700" fill="currentColor" stroke="none" textAnchor="middle">
        {letter}
      </text>
    </Svg>
  );
  return Brake;
};

const Battery: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <rect x="3" y="8" width="18" height="11" rx="2" />
    <path d="M7 8V5.6h3V8M14 8V5.6h3V8" />
    <path d="M7 13.5h3M8.5 12v3M14 13.5h3" />
  </Svg>
);

const SparkPlug: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M12 1.8v2.4" />
    <rect x="8.6" y="4.2" width="6.8" height="3.6" rx="0.6" />
    <path d="M10.2 7.8v4.2h3.6V7.8M10.2 12l-.9 3.2h5.4L13.8 12" />
    <path d="M12 15.2v3.8h2.8" />
    <path d="M17 16.6l1.6-1M17.4 19.2h2.2" />
  </Svg>
);

const AirFilter: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <rect x="4" y="8.2" width="16" height="8.4" rx="1.4" />
    <path d="M8 8.2v8.4M12 8.2v8.4M16 8.2v8.4" />
    <path d="M12 2.4v3.4M10.2 4.2L12 2.4l1.8 1.8" />
    <path d="M12 18.4v3.2M10.2 19.8l1.8 1.8 1.8-1.8" />
  </Svg>
);

const ChainLube: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M12 2.4c2.1 2.6 3.4 4.3 3.4 6a3.4 3.4 0 0 1-6.8 0c0-1.7 1.3-3.4 3.4-6z" />
    <rect x="2.6" y="15" width="10" height="5.2" rx="2.6" />
    <rect x="11.4" y="15" width="10" height="5.2" rx="2.6" />
  </Svg>
);

const ChainSlack: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M2.6 9c4 7.5 14.8 7.5 18.8 0" strokeDasharray="2.4 2" />
    <path d="M12 2.8v9.4M10.2 4.6L12 2.8l1.8 1.8M10.2 10.4l1.8 1.8 1.8-1.8" />
  </Svg>
);

const ClutchFreePlay: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M5 19.5L15.4 9" strokeWidth="2.2" />
    <circle cx="17.4" cy="6.8" r="2.4" />
    <path d="M2.8 11.6c.7 3 2.3 5 5 6" />
    <path d="M2.6 9.2v2.8h2.8M5.4 14.6l2.6 3-3.4.6" />
  </Svg>
);

const ForkOil: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <rect x="7.6" y="2.4" width="6.2" height="8" rx="1" />
    <rect x="9" y="10.4" width="3.4" height="7" />
    <circle cx="10.7" cy="19.8" r="2" />
    <path d="M19 5.4c1.3 1.6 2 2.6 2 3.8a2 2 0 0 1-4 0c0-1.2.7-2.2 2-3.8z" />
  </Svg>
);

const TyreBalance: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12.4" r="7.4" />
    <circle cx="12" cy="12.4" r="1.8" />
    <path d="M9.6 2h4.8v2.2H9.6z" />
    <path d="M1.4 12.4h2.6M20 12.4h2.6" />
  </Svg>
);

const CheckEngine: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M3.4 10.6h2V8.4h3.2l1.4-1.6h5.2v1.6h2l1.6 1.6v1.3h1.4v4.5h-1.4v1.3l-1.8 1.8H9.4l-2.2-2.2H3.4z" />
    <path d="M9.4 12.8l2 2 3.8-4" />
  </Svg>
);

const Wash: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M9 6c2.6 3.4 4 5.2 4 7.2a4 4 0 0 1-8 0c0-2 1.4-3.8 4-7.2z" />
    <path d="M17.6 12c1.5 1.9 2.3 3 2.3 4.2a2.3 2.3 0 0 1-4.6 0c0-1.2.8-2.3 2.3-4.2z" />
    <path d="M18.4 2.6v3.6M16.6 4.4h3.6" />
  </Svg>
);

const EngineOil: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M3 11.6h11.4l3-3.6h3.4" />
    <path d="M5 11.6v6.4h8.8v-6.4M6.8 11.6V9.4h5.4v2.2" />
    <path d="M21.4 11.4c.7.9 1.1 1.5 1.1 2.1a1.1 1.1 0 0 1-2.2 0c0-.6.4-1.2 1.1-2.1z" />
  </Svg>
);

const BrakeFluid: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="10.4" r="4.4" />
    <path d="M5.4 6a7.8 7.8 0 0 0 0 8.8M18.6 6a7.8 7.8 0 0 1 0 8.8" />
    <path d="M12 7.8c1.2 1.5 1.8 2.3 1.8 3.1a1.8 1.8 0 0 1-3.6 0c0-.8.6-1.6 1.8-3.1z" />
    <text x="12" y="21.6" fontSize="5.6" fontWeight="700" fill="currentColor" stroke="none" textAnchor="middle">DOT 4</text>
  </Svg>
);

const Throttle: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="6.6" />
    <path d="M7.4 16.6L16.6 7.4" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="1.2" />
    <path d="M1.8 12h3M19.2 12h3" />
  </Svg>
);

export const CareIcons: Record<string, React.FC<IconProps>> = {
  service: Service,
  'spark-plug': SparkPlug,
  'engine-oil': EngineOil,
  'brake-fluid': BrakeFluid,
  'throttle-body': Throttle,
  'air-filter': AirFilter,
  battery: Battery,
  'brake-front': brake('F'),
  'brake-rear': brake('R'),
  'tyre-pressure': TyrePressure,
  'tyre-balance': TyreBalance,
  'chain-lube': ChainLube,
  'chain-slack': ChainSlack,
  'clutch-freeplay': ClutchFreePlay,
  'fork-oil': ForkOil,
  'routine-check': CheckEngine,
  wash: Wash,
};
