import React, { useState, useMemo } from 'react';
import { AccessoryGear } from '../types/fuel';
import { 
  ShoppingBag, 
  Trash2, 
  Pencil, 
  FileText, 
  Code, 
  Eye, 
  Search, 
  Calendar,
  ShieldCheck,
  Zap,
  Sparkles,
  Package,
  Cpu,
  Wrench,
  Tag,
  Receipt,
  Upload
} from 'lucide-react';
import { AnimatedActionButton } from './AnimatedActionButton';
import { DocumentViewerModal, getDocType } from './DocumentViewerModal';

interface AccessoriesViewProps {
  accessories: AccessoryGear[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
  onEditAccessory?: (item: AccessoryGear) => void;
  onDeleteAccessory: (id: string) => void;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateAccessoryInvoiceHtml(item: AccessoryGear): string {
  const dateStr = new Date(item.datePurchased).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const invoiceId = `N250-ACC-${item.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${escapeHtml(item.itemName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 24px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .invoice-card {
      background: #ffffff;
      border-radius: 20px;
      width: 100%;
      max-width: 480px;
      padding: 32px 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      position: relative;
    }
    .badge-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px dashed #e2e8f0;
    }
    .logo-text {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #047857;
      text-transform: uppercase;
      font-family: ui-monospace, monospace;
    }
    .inv-number {
      font-size: 11px;
      color: #64748b;
      font-family: ui-monospace, monospace;
      font-weight: 600;
    }
    .header-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 6px;
    }
    .meta-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #047857;
      background: #ecfdf5;
      padding: 3px 10px;
      border-radius: 9999px;
      margin-bottom: 20px;
      font-family: ui-monospace, monospace;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .info-table td {
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .info-table td.label {
      color: #64748b;
      font-weight: 500;
    }
    .info-table td.value {
      text-align: right;
      font-weight: 700;
      color: #0f172a;
      font-family: ui-monospace, monospace;
    }
    .total-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .total-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
    }
    .total-amount {
      font-size: 24px;
      font-weight: 900;
      color: #047857;
      font-family: ui-monospace, monospace;
    }
    .notes-box {
      background: #f8fafc;
      border-left: 3px solid #10b981;
      padding: 12px 16px;
      border-radius: 0 10px 10px 0;
      margin-bottom: 24px;
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    .footer-bar {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      font-family: ui-monospace, monospace;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
    .verified-stamp {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #059669;
      font-weight: 700;
      margin-top: 6px;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-card { box-shadow: none; max-width: 100%; border: none; padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="badge-bar">
      <div class="logo-text">⚡ PULSAR N250</div>
      <div class="inv-number">${invoiceId}</div>
    </div>
    
    <div class="meta-tag">${escapeHtml(item.category)} • ${escapeHtml(item.brand || 'Accessories')}</div>
    <h1 class="header-title">${escapeHtml(item.itemName)}</h1>
    
    <table class="info-table">
      <tr>
        <td class="label">Date Purchased</td>
        <td class="value">${dateStr}</td>
      </tr>
      <tr>
        <td class="label">Category</td>
        <td class="value">${escapeHtml(item.category)}</td>
      </tr>
      ${item.brand ? `<tr><td class="label">Brand / Manufacturer</td><td class="value">${escapeHtml(item.brand)}</td></tr>` : ''}
      <tr>
        <td class="label">Vehicle Association</td>
        <td class="value">Bajaj Pulsar N250</td>
      </tr>
      <tr>
        <td class="label">Invoice Status</td>
        <td class="value" style="color: #059669;">PAID / VERIFIED</td>
      </tr>
    </table>

    ${item.notes ? `
    <div class="notes-box">
      <strong>Notes / Logged Details:</strong><br/>
      ${escapeHtml(item.notes)}
    </div>` : ''}

    <div class="total-box">
      <span class="total-label">Total Amount Paid</span>
      <span class="total-amount">₹${item.cost.toLocaleString('en-IN')}</span>
    </div>

    <div class="footer-bar">
      <div>Telemetry Recorded • Official Equipment Log</div>
      <div class="verified-stamp">✓ Verified Purchase Record</div>
    </div>
  </div>
</body>
</html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

const getCategoryTheme = (category: string) => {
  const cat = (category || 'OTHER').toUpperCase().trim();
  switch (cat) {
    case 'GEAR':
      return {
        badgeBg: 'bg-indigo-50 border-indigo-200/70 text-indigo-700',
        cardGradient: 'from-indigo-500/10 via-slate-50/50 to-white',
        iconBg: 'bg-indigo-100 text-indigo-600',
        icon: ShoppingBag,
      };
    case 'PROTECTION':
      return {
        badgeBg: 'bg-blue-50 border-blue-200/70 text-blue-700',
        cardGradient: 'from-blue-500/10 via-slate-50/50 to-white',
        iconBg: 'bg-blue-100 text-blue-600',
        icon: ShieldCheck,
      };
    case 'PERFORMANCE':
      return {
        badgeBg: 'bg-amber-50 border-amber-200/70 text-amber-800',
        cardGradient: 'from-amber-500/10 via-slate-50/50 to-white',
        iconBg: 'bg-amber-100 text-amber-600',
        icon: Zap,
      };
    case 'COSMETIC':
      return {
        badgeBg: 'bg-fuchsia-50 border-fuchsia-200/70 text-fuchsia-700',
        cardGradient: 'from-fuchsia-500/10 via-slate-50/50 to-white',
        iconBg: 'bg-fuchsia-100 text-fuchsia-600',
        icon: Sparkles,
      };
    case 'LUGGAGE':
      return {
        badgeBg: 'bg-teal-50 border-teal-200/70 text-teal-700',
        cardGradient: 'from-teal-500/10 via-slate-50/50 to-white',
        iconBg: 'bg-teal-100 text-teal-600',
        icon: Package,
      };
    case 'ELECTRONICS':
      return {
        badgeBg: 'bg-rose-50 border-rose-200/70 text-rose-700',
        cardGradient: 'from-rose-500/10 via-slate-50/50 to-white',
        iconBg: 'bg-rose-100 text-rose-600',
        icon: Cpu,
      };
    case 'MAINTENANCE':
      return {
        badgeBg: 'bg-emerald-50 border-emerald-200/70 text-emerald-700',
        cardGradient: 'from-emerald-500/10 via-slate-50/50 to-white',
        iconBg: 'bg-emerald-100 text-emerald-600',
        icon: Wrench,
      };
    default:
      return {
        badgeBg: 'bg-slate-100 border-slate-200/70 text-slate-700',
        cardGradient: 'from-slate-500/10 via-slate-50/50 to-white',
        iconBg: 'bg-slate-100 text-slate-600',
        icon: Tag,
      };
  }
};

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

  const handleViewBill = (item: AccessoryGear) => {
    if (item.photoUrl) {
      setViewingDoc({ title: item.itemName, url: item.photoUrl });
    } else {
      const digitalInvoiceUrl = generateAccessoryInvoiceHtml(item);
      setViewingDoc({ title: `${item.itemName} - Tax Invoice`, url: digitalInvoiceUrl });
    }
  };

  const categories = [
    'ALL', 
    'GEAR', 
    'PROTECTION', 
    'PERFORMANCE', 
    'COSMETIC', 
    'LUGGAGE', 
    'ELECTRONICS', 
    'MAINTENANCE', 
    'OTHER'
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-mono tracking-tight">Accessories & Riding Gear</h2>
          <p className="text-sm text-slate-500 mt-1 font-mono">Manage your bike equipment, touring accessories, and invoice receipts.</p>
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
          {categories.map((cat) => (
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
            const hasPhoto = Boolean(item.photoUrl && item.photoUrl.trim().length > 0);
            const docType = getDocType(item.photoUrl);
            const theme = getCategoryTheme(item.category);
            const CategoryIcon = theme.icon;

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between overflow-hidden relative group"
              >
                {/* ── CARD MEDIA BANNER (ONLY IF PHOTO ATTACHED) ── */}
                {hasPhoto ? (
                  <div className="relative h-52 w-full p-2.5 pb-0">
                    <div 
                      className="w-full h-full rounded-2xl overflow-hidden relative bg-slate-900 flex items-center justify-center cursor-pointer group/img"
                      onClick={() => handleViewBill(item)}
                      title="Click to view bill / receipt"
                    >
                      {docType === 'IMAGE' ? (
                        <>
                          <div 
                            className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110" 
                            style={{ backgroundImage: `url(${item.photoUrl})` }}
                          />
                          <img 
                            src={item.photoUrl} 
                            alt={item.itemName} 
                            className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover/img:scale-105" 
                          />
                        </>
                      ) : docType === 'PDF' ? (
                        <div className="w-full h-full bg-red-950/40 flex flex-col items-center justify-center p-4">
                          <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-2 shadow-xs transition-transform duration-300 group-hover/img:scale-110">
                            <FileText className="w-7 h-7" />
                          </div>
                          <span className="text-[11px] font-bold text-red-300 tracking-wider font-mono">PDF INVOICE</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-emerald-950/40 flex flex-col items-center justify-center p-4">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 shadow-xs transition-transform duration-300 group-hover/img:scale-110">
                            <Code className="w-7 h-7" />
                          </div>
                          <span className="text-[11px] font-bold text-emerald-300 tracking-wider font-mono">DIGITAL INVOICE</span>
                        </div>
                      )}

                      {/* Top Left: Document Type Badge */}
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

                      {/* Top Right: Cost Badge */}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold font-mono text-slate-900 shadow-sm z-20 border border-slate-100">
                        ₹{item.cost.toLocaleString('en-IN')}
                      </div>

                      {/* Bottom Right: Direct View Bill Pill */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBill(item);
                        }}
                        className="absolute bottom-3 right-3 z-20 bg-slate-950/90 hover:bg-black active:scale-95 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer"
                        title="View Bill / Invoice"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Bill</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── HIGH-TECH ACCENT HEADER (WHEN NO PHOTO ATTACHED - REPLACES UGLY 'NO IMAGE' VOID) ── */
                  <div className={`p-4 pb-0 bg-gradient-to-b ${theme.cardGradient}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-xs border border-white/80`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md font-mono border ${theme.badgeBg}`}>
                            {item.category}
                          </span>
                          {item.brand && (
                            <span className="block text-[11px] font-bold text-slate-500 font-mono tracking-wide mt-0.5">
                              {item.brand}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price Badge */}
                      <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm font-black font-mono text-slate-900 shadow-xs border border-slate-200/80">
                        ₹{item.cost.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CARD CONTENT BODY ── */}
                <div className="p-5 flex flex-col flex-1">
                  {hasPhoto && (
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-mono border ${theme.badgeBg}`}>
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
                  )}

                  <div className="flex items-start justify-between gap-2 mt-1">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug tracking-tight">
                      {item.itemName}
                    </h3>

                    {!hasPhoto && isOwnerMode && (
                      <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200/80 shrink-0">
                        {onEditAccessory && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditAccessory(item); }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Accessory / Attach Photo"
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

                  {item.notes && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl line-clamp-2">
                      {item.notes}
                    </p>
                  )}

                  {/* ── CARD FOOTER WITH PERMANENT 'VIEW BILL' BUTTON ── */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-auto pt-4 border-t border-slate-100 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Purchased {new Date(item.datePurchased).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!hasPhoto && isOwnerMode && onEditAccessory && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditAccessory(item);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg font-mono transition-colors"
                          title="Attach photo/document bill"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Attach</span>
                        </button>
                      )}

                      {/* Always Visible View Bill Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBill(item);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 border border-emerald-200/80 font-bold text-xs font-mono transition-all cursor-pointer active:scale-95 shadow-2xs"
                        title={hasPhoto ? "View attached invoice/receipt" : "View digital equipment invoice"}
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Bill</span>
                      </button>
                    </div>
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
