'use client';

import React from 'react';
import { CalendarPlus, RotateCcw, Check } from 'lucide-react';
import { ServiceLog } from '@/types/fuel';
import { StorageService } from '@/services/googleSheetsService';
import { saveCareToCloud, syncCareFromCloud, CareHistoryRow } from '@/services/careService';
import {
  CareState,
  ConsoleEntry,
  consoleEntries,
  ensureBaselines,
  markCareDone,
  setCareLastDone,
  severityRank,
} from '@/lib/care';
import { calendarEvent } from '@/lib/googleLinks';
import { PageHeader } from '@/components/ui/Page';
import { PushToggle } from '@/components/ui/PushToggle';

interface Props {
  latestOdometer: number;
  services: ServiceLog[];
  isOwnerMode: boolean;
  onRequireOwner?: () => void;
  onQuickService?: (odometer: number) => void;
  onChanged?: () => void;
}

type Style = 'cluster' | 'lamps' | 'gauges';
type Healthy = 'green' | 'off';
const PREFS_KEY = 'n250_console_prefs';
const HOLD_MS = 650;

const SEV_WORD = { good: 'On track', fair: 'Getting there', warn: 'Due soon', overdue: 'Overdue' } as const;

/** Tap selects. Hold for about half a second, or double-click, resets the item. */
function useReset(onReset: () => void) {
  const [holding, setHolding] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = React.useRef(false);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  return {
    holding,
    bind: {
      onPointerDown: () => {
        fired.current = false;
        setHolding(true);
        timer.current = setTimeout(() => {
          fired.current = true;
          setHolding(false);
          onReset();
        }, HOLD_MS);
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      onDoubleClick: () => {
        cancel();
        if (!fired.current) onReset();
      },
    },
    wasHold: () => fired.current,
  };
}

const Lamp: React.FC<{ entry: ConsoleEntry; selected: boolean; healthy: Healthy; onSelect: () => void; onReset: () => void }> = ({
  entry,
  selected,
  healthy,
  onSelect,
  onReset,
}) => {
  const { holding, bind, wasHold } = useReset(onReset);
  const Icon = entry.icon;
  const lit = entry.severity !== 'good' || healthy === 'green';
  return (
    <button
      type="button"
      {...bind}
      onClick={() => !wasHold() && onSelect()}
      data-sev={entry.severity}
      aria-pressed={selected}
      aria-label={`${entry.label}: ${SEV_WORD[entry.severity]}, ${entry.remainingLabel}. Hold to reset.`}
      className={`lamp rounded-lg h-[68px] w-full px-3 flex items-center gap-3 text-left ${lit ? 'is-lit' : ''} ${
        entry.severity === 'overdue' ? 'is-pulsing' : ''
      } ${selected ? 'is-selected' : ''} ${holding ? 'is-holding' : ''}`}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={1.9} />
      <span className="min-w-0 flex-1">
        <span className="lamp-legend block text-[13px] leading-tight truncate">{entry.label}</span>
        <span className="block text-[11px] mt-0.5 opacity-75 tabular truncate">{entry.remainingLabel}</span>
      </span>
      <span className="lamp-hold" />
    </button>
  );
};

const Glyph: React.FC<{ entry: ConsoleEntry; selected: boolean; healthy: Healthy; onSelect: () => void; onReset: () => void }> = ({
  entry,
  selected,
  healthy,
  onSelect,
  onReset,
}) => {
  const { holding, bind, wasHold } = useReset(onReset);
  const Icon = entry.icon;
  const lit = entry.severity !== 'good' || healthy === 'green';
  return (
    <button
      type="button"
      {...bind}
      onClick={() => !wasHold() && onSelect()}
      data-sev={entry.severity}
      aria-pressed={selected}
      aria-label={`${entry.label}: ${SEV_WORD[entry.severity]}, ${entry.remainingLabel}. Hold to reset.`}
      className={`glyph-tile flex flex-col items-center gap-2 rounded-xl px-1 py-3.5 ${selected ? 'is-selected' : ''}`}
    >
      <span className={`glyph ${lit ? 'is-lit' : ''} ${entry.severity === 'overdue' ? 'is-pulsing' : ''} ${holding ? 'is-holding' : ''}`}>
        <Icon className="w-11 h-11" />
      </span>
      <span className="text-[11.5px] leading-tight text-center text-white/60 min-h-[28px]">{entry.label}</span>
    </button>
  );
};

const R = 34;
const CIRC = 2 * Math.PI * R;
const SWEEP = 0.75; // 270° dial

const Dial: React.FC<{ entry: ConsoleEntry; selected: boolean; healthy: Healthy; onSelect: () => void; onReset: () => void }> = ({
  entry,
  selected,
  healthy,
  onSelect,
  onReset,
}) => {
  const { holding, bind, wasHold } = useReset(onReset);
  const Icon = entry.icon;
  const dim = entry.severity === 'good' && healthy === 'off';
  const used = 100 - Math.min(100, Math.max(0, entry.progress)); // arc shows what is LEFT, like a fuel gauge
  const big = Math.abs(entry.remaining) >= 1000 ? `${(Math.abs(entry.remaining) / 1000).toFixed(1)}k` : `${Math.abs(entry.remaining)}`;
  const trackLen = CIRC * SWEEP;
  return (
    <button
      type="button"
      {...bind}
      onClick={() => !wasHold() && onSelect()}
      data-sev={entry.severity}
      aria-pressed={selected}
      aria-label={`${entry.label}: ${SEV_WORD[entry.severity]}, ${entry.remainingLabel}. Hold to reset.`}
      className={`gauge-dial flex flex-col items-center gap-1 rounded-xl py-2 ${dim ? 'is-dim' : ''} ${holding ? 'is-holding' : ''} ${
        selected ? 'outline outline-2 outline-white/50 outline-offset-2' : ''
      }`}
    >
      <svg viewBox="0 0 88 88" className="w-[92px] h-[92px]" aria-hidden="true">
        <g transform="rotate(135 44 44)">
          <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${trackLen} ${CIRC}`} />
          <circle
            className="gauge-fill"
            cx="44" cy="44" r={R} fill="none" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(trackLen * used) / 100} ${CIRC}`}
          />
        </g>
        {/* ring that fills while holding to reset */}
        <circle className="gauge-ring" cx="44" cy="44" r="42" fill="none" stroke="var(--lamp)" strokeWidth="1.5" pathLength={100} strokeDasharray="0 100" transform="rotate(-90 44 44)" />
        <foreignObject x="26" y="22" width="36" height="22">
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--lamp)' }}>
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </div>
        </foreignObject>
        <text x="44" y="58" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="600" style={{ fontFamily: 'var(--font-disp)', fontVariantNumeric: 'tabular-nums' }}>
          {entry.remaining < 0 ? `−${big}` : big}
        </text>
        <text x="44" y="68" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7">
          {entry.unit} {entry.remaining < 0 ? 'over' : 'left'}
        </text>
      </svg>
      <span className="lamp-legend text-[11.5px] text-white/80 text-center leading-tight max-w-[110px]">{entry.label}</span>
    </button>
  );
};

