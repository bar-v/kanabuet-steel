"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, X, Package, AlertTriangle, Archive,
  Boxes, Edit2, Trash2, MoreVertical, PlusCircle, Loader2,
  ChevronDown, Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Material, MaterialWithSupplier, Supplier } from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";
import useSWR, { mutate } from "swr";

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
  sidebar: "#F1F5F9",
};

function getStockStatus(m: Material) {
  if (m.current_stock <= 0) return "habis";
  if (m.current_stock < m.minimum_stock) return "min_stock";
  return "tersedia";
}
function getStatusBadge(s: string) {
  switch (s) {
    case "tersedia": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "min_stock": return "bg-amber-50 text-amber-700 border-amber-200";
    case "habis": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
}
function getStatusLabel(s: string) {
  switch (s) {
    case "tersedia": return "Tersedia";
    case "min_stock": return "Minimum";
    case "habis": return "Habis";
    default: return s;
  }
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}

const standardUnits = ["batang", "kg", "lembar", "kaleng", "pcs"];

// Component for searchable supplier dropdown
function SupplierSearchSelect({
  suppliers,
  value,
  onChange,
  borderColor,
}: {
  suppliers: Supplier[];
  value: number | "";
  onChange: (value: number | "") => void;
  borderColor: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedSupplier = suppliers.find((s) => s.supplier_id === value);

  const filteredSuppliers = suppliers.filter((s) =>
    s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".supplier-search-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative supplier-search-container mt-1">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none text-left flex items-center justify-between bg-white focus:border-orange-500 transition-all"
        style={{ borderColor }}
      >
        <span className={selectedSupplier ? "text-slate-900" : "text-slate-400"}>
          {selectedSupplier ? selectedSupplier.supplier_name : "Pilih Supplier"}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-[110] left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60 animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ borderColor }}
        >
          <div className="p-2 border-b flex items-center gap-2 bg-slate-50" style={{ borderColor }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none font-medium text-slate-800"
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-48">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              — Tanpa Supplier —
            </button>
            {filteredSuppliers.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                Supplier tidak ditemukan
              </div>
            ) : (
              filteredSuppliers.map((s) => (
                <button
                  key={s.supplier_id}
                  type="button"
                  onClick={() => {
                    onChange(s.supplier_id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between hover:bg-orange-50/30
                    ${s.supplier_id === value ? "bg-orange-50/50 font-bold text-orange-600" : "text-slate-700"}`}
                >
                  <span className="truncate pr-4">{s.supplier_name}</span>
                  {s.supplier_id === value && <Check size={14} className="text-orange-500 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialSearchSelect({
  materials,
  value,
  onChange,
  borderColor,
}: {
  materials: MaterialWithSupplier[];
  value: number | "";
  onChange: (value: number | "") => void;
  borderColor: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedMaterial = materials.find((m) => m.material_id === value);

  const filteredMaterials = materials.filter((m) =>
    m.material_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".material-search-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative material-search-container mt-1">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        className="w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none text-left flex items-center justify-between bg-white focus:border-emerald-500 transition-all"
        style={{ borderColor }}
      >
        <span className={selectedMaterial ? "text-slate-900" : "text-slate-400"}>
          {selectedMaterial ? selectedMaterial.material_name : "Pilih Material..."}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-[110] left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60 animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ borderColor }}
        >
          <div className="p-2 border-b flex items-center gap-2 bg-slate-50" style={{ borderColor }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none font-medium text-slate-800"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-48">
            {filteredMaterials.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                Material tidak ditemukan
              </div>
            ) : (
              filteredMaterials.map((m) => (
                <button
                  key={m.material_id}
                  type="button"
                  onClick={() => {
                    onChange(m.material_id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between hover:bg-emerald-50/30
                    ${m.material_id === value ? "bg-emerald-50/50 font-bold text-emerald-600" : "text-slate-700"}`}
                >
                  <span className="truncate pr-4">{m.material_name}</span>
                  {m.material_id === value && <Check size={14} className="text-emerald-500 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaterialManagementPage() {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const fetchMaterialsData = async () => {
    const supabase = createClient();
    const [resMat, resSup] = await Promise.all([
      supabase.from("materials").select("*, suppliers(supplier_name)").order("material_name"),
      supabase.from("suppliers").select("*").order("supplier_name")
    ]);
    return {
      materials: (resMat.data || []) as MaterialWithSupplier[],
      suppliers: (resSup.data || []) as Supplier[]
    };
  };

  const { data, isLoading } = useSWR('admin_materials', fetchMaterialsData);
  const materials = data?.materials || [];
  const suppliers = data?.suppliers || [];

  // Modal states
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialWithSupplier | null>(null);
  const [restockMaterial, setRestockMaterial] = useState<MaterialWithSupplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add/Edit form
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(0);
  const [formSupplierId, setFormSupplierId] = useState<number | "">("");
  const [formUnitPrice, setFormUnitPrice] = useState(0);

  // Restock form
  const [restockQty, setRestockQty] = useState(0);
  const [restockPurchasePrice, setRestockPurchasePrice] = useState<number | "">("");
  const [updateLatestPrice, setUpdateLatestPrice] = useState(true);
  const [restockNotes, setRestockNotes] = useState("");
  const [isQuickRestock, setIsQuickRestock] = useState(false);
  const [showPriceConfirmation, setShowPriceConfirmation] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setFormName(""); setFormCategory(""); setFormUnit(""); setFormStock(0); setFormMinStock(0); setFormSupplierId(""); setFormUnitPrice(0);
    setEditingMaterial(null);
  };

  const openAdd = () => { resetForm(); setShowAddModal(true); };
  const openEdit = (m: MaterialWithSupplier) => {
    setEditingMaterial(m);
    setFormName(m.material_name);
    setFormCategory(m.category ?? "");
    setFormUnit(m.unit);
    setFormStock(m.current_stock);
    setFormMinStock(m.minimum_stock);
    setFormSupplierId(m.supplier_id ?? "");
    setFormUnitPrice(m.unit_price ?? 0);
    setShowAddModal(true);
  };
  const openRestock = (m: MaterialWithSupplier | null, isQuick = false) => {
    setRestockMaterial(m);
    setIsQuickRestock(isQuick);
    setRestockQty(0);
    setRestockPurchasePrice("");
    setUpdateLatestPrice(true);
    setRestockNotes("");
    setShowPriceConfirmation(false);
    setShowRestockModal(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        material_name: formName,
        category: formCategory || null,
        unit: formUnit,
        current_stock: formStock,
        minimum_stock: formMinStock,
        supplier_id: formSupplierId || null,
        unit_price: formUnitPrice,
      };

      if (editingMaterial) {
        const { error } = await supabase.from("materials").update(payload).eq("material_id", editingMaterial.material_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("materials").insert([payload]);
        if (error) throw error;
      }
      setShowAddModal(false);
      resetForm();
      mutate('admin_materials');
    } catch (err: unknown) {
      alert("Gagal menyimpan: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestockInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockMaterial || restockQty <= 0) return;

    const isPriceChanged = restockPurchasePrice !== "" && restockPurchasePrice !== restockMaterial.unit_price;
    if (isPriceChanged) {
      setShowPriceConfirmation(true);
    } else {
      executeRestock(false);
    }
  };

  const executeRestock = async (updatePrice: boolean) => {
    if (!restockMaterial) return;
    setIsSubmitting(true);
    const finalPurchasePrice = restockPurchasePrice === "" ? restockMaterial.unit_price : restockPurchasePrice;

    try {
      const { error } = await supabase.from("restocks").insert([{
        material_id: restockMaterial.material_id,
        supplier_id: restockMaterial.supplier_id,
        quantity: restockQty,
        purchase_unit_price: finalPurchasePrice,
        total_purchase_price: finalPurchasePrice * restockQty,
      }]);
      if (error) throw error;

      if (updatePrice) {
        const { error: updateError } = await supabase
          .from("materials")
          .update({ unit_price: finalPurchasePrice })
          .eq("material_id", restockMaterial.material_id);
        if (updateError) throw updateError;
      }

      setShowRestockModal(false);
      setShowPriceConfirmation(false);
      mutate('admin_materials');
    } catch (err: unknown) {
      alert("Gagal restock: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (m: MaterialWithSupplier) => {
    if (!confirm(`Hapus material "${m.material_name}"?`)) return;
    const { error } = await supabase.from("materials").delete().eq("material_id", m.material_id);
    if (error) { alert("Gagal menghapus: " + error.message); return; }
    mutate('admin_materials');
  };

  const filtered = materials.filter((m) =>
    m.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.category ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMaterials = materials.length;
  const availableCount = materials.filter((m) => getStockStatus(m) === "tersedia").length;
  const lowStockCount = materials.filter((m) => getStockStatus(m) === "min_stock").length;
  const outOfStockCount = materials.filter((m) => getStockStatus(m) === "habis").length;
  const criticalStocks = materials.filter((m) => m.current_stock < m.minimum_stock);

  const STATS = [
    { label: "Total Material", value: totalMaterials, color: "text-slate-600", iconBg: "bg-slate-50", Icon: Boxes },
    { label: "Tersedia", value: availableCount, color: "text-emerald-600", iconBg: "bg-emerald-50", Icon: Package },
    { label: "Minimum", value: lowStockCount, color: "text-amber-600", iconBg: "bg-amber-50", Icon: AlertTriangle },
    { label: "Habis", value: outOfStockCount, color: "text-red-600", iconBg: "bg-red-50", Icon: Archive },
  ];

  return (
    <DashboardShell title="Material Management" subtitle="Pantau stok dan kebutuhan bahan baku bengkel">
      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={openAdd}
          className="group p-4 rounded-xl border flex items-center gap-4 hover:border-orange-500 hover:shadow-md transition-all duration-200 bg-white"
          style={{ borderColor: C.border }}>
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
            <PlusCircle size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Tambah Material</p>
            <p className="text-[10px]" style={{ color: C.muted }}>Daftarkan bahan baku baru</p>
          </div>
        </button>
        <button onClick={() => openRestock(null, true)}
          disabled={!mounted || materials.length === 0}
          className="group p-4 rounded-xl border flex items-center gap-4 hover:border-emerald-500 hover:shadow-md transition-all duration-200 bg-white disabled:opacity-50"
          style={{ borderColor: C.border }}>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <Archive size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Restock Cepat</p>
            <p className="text-[10px]" style={{ color: C.muted }}>Input penambahan stok material</p>
          </div>
        </button>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, color, iconBg, Icon }) => (
          <div key={label} className="p-4 rounded-xl border flex flex-col gap-2 shadow-sm" style={{ background: C.card, borderColor: C.border }}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-black ${color}`}>
                {isLoading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : value}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Warning Section */}
      {criticalStocks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: C.muted }}>
            <AlertTriangle size={14} className="text-amber-500" /> Warning Stok Minimum
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
            {criticalStocks.map((item) => (
              <div key={item.material_id}
                className="min-w-[280px] sm:min-w-[320px] snap-start p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Package size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate pr-6" style={{ color: C.text }}>{item.material_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs font-semibold text-red-600">Sisa: {item.current_stock} {item.unit}</p>
                    <span className="text-[10px] text-slate-400">|</span>
                    <p className="text-xs font-medium" style={{ color: C.muted }}>Min: {item.minimum_stock} {item.unit}</p>
                  </div>
                </div>
                <button onClick={() => openRestock(item as MaterialWithSupplier)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm active:scale-95">
                  Restock
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search + Table */}
      <section className="space-y-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          <input type="text" placeholder="Cari material..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 transition-colors"
            style={{ borderColor: C.border, background: C.card }} />
        </div>

        <div className="rounded-xl border overflow-hidden shadow-sm" style={{ background: C.card, borderColor: C.border }}>
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: C.border }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={40} className="mx-auto mb-3" style={{ color: C.muted }} />
              <p className="text-sm font-semibold" style={{ color: C.muted }}>
                {searchQuery ? "Tidak ada material yang cocok." : "Belum ada material. Tambahkan yang pertama."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ background: C.sidebar, borderColor: C.border }}>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Material</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Stok</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Status</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-right" style={{ color: C.muted }}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: C.border }}>
                  {filtered.map((m) => {
                    const st = getStockStatus(m);
                    return (
                      <tr key={m.material_id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold" style={{ color: C.text }}>{m.material_name}</p>
                          <p className="text-[10px] mt-0.5 font-medium" style={{ color: C.muted }}>
                            {m.category ?? "—"} • {m.suppliers?.supplier_name ?? "Tanpa supplier"}
                          </p>
                          <p className="text-xs mt-1 font-semibold text-orange-600">
                            {formatRupiah(m.unit_price)} <span className="font-normal text-slate-500">/ {m.unit}</span>
                          </p>
                        </td>
                        <td className="px-5 py-4 text-xs font-black" style={{ color: C.text }}>
                          {m.current_stock} <span className="font-medium" style={{ color: C.muted }}>{m.unit}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadge(st)}`}>
                            {getStatusLabel(st)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openRestock(m, false)}
                              className="px-2 py-1 bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-600 text-[10px] font-bold rounded transition-all active:scale-95">
                              Restock
                            </button>
                            <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-md transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(m)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ ADD/EDIT MODAL ═══════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowAddModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-orange-200 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-800">{editingMaterial ? "Edit Material" : "Tambah Material"}</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-orange-50 rounded-full text-orange-400 hover:text-orange-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveMaterial} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">Nama Material *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="mis. Besi Hollow 4x4 cm"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 ml-1">Kategori</label>
                  <input type="text" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="mis. Baja"
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 ml-1">Satuan *</label>
                  <select value={formUnit} onChange={(e) => setFormUnit(e.target.value)} required
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500 bg-white" style={{ borderColor: C.border }}>
                    <option value="">Pilih Satuan</option>
                    {standardUnits.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    {formUnit && !standardUnits.includes(formUnit) ? (
                      <option value={formUnit}>{formUnit}</option>
                    ) : null}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 ml-1">Stok Awal</label>
                  <input type="number" min="0" value={formStock} onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-bold outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 ml-1">Minimum</label>
                  <input type="number" min="0" value={formMinStock} onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-bold outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">Harga Satuan</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                  <input type="number" min="0" value={formUnitPrice} onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-bold outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">Supplier</label>
                <SupplierSearchSelect
                  suppliers={suppliers}
                  value={formSupplierId}
                  onChange={(val) => setFormSupplierId(val)}
                  borderColor={C.border}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 py-3 rounded-xl border font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors" style={{ borderColor: C.border }}>Batal</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60">
                  {isSubmitting ? "Menyimpan..." : editingMaterial ? "Simpan Perubahan" : "Tambah Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ RESTOCK MODAL ═══════════ */}
      {showRestockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRestockModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-orange-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-lg text-slate-800">{isQuickRestock ? "Restock Cepat" : "Restock Material"}</h2>
              </div>
              <button onClick={() => setShowRestockModal(false)} className="p-2 hover:bg-orange-50 rounded-full text-orange-400 hover:text-orange-600 transition-colors"><X size={20} /></button>
            </div>
            {showPriceConfirmation ? (
              <div className="p-6 space-y-6">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <h3 className="font-bold text-orange-800 mb-4">Konfirmasi Perubahan Harga</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-orange-200">
                      <span className="text-sm font-medium text-orange-700">Harga aktif saat ini:</span>
                      <span className="text-sm font-bold text-orange-900">{formatRupiah(restockMaterial!.unit_price)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-orange-200">
                      <span className="text-sm font-medium text-orange-700">Harga beli baru:</span>
                      <span className="text-sm font-bold text-orange-900">{formatRupiah(restockPurchasePrice as number)}</span>
                    </div>
                    <div className="pt-2 text-center">
                      <p className="text-sm font-bold text-orange-800">Perbarui harga material menjadi {formatRupiah(restockPurchasePrice as number)}?</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button 
                    type="button" 
                    onClick={() => executeRestock(true)}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? "Menyimpan..." : "Ya, Perbarui"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => executeRestock(false)}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? "Menyimpan..." : "Tidak, Simpan Restock Saja"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPriceConfirmation(false)}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl border font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors" 
                    style={{ borderColor: C.border }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRestockInitiate} className="p-6 space-y-4">
                {isQuickRestock && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 ml-1">Pilih Material *</label>
                    <MaterialSearchSelect
                      materials={materials}
                      value={restockMaterial?.material_id || ""}
                      onChange={(val) => {
                        const mat = materials.find(m => m.material_id === val);
                        setRestockMaterial(mat || null);
                      }}
                      borderColor={C.border}
                    />
                  </div>
                )}

                {restockMaterial ? (
                  <>
                    <div className="p-4 rounded-xl bg-slate-50 border" style={{ borderColor: C.border }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Material Terpilih</p>
                      <h3 className="font-bold text-base mt-0.5">{restockMaterial.material_name}</h3>
                      <div className="flex gap-6 mt-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400">Stok Saat Ini</p>
                          <p className="text-xs font-black text-orange-600">{restockMaterial.current_stock} {restockMaterial.unit}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400">Harga Saat Ini</p>
                          <p className="text-xs font-black text-slate-600">{formatRupiah(restockMaterial.unit_price)} / {restockMaterial.unit}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Jumlah Restock *</label>
                        <div className="relative mt-1">
                          <input type="number" min="1" value={restockQty || ""} onChange={(e) => setRestockQty(Number(e.target.value))} required
                            className="w-full pl-4 pr-16 py-3 rounded-xl border text-sm font-bold outline-none focus:border-emerald-500" style={{ borderColor: C.border }} />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">{restockMaterial.unit}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Harga Beli per Unit</label>
                        <div className="relative mt-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                          <input type="number" min="0" value={restockPurchasePrice === "" ? "" : restockPurchasePrice} onChange={(e) => setRestockPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder={restockMaterial.unit_price.toString()}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-bold outline-none focus:border-emerald-500 placeholder:font-normal placeholder:text-slate-300" style={{ borderColor: C.border }} />
                        </div>
                      </div>
                    </div>

                    {restockQty > 0 && (
                      <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Total Pembelian:</span>
                        <span className="text-sm font-black text-orange-600">
                          {formatRupiah(restockQty * (restockPurchasePrice === "" ? restockMaterial.unit_price : restockPurchasePrice))}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Package size={32} className="mx-auto mb-2 text-slate-200" />
                    <p className="text-sm font-medium text-slate-400">Pilih material terlebih dahulu.</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRestockModal(false)}
                    className="flex-1 py-3 rounded-xl border font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors" style={{ borderColor: C.border }}>Batal</button>
                  <button type="submit" disabled={isSubmitting || !restockMaterial || restockQty <= 0}
                    className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60">
                    {isSubmitting ? "Menyimpan..." : "Simpan Restock"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
