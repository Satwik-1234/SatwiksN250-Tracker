'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Image as ImageIcon,
  Code,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  RefreshCcw,
  Printer,
  Smartphone,
  CheckCircle2,
  Share2,
  AlertCircle
} from 'lucide-react';
import {
  openPdfWithSystemViewer,
  getGoogleDriveViewerUrl,
  getGoogleDocsEmbeddedUrl,
  isMobileDevice,
  isAndroidDevice,
  cleanPdfFilename
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

// Official Google Drive Logo SVG
const GoogleDriveLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
}) => {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [pdfMode, setPdfMode] = useState<'native' | 'google'>('native');
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLaunchingViewer, setIsLaunchingViewer] = useState(false);
  const [showInAppMobilePreview, setShowInAppMobilePreview] = useState(false);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
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
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        setDisplayUrl(blobUrl);
        setIsLoading(false);

        return () => URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Failed to convert data URI to blob', err);
        setDisplayUrl(url);
        setIsLoading(false);
      }
    } else {
      setDisplayUrl(url);
      setIsLoading(false);
    }
  }, [url]);

  if (!isOpen || !url) return null;

  const docType = getDocType(url);
  const isDataUrl = url.startsWith('data:');

  const handleZoomIn = () => setScale((s) => Math.min(Number((s + 0.25).toFixed(2)), 3.5));
  const handleZoomOut = () => setScale((s) => Math.max(Number((s - 0.25).toFixed(2)), 0.5));
  const handleReset = () => {
    setScale(1);
    setRotate(0);
  };
  const handleRotate = () => setRotate((r) => (r + 90) % 360);

  const googleCloudViewerUrl = getGoogleDriveViewerUrl(url);
  const googleDocsEmbeddedUrl = getGoogleDocsEmbeddedUrl(url);

  // Trigger system default PDF viewer (e.g. Google Drive Offline PDF Viewer)
  const handleOpenSystemPdfViewer = async () => {
    setIsLaunchingViewer(true);
    try {
      await openPdfWithSystemViewer(displayUrl || url, title);
    } catch (err) {
      console.error('Error opening system PDF viewer:', err);
    } finally {
      setTimeout(() => setIsLaunchingViewer(false), 1200);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-fade-in transition-all ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-800 flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl rounded-2xl h-[92vh] max-h-[920px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {docType === 'PDF' && <FileText className="w-4 h-4 text-red-400" />}
              {docType === 'IMAGE' && <ImageIcon className="w-4 h-4 text-blue-400" />}
              {docType === 'HTML' && <Code className="w-4 h-4 text-emerald-400" />}
              {docType === 'DOC' && <Eye className="w-4 h-4 text-purple-400" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm sm:text-base leading-tight truncate">
                {title || 'Document Preview'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                  {docType}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
                  {isDataUrl ? 'Local Attachment' : 'Supabase Cloud Storage'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Desktop PDF Mode Toggle */}
            {docType === 'PDF' && googleDocsEmbeddedUrl && !isMobile && (
              <div className="hidden sm:flex bg-slate-800 border border-slate-700 rounded-lg p-0.5 mr-2">
                <button
                  onClick={() => setPdfMode('native')}
                  className={`px-2 py-1 text-xs rounded-md transition font-medium ${
                    pdfMode === 'native'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chrome Native
                </button>
                <button
                  onClick={() => setPdfMode('google')}
                  className={`px-2 py-1 text-xs rounded-md transition font-medium ${
                    pdfMode === 'google'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cloud View
                </button>
              </div>
            )}

            {/* Print button for HTML/PDF */}
            {(docType === 'HTML' || docType === 'PDF') && (
              <button
                onClick={() => {
                  const w = window.open(displayUrl || url, '_blank');
                  if (w) w.focus();
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Print or Open Clean Tab"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            {/* Download */}
            <a
              href={displayUrl || url}
              download={cleanPdfFilename(title)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* External Tab */}
            <a
              href={displayUrl || url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
              title="Open in Full Browser Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Toolbar for Images */}
        {docType === 'IMAGE' && (
          <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-300 font-semibold px-2">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-800 mx-1" />
              <button
                onClick={handleReset}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Fit to Screen (100%)"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Scroll or use buttons to zoom & pan
            </span>
          </div>
        )}

        {/* Main Document Body */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 p-8">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Preparing document...</p>
            </div>
          ) : loadError ? (
            <div className="p-8 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-white mb-1">Preview couldn't be loaded</h4>
              <p className="text-xs text-slate-400 mb-5">
                The document might be restricted by your browser or requires direct opening.
              </p>
              <a
                href={displayUrl || url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-lg"
              >
                <ExternalLink className="w-4 h-4" /> Open Directly
              </a>
            </div>
          ) : docType === 'IMAGE' ? (
            <div
              ref={imgContainerRef}
              className="w-full h-full overflow-auto flex items-center justify-center p-4"
            >
              <div
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  transition: 'transform 0.15s ease-out',
                  transformOrigin: 'center center',
                }}
                className="flex items-center justify-center max-w-full max-h-full"
              >
                <img
                  src={displayUrl || url}
                  alt={title}
                  onError={() => setLoadError(true)}
                  className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl select-none"
                  draggable={false}
                />
              </div>
            </div>
          ) : docType === 'PDF' ? (
            <div className="w-full h-full flex flex-col bg-slate-950 relative">
              {/* MOBILE DEDICATED VIEW (Android & iOS Default System Viewer / Google Drive Hub) */}
              <div className="sm:hidden w-full h-full flex flex-col items-center justify-start p-5 text-center bg-slate-900 overflow-y-auto">
                {/* Hero Icon Badge */}
                <div className="mt-4 mb-3 relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-red-500/20 border border-slate-700 flex items-center justify-center shadow-xl">
                    <FileText className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-slate-800 border border-slate-700 p-1.5 rounded-lg shadow">
                    <GoogleDriveLogo className="w-4 h-4" />
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mb-1 leading-snug max-w-xs">{title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Google Drive & System Default PDF Hub</span>
                </div>

                {/* Primary Action: Open in Google Drive / Default PDF Viewer */}
                <div className="w-full max-w-sm space-y-3">
                  <button
                    onClick={handleOpenSystemPdfViewer}
                    disabled={isLaunchingViewer}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 active:scale-[0.98] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-600/25 transition disabled:opacity-75"
                  >
                    {isLaunchingViewer ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <GoogleDriveLogo className="w-5 h-5 shrink-0" />
                    )}
                    <span>
                      {isLaunchingViewer
                        ? 'Launching Viewer...'
                        : 'Open in Google Drive / Default App'}
                    </span>
                  </button>

                  {/* Secondary: Google Drive Web Viewer (for public cloud URLs) */}
                  {googleCloudViewerUrl && (
                    <a
                      href={googleCloudViewerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-400" />
                      <span>Open in Google Drive Web Viewer</span>
                    </a>
                  )}

                  {/* Download PDF to Device */}
                  <a
                    href={displayUrl || url}
                    download={cleanPdfFilename(title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download PDF to Phone</span>
                  </a>

                  {/* Toggle In-App Mobile Preview */}
                  {googleDocsEmbeddedUrl && (
                    <button
                      onClick={() => setShowInAppMobilePreview(!showInAppMobilePreview)}
                      className="w-full py-2 px-3 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {showInAppMobilePreview ? 'Hide In-App Preview' : 'Preview Inside App'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Optional In-App Mobile Embedded Preview */}
                {showInAppMobilePreview && googleDocsEmbeddedUrl && (
                  <div className="w-full h-80 mt-4 rounded-xl overflow-hidden border border-slate-700 shadow-2xl shrink-0">
                    <iframe
                      src={googleDocsEmbeddedUrl}
                      title={title}
                      className="w-full h-full border-0 bg-white"
                    />
                  </div>
                )}

                {/* Helpful Note for Android Users */}
                <div className="mt-5 p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-400 max-w-sm text-left flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300">Android Tip:</span> Tapping "Open in Google Drive" opens your preinstalled offline Google Drive PDF Viewer or default reader instantly.
                  </div>
                </div>
              </div>

              {/* DESKTOP VIEW (Chrome Native PDF Embed Viewer) */}
              <div className="hidden sm:flex flex-col w-full h-full">
                <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-white">
                      {pdfMode === 'native' ? 'Chrome PDF Viewer' : 'Google Drive Cloud View'}
                    </span>
                    <span className="text-slate-500 text-[11px] hidden md:inline">
                      Full navigation, zoom controls & printing supported
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {googleCloudViewerUrl && (
                      <a
                        href={googleCloudViewerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                      >
                        <GoogleDriveLogo className="w-3.5 h-3.5" /> Google Drive View
                      </a>
                    )}
                    <a
                      href={displayUrl || url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in Chrome Tab
                    </a>
                  </div>
                </div>

                <div className="w-full h-full flex-1 bg-slate-900 relative">
                  {pdfMode === 'native' ? (
                    <embed
                      src={`${displayUrl || url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                      type="application/pdf"
                      className="w-full h-full border-0 bg-white"
                    />
                  ) : (
                    <iframe
                      src={googleDocsEmbeddedUrl || displayUrl || url}
                      title={title}
                      className="w-full h-full border-0 bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : docType === 'HTML' ? (
            <div className="w-full h-full flex flex-col bg-white">
              <iframe
                src={displayUrl || url}
                title={title}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <FileText className="w-16 h-16 text-slate-600 mb-4" />
              <h4 className="text-base font-semibold text-white mb-2">
                Document Ready to Open
              </h4>
              <p className="text-xs text-slate-400 mb-6 max-w-sm">
                This document is stored securely. Click below to download or view in your native application.
              </p>
              <a
                href={displayUrl || url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-xl"
              >
                <ExternalLink className="w-4 h-4" /> Open Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
