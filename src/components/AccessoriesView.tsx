import React, { useState, useMemo } from 'react';
import { AccessoryGear } from '../types/fuel';
import { ShoppingBag, Image as ImageIcon, Trash2, Pencil, FileText, Code, Eye, Search, Filter, Calendar } from 'lucide-react';
import { AnimatedActionButton } from './AnimatedActionButton';
import { DocumentViewerModal, getDocType } from './DocumentViewerModal';

interface AccessoriesViewProps {
  accessories: AccessoryGear[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
  onEditAccessory?: (item: AccessoryGear) => void;
  onDeleteAccessory: (id: string) => void;
}

export const AccessoriesView: React.FC<AccessoriesViewProps> = ({ 
  accessories, 
  isOwnerMode, 
  onOpenAddModal, 
  onEditAccessory, 
  onDeleteAccessory 
}) => {
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const totalSpent = accessories.reduce((sum, a) => sum + a.cost, 0);
  const avgCost = accessories.length > 0 ? Math.round(totalSpent / accessories.length) : 0;
  const topItem = accessories.length > 0 ? [...accessories].sort((a, b) => b.cost - a.cost)[0] : null;

  // Filtered accessories
  const filteredAccessories = useMemo(() => {
    return accessories.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.itemName.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q);

      const matchCategory =
        categoryFilter === 'ALL' || item.category?.toUpperCase() === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [accessories, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-mono tracking-tight">Accessories & Riding Gear</h2>
          <p className="text-sm text-slate-500 mt-1 font-mono">Manage your bike equipment, touring accessories, and invoice receipts (PDF, PNG, JPEG, HTML).</p>
        </div>
        <AnimatedActionButton label="Add Item" onClick={onOpenAddModal} />
      </div>

      {/* ── ACCESSORIES TELEMETRY SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Total Accessories Cost</span>
          <span className="text-xl font-black text-emerald-600 font-mono mt-1 block">₹{totalSpent.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Items Purchased</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{accessories.length}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Avg Cost / Item</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">₹{avgCost.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Top Investment</span>
          <span className="text-xs font-bold text-slate-800 font-mono mt-1.5 truncate block" title={topItem?.itemName}>
            {topItem ? `${topItem.itemName} (₹${topItem.cost.toLocaleString('en-IN')})` : '—'}
          </span>
        </div>
      </div>

      {/* ── SEARCH & CATEGORY FILTER BAR ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gear, brand, invoice notes…"
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['ALL', 'GEAR', 'PROTECTION', 'LUGGAGE', 'ELECTRONICS', 'MAINTENANCE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap
                ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredAccessories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {accessories.length === 0 ? 'No items added yet' : 'No matching gear or accessories found'}
          </h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto text-xs">
            {accessories.length === 0
              ? 'Add your helmet, riding jacket, exhaust, or any other accessories along with billing invoices (PDF, Images, HTML).'
              : 'Try clearing your search keyword or category filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccessories.map((item) => {
            const docType = getDocType(item.photoUrl);
            const hasBill = !!item.photoUrl;

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.07)] transition-all flex flex-col justify-between overflow-hidden relative group"
              >
                {/* ── CARD MEDIA / INVOICE PREVIEW ── */}
                <div className="relative h-56 w-full p-2.5 pb-0">
                  <div 
                    className={`w-full h-full rounded-2xl overflow-hidden relative bg-slate-50 border border-slate-100 flex items-center justify-center ${hasBill ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (hasBill) setViewingDoc({ title: item.itemName, url: item.photoUrl! });
                    }}
                    title={hasBill ? 'Click to view bill/invoice' : undefined}
                  >
                    {hasBill ? (
                      docType === 'IMAGE' ? (
                        <>
                          <div 
                            className="absolute inset-0 bg-cover bg-center opacity-25 blur-xl scale-110" 
                            style={{ backgroundImage: `url(${item.photoUrl})` }}
                          />
                          <img 
                            src={item.photoUrl} 
                            alt={item.itemName} 
                            className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105" 
                          />
                        </>
                      ) : docType === 'PDF' ? (
                        <div className="w-full h-full bg-red-50/40 flex flex-col items-center justify-center p-4">
                          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-2 shadow-xs transition-transform duration-300 group-hover:scale-110">
                            <FileText className="w-7 h-7" />
                          </div>
                          <span className="text-[11px] font-bold text-red-700 tracking-wider font-mono">PDF INVOICE</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-emerald-50/40 flex flex-col items-center justify-center p-4">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-xs transition-transform duration-300 group-hover:scale-110">
                            <Code className="w-7 h-7" />
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 tracking-wider font-mono">DIGITAL INVOICE</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 py-8">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">No Bill Attached</span>
                      </div>
                    )}

                    {/* Top Left: Document Type Badge */}
                    {hasBill && (
                      <div className="absolute top-3 left-3 z-20">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono tracking-wider backdrop-blur-md shadow-xs border ${
                          docType === 'PDF'
                            ? 'bg-red-500/90 text-white border-red-400/50'
                            : docType === 'HTML'
                            ? 'bg-emerald-600/90 text-white border-emerald-400/50'
                            : 'bg-slate-900/80 text-white border-white/20'
                        }`}>
                          {docType === 'PDF' ? 'PDF BILL' : docType === 'HTML' ? 'HTML BILL' : 'PHOTO BILL'}
                        </span>
                      </div>
                    )}

                    {/* Top Right: Cost Badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold font-mono text-slate-900 shadow-sm z-20 border border-slate-100">
                      ₹{item.cost.toLocaleString('en-IN')}
                    </div>

                    {/* Bottom Right: Always Visible Floating View Bill Pill (NO disappearing hover) */}
                    {hasBill && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDoc({ title: item.itemName, url: item.photoUrl! });
                        }}
                        className="absolute bottom-3 right-3 z-20 bg-slate-900/90 hover:bg-black active:scale-95 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer"
                        title="View Bill / Invoice"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Bill</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ── CARD CONTENT BODY ── */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-mono">
                        {item.category}
                      </span>
                      {item.brand && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-[11px] font-bold text-slate-500 font-mono tracking-wide">{item.brand}</span>
                        </>
                      )}
                    </div>

                    {/* Owner Controls */}
                    {isOwnerMode && (
                      <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200/80">
                        {onEditAccessory && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditAccessory(item); }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Accessory"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${item.itemName}?`)) onDeleteAccessory(item.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Accessory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg leading-snug tracking-tight">
                    {item.itemName}
                  </h3>

                  {item.notes && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-2.5 p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl line-clamp-2">
                      {item.notes}
                    </p>
                  )}

                  {/* ── CARD FOOTER ── */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-auto pt-4 border-t border-slate-100 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(item.datePurchased).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    </div>

                    {hasBill ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDoc({ title: item.itemName, url: item.photoUrl! });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 border border-emerald-200/80 font-bold text-xs font-mono transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Bill</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono italic">No bill</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={viewingDoc.title}
          url={viewingDoc.url}
        />
      )}
    </div>
  );
};
