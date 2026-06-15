"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, X, ShoppingCart, Edit2, Trash2,
  Phone, MapPin, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Supplier } from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";
import useSWR, { mutate } from "swr";

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
  sidebar: "#F1F5F9",
};

export default function SupplierManagementPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const fetchSuppliersData = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("suppliers").select("*").order("supplier_name");
    return (data || []) as Supplier[];
  };

  const { data: suppliersData, isLoading } = useSWR('admin_suppliers', fetchSuppliersData);
  const suppliers = suppliersData || [];

  const resetForm = () => { setFormName(""); setFormPhone(""); setFormAddress(""); setEditingSupplier(null); };

  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.supplier_name);
    setFormPhone(s.phone ?? "");
    setFormAddress(s.address ?? "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        supplier_name: formName,
        phone: formPhone || null,
        address: formAddress || null,
      };
      if (editingSupplier) {
        const { error } = await supabase.from("suppliers").update(payload).eq("supplier_id", editingSupplier.supplier_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      resetForm();
      mutate('admin_suppliers');
    } catch (err: unknown) {
      alert("Gagal menyimpan: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Hapus supplier "${s.supplier_name}"?`)) return;
    const { error } = await supabase.from("suppliers").delete().eq("supplier_id", s.supplier_id);
    if (error) { alert("Gagal menghapus: " + error.message); return; }
    mutate('admin_suppliers');
  };

  const filtered = suppliers.filter((s) =>
    s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone ?? "").includes(searchQuery)
  );

  const headerActions = (
    <button onClick={openAdd}
      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95">
      <Plus size={16} /> <span className="hidden sm:inline">Tambah Supplier</span>
    </button>
  );

  return (
    <DashboardShell title="Manajemen Supplier" subtitle="Kelola data supplier material" headerActions={headerActions}>
      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border flex items-center gap-4 shadow-sm" style={{ background: C.card, borderColor: C.border }}>
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <ShoppingCart size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-orange-600">
              {isLoading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : suppliers.length}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Total Supplier</p>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
        <input type="text" placeholder="Cari supplier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 transition-colors"
          style={{ borderColor: C.border, background: C.card }} />
      </div>

      {/* Supplier List */}
      <section>
        <div className="rounded-xl border overflow-hidden shadow-sm" style={{ background: C.card, borderColor: C.border }}>
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: C.border }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: C.muted }} />
              <p className="text-sm font-semibold" style={{ color: C.muted }}>
                {searchQuery ? "Tidak ditemukan." : "Belum ada supplier. Tambahkan yang pertama."}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: C.border }}>
              {filtered.map((s) => (
                <div key={s.supplier_id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                  <div className="w-11 h-11 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                    {s.supplier_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: C.text }}>{s.supplier_name}</p>
                    <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                      {s.phone && (
                        <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: C.muted }}>
                          <Phone size={10} /> {s.phone}
                        </span>
                      )}
                      {s.address && (
                        <span className="flex items-center gap-1 text-[11px] font-medium line-clamp-1" style={{ color: C.muted }}>
                          <MapPin size={10} /> {s.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(s)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-md" title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs mt-2 text-right font-medium" style={{ color: C.muted }}>
            Menampilkan {filtered.length} dari {suppliers.length} supplier
          </p>
        )}
      </section>

      {/* ═══════════ ADD/EDIT MODAL ═══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">{editingSupplier ? "Edit Supplier" : "Tambah Supplier"}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">Nama Supplier *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="mis. PT. Baja Utama"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">Nomor Telepon</label>
                <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="mis. 08123456789"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">Alamat</label>
                <textarea rows={2} value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="mis. Jl. Industri No. 10, Banda Aceh"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500 resize-none" style={{ borderColor: C.border }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-3 rounded-xl border font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors" style={{ borderColor: C.border }}>Batal</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60">
                  {isSubmitting ? "Menyimpan..." : editingSupplier ? "Simpan Perubahan" : "Tambah Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
