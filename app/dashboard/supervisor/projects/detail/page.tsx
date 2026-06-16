"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid, FolderOpen, TrendingUp, Package, LogOut, Menu, X, ArrowLeft,
  MapPin, CalendarClock, Activity, Upload, ImageIcon, ChevronRight, Plus,
  Search, AlertTriangle, CheckCircle2
} from "lucide-react";

import DashboardShell from "@/components/layout/DashboardShell";
import { C, getStatusStyle, getStatusLabel, getProgressColor } from "@/lib/utils/theme";

// ── Mock data ──────────────────────────────────────────────
const PROJECT = {
  name: "Fabrikasi Pintu Gerbang Industri",
  location: "Jl. Industri Raya No. 12, Banda Aceh",
  status: "on_progress",
  pct: 45,
  description: "Fabrikasi dan pemasangan pintu gerbang industri berbahan baja untuk kawasan industri. Pekerjaan meliputi pemotongan, pengelasan, pengecatan, dan pemasangan.",
};

const MATERIALS_USED = [
  { id: 1, name: "Besi Hollow 4×4 cm", qty: 15, unit: "batang", date: "10 Mei 2025" },
  { id: 2, name: "Elektroda Las E6013", qty: 2, unit: "kg", date: "10 Mei 2025" },
];

const AVAILABLE_MATERIALS = [
  { id: 1, name: "Besi Hollow 4x4 cm", stock: 20, unit: "batang", min: 10 },
  { id: 2, name: "Besi Hollow 2x4 cm", stock: 12, unit: "batang", min: 20 }, // Min stock
  { id: 3, name: "Plat Bordes 3mm", stock: 5, unit: "lembar", min: 2 },
  { id: 4, name: "Elektroda Las E6013", stock: 2, unit: "kg", min: 20 }, // Min stock
  { id: 5, name: "Cat Anti Karat (Gray)", stock: 3, unit: "kaleng", min: 10 },
];



const TABS = ["Overview", "Material"] as const;
type Tab = typeof TABS[number];

