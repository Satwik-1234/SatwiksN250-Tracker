'use client';

import React, { useState, useMemo } from 'react';
import { AccessoryGear } from '@/types/fuel';
import { ShoppingBag, Trash2, Pencil, FileText } from 'lucide-react';
import { AnimatedActionButton } from '@/components/ui/AnimatedActionButton';
import { DocumentViewerModal, getDocType } from '@/components/modals/DocumentViewerModal';
import { PageHeader, StatStrip, Chip, ChipRow, SearchInput, EmptyState } from '@/components/ui/Page';

interface AccessoriesViewProps {
  accessories: AccessoryGear[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
  onEditAccessory?: (item: AccessoryGear) => void;
  onDeleteAccessory: (id: string) => void;
}

const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

export const AccessoriesView: React.FC<AccessoriesViewProps> = ({
  accessories,
  isOwnerMode,
  onOpenAddModal,
  onEditAccessory,
  onDeleteAccessory,
}) => {
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const totalSpent = accessories.reduce((sum, a) => sum + a.cost, 0);
  const avgCost = accessories.length > 0 ? Math.round(totalSpent / accessories.length) : 0;
  const topItem = accessories.length > 0 ? [...accessories].sort((a, b) => b.cost - a.cost)[0] : null;

  // Only offer the categories that actually have items.
  const categories = useMemo(() => {
    const seen = new Set<string>();
    accessories.forEach((a) => a.category && seen.add(a.category.toUpperCase()));
    return ['ALL', ...Array.from(seen).sort()];
  }, [accessories]);

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
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader
        title="Gear"
        subtitle="Accessories, riding gear and their bills."
        action={<AnimatedActionButton label="Add item" onClick={onOpenAddModal} />}
      />

      <StatStrip
        items={[
          { label: 'Spent on gear', value: `₹${totalSpent.toLocaleString('en-IN')}` },
          { label: 'Items', value: accessories.length },
          { label: 'Average per item', value: `₹${avgCost.toLocaleString('en-IN')}` },
          {
            label: 'Biggest purchase',
            value: topItem ? `₹${topItem.cost.toLocaleString('en-IN')}` : '—',
            hint: topItem?.itemName,
          },
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search item, brand, notes"
          className="md:w-80"
        />
        {categories.length > 2 && (
          <ChipRow>
            {categories.map((cat) => (
              <Chip key={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(cat)}>
                {cat === 'ALL' ? 'All' : titleCase(cat)}
              </Chip>
            ))}
          </ChipRow>
        )}
      </div>

      {filteredAccessories.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={accessories.length === 0 ? 'No gear yet' : 'No items match'}
          body={
            accessories.length === 0
              ? 'Add your helmet, jacket, guards or any accessory, with its bill if you have one.'
              : 'Try a different search or category.'
          }
        />
      ) : (
        <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAccessories.map((item) => {
            const docType = getDocType(item.photoUrl);
            const hasPhoto = Boolean(item.photoUrl) && docType === 'IMAGE';
            const hasBill = Boolean(item.photoUrl) && docType !== 'IMAGE';
            const purchased = (() => {
              const d = new Date(item.datePurchased);
              return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            })();

            return (
              <article key={item.id} className="card overflow-hidden flex flex-col">
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={() => setViewingDoc({ title: item.itemName, url: item.photoUrl! })}
                    aria-label={`View photo of ${item.itemName}`}
                    className="block h-44 w-full bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- accessory photos may be data: URLs, next/image unsupported */}
                    <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-slate-900 leading-snug">{item.itemName}</h3>
                    <span className="text-[15px] font-semibold text-slate-900 tabular shrink-0">
                      ₹{(item.cost || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    {[titleCase(item.category || ''), item.brand, purchased].filter(Boolean).join(' · ')}
                  </p>

                  {item.notes && (
                    <p className="text-[13px] text-slate-600 leading-relaxed mt-2.5 line-clamp-3">{item.notes}</p>
                  )}

                  {(hasBill || isOwnerMode) && (
                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                      {hasBill ? (
                        <button
                          type="button"
                          onClick={() => setViewingDoc({ title: item.itemName, url: item.photoUrl! })}
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="w-4 h-4" />
                          View bill
                        </button>
                      ) : (
                        <span />
                      )}

                      {isOwnerMode && (
                        <div className="flex items-center -mr-2">
                          {onEditAccessory && (
                            <button
                              type="button"
                              onClick={() => onEditAccessory(item)}
                              aria-label="Edit item"
                              title="Edit item"
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this item?')) onDeleteAccessory(item.id);
                            }}
                            aria-label="Delete item"
                            title="Delete item"
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

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
