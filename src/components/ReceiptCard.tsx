'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Fuel, Wrench, ShoppingBag, RotateCcw } from 'lucide-react';
import { FuelLog, ServiceLog, AccessoryGear } from '../types/fuel';
import './ReceiptCard.css';

interface ReceiptCardProps {
  logs: FuelLog[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
  period: string;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  logs,
  services,
  accessories,
  period,
}) => {
  const [isPrinting, setIsPrinting] = useState(true);

  // Retrigger animation when the period changes
  useEffect(() => {
    setIsPrinting(false);
    // short delay to let the DOM remove the class, then re-add
    const t = setTimeout(() => setIsPrinting(true), 100);
    return () => clearTimeout(t);
  }, [period, logs, services, accessories]);

  const handlePrint = () => {
    setIsPrinting(false);
    setTimeout(() => setIsPrinting(true), 100);
  };

  type ReceiptItem = { id: string; date: Date; name: string; qty?: string; cost: number; type: 'fuel' | 'service' | 'acc' };
  
  const items: ReceiptItem[] = [
    ...logs.map(l => ({ id: l.id, date: new Date(l.date), name: 'Petrol', qty: `${l.liters}L`, cost: l.totalCost, type: 'fuel' as const })),
    ...services.map(s => ({ id: s.id, date: new Date(s.date), name: s.type, cost: s.totalCost, type: 'service' as const })),
    ...accessories.map(a => ({ id: a.id, date: new Date(a.date), name: a.item, cost: a.cost, type: 'acc' as const }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const grandTotal = items.reduce((sum, item) => sum + item.cost, 0);
  
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`wrapper ${isPrinting ? 'printing' : ''}`}>
      <div className="printer" />
      <div className="printer-display">
        <span className="printer-message">Click to print</span>
        <div className="letter-wrapper">
          <span className="letter">P</span>
          <span className="letter">r</span>
          <span className="letter">i</span>
          <span className="letter">n</span>
          <span className="letter">t</span>
          <span className="letter">i</span>
          <span className="letter">n</span>
          <span className="letter">g</span>
          <span className="letter">.</span>
          <span className="letter">.</span>
          <span className="letter">.</span>
        </div>
      </div>
      <button className="print-button" onClick={handlePrint} aria-label="Print Receipt" title="Re-print Receipt">
        <RotateCcw className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
      </button>
      
      <div className="receipt-wrapper">
        <div className="receipt">
          <div className="receipt-header">
            <div>
              N250 Telemetry <br />
              Satwik's Garage <br />
            </div>
            <div className="logo relative w-20 h-12 shrink-0 flex items-center justify-center opacity-90 transform -rotate-6">
              {/* Using the standard img tag to ensure it works nicely in the receipt layout without next/image config issues */}
              <img 
                src="/n250-profile.png" 
                alt="Pulsar N250" 
                className="w-full h-full object-contain filter drop-shadow-sm grayscale contrast-125"
              />
            </div>
          </div>
          <div className="receipt-subheader">
            Summary ID: #N250-{Math.floor(Math.random() * 10000)} <br />
            Period: {period} <br />
            {currentDate} - {currentTime}
          </div>
          <table className="receipt-table">
            <tbody>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-right">Amt</th>
              </tr>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-600">
                        {item.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {item.type === 'fuel' && <Fuel className="w-3.5 h-3.5 text-slate-400" />}
                        {item.type === 'service' && <Wrench className="w-3.5 h-3.5 text-slate-400" />}
                        {item.type === 'acc' && <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="truncate max-w-[120px]">{item.name} {item.qty ? `(${item.qty})` : ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="align-bottom text-right">{item.cost.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              
              <tr className="receipt-subtotal">
                <td>Subtotal</td>
                <td>{grandTotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="receipt-tax">
                <td>Taxes/Fees</td>
                <td>0</td>
              </tr>
              <tr className="receipt-total">
                <td>Grand Total</td>
                <td>{grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          <div className="receipt-message">Ride Safe! 🏁</div>
        </div>
      </div>
    </div>
  );
};
