'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Download, FileText, Image as ImageIcon, Code, Eye, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, RefreshCcw } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const getDocType = (url?: string) => {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('.pdf') || lower.includes('pdf') || lower.includes('application/pdf')) return 'PDF';
  if (lower.includes('.html') || lower.includes('.htm') || lower.includes('html') || lower.includes('text/html')) return 'HTML';
  if (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.webp') || lower.includes('image') || lower.startsWith('data:image')) return 'IMAGE';
  return 'DOC';
};

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
}) => {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !url) return null;

  const docType = getDocType(url);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 4));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.25));
  const handleReset = () => { setScale(1); setRotate(0); };
  const handleRotate = () => setRotate(r => r + 90);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/90 backdrop-blur-md animate-fade-in transition-all ${isFullscreen ? 'p-0 sm:p-0' : ''}`}>
      <div className={`bg-white flex flex-col overflow-hidden shadow-2xl border border-slate-200 transition-all ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl rounded-2xl max-h-[92vh]'}`}>
        
        {/* Modal Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/95 backdrop-blur z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200/50 flex items-center justify-center border border-slate-200">
              {docType === 'PDF' && <FileText className="w-5 h-5 text-red-600" />}
              {docType === 'IMAGE' && <ImageIcon className="w-5 h-5 text-blue-600" />}
              {docType === 'HTML' && <Code className="w-5 h-5 text-emerald-600" />}
              {docType === 'DOC' && <Eye className="w-5 h-5 text-slate-600" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate max-w-[200px] sm:max-w-md">{title}</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">{docType} Document</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-full transition-colors hidden sm:block">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <a
              href={url}
              download
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-full transition-colors"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar for Images */}
        {docType === 'IMAGE' && (
          <div className="bg-slate-900 border-b border-slate-800 flex items-center justify-center p-2 space-x-2 sm:space-x-4 shrink-0">
            <button onClick={handleZoomOut} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-mono text-slate-400 font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><ZoomIn className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-slate-700"></div>
            <button onClick={handleReset} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Fit to Screen"><RefreshCcw className="w-4 h-4" /></button>
            <button onClick={handleRotate} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Rotate 90°"><RotateCw className="w-4 h-4" /></button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className={`flex-1 bg-slate-950 overflow-auto relative ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'min-h-[50vh] h-[75vh]'}`}>
          {docType === 'IMAGE' ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4 sm:p-8">
              <img 
                src={url} 
                alt={title} 
                style={{ 
                  transform: `scale(${scale}) rotate(${rotate}deg)`, 
                  transformOrigin: 'center',
                  transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)' 
                }}
                className="max-w-full max-h-full object-contain rounded drop-shadow-2xl"
                draggable={false}
              />
            </div>
          ) : docType === 'PDF' ? (
            <div className="w-full h-full relative flex items-center justify-center bg-slate-800">
              <iframe 
                src={url.includes('#') || url.startsWith('data:') ? url : `${url}#view=Fit&toolbar=0&navpanes=0`} 
                title={title} 
                className="w-full h-full border-0 bg-white"
              />
              <div className="absolute bottom-4 right-4 sm:hidden">
                <a href={url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-xl text-sm font-bold flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Open Native Viewer
                </a>
              </div>
            </div>
          ) : docType === 'HTML' ? (
            <iframe 
              src={url} 
              title={title} 
              className="w-full h-full border-0 bg-white"
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white">
              <FileText className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-sm font-semibold mb-4 text-slate-300">Preview unavailable for this format</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Download / Open Document
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
