'use client';

import React, { useState, useMemo } from 'react';
import { ReceiptCard } from './ReceiptCard';
import { RoadCard } from './RoadCard';
import { FuelLog, ServiceLog, AccessoryGear } from '../types/fuel';
import { Calendar, Filter, Receipt } from 'lucide-react';

interface BillingViewProps {
  logs: FuelLog[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
}

export const BillingView: React.FC<BillingViewProps> = ({ logs, services, accessories }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Generate available years from the data + current year
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    
    logs.forEach(log => years.add(new Date(log.date).getFullYear()));
    services.forEach(svc => years.add(new Date(svc.date).getFullYear()));
    accessories.forEach(acc => years.add(new Date(acc.date).getFullYear()));
    
    return Array.from(years).sort((a, b) => b - a);
  }, [logs, services, accessories]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter items for the selected month/year
  const { filteredLogs, filteredServices, filteredAccessories } = useMemo(() => {
    return {
      filteredLogs: logs.filter(log => {
        const d = new Date(log.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }),
      filteredServices: services.filter(svc => {
        const d = new Date(svc.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }),
      filteredAccessories: accessories.filter(acc => {
        const d = new Date(acc.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
    };
  }, [logs, services, accessories, selectedMonth, selectedYear]);

  const hasData = filteredLogs.length > 0 || filteredServices.length > 0 || filteredAccessories.length > 0;
  
  const monthlyFuel = filteredLogs.reduce((sum, item) => sum + item.totalCost, 0);
  const monthlyService = filteredServices.reduce((sum, item) => sum + item.totalCost, 0);
  const monthlyAccessory = filteredAccessories.reduce((sum, item) => sum + item.cost, 0);
  const grandTotal = monthlyFuel + monthlyService + monthlyAccessory;

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 max-w-6xl mx-auto h-full min-h-screen">
      
      {/* Left Pane: Analytics & Filters */}
      <div className="w-full md:w-1/2 flex flex-col gap-6 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Receipt className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Monthly Billing</h1>
            <p className="text-slate-500 text-sm">Analyze your expenses by month</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto text-slate-600">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter:</span>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto flex-1">
            <div className="relative flex-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="relative flex-1">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Monthly Fuel</p>
              <p className="text-xl font-bold text-slate-800">₹{monthlyFuel.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Service & Maint.</p>
              <p className="text-xl font-bold text-slate-800">₹{monthlyService.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Accessories</p>
              <p className="text-xl font-bold text-slate-800">₹{monthlyAccessory.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Light Printer Area */}
      <div className="w-full md:w-1/2 bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 md:p-10 flex flex-col items-center justify-start min-h-[600px] relative overflow-hidden">
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-xl font-bold text-slate-800">Receipt Generator</h2>
          <p className="text-slate-500 text-sm mt-1">
            {months[selectedMonth]} {selectedYear}
          </p>
        </div>

        <div className="w-full max-w-sm flex flex-col items-center relative z-10 mt-8">
          {hasData ? (
            <ReceiptCard 
              logs={filteredLogs}
              services={filteredServices}
              accessories={filteredAccessories}
              period={`${months[selectedMonth]} ${selectedYear}`}
            />
          ) : (
            <div className="text-center z-10 flex flex-col items-center justify-center opacity-60">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                <ReceiptCardIcon className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-bold text-slate-500 font-mono">No expenses logged</p>
              <p className="text-sm text-slate-400">for {months[selectedMonth]} {selectedYear}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper icon
const ReceiptCardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 17V7"/>
  </svg>
);
