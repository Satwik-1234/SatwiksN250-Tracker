'use client';

import React from 'react';
import { FileText, Image as ImageIcon, Download, Eye, Trash2, Lock, Plus, FolderOpen } from 'lucide-react';
import { PageHeader, Chip, ChipRow, EmptyState } from '@/components/ui/Page';
import { AnimatedUploadButton } from '@/components/ui/AnimatedUploadButton';
import { DocumentViewerModal } from '@/components/modals/DocumentViewerModal';
import { ModalSheet, SheetField, ChipSelect, sheetInput } from '@/components/modals/sheet';
import { compressImageFile } from '@/utils/imageCompression';
import {
  BikeDocument,
  DOCUMENT_CATEGORIES,
  listDocuments,
  uploadDocument,
  deleteDocument,
  fetchDocumentBlob,
  blobToDataUrl,
  saveBlobAs,
} from '@/services/documentsService';

interface Props {
  isOwnerMode: boolean;
  onRequireOwner?: () => void;
}

const formatSize = (b: number) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const fmt = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Insurance, PUC and licence papers run out, so say so plainly. */
function expiryInfo(expiry: string | null): { text: string; tone: 'bad' | 'warn' | 'ok' } | null {
  if (!expiry) return null;
  const days = Math.round((new Date(`${expiry}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (days < 0) return { text: `Expired ${fmt(expiry)}`, tone: 'bad' };
  if (days <= 30) return { text: `Expires in ${days} ${days === 1 ? 'day' : 'days'}`, tone: 'warn' };
  return { text: `Valid till ${fmt(expiry)}`, tone: 'ok' };
}

export const DocumentsView: React.FC<Props> = ({ isOwnerMode, onRequireOwner }) => {
  const [docs, setDocs] = React.useState<BikeDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState('ALL');
  const [reload, setReload] = React.useState(0);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [viewing, setViewing] = React.useState<{ title: string; url: string } | null>(null);
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    const open = () => setAdding(true);
    window.addEventListener('n250:add', open);
    return () => window.removeEventListener('n250:add', open);
  }, []);

  React.useEffect(() => {
    if (!isOwnerMode) return;
    let cancelled = false;
    listDocuments()
      .then((d) => {
        if (cancelled) return;
        setDocs(d);
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
        <PageHeader title="Documents" subtitle="RC, insurance, licence and other bike papers." />
        <EmptyState
          icon={Lock}
          title="Your papers are private"
          body="Unlock owner mode to see, download and add documents. They are never shown to visitors."
          action={
            <button type="button" className="btn btn-primary" onClick={onRequireOwner}>
              Unlock
            </button>
          }
        />
      </div>
    );
  }

  const categories = ['ALL', ...Array.from(new Set(docs.map((d) => d.category)))];
  const shown = filter === 'ALL' ? docs : docs.filter((d) => d.category === filter);

  const view = async (d: BikeDocument) => {
    setBusyId(d.id);
    try {
      const url = await blobToDataUrl(await fetchDocumentBlob(d.id));
      setViewing({ title: d.title, url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const download = async (d: BikeDocument) => {
    setBusyId(d.id);
    try {
      saveBlobAs(await fetchDocumentBlob(d.id, true), d.fileName);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (d: BikeDocument) => {
    if (!confirm(`Delete "${d.title}"? This cannot be undone.`)) return;
    setBusyId(d.id);
    try {
      await deleteDocument(d.id);
      setReload((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Open or download your bike papers from any device."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add document
          </button>
        }
      />

      {error && (
        <div role="alert" className="card px-4 py-3 text-[14px] text-accent">
          {error}
        </div>
      )}

      {docs.length > 0 && (
        <ChipRow>
          {categories.map((c) => (
            <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
              {c === 'ALL' ? 'All' : c}
            </Chip>
          ))}
        </ChipRow>
      )}

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading"><div className="card p-5 space-y-3"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-2/3" /></div><div className="card p-5 space-y-3"><div className="skeleton h-4 w-1/4" /><div className="skeleton h-3 w-5/6" /></div></div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={docs.length === 0 ? 'No documents yet' : 'Nothing in this category'}
          body={docs.length === 0 ? 'Add your RC, insurance, PUC or licence as a PDF or photo.' : undefined}
          action={
            docs.length === 0 ? (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>
                Add your first document
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {shown.map((d) => {
            const exp = expiryInfo(d.expiryDate);
            const isPdf = d.mimeType === 'application/pdf';
            const busy = busyId === d.id;
            return (
              <li key={d.id} className="card p-4 flex items-start gap-3.5">
                <span className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                  {isPdf ? <FileText className="w-5 h-5 text-accent" /> : <ImageIcon className="w-5 h-5 text-ink-2" />}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-ink-1 truncate">{d.title}</h3>
                  <p className="text-[13px] text-ink-2 mt-0.5 tabular">
                    {d.category} · {isPdf ? 'PDF' : 'Photo'} · {formatSize(d.sizeBytes)}
                  </p>
                  {exp && (
                    <p
                      className={`text-[13px] mt-1 font-medium ${
                        exp.tone === 'bad' ? 'text-accent' : exp.tone === 'warn' ? 'text-amber-500' : 'text-ink-2'
                      }`}
                    >
                      {exp.text}
                    </p>
                  )}
                  {d.notes && <p className="text-[13px] text-ink-2 mt-1 line-clamp-2">{d.notes}</p>}

                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" disabled={busy} onClick={() => view(d)} className="btn btn-secondary btn-sm disabled:opacity-60">
                      <Eye className="w-4 h-4" /> {busy ? 'Opening…' : 'View'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => download(d)} className="btn btn-secondary btn-sm disabled:opacity-60">
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(d)}
                      aria-label={`Delete ${d.title}`}
                      className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-accent hover:bg-surface-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {viewing && <DocumentViewerModal isOpen onClose={() => setViewing(null)} title={viewing.title} url={viewing.url} />}

      <AddDocumentSheet
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={() => {
          setAdding(false);
          setReload((n) => n + 1);
        }}
      />
    </div>
  );
};

const AddDocumentSheet: React.FC<{ open: boolean; onClose: () => void; onSaved: () => void }> = ({ open, onClose, onSaved }) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('Registration (RC)');
  const [expiry, setExpiry] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setFile(null);
        setTitle('');
        setCategory('Registration (RC)');
        setExpiry('');
        setNotes('');
        setErr(null);
      });
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErr('Choose a PDF or photo first.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      // Phone photos are large; shrinking them keeps the upload quick and the database small.
      const toSend = file.type.startsWith('image/') ? await compressImageFile(file, 2200, 2200, 0.85).catch(() => file) : file;
      await uploadDocument(toSend, { title: title.trim() || file.name.replace(/\.[^.]+$/, ''), category, expiryDate: expiry || undefined, notes: notes.trim() || undefined });
      onSaved();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet open={open} onClose={onClose} title="Add a document" subtitle="Stored privately. Only you can open it.">
      <form onSubmit={submit} className="px-5 pb-5 space-y-4 overflow-y-auto grow">
        <SheetField label="File" hint="PDF or photo · up to 8 MB">
          <AnimatedUploadButton
            onFileSelect={setFile}
            accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
            selectedFileName={file ? file.name : null}
            maxMb={8}
          />
        </SheetField>

        <SheetField label="Type">
          <ChipSelect value={category} onChange={setCategory} options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </SheetField>

        <SheetField label="Name" hint="optional">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Insurance 2026–27" className={sheetInput} />
        </SheetField>

        <SheetField label="Expires on" hint="optional">
          <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={sheetInput} />
        </SheetField>

        <SheetField label="Notes" hint="optional">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Policy number, renewal contact…" className={`${sheetInput} h-20 py-2.5 resize-none`} />
        </SheetField>

        {err && (
          <p role="alert" className="text-[13px] text-accent">
            {err}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn btn-accent w-full !h-12 text-[15px] disabled:opacity-60">
          {saving ? 'Saving…' : 'Save document'}
        </button>
      </form>
    </ModalSheet>
  );
};
