import React, { useState } from 'react';
import { X, Calendar, IndianRupee, Tag, Check, Image as ImageIcon, Upload, ShoppingBag } from 'lucide-react';
import { AnimatedUploadButton } from './AnimatedUploadButton';
import { AccessoryGear } from '../types/fuel';

interface AddAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<AccessoryGear, 'id'>, file?: File) => void;
}

export const AddAccessoryModal: React.FC<AddAccessoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [datePurchased, setDatePurchased] = useState(new Date().toISOString().split('T')[0]);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Gear');
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      datePurchased,
      itemName,
      category,
      brand,
      cost: Number(cost),
      notes,
    }, file || undefined);
    onClose();
    // reset
    setFile(null);
    setItemName('');
    setBrand('');
    setCost('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Add Accessory or Gear</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={datePurchased}
                onChange={(e) => setDatePurchased(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              >
                <option value="Gear">Riding Gear (Helmet, Jacket, etc.)</option>
                <option value="Performance">Performance Part</option>
                <option value="Cosmetic">Cosmetic Accessory</option>
                <option value="Luggage">Luggage / Mount</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. MT Thunder 3 Helmet"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                placeholder="e.g. MT Helmets"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Cost (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Attach Invoice / Bill / Document</label>
            <div className="mt-1 bg-slate-50 border-2 border-slate-300 border-dashed rounded-xl pt-6 pb-8">
              <AnimatedUploadButton 
                onFileSelect={setFile} 
                accept="image/png,image/jpeg,image/jpg,application/pdf,text/html,.pdf,.png,.jpg,.jpeg,.html,.htm"
                selectedFileName={file ? file.name : null} 
              />
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded">PDF</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded">PNG / JPG</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded">HTML</span>
                <span className="text-xs text-slate-400 font-mono ml-1">up to 10MB</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details about the purchase?"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none h-20"
            />
          </div>

          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
