import React from 'react';
import { ServiceLog } from '../types/fuel';
import { Wrench, ExternalLink, Trash2, Pencil, FileText, Image as ImageIcon, Code, Download } from 'lucide-react';

import { AnimatedActionButton } from './AnimatedActionButton';

interface ServiceLogsViewProps {
  services: ServiceLog[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
  onEditService?: (service: ServiceLog) => void;
  onDeleteService: (id: string) => void;
}

const getDocType = (url?: string) => {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('.pdf') || lower.includes('pdf')) return 'PDF';
  if (lower.includes('.html') || lower.includes('.htm') || lower.includes('html')) return 'HTML';
  if (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.webp') || lower.includes('image')) return 'IMAGE';
  return 'DOC';
};

export const ServiceLogsView: React.FC<ServiceLogsViewProps> = ({ services, isOwnerMode, onOpenAddModal, onEditService, onDeleteService }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Service History</h2>
          <p className="text-sm text-slate-500 mt-1">Keep track of your bike's maintenance, repairs, and service bills (PDF, PNG, JPEG, HTML).</p>
        </div>
        <AnimatedActionButton label="Add Service" onClick={onOpenAddModal} />
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No services logged yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Log your regular services, oil changes, and repairs along with billing details in PDF, Image, or HTML format.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const docType = getDocType(service.documentUrl);
            return (
              <div key={service.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{service.serviceType}</h3>
                      <p className="text-sm text-slate-500">{new Date(service.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700">
                        {service.odometer.toLocaleString('en-IN')} km
                      </span>
                      {isOwnerMode && (
                        <div className="flex items-center space-x-1">
                          {onEditService && (
                            <button
                              onClick={() => onEditService(service)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Service"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Delete this service log?')) onDeleteService(service.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {service.serviceCenter && (
                      <div className="text-sm">
                        <span className="text-slate-500">Center: </span>
                        <span className="font-medium text-slate-900">{service.serviceCenter}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-slate-500">Cost: </span>
                      <span className="font-bold text-slate-900 font-mono">₹{service.totalCost.toLocaleString('en-IN')}</span>
                    </div>
                    {service.notes && (
                      <div className="text-sm">
                        <span className="text-slate-500">Notes: </span>
                        <span className="text-slate-700">{service.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {service.documentUrl && (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {docType === 'PDF' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <FileText className="w-3 h-3" /> PDF Bill
                        </span>
                      )}
                      {docType === 'IMAGE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <ImageIcon className="w-3 h-3" /> Photo/Bill
                        </span>
                      )}
                      {docType === 'HTML' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Code className="w-3 h-3" /> HTML Bill
                        </span>
                      )}
                    </div>

                    <a
                      href={service.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      View Document
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
