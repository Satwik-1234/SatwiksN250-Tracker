import React, { useState } from 'react';
import { ServiceLog } from '../types/fuel';
import { Wrench, ExternalLink, Trash2, Pencil, FileText, Image as ImageIcon, Code, Eye, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { AnimatedActionButton } from './AnimatedActionButton';
import { DocumentViewerModal, getDocType } from './DocumentViewerModal';

interface ServiceLogsViewProps {
  services: ServiceLog[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
  onEditService?: (service: ServiceLog) => void;
  onDeleteService: (id: string) => void;
}

const N250_MAINTENANCE_SCHEDULE = [
  { id: 1, name: '1st Free Service', km: 750, range: '500 – 750 km', tasks: 'Engine oil 10W-50, Oil strainer, Chain slack' },
  { id: 2, name: '2nd Free Service', km: 5000, range: '4,500 – 5,000 km', tasks: 'Oil change, Air filter inspection, Fasteners' },
  { id: 3, name: '3rd Free Service', km: 10000, range: '9,500 – 10,000 km', tasks: 'Oil & Filter, Spark plugs, Valve clearance, Brake pads' },
  { id: 4, name: '4th Paid Service', km: 15000, range: '14,500 – 15,000 km', tasks: 'Coolant check, Fork oil, Chain sprocket, Full tune' },
];

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
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-mono tracking-tight">Service History & Maintenance</h2>
          <p className="text-sm text-slate-500 mt-1 font-mono">Official Bajaj maintenance ledger and invoice documents (PDF, PNG, JPEG, HTML).</p>
        </div>
        <AnimatedActionButton label="Add Service" onClick={onOpenAddModal} />
      </div>

      {/* ── SERVICE TELEMETRY SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Total Service Cost</span>
          <span className="text-xl font-black text-blue-600 font-mono mt-1 block">₹{totalSpent.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Service Records</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{services.length}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Avg Cost / Service</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">₹{avgCost.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Latest Service Odo</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{maxOdometer > 0 ? `${maxOdometer.toLocaleString('en-IN')} km` : '—'}</span>
        </div>
      </div>

      {/* ── SENIOR DEV FEATURE: OFFICIAL BAJAJ PULSAR N250 SERVICE SCHEDULE TRACKER ── */}
      <div className="bg-white rounded-3xl border border-slate-200/85 p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Pulsar N250 Factory Service Schedule
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Bajaj Authorized Standards
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {N250_MAINTENANCE_SCHEDULE.map((interval) => {
            const isCompleted = services.some(
              (s) => Math.abs(s.odometer - interval.km) <= 1500
            ) || (maxOdometer > interval.km + 500);

            const isCurrentTarget =
              !isCompleted &&
              maxOdometer <= interval.km + 500 &&
              (interval.id === 1 || maxOdometer >= (N250_MAINTENANCE_SCHEDULE[interval.id - 2]?.km || 0));

            return (
              <div
                key={interval.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                    : isCurrentTarget
                    ? 'bg-blue-50/60 border-blue-300 text-blue-950 shadow-xs ring-1 ring-blue-500/10'
                    : 'bg-slate-50/70 border-slate-200/70 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
                    {interval.name}
                  </span>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  ) : isCurrentTarget ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 font-mono">
                      <Clock className="w-3.5 h-3.5" /> Next Due
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">Upcoming</span>
                  )}
                </div>

                <p className="text-sm font-black font-mono tracking-tight">{interval.range}</p>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-sans">{interval.tasks}</p>
              </div>
            );
          })}
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
              <div key={service.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors duration-500"></div>
                
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 w-8 h-8 rounded-full border border-blue-100/50">
                          <Wrench className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 font-mono">
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
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                              title="Edit Service"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Delete this service log?')) onDeleteService(service.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {service.notes && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{service.notes}</p>
                    </div>
                  )}
                </div>

                {service.documentUrl && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {docType === 'PDF' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100/50 font-mono">
                          <FileText className="w-3 h-3" /> PDF Bill
                        </span>
                      )}
                      {docType === 'IMAGE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100/50 font-mono">
                          <ImageIcon className="w-3 h-3" /> Image Bill
                        </span>
                      )}
                      {docType === 'HTML' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 font-mono">
                          <Code className="w-3 h-3" /> HTML Bill
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setViewingDoc({ title: `${service.serviceType} Bill (${service.date.split('T')[0]})`, url: service.documentUrl! })}
                      className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200/80 cursor-pointer font-mono"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      View Bill
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
