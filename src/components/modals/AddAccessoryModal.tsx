'use client';

import React, { useState } from 'react';
import { AnimatedUploadButton } from '@/components/ui/AnimatedUploadButton';
import { AccessoryGear } from '@/types/fuel';
import { ModalSheet, SheetField, ChipSelect, sheetInput } from '@/components/modals/sheet';

interface AddAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<AccessoryGear, 'id'>, file?: File, id?: string) => void;
  editData?: AccessoryGear | null;
}

const CATEGORIES = [
  { value: 'Gear', label: 'Riding gear' },
  { value: 'Performance', label: 'Performance' },
  { value: 'Cosmetic', label: 'Cosmetic' },
  { value: 'Luggage', label: 'Luggage' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Other', label: 'Other' },
];

export const AddAccessoryModal: React.FC<AddAccessoryModalProps> = ({ isOpen, onClose, onSave, editData }) => {
  const [datePurchased, setDatePurchased] = useState(new Date().toISOString().split('T')[0]);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Gear');
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  React.useEffect(() => {
    queueMicrotask(() => {
      if (editData) {
        setDatePurchased(editData.datePurchased ? editData.datePurchased.split('T')[0] : new Date().toISOString().split('T')[0]);
        setItemName(editData.itemName || '');
        setCategory(editData.category || 'Gear');
        setBrand(editData.brand || '');
        setCost(editData.cost ? editData.cost.toString() : '');
        setNotes(editData.notes || '');
      } else {
        setDatePurchased(new Date().toISOString().split('T')[0]);
        setItemName('');
        setCategory('Gear');
        setBrand('');
        setCost('');
        setNotes('');
      }
      setFile(null);
    });
  }, [editData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        datePurchased,
        itemName,
        category,
        brand,
        cost: Number(cost),
        notes,
        photoUrl: editData?.photoUrl,
      },
      file || undefined,
      editData?.id
    );
    onClose();
    setFile(null);
    setItemName('');
    setBrand('');
    setCost('');
    setNotes('');
  };

  return (
    <ModalSheet open={isOpen} onClose={onClose} title={editData ? 'Edit item' : 'Add gear'} subtitle="Accessory, part or riding gear">
      <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4 overflow-y-auto grow">
        <SheetField label="Item">
          <input
            type="text"
            required
            placeholder="e.g. MT Thunder 3 helmet"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className={sheetInput}
          />
        </SheetField>

        <SheetField label="Category">
          <ChipSelect value={category} onChange={setCategory} options={CATEGORIES} />
        </SheetField>

        <div className="grid grid-cols-2 gap-3">
          <SheetField label="Brand">
            <input
              type="text"
              placeholder="e.g. MT Helmets"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
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
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className={`${sheetInput} pl-7 tabular`}
              />
            </div>
          </SheetField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SheetField label="Bought on">
            <input
              type="date"
              required
              value={datePurchased}
              onChange={(e) => setDatePurchased(e.target.value)}
              className={sheetInput}
            />
          </SheetField>
        </div>

        <SheetField label="Photo or bill" hint="PDF, photo or HTML · up to 10 MB">
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
            placeholder="Any details about the purchase?"
            className={`${sheetInput} h-20 py-2.5 resize-none`}
          />
        </SheetField>

        <button type="submit" className="btn btn-accent w-full !h-12 text-[15px]">
          {editData ? 'Save changes' : 'Save item'}
        </button>
      </form>
    </ModalSheet>
  );
};
