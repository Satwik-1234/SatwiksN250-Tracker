'use client';

import React, { useState, useMemo } from 'react';
import { ServiceLog } from '@/types/fuel';
import { 
  Trash2, 
  Pencil, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  Clock, 
  Search, 
  X, 
  CalendarDays,
  Sparkles,
  Droplet,
  ChevronDown
} from 'lucide-react';
import { AnimatedActionButton } from '@/components/ui/AnimatedActionButton';
import { DocumentViewerModal, getDocType } from '@/components/modals/DocumentViewerModal';
import { WarrantyGuardianCard } from '@/components/cards/WarrantyGuardianCard';
import { N250_MAINTENANCE_SCHEDULE, getServiceWindow, getWarrantySummary } from '@/lib/maintenance';

interface ServiceLogsViewProps {
  services: ServiceLog[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
  onEditService?: (service: ServiceLog) => void;
  onDeleteService: (id: string) => void;
  latestOdometer?: number;
}

export const ServiceLogsView: React.FC<ServiceLogsViewProps> = ({ 
  services = [], 
  isOwnerMode, 
  onOpenAddModal, 
  onEditService, 
  onDeleteService,
  latestOdometer = 4180,
}) => {
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'schedule'>('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'docs' | 'routine' | 'wash'>('all');

  const totalSpent = useMemo(() => services.reduce((sum, s) => sum + (Number(s.totalCost) || 0), 0), [services]);
  const avgCost = services.length > 0 ? Math.round(totalSpent / services.length) : 0;
  const maxOdometer = Math.max(
    latestOdometer || 0,
    services.length > 0 ? Math.max(...services.map(s => Number(s.odometer) || 0)) : 0
  );

  const isIntervalCompleted = (km: number) =>
    services.some((s) => Math.abs(Number(s.odometer) - km) <= 1500) || maxOdometer >= km + 500;
  const currentIntervalId =
    N250_MAINTENANCE_SCHEDULE.find((i) => !isIntervalCompleted(i.km))?.id ?? null;
  const [expandedIntervalId, setExpandedIntervalId] = useState<number | null>(currentIntervalId);
  const serviceWindow = getServiceWindow(maxOdometer);
  const warranty = getWarrantySummary(maxOdometer);

  // Stats for filter badges
  const withDocsCount = useMemo(() => services.filter(s => Boolean(s.documentUrl)).length, [services]);
  const routineCount = useMemo(() => services.filter(s => 
    s.serviceType.toLowerCase().includes('routine') || 
    s.serviceType.toLowerCase().includes('service')
  ).length, [services]);
  const washCount = useMemo(() => services.filter(s => 
    (s.serviceCenter || '').toLowerCase().includes('wash') || 
    (s.notes || '').toLowerCase().includes('wash')
  ).length, [services]);

  const filteredServices = useMemo(() => {
    let list = services;

    // Type filter chip
    if (filterType === 'docs') {
      list = list.filter(s => Boolean(s.documentUrl));
    } else if (filterType === 'routine') {
      list = list.filter(s => 
        s.serviceType.toLowerCase().includes('routine') || 
        s.serviceType.toLowerCase().includes('service')
      );
    } else if (filterType === 'wash') {
      list = list.filter(s => 
        (s.serviceCenter || '').toLowerCase().includes('wash') || 
        (s.notes || '').toLowerCase().includes('wash')
      );
    }

    // Text search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        [
          s.serviceType,
          s.serviceCenter,
          s.notes,
          String(s.odometer || ''),
          String(s.totalCost || ''),
          s.date ? s.date.split('T')[0] : '',
        ].some((field) => (field || '').toLowerCase().includes(q))
      );
    }

    return list;
  }, [services, filterType, searchQuery]);

  const subTabs = [
    { key: 'records', label: 'Service Records & Invoices', count: services.length, icon: FileText, iconColor: 'text-blue-600' },
    { key: 'schedule', label: 'Bajaj OEM Schedule & Warranty Matrix', count: N250_MAINTENANCE_SCHEDULE.length, icon: Clock, iconColor: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── SECTION 1: MASTER PAGE HEADER ── */}
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <span className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/80 flex items-center justify-center shrink-0">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  Service &amp; Maintenance Passport
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-mono border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-mono">
                Official Bajaj maintenance ledger, 5-year warranty guardian, and 500 km chain care.
              </p>
            </div>
          </div>

          <AnimatedActionButton label="Add Service Record" onClick={onOpenAddModal} />
        </div>
      </div>

      {/* ── SECTION 2: TOP EXECUTIVE STRIP (3 quick metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Total Maintenance Cost */}
        <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            <span>Total Maintenance Cost</span>
            <span className="text-blue-600 font-bold">ALL TIME</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Avg ₹{avgCost} across {services.length} records
          </p>
        </div>

        {/* Card 2: Warranty Health */}
        <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            <span>Warranty Health</span>
            <span className={`font-bold ${warranty.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>5 YRS</span>
          </div>
          <div className={`text-2xl font-black font-mono mt-1 ${warranty.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {warranty.isActive ? 'Active' : 'Expired'} <span className="text-xs font-normal text-slate-400">/ 5 Yrs</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Valid until {warranty.validUntil} · {warranty.freeServicesRemaining} free service{warranty.freeServicesRemaining === 1 ? '' : 's'} left
          </p>
        </div>

        {/* Card 3: Next Due Service */}
        <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            <span>Next Due Service</span>
            <span className={`font-bold ${serviceWindow.isDue ? 'text-amber-600' : 'text-blue-600'}`}>
              {serviceWindow.isDue ? 'DUE' : 'SCHEDULED'}
            </span>
          </div>
          <div className={`text-2xl font-black font-mono mt-1 ${serviceWindow.isDue ? 'text-amber-600' : 'text-slate-900'}`}>
            {serviceWindow.kmRemaining.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">km left</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {serviceWindow.intervalName} · target {serviceWindow.nextTargetKm.toLocaleString('en-IN')} km
          </p>
        </div>
      </div>

      {/* ── SECTION 3: ELEGANT SEGMENTED CONTROLLER (Sub-Tabs) ── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-full sm:w-fit overflow-x-auto shadow-xs">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as typeof activeSubTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                : 'text-slate-500 hover:text-slate-900 border border-transparent'
            }`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${tab.iconColor}`} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                activeSubTab === tab.key ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: INTERACTIVE BILL & INVOICE GALLERY ── */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'records' && (
        <div className="space-y-5">
          {/* Dedicated Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoice number, workshop, parts, odo, notes…"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none font-mono transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  All ({services.length})
                </button>
                <button
                  onClick={() => setFilterType('docs')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'docs'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  With Invoices ({withDocsCount})
                </button>
                <button
                  onClick={() => setFilterType('routine')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'routine'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Routine Services ({routineCount})
                </button>
                <button
                  onClick={() => setFilterType('wash')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'wash'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                  }`}
                >
                  <Droplet className="w-3 h-3" />
                  Washes ({washCount})
                </button>
              </div>
            </div>
          </div>

          {/* Service Invoices Card Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="mx-auto w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-mono">No matching records found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono">
                Try modifying your search query or reset filter chips.
              </p>
              {(searchQuery || filterType !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                  className="mt-3.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono rounded-xl transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => {
                const docType = getDocType(service.documentUrl);
                const isRoutine = service.serviceType.toLowerCase().includes('routine') || service.serviceType.toLowerCase().includes('service');
                const isWash = (service.serviceCenter || '').toLowerCase().includes('wash') || (service.notes || '').toLowerCase().includes('wash');

                return (
                  <div 
                    key={service.id} 
                    className="bg-white rounded-3xl p-5 border border-slate-200/85 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Top Decorative Category Accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isRoutine ? 'bg-blue-600' : isWash ? 'bg-purple-500' : 'bg-slate-400'
                    }`} />

                    <div>
                      {/* Date & Odometer Header */}
                      <div className="flex items-center justify-between pt-1 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded-md border uppercase ${
                            isRoutine 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : isWash
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {service.serviceType}
                          </span>
                        </div>

                        <span className="text-xs font-mono font-bold text-slate-700">
                          {(service.odometer || 0).toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">km</span>
                        </span>
                      </div>

                      {/* Workshop & Service Title */}
                      <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                        {service.serviceCenter || 'Bajaj Authorized Centre'}
                      </h3>
                      
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {(() => {
                          if (!service.date) return '—';
                          try {
                            const d = new Date(service.date);
                            return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                          } catch {
                            return '—';
                          }
                        })()}
                      </p>

                      {/* Notes / Details */}
                      {service.notes && (
                        <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs text-slate-600 font-sans leading-relaxed">
                          {service.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Pricing & Document Preview Action */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">Total Cost</span>
                        <div className="text-lg font-black text-slate-900 font-mono">
                          ₹{(service.totalCost || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {service.documentUrl ? (
                          <button
                            onClick={() => setViewingDoc({ 
                              title: `${service.serviceType} Bill (${service.date ? service.date.split('T')[0] : ''})`, 
                              url: service.documentUrl! 
                            })}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            {docType === 'PDF' ? <FileText className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                            <span>View Bill</span>
                            <Eye className="w-3 h-3 text-blue-500" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">
                            No digital receipt
                          </span>
                        )}

                        {isOwnerMode && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEditService && (
                              <button
                                onClick={() => onEditService(service)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteService(service.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: BAJAJ OEM SCHEDULE & WARRANTY MATRIX ── */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-6">
          {/* Warranty Guardian lives inside the Schedule tab */}
          <div className="max-w-4xl mx-auto w-full">
            <WarrantyGuardianCard services={services} latestOdometer={maxOdometer} />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Bajaj OEM Schedule &amp; Warranty Matrix (16 Intervals)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Official Bajaj Auto maintenance roadmap up to 75,000 km / 5 Years
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl w-fit">
                Current Odo: {maxOdometer.toLocaleString('en-IN')} km
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {N250_MAINTENANCE_SCHEDULE.map((interval) => {
                const isCompleted = isIntervalCompleted(interval.km);
                const isCurrentTarget = interval.id === currentIntervalId;
                const isExpanded = expandedIntervalId === interval.id;
                const upcomingKm = Math.max(0, interval.km - maxOdometer);

                return (
                  <div 
                    key={interval.id}
                    onClick={() => setExpandedIntervalId(isExpanded ? null : interval.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer select-none ${
                      isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : isCurrentTarget
                        ? 'bg-amber-50/70 border-amber-300 shadow-sm ring-2 ring-amber-400/20'
                        : 'bg-slate-50/70 border-slate-200/70 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{interval.id}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCurrentTarget
                            ? 'bg-amber-100 text-amber-800 font-black'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isCompleted ? 'COMPLETED' : isCurrentTarget ? 'UP NEXT' : 'SCHEDULED'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 font-mono">
                        {interval.name}
                      </h4>
                      <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                        {interval.range}
                      </p>

                      {/* Service checklist — expand/collapse */}
                      <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <p className="text-[11px] text-slate-600 font-sans leading-relaxed pb-0.5">
                            {interval.tasks}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{interval.km.toLocaleString('en-IN')} km mark</span>
                      <span className={`font-bold flex items-center gap-1 ${
                        isCompleted ? 'text-emerald-700' : isCurrentTarget ? 'text-amber-700' : 'text-slate-400'
                      }`}>
                        {isCompleted ? '✅ Completed' : isCurrentTarget ? `⏳ Upcoming in ${upcomingKm.toLocaleString('en-IN')} km` : '🔒 Scheduled'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENT VIEWER MODAL ── */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setViewingDoc(null)}
          url={viewingDoc.url}
          title={viewingDoc.title}
        />
      )}
    </div>
  );
};
