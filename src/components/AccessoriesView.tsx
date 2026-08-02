import React, { useState } from 'react';
import { AccessoryGear } from '../types/fuel';
import { ShoppingBag, Image as ImageIcon, Trash2, Pencil, FileText, Code, Eye } from 'lucide-react';
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

  const totalSpent = accessories.reduce((sum, a) => sum + a.cost, 0);
  const avgCost = accessories.length > 0 ? Math.round(totalSpent / accessories.length) : 0;
  const topItem = accessories.length > 0 ? [...accessories].sort((a, b) => b.cost - a.cost)[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Accessories & Gear</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your bike accessories, riding gear purchases, and invoices (PDF, PNG, JPEG, HTML).</p>
        </div>
        <AnimatedActionButton label="Add Item" onClick={onOpenAddModal} />
      </div>

      {/* ── ACCESSORIES TELEMETRY SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Accessories Cost</span>
          <span className="text-xl font-black text-emerald-600 font-mono mt-1 block">₹{totalSpent.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Items Purchased</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{accessories.length}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg Cost / Item</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">₹{avgCost.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Top Investment</span>
          <span className="text-xs font-bold text-slate-800 font-mono mt-1.5 truncate block" title={topItem?.itemName}>
            {topItem ? `${topItem.itemName} (₹${topItem.cost.toLocaleString('en-IN')})` : '—'}
          </span>
        </div>
      </div>

      {accessories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No items added yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Add your helmet, riding jacket, exhaust, or any other accessories along with billing invoices (PDF, Images, HTML).
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accessories.map((item) => {
            const docType = getDocType(item.photoUrl);
            return (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  {item.photoUrl ? (
                    docType === 'IMAGE' ? (
                      <div className="w-full h-48 bg-slate-100 relative cursor-pointer" onClick={() => setViewingDoc({ title: item.itemName, url: item.photoUrl! })}>
                        <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold font-mono text-slate-900 shadow-sm">
                          ₹{item.cost.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ) : docType === 'PDF' ? (
                      <div className="w-full h-36 bg-red-50/60 flex flex-col items-center justify-center relative border-b border-red-100 cursor-pointer" onClick={() => setViewingDoc({ title: `${item.itemName} Invoice`, url: item.photoUrl! })}>
                        <FileText className="w-10 h-10 text-red-500 mb-1" />
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wider">PDF Invoice Attached</span>
                        <div className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-full text-xs font-bold font-mono text-slate-900 shadow-sm border border-slate-100">
                          ₹{item.cost.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-36 bg-emerald-50/60 flex flex-col items-center justify-center relative border-b border-emerald-100 cursor-pointer" onClick={() => setViewingDoc({ title: `${item.itemName} Invoice`, url: item.photoUrl! })}>
                        <Code className="w-10 h-10 text-emerald-600 mb-1" />
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">HTML Invoice Attached</span>
                        <div className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-full text-xs font-bold font-mono text-slate-900 shadow-sm border border-slate-100">
                          ₹{item.cost.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-32 bg-slate-50 flex items-center justify-center relative border-b border-slate-100">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                      <div className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-full text-xs font-bold font-mono text-slate-900 shadow-sm border border-slate-100">
                        ₹{item.cost.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-5">
                    <div className="mb-2 flex justify-between items-start">
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 mb-2">
                          {item.category}
                        </span>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.itemName}</h3>
                      </div>
                      {isOwnerMode && (
                        <div className="flex items-center space-x-1">
                          {onEditAccessory && (
                            <button
                              onClick={() => onEditAccessory(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Accessory"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Delete this accessory?')) onDeleteAccessory(item.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1.5 mt-2">
                      {item.brand && (
                        <div className="text-sm">
                          <span className="text-slate-500">Brand: </span>
                          <span className="font-medium text-slate-900">{item.brand}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-slate-500">Purchased: </span>
                        <span className="font-medium text-slate-900">{new Date(item.datePurchased).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {item.notes && (
                        <div className="text-sm mt-3 pt-3 border-t border-slate-100">
                          <p className="text-slate-600 line-clamp-3">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {item.photoUrl && (
                  <div className="px-5 pb-5 pt-2">
                    <button
                      onClick={() => setViewingDoc({ title: `${item.itemName} Invoice`, url: item.photoUrl! })}
                      className="w-full inline-flex items-center justify-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Document / Invoice
                    </button>
                  </div>
                )}
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
