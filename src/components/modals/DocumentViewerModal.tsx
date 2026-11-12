'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  AlertCircle,
} from 'lucide-react';
import {
  openPdfWithSystemViewer,
  getGoogleDocsEmbeddedUrl,
  isMobileDevice,
  cleanPdfFilename,
} from '@/utils/pdfViewerHelper';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const getDocType = (url?: string): 'PDF' | 'IMAGE' | 'HTML' | 'DOC' | null => {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('.pdf') || lower.includes('pdf') || lower.includes('application/pdf')) return 'PDF';
  if (lower.includes('.html') || lower.includes('.htm') || lower.includes('html') || lower.includes('text/html')) return 'HTML';
  if (
    lower.includes('.png') ||
    lower.includes('.jpg') ||
    lower.includes('.jpeg') ||
    lower.includes('.webp') ||
    lower.includes('image') ||
    lower.startsWith('data:image')
  ) {
    return 'IMAGE';
  }
  return 'DOC';
};

const TYPE_LABEL: Record<string, string> = { PDF: 'PDF', IMAGE: 'Photo', HTML: 'Web invoice', DOC: 'Document' };

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ───────────────────────── Image stage: pinch, wheel, drag, double-tap ───────────────────────── */

const ImageStage = ({ src, alt, onError }: { src: string; alt: string; onError: () => void }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const lastTap = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const applyZoom = useCallback((next: number) => {
    const z = clamp(Number(next.toFixed(2)), MIN_ZOOM, MAX_ZOOM);
    setZoom(z);
    if (z === 1) setOffset({ x: 0, y: 0 });
  }, []);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  // Wheel zoom needs a non-passive listener to stop the page behind from scrolling.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => {
        const next = clamp(Number((z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)).toFixed(2)), MIN_ZOOM, MAX_ZOOM);
        if (next === 1) setOffset({ x: 0, y: 0 });
        return next;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    } else {
      // Double tap / double click toggles between fit and 2.5×
      const now = Date.now();
      if (now - lastTap.current < 300) {
        applyZoom(zoom > 1 ? 1 : 2.5);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
      setDragging(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      applyZoom(pinchStart.current.zoom * (dist / pinchStart.current.dist));
    } else if (pointers.current.size === 1 && zoom > 1) {
      setOffset((o) => ({ x: o.x + (e.clientX - prev.x), y: o.y + (e.clientY - prev.y) }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const toolBtn =
    'w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors';

  return (
    <>
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute inset-0 flex items-center justify-center overflow-hidden select-none"
        style={{ touchAction: 'none', cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data:/blob: preview URLs, next/image unsupported */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          onError={onError}
          className="max-w-full max-h-full object-contain animate-fade-in"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: dragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: 16,
          }}
        />
      </div>

      {/* Floating controls */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 pb-safe z-10">
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-2xl">
          <button type="button" className={toolBtn} onClick={() => applyZoom(zoom - 0.5)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="w-12 text-center text-[13px] font-medium text-white tabular" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" className={toolBtn} onClick={() => applyZoom(zoom + 0.5)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">
            <ZoomIn className="w-5 h-5" />
          </button>
          <span className="w-px h-5 bg-white/15 mx-1" />
          <button type="button" className={toolBtn} onClick={() => setRotation((r) => r + 90)} aria-label="Rotate">
            <RotateCw className="w-5 h-5" />
          </button>
          <button type="button" className={toolBtn} onClick={reset} aria-label="Fit to screen">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

/* ───────────────────────── Viewer ───────────────────────── */

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, title, url }) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setIsMobile(isMobileDevice()));
  }, []);

  // data: URLs are converted to blob: URLs so large files render and download reliably.
  useEffect(() => {
    let revokeBlob: (() => void) | null = null;

    const t = setTimeout(() => {
      if (!url) {
        setDisplayUrl(null);
        return;
      }
      setIsLoading(true);
      setLoadError(false);

      if (url.startsWith('data:')) {
        try {
          const arr = url.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : '';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          const blobUrl = URL.createObjectURL(new Blob([u8arr], { type: mime }));
          setDisplayUrl(blobUrl);
          revokeBlob = () => URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.error('Failed to convert data URI to blob', err);
          setDisplayUrl(url);
        }
      } else {
        setDisplayUrl(url);
      }
      setIsLoading(false);
    }, 0);

    return () => {
      clearTimeout(t);
      revokeBlob?.();
    };
  }, [url]);

  // Escape closes; the page behind does not scroll while the viewer is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  const docType = getDocType(url) ?? 'DOC';
  const src = displayUrl || url;
  const embeddedPdfUrl = getGoogleDocsEmbeddedUrl(url);

  const openInPdfApp = async () => {
    setIsLaunching(true);
    try {
      await openPdfWithSystemViewer(src, title);
    } catch (err) {
      console.error('Error opening system PDF viewer:', err);
    } finally {
      setTimeout(() => setIsLaunching(false), 1200);
    }
  };

  const barBtn =
    'w-11 h-11 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition-colors';

  const fallback = (heading: string, body: string) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        {loadError ? <AlertCircle className="w-6 h-6 text-red-400" /> : <FileText className="w-6 h-6 text-white/70" />}
      </div>
      <h4 className="text-base font-semibold text-white">{heading}</h4>
      <p className="mt-1 text-sm text-white/60 max-w-xs">{body}</p>
      <div className="mt-5 flex flex-col sm:flex-row gap-2.5 w-full max-w-xs sm:max-w-none sm:w-auto">
        <a href={src} target="_blank" rel="noopener noreferrer" className="btn btn-accent">
          <ExternalLink className="w-4 h-4" /> Open in new tab
        </a>
        <a
          href={src}
          download={cleanPdfFilename(title)}
          className="btn bg-white/10 text-white hover:bg-white/15"
        >
          <Download className="w-4 h-4" /> Download
        </a>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-slate-950/95 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Document'}
    >
      {/* Top bar */}
      <header className="shrink-0 h-14 pl-4 pr-1.5 flex items-center justify-between gap-2 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white/80">
            {docType === 'IMAGE' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-medium text-white truncate leading-tight">{title || 'Document'}</h3>
            <p className="text-xs text-white/50">{TYPE_LABEL[docType]}</p>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <a href={src} download={cleanPdfFilename(title)} className={barBtn} aria-label="Download" title="Download">
            <Download className="w-5 h-5" />
          </a>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className={`${barBtn} hidden sm:flex`}
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button type="button" onClick={onClose} className={barBtn} aria-label="Close" title="Close (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stage. Clicking the empty backdrop closes the viewer. */}
      <div
        className="relative flex-1 min-h-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          fallback('This file could not be previewed', 'It may have been moved or your browser is blocking it. You can still open or download it.')
        ) : docType === 'IMAGE' ? (
          <ImageStage src={src} alt={title} onError={() => setLoadError(true)} />
        ) : docType === 'PDF' ? (
          isMobile ? (
            // Phone browsers cannot render PDFs inline: preview through the embedded
            // reader when the file is public, and always offer the phone's own PDF app.
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 min-h-0 relative">
                {embeddedPdfUrl ? (
                  <iframe src={embeddedPdfUrl} title={title} className="absolute inset-0 w-full h-full border-0 bg-surface" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-white/70" />
                    </div>
                    <p className="text-sm text-white/60 max-w-xs">
                      This PDF is saved on this device. Open it in your PDF app to read it.
                    </p>
                  </div>
                )}
              </div>
              <div className="shrink-0 p-3 pb-safe border-t border-white/10 bg-slate-950">
                <button type="button" onClick={openInPdfApp} disabled={isLaunching} className="btn btn-accent w-full !h-12 disabled:opacity-70">
                  {isLaunching ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isLaunching ? 'Opening…' : 'Open in PDF app'}
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 sm:inset-x-6 sm:top-4 sm:bottom-4 lg:inset-x-[12%] sm:rounded-xl overflow-hidden bg-surface shadow-2xl animate-fade-up">
              <embed src={`${src}#toolbar=1&navpanes=0&view=Fit`} type="application/pdf" className="w-full h-full border-0" />
            </div>
          )
        ) : docType === 'HTML' ? (
          <div className="absolute inset-0 sm:inset-x-6 sm:top-4 sm:bottom-4 lg:inset-x-[12%] sm:rounded-xl overflow-hidden bg-surface shadow-2xl animate-fade-up">
            {/* Uploaded HTML is untrusted: no scripts and no access to this app's storage. */}
            <iframe
              src={src}
              title={title}
              className="w-full h-full border-0 bg-surface"
              sandbox="allow-popups"
              onError={() => setLoadError(true)}
            />
          </div>
        ) : (
          fallback('No preview for this file type', 'Open it in a new tab or download it to view.')
        )}
      </div>
    </div>
  );
};
