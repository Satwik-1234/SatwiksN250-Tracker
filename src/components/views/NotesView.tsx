'use client';

import React from 'react';
import { Lock, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader, Chip, ChipRow, SearchInput, EmptyState } from '@/components/ui/Page';
import { ModalSheet, SheetField, ChipSelect, sheetInput } from '@/components/modals/sheet';
import { BikeNote, NOTE_CATEGORIES, NoteCategory, NoteInput, createNote, listNotes, removeNote, updateNote } from '@/services/notesService';

interface Props {
  isOwnerMode: boolean;
  onRequireOwner?: () => void;
  latestOdometer: number;
}

const DOT: Record<NoteCategory, string> = {
  Breakdown: 'bg-accent',
  Issue: 'bg-[var(--color-text-1)]',
  'Good experience': 'bg-[var(--color-data)]',
  Review: 'bg-[var(--color-data)]',
  Tip: 'bg-ink-3',
  Note: 'bg-ink-3',
};

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// The first notes, from what the owner told us. Added once, with one tap, and editable afterwards.
const STARTER: NoteInput[] = [
  { title: 'Battery died, replaced under warranty', category: 'Breakdown', noteDate: '2026-08-04', odometer: null, rating: null, cost: 2200,
    body: 'The battery was dead and I had it replaced. The warranty battery did come, but it took a very long time. The purchase is logged in Gear (Amaron Battery).' },
  { title: 'BlueArmor C10 intercom: performance is not good', category: 'Review', noteDate: null, odometer: null, rating: null, cost: null,
    body: 'I bought the BlueArmor C10 intercom. Its performance is not good.' },
  { title: 'Jio petrol is the best', category: 'Good experience', noteDate: null, odometer: null, rating: null, cost: null,
    body: 'I have tried it again and again, and Jio petrol is the best one.' },
  { title: 'Hex head cut on the nut under the seat and mudguard', category: 'Issue', noteDate: null, odometer: null, rating: null, cost: null,
    body: 'A nut fitted under the seat, at the mudguard, has its hex head cut. I tried hard to get it out, but nobody is interested in fixing it. Bolt quality is a weak spot on this bike.' },
  { title: '10W-5 oil: the engine feels much smoother', category: 'Good experience', noteDate: null, odometer: null, rating: null, cost: null,
    body: 'The 10W-5 oil made the engine feel like a smooth operator: smooth idling, better low-end torque, good at low speeds, no stalling. Mileage: nothing special noticed.' },
];

