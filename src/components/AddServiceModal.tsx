import React, { useState } from 'react';
import { X, Upload, Wrench } from 'lucide-react';
import { ServiceLog } from '../types/fuel';
import { AnimatedUploadButton } from './AnimatedUploadButton';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<ServiceLog, 'id'>, file?: File, id?: string) => void;
  latestOdometer: number;
  editData?: ServiceLog | null;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  latestOdometer,
  editData,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(latestOdometer.toString());
  const [serviceType, setServiceType] = useState('Routine Service');
  const [serviceCenter, setServiceCenter] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  React.useEffect(() => {
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
  }, [editData, isOpen, latestOdometer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      odometer: Number(odometer),
      serviceType,
      serviceCenter,
      totalCost: Number(totalCost),
      notes,
      documentUrl: editData?.documentUrl,
    }, file || undefined, editData?.id);
    onClose();
    // reset
    setFile(null);
    setTotalCost('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">{editData ? 'Edit Service Log' : 'Log Service'}</h2>
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Odometer (km)</label>
              <input
                type="number"
                required
                min={0}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="Routine Service">Routine Service</option>
              <option value="Oil Change">Oil Change</option>
              <option value="Chain Maintenance">Chain Maintenance</option>
              <option value="Tyre Replacement">Tyre Replacement</option>
              <option value="Breakpad Replacement">Breakpad Replacement</option>
              <option value="Repair">Repair</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Service Center</label>
              <input
                type="text"
                placeholder="e.g. Bajaj Auto"
                value={serviceCenter}
                onChange={(e) => setServiceCenter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Attach Bill / Invoice / Document</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was fixed or changed?"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-20"
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
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Save Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
