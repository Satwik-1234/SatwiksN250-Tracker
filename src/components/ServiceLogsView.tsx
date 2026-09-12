import React, { useState } from 'react';
import { ServiceLog } from '../types/fuel';
import { Wrench, ExternalLink, Trash2, Pencil, FileText, Image as ImageIcon, Code, Eye } from 'lucide-react';
import { AnimatedActionButton } from './AnimatedActionButton';
import { DocumentViewerModal, getDocType } from './DocumentViewerModal';

interface ServiceLogsViewProps {
  services: ServiceLog[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
  onEditService?: (service: ServiceLog) => void;
  onDeleteService: (id: string) => void;
}

export const ServiceLogsView: React.FC<ServiceLogsViewProps> = ({ 
  services, 
  isOwnerMode, 
  onOpenAddModal, 
  onEditService, 
  onDeleteService 
}) => {
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);

  const totalSpent = services.reduce((sum, s) => sum + s.totalCost, 0);
  const avgCost = services.length > 0 ? Math.round(totalSpent / services.length) : 0;
  const maxOdometer = services.length > 0 ? Math.max(...services.map(s => s.odometer)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Service History</h2>
          <p className="text-sm text-slate-500 mt-1">Keep track of your bike&apos;s maintenance, repairs, and service bills (PDF, PNG, JPEG, HTML).</p>
        </div>
        <AnimatedActionButton label="Add Service" onClick={onOpenAddModal} />
      </div>

      {/* ── SERVICE TELEMETRY SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Service Cost</span>
          <span className="text-xl font-black text-blue-600 font-mono mt-1 block">₹{totalSpent.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Service Records</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{services.length}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg Cost / Service</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">₹{avgCost.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Latest Service Odo</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{maxOdometer > 0 ? `${maxOdometer.toLocaleString('en-IN')} km` : '—'}</span>
        </div>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const docType = getDocType(service.documentUrl);
            return (
              <div key={service.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors duration-500"></div>
                
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 w-8 h-8 rounded-full border border-blue-100/50">
                          <Wrench className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                          {new Date(service.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className="text-[11px] font-mono font-bold text-slate-500 tracking-tight">{service.odometer.toLocaleString('en-IN')} km</span>
                      </div>
                      
                      <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-1.5 leading-tight">{service.serviceType}</h3>
                      {service.serviceCenter && (
                        <p className="text-xs text-slate-500 font-medium">{service.serviceCenter}</p>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="font-mono text-xl font-black text-slate-900 mb-3 tracking-tight">₹{service.totalCost.toLocaleString('en-IN')}</div>
                      {isOwnerMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 rounded-full p-1 border border-slate-100">
                          {onEditService && (
                            <button
                              onClick={() => onEditService(service)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Edit Service"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Delete this service log?')) onDeleteService(service.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {service.notes && (
                    <div className="mt-5 pt-4 border-t border-slate-50/80">
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{service.notes}</p>
                    </div>
                  )}
                </div>

                {service.documentUrl && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {docType === 'PDF' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100/50">
                          <FileText className="w-3 h-3" /> PDF Bill
                        </span>
                      )}
                      {docType === 'IMAGE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100/50">
                          <ImageIcon className="w-3 h-3" /> Image Bill
                        </span>
                      )}
                      {docType === 'HTML' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                          <Code className="w-3 h-3" /> HTML Bill
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setViewingDoc({ title: `${service.serviceType} Bill (${service.date.split('T')[0]})`, url: service.documentUrl! })}
                      className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      View
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={viewingDoc.title}
          url={viewingDoc.url}
        />
      )}
    </div>
  );
};
