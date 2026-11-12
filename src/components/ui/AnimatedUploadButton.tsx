'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, FileText, X, Image as ImageIcon } from 'lucide-react';

interface UploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  /** Kept for the existing call sites; the parent clears it to reset the control. */
  selectedFileName?: string | null;
  /** Largest file accepted, in MB. */
  maxMb?: number;
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * File picker for bills and photos: tap or drag a file onto it. A photo shows
 * as a thumbnail, a PDF or web invoice as a file row, with a button to remove it.
 */
export const AnimatedUploadButton: React.FC<UploadProps> = ({
  onFileSelect,
  accept = 'image/png,image/jpeg,image/jpg,application/pdf,text/html,.pdf,.png,.jpg,.jpeg,.html,.htm',
  selectedFileName,
  maxMb = 10,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const [picked, setPicked] = useState<{ file: File; previewUrl: string | null } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revoke = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  useEffect(() => revoke, []);

  // Only trust the local copy while the parent still holds the same file;
  // when the parent resets (after save or cancel) the control goes back to empty.
  const current = picked && selectedFileName === picked.file.name ? picked : null;

  const take = (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`That file is ${formatSize(file.size)}. The limit is ${maxMb} MB.`);
      return;
    }
    setError(null);
    revoke();
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    urlRef.current = previewUrl;
    setPicked({ file, previewUrl });
    onFileSelect(file);
  };

  const clear = () => {
    revoke();
    setPicked(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileSelect(null);
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      className="sr-only"
      accept={accept}
      onChange={(e) => take(e.target.files?.[0])}
      tabIndex={-1}
    />
  );

  if (current) {
    const isPdf = current.file.type === 'application/pdf' || current.file.name.toLowerCase().endsWith('.pdf');
    return (
      <div>
        {input}
        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-surface p-2.5 animate-fade-in">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-2 flex items-center justify-center shrink-0">
            {current.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob: preview
              <img src={current.previewUrl} alt="" className="w-full h-full object-cover" />
            ) : isPdf ? (
              <FileText className="w-6 h-6 text-accent" />
            ) : (
              <ImageIcon className="w-6 h-6 text-ink-3" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-ink-1 truncate">{current.file.name}</p>
            <p className="text-[12px] text-ink-3 mt-0.5 tabular">
              {isPdf ? 'PDF' : current.previewUrl ? 'Photo' : 'File'} · {formatSize(current.file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label="Remove file"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-3 hover:text-accent hover:bg-surface-2 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {input}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={`w-full rounded-xl border border-dashed px-4 py-5 flex items-center gap-3.5 text-left transition-colors ${
          dragging
            ? 'border-[var(--color-accent)] bg-accent-bg'
            : 'border-[var(--color-border)] bg-surface hover:bg-surface-2'
        }`}
      >
        <span className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
          <Paperclip className="w-[18px] h-[18px] text-ink-2" />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-medium text-ink-1">{dragging ? 'Drop to attach' : 'Attach a file'}</span>
          <span className="block text-[12px] text-ink-3 mt-0.5">Tap to choose, or drop it here</span>
        </span>
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-[12px] text-accent">
          {error}
        </p>
      )}
    </div>
  );
};
