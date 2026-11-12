'use client';

import React, { useState } from 'react';
import { ServiceLog } from '@/types/fuel';
import { AnimatedUploadButton } from '@/components/ui/AnimatedUploadButton';
import { ModalSheet, SheetField, ChipSelect, sheetInput } from '@/components/modals/sheet';
import { checklistFor } from '@/lib/manualChecklist';
import { N250_MAINTENANCE_SCHEDULE, serviceNumberForOdometer } from '@/lib/maintenance';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<ServiceLog, 'id'>, file?: File, id?: string) => void;
  latestOdometer: number;
  editData?: ServiceLog | null;
  /** Called with the console lamps to restart, for the items ticked from the manual checklist. */
  onApplyChecklist?: (taskIds: string[], date: string, odometer: number) => void;
}

const SERVICE_TYPES = [
  'Routine Service',
  'Oil Change',
  'Chain Maintenance',
  'Tyre Replacement',
  'Brake Pads',
  'Wash',
  'Repair',
  'Other',
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({ isOpen, onClose, onSave, latestOdometer, editData, onApplyChecklist }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(latestOdometer.toString());
  const [serviceType, setServiceType] = useState('Routine Service');
  const [serviceCenter, setServiceCenter] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});

  React.useEffect(() => {
    queueMicrotask(() => {
      if (editData) {
        setDate(editData.date ? editData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setOdometer(editData.odometer.toString());
        setServiceType(editData.serviceType || 'Routine Service');
        setServiceCenter(editData.serviceCenter || '');
        setTotalCost(editData.totalCost ? editData.totalCost.toString() : '');
        setNotes(editData.notes || '');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setOdometer(latestOdometer > 0 ? latestOdometer.toString() : '');
        setServiceType('Routine Service');
        setServiceCenter('');
        setTotalCost('');
        setNotes('');
      }
      setFile(null);
      setOverrides({});
    });
  }, [editData, isOpen, latestOdometer]);

  // The manual's checklist for the service this odometer reading belongs to (new records only).
  const isPeriodic = /service/i.test(serviceType);
  const serviceNo = !editData && isPeriodic ? serviceNumberForOdometer(Number(odometer) || 0) : null;
  const items = serviceNo ? checklistFor(serviceNo) : [];
  const trackable = items.filter((i) => i.tasks.length > 0);
  const others = items.filter((i) => i.tasks.length === 0);
  const isChecked = (i: (typeof items)[number]) => overrides[i.rowId] ?? i.renews;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        date,
        odometer: Number(odometer),
        serviceType,
        serviceCenter,
        totalCost: Number(totalCost),
        notes,
        documentUrl: editData?.documentUrl,
      },
      file || undefined,
      editData?.id
    );
    if (onApplyChecklist && trackable.length > 0) {
      onApplyChecklist(trackable.filter(isChecked).flatMap((i) => i.tasks), date, Number(odometer));
    }
    onClose();
    setFile(null);
    setTotalCost('');
    setNotes('');
  };

  return (
    <ModalSheet open={isOpen} onClose={onClose} title={editData ? 'Edit service' : 'Log a service'} subtitle="Workshop visit, repair or wash">
      <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4 overflow-y-auto grow">
        <div className="grid grid-cols-2 gap-3">
          <SheetField label="Date">
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={sheetInput} />
          </SheetField>
          <SheetField label="Odometer" hint="km">
            <input
              type="number"
              required
              min={0}
              inputMode="numeric"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              className={`${sheetInput} tabular`}
            />
          </SheetField>
        </div>

        <SheetField label="What was done">
          <ChipSelect
            value={serviceType}
            onChange={setServiceType}
            options={SERVICE_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </SheetField>

        <div className="grid grid-cols-2 gap-3">
          <SheetField label="Workshop">
            <input
              type="text"
              placeholder="e.g. Bajaj Auto"
              value={serviceCenter}
              onChange={(e) => setServiceCenter(e.target.value)}
              className={sheetInput}
            />
          </SheetField>
          <SheetField label="Cost">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-ink-3">₹</span>
              <input
                type="number"
                required
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className={`${sheetInput} pl-7 tabular`}
              />
            </div>
          </SheetField>
        </div>

        {serviceNo && trackable.length > 0 && (
          <SheetField label={`From the manual: ${N250_MAINTENANCE_SCHEDULE.find((i) => i.id === serviceNo)?.name}`} hint="tick what was done">
            <div className="rounded-xl border border-[var(--color-border)] bg-surface divide-y divide-[var(--color-border)]">
              {trackable.map((i) => (
                <label key={i.rowId} className="flex items-start gap-3 px-3.5 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked(i)}
                    onChange={(e) => setOverrides((o) => ({ ...o, [i.rowId]: e.target.checked }))}
                    className="mt-1 w-4 h-4 accent-[var(--color-accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-ink-1">{i.name}</span>
                    <span className="block text-[12px] text-ink-2 first-letter:uppercase">{i.action}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[12px] text-ink-3 mt-1.5">Ticked items restart their lamp in the Console.</p>
            {others.length > 0 && (
              <details className="mt-2 text-[13px] text-ink-2">
                <summary className="cursor-pointer select-none">Also in the manual for this service ({others.length})</summary>
                <ul className="mt-1.5 space-y-0.5">
                  {others.map((i) => (
                    <li key={i.rowId}>
                      {i.name}: <span className="text-ink-3">{i.action}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </SheetField>
        )}

        <SheetField label="Bill or invoice" hint="PDF, photo or HTML · up to 10 MB">
          <AnimatedUploadButton
            onFileSelect={setFile}
            accept="image/png,image/jpeg,image/jpg,application/pdf,text/html,.pdf,.png,.jpg,.jpeg,.html,.htm"
            selectedFileName={file ? file.name : null}
          />
        </SheetField>

        <SheetField label="Notes" hint="optional">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was fixed or changed?"
            className={`${sheetInput} h-20 py-2.5 resize-none`}
          />
        </SheetField>

        <button type="submit" className="btn btn-accent w-full !h-12 text-[15px]">
          {editData ? 'Save changes' : 'Save service'}
        </button>
      </form>
    </ModalSheet>
  );
};
