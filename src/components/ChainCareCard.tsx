'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Wrench, AlertTriangle, Droplet, Plus, Calendar } from 'lucide-react';
import { ChainLubeRecord } from '../types/fuel';
import { StorageService } from '../services/googleSheetsService';

interface ChainCareCardProps {
  latestOdometer: number;
  isOwnerMode: boolean;
  onLubeLogged?: () => void;
}

export const ChainCareCard: React.FC<ChainCareCardProps> = ({
  latestOdometer,
  isOwnerMode,
  onLubeLogged,
}) => {
  const [record, setRecord] = useState<ChainLubeRecord>(() => StorageService.getChainLube());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formOdo, setFormOdo] = useState<number>(latestOdometer || 2328);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formBrand, setFormBrand] = useState<string>('Motul Chain Lube');
  const [formSlack, setFormSlack] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState<string>('Cleaned & lubed; slack checked at 25 mm');

  useEffect(() => {
    setRecord(StorageService.getChainLube());
  }, []);

  useEffect(() => {
    if (latestOdometer && latestOdometer > formOdo) {
      setFormOdo(latestOdometer);
    }
  }, [latestOdometer]);

  const kmSinceLube = Math.max(0, (latestOdometer || record.lastLubeOdometer) - record.lastLubeOdometer);
  const remainingKm = Math.max(0, 500 - kmSinceLube);
  const progressPercent = Math.min(100, Math.round((kmSinceLube / 500) * 100));

  const isOverdue = kmSinceLube >= 500;
  const isDueSoon = kmSinceLube >= 400 && !isOverdue;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: ChainLubeRecord = {
      lastLubeOdometer: Number(formOdo),
      lastLubeDate: formDate,
      lubeBrand: formBrand,
      slackChecked: formSlack,
      notes: formNotes,
    };
    StorageService.saveChainLube(newRecord);
    setRecord(newRecord);
    setIsModalOpen(false);
    if (onLubeLogged) onLubeLogged();
  };

  return (
    <>
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOverdue
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : isDueSoon
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
                  500 km O-Ring Chain Care
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold font-mono bg-slate-100 text-slate-600">
                  Manual Spec
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Sealed chain lubrication & 20–30mm slack monitoring
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Lube</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-slate-500">
              Interval: <strong className="text-slate-900">{kmSinceLube} km</strong> / 500 km
            </span>
            <span className={`font-bold ${isOverdue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isOverdue
                ? `⚠️ Overdue by ${kmSinceLube - 500} km!`
                : `${remainingKm} km remaining`}
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isOverdue
                  ? 'bg-rose-500'
                  : isDueSoon
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Specifications & Log Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs font-mono">
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Last Lubed At</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-slate-800">{record.lastLubeOdometer.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-slate-400">km</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {record.lastLubeDate ? new Date(record.lastLubeDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recorded'}
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Lubricant Used</span>
            <span className="text-sm font-bold text-slate-800 block mt-0.5 truncate">{record.lubeBrand || 'Motul/OKS Spray'}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {record.slackChecked ? '✓ Slack 20–30mm Verified' : 'Slack check pending'}
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Factory Guideline</span>
            <span className="text-[11px] font-bold text-slate-700 block mt-0.5">Keep O-rings wet</span>
            <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
              Wash with diesel/SAE 90 (50:50). Never use petrol.
            </span>
          </div>
        </div>
      </div>

      {/* Modal for Logging Chain Lube */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Droplet className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-mono">Record Chain Lubrication</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 font-mono">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Odometer Reading (km)
                </label>
                <input
                  type="number"
                  required
                  value={formOdo}
                  onChange={(e) => setFormOdo(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 2640"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Service
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lube Product
                </label>
                <select
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                >
                  <option value="Motul Chain Lube">Motul Chain Lube</option>
                  <option value="OKS Chain Lube Spray">OKS Chain Lube Spray (Bajaj Rec.)</option>
                  <option value="SAE 90 Gear Oil">SAE 90 Gear Oil</option>
                  <option value="Wurth High Performance Lube">Wurth High Performance Lube</option>
                  <option value="Other">Other Lube Spray</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="slackCheck"
                  checked={formSlack}
                  onChange={(e) => setFormSlack(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="slackCheck" className="text-xs text-slate-700">
                  Verified chain slackness is within <strong>20–30 mm</strong>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. Cleaned with brush before spray"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Save Lube Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
