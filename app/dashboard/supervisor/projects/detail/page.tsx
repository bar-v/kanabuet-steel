"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid, FolderOpen, TrendingUp, Package, LogOut, Menu, X, ArrowLeft,
  MapPin, CalendarClock, Activity, Upload, ImageIcon, ChevronRight, Plus,
  Search, AlertTriangle, CheckCircle2
} from "lucide-react";

// ── Design tokens — light mode ──
const C = {
  bg:      "#F8FAFC",
  card:    "#FFFFFF",
  border:  "#E2E8F0",
  text:    "#0F172A",
  subtext: "#334155",
  muted:   "#64748B",
  sidebar: "#F1F5F9",
  header:  "#FFFFFF",
};

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

import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";

const TABS = ["Overview", "Material"] as const;
type Tab = typeof TABS[number];

// ── Helpers ───────────────────────────────────────────────
function statusBadge(s: string) {
  if (s === "completed")   return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "on_progress") return "bg-orange-50  text-orange-700  border border-orange-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}
function statusLabel(s: string) {
  if (s === "completed") return "Selesai";
  if (s === "on_progress") return "Aktif";
  return "Pending";
}
function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-orange-400";
  return "bg-amber-500";
}

// ── Component ─────────────────────────────────────────────
export default function SupervisorProjectDetail() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Material"); // Default ke material untuk demo
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  
  const selectedMaterial = AVAILABLE_MATERIALS.find(m => m.id.toString() === selectedMaterialId);
  const isCritical = selectedMaterial ? selectedMaterial.stock <= selectedMaterial.min : false;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, color: C.text }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 flex flex-col border-r transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        style={{ background: C.sidebar, borderColor: C.border }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: C.border }}>
          <Image src="/images/logo.png" alt="logo" width={36} height={36} className="object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
          <div className="flex-1 min-w-0">
            <p className="text-orange-500 font-black text-sm tracking-wider leading-none truncate">KANABUET STEEL</p>
            <p className="text-[10px] tracking-wide mt-0.5 font-medium" style={{ color: C.subtext }}>Fabrication Management System</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden hover:text-slate-900 transition-colors" style={{ color: C.muted }}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {SUPERVISOR_NAV.map(({ label, Icon, href, matchPatterns }) => {
            const active = isNavActive(pathname, href, matchPatterns);
            return (
              <button
                key={label}
                onClick={() => { setSidebarOpen(false); router.push(href); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
                  ${active
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                    : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                style={!active ? { color: C.subtext } : undefined}
              >
                <Icon size={17} style={!active ? { color: C.muted } : undefined} className={active ? "text-orange-400" : ""} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-4" style={{ borderColor: C.border }}>
           <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 font-bold text-sm">SV</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: C.text }}>Dummy 3</p>
              <p className="text-[11px] font-medium" style={{ color: C.muted }}>Supervisor</p>
            </div>
          </div>
          <button onClick={() => router.push('/login')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-5 backdrop-blur border-b" style={{ height: 60, background: `${C.header}E6`, borderColor: C.border }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: C.muted }}>
            <Menu size={20} />
          </button>

          <button onClick={() => router.push('/dashboard/supervisor')} className="p-2 -ml-2 sm:ml-0 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-medium" style={{ color: C.subtext }}>
            <ArrowLeft size={16} />
            <span className="hidden sm:block">Kembali</span>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate" style={{ color: C.text }}>Detail Proyek</h1>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto">

          {/* Project Info Header */}
          <div className="p-4 sm:p-5 lg:p-7 pb-0">
             <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: C.border }}>
               <div className="p-4 space-y-3">
                 <div className="flex items-start justify-between gap-3">
                   <p className="text-sm sm:text-base font-bold leading-tight" style={{ color: C.text }}>{PROJECT.name}</p>
                   <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusBadge(PROJECT.status)}`}>
                     {statusLabel(PROJECT.status)}
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
        </main>

        {/* FAB (Floating Action Button) for Mobile / Sticky Button for Desktop */}
        {activeTab === "Material" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-8 pointer-events-none">
            <button 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-orange-500/30 transition-all active:scale-95 pointer-events-auto"
            >
              <Plus size={18} /> Catat Penggunaan Material
            </button>
          </div>
        )}
      </div>

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

    </div>
  );
}