// ── Component ─────────────────────────────────────────────
export default function SupervisorProjectDetail() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Material"); // Default ke material untuk demo
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  
  const selectedMaterial = AVAILABLE_MATERIALS.find(m => m.id.toString() === selectedMaterialId);
  const isCritical = selectedMaterial ? selectedMaterial.stock <= selectedMaterial.min : false;

  return (
    <DashboardShell
      role="supervisor"
      title="Detail Proyek"
      backUrl="/dashboard/supervisor/projects"
      headerActions={
        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-600 border border-red-200 shadow-sm animate-pulse">
          MOCKUP DATA
        </span>
      }
    >

          {/* Project Info Header */}
          <div className="p-4 sm:p-5 lg:p-7 pb-0">
             <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: C.border }}>
               <div className="p-4 space-y-3">
                 <div className="flex items-start justify-between gap-3">
                   <p className="text-sm sm:text-base font-bold leading-tight" style={{ color: C.text }}>{PROJECT.name}</p>
                   <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${getStatusStyle(PROJECT.status)}`}>
                     {getStatusLabel(PROJECT.status)}
                   </span>
                 </div>
                 <div className="flex items-center gap-1.5" style={{ color: C.muted }}>
                   <MapPin size={13} className="shrink-0 text-orange-500" />
                   <span className="text-xs font-medium truncate">{PROJECT.location}</span>
                 </div>
               </div>
             </div>
          </div>

          {/* Tabs Navigation */}
          <div className="sticky top-0 z-10 px-4 sm:px-5 lg:px-7 pt-4 pb-0 bg-slate-50/80 backdrop-blur-md">
            <div className="flex gap-1 rounded-xl p-1 border bg-white shadow-sm" style={{ borderColor: C.border }}>
              {TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ${activeTab === tab ? "bg-orange-500 text-white shadow-sm" : "hover:bg-slate-50 text-slate-500"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-7 pt-4 space-y-5 pb-24">
             {activeTab === "Overview" && (
                <div className="rounded-xl border p-4 bg-white" style={{ borderColor: C.border }}>
                  <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Deskripsi Pekerjaan</h2>
                  <p className="text-sm leading-relaxed font-medium" style={{ color: C.subtext }}>{PROJECT.description}</p>
                </div>
             )}

             {activeTab === "Material" && (
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Riwayat Penggunaan</h2>
                 </div>
                 
                 <div className="space-y-3">
                   {MATERIALS_USED.map((m) => (
                     <div key={m.id} className="rounded-xl border p-4 flex items-center justify-between gap-3 bg-white" style={{ borderColor: C.border }}>
                       <div className="flex items-start gap-3 flex-1 min-w-0">
                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                           <Package size={18} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold truncate" style={{ color: C.text }}>{m.name}</p>
                           <p className="text-xs font-medium text-slate-500 mt-0.5">{m.date}</p>
                         </div>
                       </div>
                       <div className="text-right shrink-0">
                         <p className="text-sm font-black text-orange-600">-{m.qty}</p>
                         <p className="text-[10px] font-bold text-slate-400">{m.unit}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>

        {/* FAB (Floating Action Button) for Mobile / Sticky Button for Desktop */}
        {activeTab === "Material" && (
          <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-8 pointer-events-none z-30">
            <button 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-orange-500/30 transition-all active:scale-95 pointer-events-auto"
            >
              <Plus size={18} /> Catat Penggunaan Material
            </button>
          </div>
        )}
      {/* ═══════════ MODAL PENCATATAN MATERIAL ═══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          {/* Modal Content - Bottom Sheet on Mobile, Centered Modal on Desktop */}
          <div className="relative w-full max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between bg-white rounded-t-3xl sm:rounded-t-2xl sticky top-0 z-10" style={{ borderColor: C.border }}>
              <div>
                <h2 className="font-bold text-base text-slate-900">Penggunaan Material</h2>
                <p className="text-[10px] font-medium text-slate-500 line-clamp-1">{PROJECT.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 bg-slate-50 rounded-full transition-colors text-slate-500">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* 1. Pilih Material */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 text-slate-700">Pilih Material</label>
                <div className="relative">
                  <select 
                    className="w-full pl-4 pr-10 py-3 rounded-xl border text-sm font-bold outline-none appearance-none focus:border-orange-500 transition-colors bg-slate-50 border-slate-200"
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                  >
                    <option value="" disabled>Cari atau pilih material...</option>
                    {AVAILABLE_MATERIALS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. Informasi Stok (Muncul jika material dipilih) */}
              {selectedMaterial && (
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${isCritical ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCritical ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                      {isCritical ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stok Tersedia</p>
                      <p className={`text-base font-black ${isCritical ? "text-amber-700" : "text-emerald-700"}`}>
                        {selectedMaterial.stock} <span className="text-xs font-bold opacity-70">{selectedMaterial.unit}</span>
                      </p>
                    </div>
                  </div>
                  {isCritical && (
                    <span className="text-[9px] font-bold px-2 py-1 rounded border bg-amber-100 text-amber-700 border-amber-200">
                      Stok Menipis
                    </span>
                  )}
                </div>
              )}

              {/* 3. Input Jumlah */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 text-slate-700">Jumlah Digunakan</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full pl-4 pr-16 py-3 rounded-xl border text-sm font-bold outline-none border-slate-200 focus:border-orange-500 transition-colors"
                  />
                  <div className="absolute right-1 top-1 bottom-1 px-3 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {selectedMaterial?.unit || "UNIT"}
                    </span>
                  </div>
                </div>
                {selectedMaterial && (
                  <p className="text-[10px] text-slate-500 ml-1 mt-1">Sisa stok setelah penggunaan akan otomatis diperbarui.</p>
                )}
              </div>

              {/* 4. Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 text-slate-700">Catatan Penggunaan (Opsional)</label>
                <textarea 
                  rows={2}
                  placeholder="Contoh: Digunakan untuk area lantai 2..."
                  className="w-full px-4 py-3 rounded-xl border text-xs font-medium outline-none border-slate-200 focus:border-orange-500 transition-colors resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t flex gap-3 bg-slate-50 sm:rounded-b-2xl pb-8 sm:pb-4" style={{ borderColor: C.border }}>
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="flex-[2] py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                disabled={!selectedMaterialId}
              >
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
