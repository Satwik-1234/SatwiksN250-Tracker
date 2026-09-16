import React, { useState, useMemo } from 'react';
import { AccessoryGear } from '../types/fuel';
import { ShoppingBag, Image as ImageIcon, Trash2, Pencil, FileText, Code, Eye, Search, Filter } from 'lucide-react';
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
            return (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-200/85 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group flex flex-col justify-between overflow-hidden relative">
                
                {/* Image Section */}
                <div className="relative h-56 w-full p-2">
                  <div className="w-full h-full rounded-2xl overflow-hidden relative group/img cursor-pointer bg-slate-50 border border-slate-100" onClick={() => {
                    if(item.photoUrl) setViewingDoc({ title: item.itemName, url: item.photoUrl });
                  }}>
                    {item.photoUrl ? (
                      docType === 'IMAGE' ? (
                        <>
                          <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110 transition-opacity group-hover/img:opacity-40" style={{ backgroundImage: `url(${item.photoUrl})` }}></div>
                          <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover/img:scale-105" />
                        </>
                      ) : docType === 'PDF' ? (
                        <div className="w-full h-full bg-red-50/30 flex flex-col items-center justify-center">
                          <FileText className="w-12 h-12 text-red-400 mb-2 transition-transform group-hover/img:scale-110 duration-300" />
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest font-mono">PDF Invoice</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-emerald-50/30 flex flex-col items-center justify-center">
                          <Code className="w-12 h-12 text-emerald-400 mb-2 transition-transform group-hover/img:scale-110 duration-300" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">HTML Invoice</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                        <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">No Image</span>
                      </div>
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold font-mono text-slate-900 shadow-sm z-20 border border-white/50">
                      ₹{item.cost.toLocaleString('en-IN')}
                    </div>

                    {/* Hover Overlay */}
                    {item.photoUrl && (
                      <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover/img:opacity-100 transition-opacity z-20 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-full font-semibold text-xs shadow-xl transform translate-y-2 group-hover/img:translate-y-0 transition-transform duration-300 flex items-center gap-1.5 font-mono">
                          <Eye className="w-3.5 h-3.5" /> View Bill
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 pt-2 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">{item.category}</span>
                        {item.brand && <span className="w-1 h-1 rounded-full bg-slate-200"></span>}
                        {item.brand && <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 font-mono">{item.brand}</span>}
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">{item.itemName}</h3>
                    </div>

                    {isOwnerMode && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 rounded-full p-1 border border-slate-100">
                        {onEditAccessory && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditAccessory(item); }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this accessory?')) onDeleteAccessory(item.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-sm text-slate-500 leading-relaxed mt-3 line-clamp-2">{item.notes}</p>
                  )}

                  <div className="flex items-center text-[11px] text-slate-400 font-medium mt-auto pt-4 font-mono">
                    <span>Purchased {new Date(item.datePurchased).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
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
