'use client';

import React, { useState } from 'react';
import { ServiceLog } from '@/types/fuel';
import { AnimatedUploadButton } from '@/components/ui/AnimatedUploadButton';
import { ModalSheet, SheetField, ChipSelect, sheetInput } from '@/components/modals/sheet';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<ServiceLog, 'id'>, file?: File, id?: string) => void;
  latestOdometer: number;
  editData?: ServiceLog | null;
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

export const AddServiceModal: React.FC<AddServiceModalProps> = ({ isOpen, onClose, onSave, latestOdometer, editData }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(latestOdometer.toString());
  const [serviceType, setServiceType] = useState('Routine Service');
  const [serviceCenter, setServiceCenter] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

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
    });
  }, [editData, isOpen, latestOdometer]);

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
