import React from 'react';
import { AccessoryGear } from '../types/fuel';
import { ShoppingBag, Plus, Image as ImageIcon } from 'lucide-react';

import { AnimatedActionButton } from './AnimatedActionButton';

interface AccessoriesViewProps {
  accessories: AccessoryGear[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
}

export const AccessoriesView: React.FC<AccessoriesViewProps> = ({ accessories, isOwnerMode, onOpenAddModal }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Accessories & Gear</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your bike accessories and riding gear purchases.</p>
        </div>
        <AnimatedActionButton label="Add Item" onClick={onOpenAddModal} />
      </div>

      {accessories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No items added yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Add your helmet, riding jacket, exhaust, or any other accessories you've purchased for your bike.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accessories.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col">
              {item.photoUrl ? (
                <div className="w-full h-48 bg-slate-100 relative">
                  <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                    ₹{item.cost.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-slate-50 flex items-center justify-center relative border-b border-slate-100">
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                  <div className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm border border-slate-100">
                    ₹{item.cost.toLocaleString()}
                  </div>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 mb-2">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.itemName}</h3>
                </div>
                
                <div className="space-y-1.5 mt-2 flex-1">
                  {item.brand && (
                    <div className="text-sm">
                      <span className="text-slate-500">Brand: </span>
                      <span className="font-medium text-slate-900">{item.brand}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="text-slate-500">Purchased: </span>
                    <span className="font-medium text-slate-900">{new Date(item.datePurchased).toLocaleDateString()}</span>
                  </div>
                  {item.notes && (
                    <div className="text-sm mt-3 pt-3 border-t border-slate-100">
                      <p className="text-slate-600 line-clamp-3">{item.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
