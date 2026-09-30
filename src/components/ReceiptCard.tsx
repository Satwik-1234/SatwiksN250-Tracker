'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Printer, Fuel, Wrench, ShoppingBag } from 'lucide-react';
import { FuelLog, ServiceLog, AccessoryGear } from '../types/fuel';
import { formatDay } from '../utils/date';
import './ReceiptCard.css';

interface ReceiptCardProps {
  logs: FuelLog[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
  period: string;
}

/** Stable, content-derived reference instead of a new random number per render. */
function summaryId(period: string, grandTotal: number, count: number): string {
  const seed = `${period}|${grandTotal.toFixed(2)}|${count}`;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return String(h % 10000).padStart(4, '0');
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  logs,
  services,
  accessories,
  period,
}) => {
  // The button's label, title and the printer display all said "print", but the
  // handler only replayed a CSS animation - there was no window.print() anywhere
  // in the app, so a user who wanted a paper or PDF copy got nothing. The
  // animation now plays *and* the print dialog opens. `issuedAt` is captured
  // when the receipt is shown rather than recomputed on every render.
  const [issuedAt] = useState(() => new Date());

  type ReceiptItem = {
    id: string;
    key: string;
    sortTs: number;
    dateLabel: string;
    name: string;
    qty?: string;
    cost: number;
    type: 'fuel' | 'service' | 'acc';
  };

  const items: ReceiptItem[] = useMemo(() => {
    const all: ReceiptItem[] = [
      ...logs.map((l) => ({
        id: l.id,
        key: `fuel-${l.id}`,
        sortTs: new Date(l.date).getTime(),
        dateLabel: formatDay(l.date),
        name: 'Petrol',
        qty: `${l.fuelAmount}L`,
        cost: l.totalCost,
        type: 'fuel' as const,
      })),
      ...services.map((s) => ({
        id: s.id,
        key: `svc-${s.id}`,
        sortTs: new Date(s.date).getTime(),
        dateLabel: formatDay(s.date),
        name: s.serviceType,
        cost: s.totalCost,
        type: 'service' as const,
      })),
      ...accessories.map((a) => ({
        id: a.id,
        key: `acc-${a.id}`,
        sortTs: new Date(a.datePurchased).getTime(),
        dateLabel: formatDay(a.datePurchased),
        name: a.itemName,
        cost: a.cost,
        type: 'acc' as const,
      })),
    ];
    // Sort on the timestamp, never on the formatted label - "12 Sep" sorts
    // before "2 Oct" if compared as a string.
    return all.sort((a, b) => a.sortTs - b.sortTs);
  }, [logs, services, accessories]);

  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.cost, 0), [items]);
  const ref = summaryId(period, grandTotal, items.length);

  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') window.print();
  }, []);

  return (
    <div className="wrapper printing">
      <div className="printer" />
      <div className="printer-display">
        <span className="printer-message">Ready to print</span>
      </div>
      <button
        type="button"
        className="print-button"
        onClick={handlePrint}
        aria-label={`Print receipt for ${period}`}
        title={`Print receipt for ${period}`}
      >
        <Printer className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </button>

      <div className="receipt-wrapper">
        <div className="receipt">
          <div className="receipt-header">
            <div>
              N250 Telemetry <br />
              Satwik&rsquo;s Garage <br />
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
            Summary ID: #N250-{ref} <br />
            Period: {period} <br />
            {issuedAt.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {issuedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          {items.length === 0 ? (
            <div className="receipt-message">No entries for this period.</div>
          ) : (
            <table className="receipt-table">
              <tbody>
                <tr>
                  <th className="text-left">Item</th>
                  <th className="text-right">Amt</th>
                </tr>
                {items.map((item) => (
                  <tr key={item.key}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-600">{item.dateLabel}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.type === 'fuel' && <Fuel className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
                          {item.type === 'service' && <Wrench className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
                          {item.type === 'acc' && <ShoppingBag className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
                          <span className="truncate max-w-[120px]">
                            {item.name} {item.qty ? `(${item.qty})` : ''}
                          </span>
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
                <tr className="receipt-total">
                  <td>Grand Total</td>
                  <td>{grandTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          )}
          <div className="receipt-message">Ride Safe!</div>
        </div>
      </div>
    </div>
  );
};