export const NotesView: React.FC<Props> = ({ isOwnerMode, onRequireOwner, latestOdometer }) => {
  const [notes, setNotes] = React.useState<BikeNote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [reload, setReload] = React.useState(0);
  const [editing, setEditing] = React.useState<BikeNote | 'new' | null>(null);
  const [seeding, setSeeding] = React.useState(false);

  React.useEffect(() => {
    const open = () => setEditing('new');
    window.addEventListener('n250:add', open);
    return () => window.removeEventListener('n250:add', open);
  }, []);

  React.useEffect(() => {
    if (!isOwnerMode) return;
    let cancelled = false;
    listNotes()
      .then((n) => {
        if (cancelled) return;
        setNotes(n);
        setError(null);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwnerMode, reload]);

  if (!isOwnerMode) {
    return (
      <div className="stagger space-y-5">
        <PageHeader title="Notes" subtitle="Breakdowns, good experiences and things worth remembering." />
        <EmptyState
          icon={Lock}
          title="Your notes are private"
          body="Unlock owner mode to read and write notes."
          action={<button type="button" className="btn btn-primary" onClick={onRequireOwner}>Unlock</button>}
        />
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const shown = notes.filter(
    (n) => (filter === 'ALL' || n.category === filter) && (!q || `${n.title} ${n.body}`.toLowerCase().includes(q))
  );

  const seed = async () => {
    setSeeding(true);
    try {
      for (const n of STARTER) await createNote(n);
      setReload((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  const remove = async (n: BikeNote) => {
    if (!confirm(`Delete "${n.title}"?`)) return;
    try {
      await removeNote(n.id);
      setReload((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader
        title="Notes"
        subtitle="Breakdowns, good experiences and things worth remembering."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Add note
          </button>
        }
      />

      {error && (
        <div role="alert" className="card px-4 py-3 text-[14px] text-accent">
          {error}
        </div>
      )}

      {notes.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search notes" className="md:w-72" />
          <ChipRow>
            {['ALL', ...NOTE_CATEGORIES.filter((c) => notes.some((n) => n.category === c))].map((c) => (
              <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
                {c === 'ALL' ? 'All' : c}
              </Chip>
            ))}
          </ChipRow>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading"><div className="card p-5 space-y-3"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-2/3" /></div><div className="card p-5 space-y-3"><div className="skeleton h-4 w-1/4" /><div className="skeleton h-3 w-5/6" /></div></div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          body="Keep a record of breakdowns, what worked, what did not, and anything you want to remember about the bike."
          action={
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button type="button" className="btn btn-primary" disabled={seeding} onClick={seed}>
                {seeding ? 'Adding…' : 'Start with the 5 notes you shared'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing('new')}>
                Write a new one
              </button>
            </div>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes match" />
      ) : (
        <ul className="space-y-3">
          {shown.map((n) => (
            <li key={n.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[13px] text-ink-2">
                    <span className={`w-2 h-2 rounded-full ${DOT[n.category]}`} aria-hidden="true" />
                    <span>{n.category}</span>
                    {n.noteDate && <span className="tabular">· {fmt(n.noteDate)}</span>}
                    {n.odometer ? <span className="tabular">· {n.odometer.toLocaleString('en-IN')} km</span> : null}
                  </div>
                  <h2 className="text-[16px] font-semibold text-ink-1 mt-1">{n.title}</h2>
                </div>
                <div className="flex items-center -mr-2 -mt-1 shrink-0">
                  <button type="button" onClick={() => setEditing(n)} aria-label="Edit note" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink-1 hover:bg-surface-2">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => remove(n)} aria-label="Delete note" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-3 hover:text-accent hover:bg-surface-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {n.body && <p className="mt-2 text-[14px] text-ink-1 leading-relaxed whitespace-pre-wrap">{n.body}</p>}
              {(n.rating || n.cost) && (
                <div className="mt-3 flex items-center gap-4 text-[13px] text-ink-2 tabular">
                  {n.rating ? <span aria-label={`${n.rating} out of 5`}>{'★'.repeat(n.rating)}{'☆'.repeat(5 - n.rating)}</span> : null}
                  {n.cost ? <span>₹{n.cost.toLocaleString('en-IN')}</span> : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <NoteSheet
        note={editing}
        latestOdometer={latestOdometer}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setReload((x) => x + 1);
        }}
      />
    </div>
  );
};

const NoteSheet: React.FC<{ note: BikeNote | 'new' | null; latestOdometer: number; onClose: () => void; onSaved: () => void }> = ({
  note,
  latestOdometer,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [category, setCategory] = React.useState<NoteCategory>('Note');
  const [date, setDate] = React.useState('');
  const [odo, setOdo] = React.useState('');
  const [rating, setRating] = React.useState<number | null>(null);
  const [cost, setCost] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!note) return;
    queueMicrotask(() => {
      const n = note === 'new' ? null : note;
      setTitle(n?.title ?? '');
      setBody(n?.body ?? '');
      setCategory(n?.category ?? 'Note');
      setDate(n ? n.noteDate ?? '' : new Date().toISOString().split('T')[0]);
      setOdo(n ? (n.odometer ? String(n.odometer) : '') : latestOdometer > 0 ? String(latestOdometer) : '');
      setRating(n?.rating ?? null);
      setCost(n?.cost ? String(n.cost) : '');
      setErr(null);
    });
  }, [note, latestOdometer]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Give the note a title.');
      return;
    }
    setSaving(true);
    setErr(null);
    const input: NoteInput = {
      title: title.trim(),
      body: body.trim(),
      category,
      noteDate: date || null,
      odometer: odo ? Number(odo) : null,
      rating,
      cost: cost ? Number(cost) : null,
    };
    try {
      if (note && note !== 'new') await updateNote(note.id, input);
      else await createNote(input);
      onSaved();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet open={!!note} onClose={onClose} title={note && note !== 'new' ? 'Edit note' : 'Add a note'} subtitle="Only you can see your notes">
      <form onSubmit={submit} className="px-5 pb-5 space-y-4 overflow-y-auto grow">
        <SheetField label="Title">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Battery died on the highway" className={sheetInput} />
        </SheetField>
        <SheetField label="Type">
          <ChipSelect value={category} onChange={(v) => setCategory(v as NoteCategory)} options={NOTE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </SheetField>
        <SheetField label="What happened" hint="optional">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details, what you did, what you would do differently" className={`${sheetInput} h-32 py-2.5 resize-none`} />
        </SheetField>
        <div className="grid grid-cols-2 gap-3">
          <SheetField label="Date" hint="optional">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={sheetInput} />
          </SheetField>
          <SheetField label="Odometer" hint="optional">
            <input type="number" inputMode="numeric" value={odo} onChange={(e) => setOdo(e.target.value)} className={`${sheetInput} tabular`} />
          </SheetField>
        </div>
        <SheetField label="Rating" hint="optional">
          <div className="flex gap-2" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? null : n)}
                aria-pressed={rating !== null && n <= rating}
                aria-label={`${n} out of 5`}
                className={`w-10 h-10 rounded-lg border text-[18px] transition-colors ${
                  rating !== null && n <= rating ? 'bg-slate-900 text-white border-slate-900' : 'bg-surface border-[var(--color-border)] text-ink-3'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </SheetField>
        <SheetField label="Cost" hint="optional">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-ink-3">₹</span>
            <input type="number" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} className={`${sheetInput} pl-7 tabular`} />
          </div>
        </SheetField>
        {err && <p role="alert" className="text-[13px] text-accent">{err}</p>}
        <button type="submit" disabled={saving} className="btn btn-accent w-full !h-12 text-[15px] disabled:opacity-60">
          {saving ? 'Saving…' : 'Save note'}
        </button>
      </form>
    </ModalSheet>
  );
};
