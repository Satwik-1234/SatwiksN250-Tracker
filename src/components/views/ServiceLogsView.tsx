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
import { PageHeader, StatStrip, Chip, ChipRow, SearchInput, EmptyState } from '@/components/ui/Page';
import { DocumentViewerModal, getDocType } from '@/components/modals/DocumentViewerModal';
import { WarrantyGuardianCard } from '@/components/cards/WarrantyGuardianCard';
import { evaluateSchedule, serviceStatus, getWarrantySummary } from '@/lib/maintenance';
import { checklistFor } from '@/lib/manualChecklist';

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
  latestOdometer = 0,
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

  const scheduleRows = evaluateSchedule(maxOdometer, services);
  const status = serviceStatus(maxOdometer, services);
  const currentIntervalId = status.missed?.interval.id ?? status.next?.interval.id ?? null;
  const [expandedIntervalId, setExpandedIntervalId] = useState<number | null>(currentIntervalId);
  const warranty = getWarrantySummary(maxOdometer, undefined, services);

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
    { key: 'records', label: 'Records', count: services.length, icon: FileText, iconColor: 'text-blue-600' },
    { key: 'schedule', label: 'Schedule', count: 16, icon: Clock, iconColor: 'text-blue-600' },
  ];

  return (
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader
        title="Service"
        subtitle="Maintenance history, invoices and the Bajaj schedule."
        action={<AnimatedActionButton label="Add record" onClick={onOpenAddModal} />}
      />

      <StatStrip
        items={[
          {
            label: 'Next service',
            value: status.missed ? 'Not logged' : (status.kmLeft ?? 0).toLocaleString('en-IN'),
            unit: status.missed ? undefined : 'km left',
            hint: status.daysLeft !== null ? `${status.headline} · ${status.daysLeft} days left` : status.headline,
          },
          {
            label: 'Warranty',
            value: warranty.isActive ? 'Active' : 'Expired',
            hint: `Until ${warranty.validUntil} · ${warranty.freeServicesRemaining} free service${warranty.freeServicesRemaining === 1 ? '' : 's'} left`,
          },
          {
            label: 'Spent on maintenance',
            value: `₹${totalSpent.toLocaleString('en-IN')}`,
            hint: `${services.length} records · ₹${avgCost.toLocaleString('en-IN')} average`,
          },
        ]}
      />

      {/* Records / Schedule */}
      <div className="inline-flex p-1 bg-slate-200/60 rounded-xl" role="tablist">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeSubTab === tab.key}
            onClick={() => setActiveSubTab(tab.key as typeof activeSubTab)}
            className={`h-8 px-4 rounded-lg text-[13px] font-medium transition-colors ${
              activeSubTab === tab.key ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-2 hover:text-ink-1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'records' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search workshop, notes, odometer"
              className="md:w-80"
            />
            <ChipRow>
              <Chip active={filterType === 'all'} onClick={() => setFilterType('all')}>
                All {services.length}
              </Chip>
              <Chip active={filterType === 'routine'} onClick={() => setFilterType('routine')}>
                Services {routineCount}
              </Chip>
              <Chip active={filterType === 'wash'} onClick={() => setFilterType('wash')}>
                Washes {washCount}
              </Chip>
              <Chip active={filterType === 'docs'} onClick={() => setFilterType('docs')}>
                With invoice {withDocsCount}
              </Chip>
            </ChipRow>
          </div>

          {filteredServices.length === 0 ? (
            <EmptyState
              icon={Search}
              title={services.length === 0 ? 'No service records yet' : 'No records match'}
              body={
                services.length === 0
                  ? 'Add a service, wash or repair to start your maintenance history.'
                  : 'Try a different search or filter.'
              }
              action={
                searchQuery || filterType !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="card overflow-hidden divide-y divide-[var(--color-border)]">
              {filteredServices.map((service) => {
                const docType = getDocType(service.documentUrl);
                const dateLabel = (() => {
                  if (!service.date) return '';
                  const d = new Date(service.date);
                  return isNaN(d.getTime())
                    ? ''
                    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                })();

                return (
                  <li key={service.id} className="px-4 sm:px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-medium text-ink-1 truncate flex items-center gap-2">
                          <span className="truncate">{service.serviceCenter || 'Bajaj Authorized Centre'}</span>
                          {service.documentUrl && (
                            <span
                              className="shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded bg-info-bg text-info-fg text-[11px] font-medium"
                              title={docType === 'PDF' ? 'PDF invoice attached' : 'Photo attached'}
                            >
                              {docType === 'PDF' ? <FileText className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                              {docType === 'PDF' ? 'PDF' : 'Photo'}
                            </span>
                          )}
                        </h3>
                        <p className="text-[13px] text-ink-2 mt-0.5 tabular">
                          {[dateLabel, service.serviceType, `${(service.odometer || 0).toLocaleString('en-IN')} km`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <div className="text-[15px] font-semibold text-ink-1 tabular shrink-0">
                        ₹{(service.totalCost || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {service.notes && (
                      <p className="mt-2 text-[13px] text-ink-2 leading-relaxed max-w-2xl">{service.notes}</p>
                    )}

                    {(service.documentUrl || isOwnerMode) && (
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        {service.documentUrl ? (
                          <button
                            type="button"
                            onClick={() => setViewingDoc({
                              title: `${service.serviceType} Bill (${service.date ? service.date.split('T')[0] : ''})`,
                              url: service.documentUrl!
                            })}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-600 hover:text-blue-700"
                          >
                            {docType === 'PDF' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            View invoice
                          </button>
                        ) : (
                          <span />
                        )}

                        {isOwnerMode && (
                          <div className="flex items-center -mr-2">
                            {onEditService && (
                              <button
                                type="button"
                                onClick={() => onEditService(service)}
                                aria-label="Edit record"
                                title="Edit record"
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink-2 hover:bg-surface-2 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteService(service.id)}
                              aria-label="Delete record"
                              title="Delete record"
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-3 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
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

          <div className="bg-surface rounded-3xl border border-slate-200/85 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-base font-bold text-ink-1 tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Bajaj service schedule
                </h3>
                <p className="text-xs text-ink-2 mt-0.5">
                  16 services up to 75,000 km or 5 years. Tap one to see what gets done.
                </p>
              </div>
              <span className="text-xs font-bold text-ink-2 bg-surface-2 px-3 py-1 rounded-xl w-fit">
                Current Odo: {maxOdometer.toLocaleString('en-IN')} km
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {scheduleRows.map((row) => {
                const interval = row.interval;
                const isCompleted = row.state === 'done' || row.state === 'late';
                const isMissed = row.state === 'missed';
                const isCurrentTarget = status.next?.interval.id === interval.id;
                const isExpanded = expandedIntervalId === interval.id;
                const upcomingKm = Math.max(0, row.lo - maxOdometer);

                return (
                  <div 
                    key={interval.id}
                    onClick={() => setExpandedIntervalId(isExpanded ? null : interval.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer select-none ${
                      isCompleted
                        ? 'bg-blue-50/50 border-blue-200'
                        : isMissed
                        ? 'bg-red-50/70 border-red-400'
                        : isCurrentTarget
                        ? 'bg-red-50/70 border-red-300 shadow-sm ring-2 ring-red-400/20'
                        : 'bg-slate-50/70 border-slate-200/70 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-ink-3">
                          #{interval.id}
                        </span>
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-blue-100 text-blue-800'
                            : isMissed
                            ? 'bg-red-100 text-red-800 font-semibold'
                            : isCurrentTarget
                            ? 'bg-red-100 text-red-800 font-semibold'
                            : 'bg-slate-200 text-ink-2'
                        }`}>
                          {row.state === 'done' ? 'Done' : row.state === 'late' ? 'Done late' : isMissed ? 'Not logged' : isCurrentTarget ? (row.state === 'due' ? 'Due now' : 'Up next') : 'Later'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-ink-1">
                        {interval.name}
                      </h4>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        {`${row.lo.toLocaleString('en-IN')}–${row.hi.toLocaleString('en-IN')} km`}
                      </p>

                      {/* Service checklist — expand/collapse */}
                      <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <ul className="text-[11px] text-ink-2 leading-relaxed pb-0.5 space-y-0.5">
                            {checklistFor(interval.id).map((it) => (
                              <li key={it.rowId}>
                                <span className="text-ink-1 font-medium">{it.name}</span>: {it.action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                      <span className="text-ink-3">{interval.km.toLocaleString('en-IN')} km mark</span>
                      <span className={`font-bold flex items-center gap-1 ${
                        isCompleted ? 'text-blue-700' : isMissed || isCurrentTarget ? 'text-red-700' : 'text-ink-3'
                      }`}>
                        {isCompleted ? `Done at ${(row.record?.odometer || 0).toLocaleString('en-IN')} km` : isMissed ? 'Log it, or ask the dealer' : isCurrentTarget ? (row.state === 'due' ? 'Open now' : `In ${upcomingKm.toLocaleString('en-IN')} km`) : 'Scheduled'}
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