export const ConsoleView: React.FC<Props> = ({ latestOdometer, services, isOwnerMode, onRequireOwner, onQuickService, onChanged }) => {
  const [care, setCare] = React.useState<CareState>(() => StorageService.getCareState());
  const [style, setStyle] = React.useState<Style>('cluster');
  const [healthy, setHealthy] = React.useState<Healthy>('green');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [undo, setUndo] = React.useState<{ label: string; prev: CareState } | null>(null);
  const undoTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editDate, setEditDate] = React.useState('');
  const [editOdo, setEditOdo] = React.useState('');
  const [history, setHistory] = React.useState<CareHistoryRow[]>([]);

  // Load saved prefs and give km tasks their starting odometer.
  React.useEffect(() => {
    queueMicrotask(() => {
      try {
        const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
        if (p.style === 'cluster' || p.style === 'lamps' || p.style === 'gauges') setStyle(p.style);
        if (p.healthy === 'green' || p.healthy === 'off') setHealthy(p.healthy);
      } catch {
        /* defaults */
      }
      const local = StorageService.getCareState();
      setCare(local);
      // The database is the shared source of truth; this device's copy is a cache.
      syncCareFromCloud(local).then(({ state, history: rows }) => {
        StorageService.saveCareState(state);
        setCare(state);
        setHistory(rows);
      });
    });
  }, []);

  // Give km tasks a starting odometer once the reading has settled (the page first shows
  // cached data, then the live odometer, and the baseline must use the live one).
  React.useEffect(() => {
    if (latestOdometer <= 0) return;
    const t = setTimeout(() => {
      const fresh = StorageService.getCareState();
      const seeded = ensureBaselines(fresh, latestOdometer);
      if (seeded !== fresh) {
        StorageService.saveCareState(seeded);
        setCare(seeded);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [latestOdometer]);

  const savePrefs = (next: { style?: Style; healthy?: Healthy }) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ style, healthy, ...next }));
    } catch {
      /* not persisted */
    }
  };

  const persist = (next: CareState, event?: { taskId: string; date: string; odometer?: number | null }) => {
    setCare(next);
    StorageService.saveCareState(next);
    void saveCareToCloud(next, event);
    if (event) setHistory((h) => [{ taskId: event.taskId, date: event.date, odometer: event.odometer ?? null }, ...h]);
    onChanged?.();
  };

  const entries = React.useMemo(() => consoleEntries(care, latestOdometer, services), [care, latestOdometer, services]);
  const groups = React.useMemo(() => {
    const map = new Map<string, ConsoleEntry[]>();
    entries.forEach((e) => map.set(e.group, [...(map.get(e.group) || []), e]));
    return [...map.entries()];
  }, [entries]);

  const overdue = entries.filter((e) => e.severity === 'overdue').length;
  const soon = entries.filter((e) => e.severity === 'warn').length;
  const worst = entries.reduce((m, e) => Math.max(m, severityRank(e.severity)), 0);
  const masterSev = worst >= 3 ? 'overdue' : worst === 2 ? 'warn' : worst === 1 ? 'fair' : 'good';

  const reset = (entry: ConsoleEntry) => {
    if (!isOwnerMode) {
      onRequireOwner?.();
      return;
    }
    if (entry.kind === 'service') {
      onQuickService?.(latestOdometer);
      return;
    }
    const prev = care;
    persist(markCareDone(care, entry.id, latestOdometer), { taskId: entry.id, date: new Date().toISOString().split('T')[0], odometer: latestOdometer || null });
    setUndo({ label: entry.label, prev });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 7000);
  };

  const selected = entries.find((e) => e.id === selectedId) || null;
  const pick = (e: ConsoleEntry) => {
    setSelectedId(e.id);
    setEditDate(e.lastDoneDate || '');
    setEditOdo(e.lastDoneOdometer !== undefined ? String(e.lastDoneOdometer) : '');
  };

  const seg = (active: boolean) =>
    `h-8 px-3.5 rounded-lg text-[13px] font-medium transition-colors ${active ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'}`;

  return (
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader title="Console" subtitle="Hold a lamp for half a second, or double-click it, after you have done the job." />

      <section className="console-panel p-4 sm:p-6">
        {/* Master caution + display options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span
              data-sev={masterSev}
              className={`lamp is-lit ${worst >= 3 ? 'is-pulsing' : ''} w-11 h-11 rounded-full flex items-center justify-center`}
              aria-hidden="true"
            >
              <span className="w-3 h-3 rounded-full" style={{ background: 'var(--lamp)' }} />
            </span>
            <div>
              <div className="text-[15px] font-semibold">
                {overdue > 0 ? `${overdue} overdue` : soon > 0 ? `${soon} due soon` : 'All systems good'}
              </div>
              <div className="text-[12px] text-white/50 tabular">
                {overdue > 0 && soon > 0 ? `${soon} more due soon · ` : ''}
                {entries.length} items tracked
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex p-1 rounded-xl bg-white/10" role="group" aria-label="Display style">
              <button type="button" className={seg(style === 'cluster')} onClick={() => { setStyle('cluster'); savePrefs({ style: 'cluster' }); }}>
                Cluster
              </button>
              <button type="button" className={seg(style === 'lamps')} onClick={() => { setStyle('lamps'); savePrefs({ style: 'lamps' }); }}>
                Warning lamps
              </button>
              <button type="button" className={seg(style === 'gauges')} onClick={() => { setStyle('gauges'); savePrefs({ style: 'gauges' }); }}>
                Gauges
              </button>
            </div>
            <div className="flex p-1 rounded-xl bg-white/10" role="group" aria-label="When an item is fine">
              <button type="button" className={seg(healthy === 'green')} onClick={() => { setHealthy('green'); savePrefs({ healthy: 'green' }); }}>
                Fine: green
              </button>
              <button type="button" className={seg(healthy === 'off')} onClick={() => { setHealthy('off'); savePrefs({ healthy: 'off' }); }}>
                Fine: off
              </button>
            </div>
          </div>
        </div>

        {/* Items */}
        {style === 'cluster' ? (
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-1">
            {entries.map((e) => (
              <Glyph key={e.id} entry={e} selected={selectedId === e.id} healthy={healthy} onSelect={() => pick(e)} onReset={() => reset(e)} />
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {groups.map(([group, items]) => (
              <div key={group}>
                <h2 className="text-[13px] font-medium text-white/50 mb-2.5">{group}</h2>
                <div className={style === 'lamps' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5' : 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1'}>
                  {items.map((e) =>
                    style === 'lamps' ? (
                      <Lamp key={e.id} entry={e} selected={selectedId === e.id} healthy={healthy} onSelect={() => pick(e)} onReset={() => reset(e)} />
                    ) : (
                      <Dial key={e.id} entry={e} selected={selectedId === e.id} healthy={healthy} onSelect={() => pick(e)} onReset={() => reset(e)} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail for the selected item */}
        <div className="mt-6 pt-5 border-t border-white/10 min-h-[84px]">
          {selected ? (
            <div className="animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold">{selected.label}</div>
                  <div className="text-[13px] text-white/55 mt-0.5">{selected.detail}</div>
                </div>
                <div className="text-right tabular">
                  <div className="text-[13px] font-medium" style={{ color: selected.severity === 'overdue' ? '#ff6a60' : '#fff' }}>
                    {SEV_WORD[selected.severity]} · {selected.remainingLabel}
                  </div>
                  <div className="text-[12px] text-white/45 mt-0.5">
                    {selected.kind === 'service' ? 'Bajaj schedule' : `every ${selected.interval.toLocaleString('en-IN')} ${selected.unit}`}
                  </div>
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-end gap-2.5">
                <button type="button" onClick={() => reset(selected)} className="btn btn-sm bg-white text-slate-900 hover:bg-white/90">
                  {selected.severity === 'good' ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  {selected.kind === 'service' ? 'Log service done' : 'Mark done'}
                </button>

                {selected.kind === 'care' && (
                  <>
                    <label className="text-[12px] text-white/50">
                      Last done
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="mt-1 block h-8 px-2 rounded-lg bg-white/10 text-[13px] text-white outline-none border border-white/10 focus:border-white/40"
                      />
                    </label>
                    {selected.unit === 'km' && (
                      <label className="text-[12px] text-white/50">
                        At km
                        <input
                          type="number"
                          inputMode="numeric"
                          value={editOdo}
                          onChange={(e) => setEditOdo(e.target.value)}
                          className="mt-1 block h-8 w-24 px-2 rounded-lg bg-white/10 text-[13px] text-white outline-none border border-white/10 focus:border-white/40 tabular"
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwnerMode) return onRequireOwner?.();
                        if (!editDate) return;
                        persist(setCareLastDone(care, selected.id, editDate, editOdo ? Number(editOdo) : undefined), {
                          taskId: selected.id,
                          date: editDate,
                          odometer: editOdo ? Number(editOdo) : null,
                        });
                      }}
                      className="btn btn-sm bg-white/10 text-white hover:bg-white/15"
                    >
                      Save date
                    </button>
                  </>
                )}

                {selected.unit === 'days' && selected.lastDoneDate && (() => {
                  const due = new Date(`${selected.lastDoneDate}T00:00:00`);
                  due.setDate(due.getDate() + selected.interval);
                  const url = calendarEvent(`N250 · ${selected.label}`, due.toISOString().split('T')[0], selected.detail);
                  return url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-white/10 text-white hover:bg-white/15">
                      <CalendarPlus className="w-4 h-4" /> Google Calendar
                    </a>
                  ) : null;
                })()}
              </div>

              {selected.kind === 'care' && (() => {
                const rows = history.filter((h) => h.taskId === selected.id).slice(0, 4);
                return rows.length > 0 ? (
                  <div className="mt-4 text-[12px] text-white/45">
                    <div className="mb-1">Previous</div>
                    <ul className="space-y-0.5 tabular">
                      {rows.map((h, i) => (
                        <li key={`${h.date}-${i}`}>
                          {new Date(`${h.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {h.odometer ? ` · ${Number(h.odometer).toLocaleString('en-IN')} km` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <p className="text-[13px] text-white/45">Tap any lamp to see when it was last done and how long is left.</p>
          )}
        </div>
      </section>

      <PushToggle isOwnerMode={isOwnerMode} onRequireOwner={onRequireOwner} />

      {/* Undo bar */}
      {undo && (
        <div role="status" className="fixed inset-x-4 md:inset-x-auto md:right-6 bottom-above-tabbar z-[60] md:max-w-sm bg-slate-900 text-white rounded-xl shadow-xl px-4 py-3 flex items-center justify-between gap-4 animate-fade-up">
          <span className="text-[14px]">{undo.label} reset</span>
          <button
            type="button"
            className="text-[14px] font-semibold text-white underline underline-offset-2"
            onClick={() => {
              persist(undo.prev);
              setUndo(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};
