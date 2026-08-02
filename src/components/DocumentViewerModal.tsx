'use client';

import React from 'react';
import { X, ExternalLink, Download, FileText, Image as ImageIcon, Code, Eye } from 'lucide-react';

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
  if (!isOpen || !url) return null;

  const docType = getDocType(url);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              {docType === 'PDF' && <FileText className="w-4 h-4 text-red-600" />}
              {docType === 'IMAGE' && <ImageIcon className="w-4 h-4 text-blue-600" />}
              {docType === 'HTML' && <Code className="w-4 h-4 text-emerald-600" />}
              {docType === 'DOC' && <Eye className="w-4 h-4 text-slate-600" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate max-w-[200px] sm:max-w-md">{title}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Format: {docType}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open External</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 bg-slate-950/90 overflow-auto p-2 sm:p-4 flex items-center justify-center min-h-[50vh] max-h-[75vh]">
          {docType === 'IMAGE' ? (
            <img 
              src={url} 
              alt={title} 
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg border border-slate-800"
            />
          ) : docType === 'PDF' ? (
            <iframe 
              src={url} 
              title={title} 
              className="w-full h-[70vh] rounded-xl bg-white border border-slate-800"
            />
          ) : docType === 'HTML' ? (
            <iframe 
              src={url} 
              title={title} 
              className="w-full h-[70vh] rounded-xl bg-white border border-slate-800"
            />
          ) : (
            <div className="text-center p-8 text-white">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold mb-2">Preview unavailable for this format</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-xs hover:bg-blue-700 transition-colors"
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
