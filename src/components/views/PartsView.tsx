'use client';

import React from 'react';
import { Cog, Lock, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/Page';
import { ModalSheet, SheetField, sheetInput } from '@/components/modals/sheet';
import { BikePart, PartInput, createPart, deletePart, listParts, updatePart } from '@/services/partsService';

interface Props {
  isOwnerMode: boolean;
  onRequireOwner?: () => void;
  latestOdometer: number;
}

const DELIVERY = '2026-05-24';
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Parts that wear out, all new at delivery. Lives follow the owner manual where it gives one.
const STARTER: { name: string; lifeKm: number }[] = [
  { name: 'Front tyre', lifeKm: 25000 },
  { name: 'Rear tyre', lifeKm: 20000 },
  { name: 'Chain and sprockets', lifeKm: 25000 },
  { name: 'Front brake pads', lifeKm: 15000 },
  { name: 'Rear brake pads', lifeKm: 15000 },
];

type Draft = { id?: string; replacing?: BikePart } & Record<'name' | 'brand' | 'date' | 'odo' | 'life' | 'cost' | 'notes', string>;

export const PartsView: React.FC<Props> = ({ isOwnerMode, onRequireOwner, latestOdometer }) => {
  const [parts, setParts] = React.useState<BikePart[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reload, setReload] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [busy, setBusy] = React.useState(false);
  const addRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    const open = () => addRef.current();
    window.addEventListener('n250:add', open);
    return () => window.removeEventListener('n250:add', open);
  }, []);

  React.useEffect(() => {
    if (!isOwnerMode) return;
    let cancelled = false;
    listParts()
      .then((p) => !cancelled && (setParts(p), setError(null), setLoading(false)))
      .catch((e: Error) => !cancelled && (setError(e.message), setLoading(false)));
    return () => {
      cancelled = true;
    };
  }, [isOwnerMode, reload]);

  if (!isOwnerMode) {
    return (
      <div className="stagger space-y-5">
        <PageHeader title="Parts" subtitle="How long tyres, chain and pads last." />
        <EmptyState icon={Lock} title="Unlock to see your parts" action={<button type="button" className="btn btn-primary" onClick={onRequireOwner}>Unlock</button>} />
      </div>
    );
  }

  const active = parts.filter((p) => !p.removedDate);
  const retired = parts.filter((p) => p.removedDate);
  const done = () => setReload((n) => n + 1);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      done();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const seed = () =>
    run(async () => {
      for (const s of STARTER) {
        await createPart({ name: s.name, brand: null, installedDate: DELIVERY, installedOdometer: 0, lifeKm: s.lifeKm, cost: null, notes: null, removedDate: null, removedOdometer: null });
      }
    });

  const toInput = (d: Draft, extra: Partial<PartInput> = {}): PartInput => ({
    name: d.name.trim(),
    brand: d.brand.trim() || null,
    installedDate: d.date || null,
    installedOdometer: d.odo ? Number(d.odo) : null,
    lifeKm: d.life ? Number(d.life) : null,
    cost: d.cost ? Number(d.cost) : null,
    notes: d.notes.trim() || null,
    removedDate: null,
    removedOdometer: null,
    ...extra,
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.name.trim()) return;
    const d = draft;
    run(async () => {
      if (d.replacing) {
        // Retire the old part at this reading, then start the new one.
        const old = d.replacing;
        await updatePart(old.id, { ...old, removedDate: d.date || null, removedOdometer: d.odo ? Number(d.odo) : null });
        await createPart(toInput(d));
      } else if (d.id) {
        const cur = parts.find((p) => p.id === d.id);
        await updatePart(d.id, toInput(d, { removedDate: cur?.removedDate ?? null, removedOdometer: cur?.removedOdometer ?? null }));
      } else {
        await createPart(toInput(d));
      }
      setDraft(null);
    });
  };

  const blank = (): Draft => ({ name: '', brand: '', date: new Date().toISOString().split('T')[0], odo: latestOdometer ? String(latestOdometer) : '', life: '', cost: '', notes: '' });
  addRef.current = () => setDraft(blank());
  const field = (k: keyof Draft) => ({ value: (draft?.[k] as string) ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft((d) => (d ? { ...d, [k]: e.target.value } : d)) });

  return (
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader
        title="Parts"
        subtitle="How long tyres, chain and pads last, and what each km cost."
        action={<button type="button" className="btn btn-primary" onClick={() => setDraft(blank())}><Plus className="h-4 w-4" /> Add part</button>}
      />
      {error && <div role="alert" className="card px-4 py-3 text-[14px] text-accent">{error}</div>}

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading"><div className="card p-5 space-y-3"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-2/3" /></div><div className="card p-5 space-y-3"><div className="skeleton h-4 w-1/4" /><div className="skeleton h-3 w-5/6" /></div></div>
      ) : parts.length === 0 ? (
        <EmptyState
          icon={Cog}
          title="No parts yet"
          body="Track the parts that wear out. Each one starts counting from the km it was fitted."
          action={<button type="button" className="btn btn-primary" disabled={busy} onClick={seed}>{busy ? 'Adding…' : 'Add tyres, chain and brake pads (all new at delivery)'}</button>}
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {active.map((p) => {
              const used = Math.max(0, latestOdometer - (p.installedOdometer ?? 0));
              const pct = p.lifeKm ? Math.min(100, Math.round((used / p.lifeKm) * 100)) : null;
              const bar = pct === null ? '' : pct >= 85 ? 'bg-accent' : pct >= 60 ? 'bg-[var(--color-text-1)]' : 'bg-[var(--color-data)]';
              return (
                <li key={p.id} className="card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[16px] font-semibold text-ink-1">{p.name}</h2>
                      <p className="text-[13px] text-ink-2 mt-0.5 tabular">
                        {[p.brand, p.installedDate && `fitted ${fmt(p.installedDate)}`, `at ${(p.installedOdometer ?? 0).toLocaleString('en-IN')} km`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center -mr-2 -mt-1 shrink-0">
                      <button type="button" aria-label="Edit part" onClick={() => setDraft({ id: p.id, name: p.name, brand: p.brand ?? '', date: p.installedDate ?? '', odo: String(p.installedOdometer ?? ''), life: String(p.lifeKm ?? ''), cost: String(p.cost ?? ''), notes: p.notes ?? '' })} className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink-1 hover:bg-surface-2"><Pencil className="w-4 h-4" /></button>
                      <button type="button" aria-label="Delete part" onClick={() => confirm(`Delete "${p.name}"?`) && run(() => deletePart(p.id))} className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-3 hover:text-accent hover:bg-surface-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between text-[13px] tabular">
                      <span className="text-ink-1 font-medium">{used.toLocaleString('en-IN')} km</span>
                      <span className="text-ink-2">{p.lifeKm ? `of about ${p.lifeKm.toLocaleString('en-IN')} km` : 'no life set'}</span>
                    </div>
                    {pct !== null && <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden"><div className={`h-full rounded-full bar-grow ${bar}`} style={{ width: `${pct}%` }} /></div>}
                    <div className="mt-2 flex items-center justify-between text-[13px] text-ink-2 tabular">
                      <span>{p.cost && used > 0 ? `₹${(p.cost / used).toFixed(2)} per km so far` : p.cost ? inr(p.cost) : ''}</span>
                      {pct !== null && <span className={pct >= 85 ? 'text-accent font-medium' : ''}>{pct >= 100 ? 'Past its life' : `${Math.max(0, (p.lifeKm ?? 0) - used).toLocaleString('en-IN')} km left`}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => setDraft({ replacing: p, name: p.name, brand: p.brand ?? '', date: new Date().toISOString().split('T')[0], odo: latestOdometer ? String(latestOdometer) : '', life: String(p.lifeKm ?? ''), cost: '', notes: '' })} className="btn btn-secondary btn-sm mt-3.5">
                    <RefreshCw className="w-4 h-4" /> Replaced it
                  </button>
                </li>
              );
            })}
          </ul>

          {retired.length > 0 && (
            <section className="card overflow-hidden">
              <h2 className="px-5 pt-5 pb-3 text-[15px] font-semibold text-ink-1">Past parts</h2>
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {retired.map((p) => {
                  const km = (p.removedOdometer ?? 0) - (p.installedOdometer ?? 0);
                  return (
                    <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-4 tabular">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-1">{p.name}{p.brand ? ` · ${p.brand}` : ''}</p>
                        <p className="text-[13px] text-ink-2">{p.installedDate && fmt(p.installedDate)}{p.removedDate && ` to ${fmt(p.removedDate)}`}</p>
                      </div>
                      <div className="text-right shrink-0 text-[13px]">
                        <p className="font-semibold text-ink-1">{km > 0 ? `${km.toLocaleString('en-IN')} km` : '—'}</p>
                        <p className="text-ink-2">{p.cost && km > 0 ? `₹${(p.cost / km).toFixed(2)}/km` : p.cost ? inr(p.cost) : ''}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      <ModalSheet open={!!draft} onClose={() => setDraft(null)} title={draft?.replacing ? `Replaced: ${draft.replacing.name}` : draft?.id ? 'Edit part' : 'Add a part'} subtitle={draft?.replacing ? 'Enter the new one. The old part is closed at this reading.' : 'Counts from the km it was fitted'}>
        <form onSubmit={save} className="px-5 pb-5 space-y-4 overflow-y-auto grow">
          <SheetField label="Part"><input type="text" required placeholder="e.g. Rear tyre" className={sheetInput} {...field('name')} /></SheetField>
          <SheetField label="Brand" hint="optional"><input type="text" className={sheetInput} {...field('brand')} /></SheetField>
          <div className="grid grid-cols-2 gap-3">
            <SheetField label={draft?.replacing ? 'Replaced on' : 'Fitted on'}><input type="date" className={sheetInput} {...field('date')} /></SheetField>
            <SheetField label={draft?.replacing ? 'Odometer now' : 'Fitted at km'}><input type="number" inputMode="numeric" className={`${sheetInput} tabular`} {...field('odo')} /></SheetField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SheetField label="Expected life" hint="km"><input type="number" inputMode="numeric" className={`${sheetInput} tabular`} {...field('life')} /></SheetField>
            <SheetField label="Cost" hint="₹"><input type="number" inputMode="numeric" className={`${sheetInput} tabular`} {...field('cost')} /></SheetField>
          </div>
          <SheetField label="Notes" hint="optional"><textarea className={`${sheetInput} h-20 py-2.5 resize-none`} {...field('notes')} /></SheetField>
          <button type="submit" disabled={busy} className="btn btn-accent w-full !h-12 text-[15px] disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        </form>
      </ModalSheet>
    </div>
  );
};
