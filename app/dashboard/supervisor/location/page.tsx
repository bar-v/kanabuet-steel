"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, FolderOpen, TrendingUp, Package, LogOut, Menu, X, ArrowLeft,
  MapPin, Navigation, Camera, CheckCircle2, AlertCircle, FileText, Upload,
  Map as MapIcon, Loader2
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
const PROJECT_PENDING = {
  name: "Pembangunan Gudang Logistik B",
  client: "PT. Maju Bersama",
  raw_address: "Kawasan Industri Terpadu, Blok C4 (Patokan dekat pabrik es)",
  supervisor: "Dummy 3",
  status: "pending"
};

const NAV = [
  { label: "Dashboard", Icon: LayoutGrid, active: false, href: "/dashboard/supervisor"          },
  { label: "Proyek",    Icon: FolderOpen, active: false, href: "/dashboard/supervisor/projects/detail" },
  { label: "Progress",  Icon: TrendingUp, active: false, href: "/dashboard/supervisor/progress"  },
  { label: "Material",  Icon: Package,    active: false, href: "/dashboard/supervisor"           },
];

export default function LocationValidationPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // States for Validation Workflow
  const [isLocating, setIsLocating] = useState(false);
  const [locationData, setLocationData] = useState<{lat: string, lng: string} | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [surveyNotes, setSurveyNotes] = useState("");
  const [materialNeeds, setMaterialNeeds] = useState("");
  const [photosUploaded, setPhotosUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Simulate GPS Fetch (Tahap 4.1)
  const handleGetLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setLocationData({ lat: "5.5483° N", lng: "95.3238° E" });
      setIsLocating(false);
    }, 1500);
  };

  // Simulate Manual Geocoding (Tahap 4.2)
  const handleManualGeocoding = () => {
    setIsLocating(true);
    setTimeout(() => {
      setLocationData({ lat: "5.5510° N", lng: "95.3180° E" }); // Koordinat hasil geocoding
      setIsLocating(false);
      setIsManualMode(false);
    }, 1500);
  };

  // Simulate Form Submit (Tahap 6 & 7)
  const handleSubmitValidation = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Automatically redirect after success
      setTimeout(() => {
        router.push('/dashboard/supervisor');
      }, 2000);
    }, 1500);
  };

  const isFormComplete = locationData && surveyNotes.length > 5;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, color: C.text }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
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
            <p className="text-[10px] tracking-wide mt-0.5 font-medium" style={{ color: C.subtext }}>Fabrication Management</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden hover:text-slate-900 transition-colors" style={{ color: C.muted }}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV.map(({ label, Icon, active, href }) => (
            <button key={label} onClick={() => { setSidebarOpen(false); router.push(href); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
                ${active ? "bg-orange-500/15 text-orange-600 border border-orange-500/25" : "hover:bg-slate-100 hover:text-slate-900"}`}
              style={!active ? { color: C.subtext } : undefined}>
              <Icon size={17} style={!active ? { color: C.muted } : undefined} className={active ? "text-orange-600" : ""} />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t p-4" style={{ borderColor: C.border }}>
          <button onClick={() => router.push('/login')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* HEADER */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-5 backdrop-blur border-b" style={{ height: 60, background: `${C.header}E6`, borderColor: C.border }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: C.muted }}>
            <Menu size={20} />
          </button>
          <button onClick={() => router.push('/dashboard/supervisor')} className="p-2 -ml-2 sm:ml-0 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-medium" style={{ color: C.subtext }}>
            <ArrowLeft size={16} /> <span className="hidden sm:block">Kembali</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate" style={{ color: C.text }}>Validasi Lapangan</h1>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8 space-y-6">

          {/* Success Overlay Simulation */}
          {isSuccess && (
            <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
               <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                 <CheckCircle2 size={40} />
               </div>
               <h2 className="text-xl font-black text-slate-800 mb-2">Proyek Tervalidasi!</h2>
               <p className="text-sm font-medium text-slate-500">Status proyek kini menjadi <span className="text-orange-500 font-bold">On Progress</span></p>
               <p className="text-xs text-slate-400 mt-6 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Mengalihkan ke Dashboard...</p>
            </div>
          )}

          {/* 1. INFO PROYEK (Tahap 1-3) */}
          <section className="rounded-xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: C.border }}>
             <div className="h-1 bg-slate-300" />
             <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                   <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Informasi Inisiasi (Owner)</p>
                      <h2 className="text-lg font-black leading-tight text-slate-800">{PROJECT_PENDING.name}</h2>
                   </div>
                   <span className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-200">
                     {PROJECT_PENDING.status}
                   </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-200">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 mb-1">Klien</p>
                     <p className="text-sm font-semibold text-slate-700">{PROJECT_PENDING.client}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 mb-1">Alamat Sementara (Input Owner)</p>
                     <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-sm font-semibold text-slate-700 leading-snug">{PROJECT_PENDING.raw_address}</p>
                     </div>
                   </div>
                </div>
             </div>
          </section>

          {/* ALUR VALIDASI FORM */}
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:md:mx-auto before:md:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
            
            {/* 2. VALIDASI LOKASI (Tahap 4 & 5) */}
            <section className="relative flex flex-col md:flex-row gap-6 items-start">
               <div className="w-10 h-10 rounded-full bg-orange-100 border-4 border-white text-orange-600 flex items-center justify-center shrink-0 z-10 md:mx-auto md:order-2 shadow-sm">
                 <MapIcon size={18} />
               </div>
               <div className="flex-1 w-full md:order-1 md:text-right" /> {/* Spacer for desktop alternating layout */}
               
               <div className="flex-1 w-full md:order-3 bg-white rounded-xl border shadow-sm p-5 space-y-4" style={{ borderColor: C.border }}>
                 <div>
                   <h3 className="text-sm font-bold text-slate-800">1. Validasi Lokasi Aktual</h3>
                   <p className="text-[11px] text-slate-500 mt-0.5">Ambil koordinat GPS di lokasi pengerjaan fisik proyek.</p>
                 </div>
                 
                 <div className="relative h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center group">
                    {/* Simulated Map Background */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                    
                    {locationData ? (
                       <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-300">
                          <MapPin size={32} className="text-emerald-500 drop-shadow-md pb-1" />
                          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-emerald-100 mt-2">
                             <p className="text-xs font-black text-emerald-700 text-center tracking-wide">
                               {locationData.lat} , {locationData.lng}
                             </p>
                          </div>
                       </div>
                    ) : (
                       <div className="relative z-10 text-slate-400 flex flex-col items-center">
                          <MapIcon size={32} className="mb-2 opacity-50" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Peta Belum Tervalidasi</p>
                       </div>
                    )}
                 </div>

                 {!locationData ? (
                   <>
                     <button 
                       onClick={handleGetLocation} disabled={isLocating}
                       className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                     >
                       {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                       {isLocating ? "Mencari Satelit GPS..." : "Ambil Titik Koordinat GPS"}
                     </button>
                     
                     {!isManualMode && (
                       <button 
                         onClick={() => setIsManualMode(true)} 
                         className="w-full mt-2 py-2 border hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors text-slate-500"
                         style={{ borderColor: C.border }}
                       >
                         GPS Bermasalah? Gunakan Validasi Manual
                       </button>
                     )}

                     {isManualMode && (
                       <div className="mt-3 p-4 rounded-xl border bg-slate-50 space-y-3 animate-in slide-in-from-top-2" style={{ borderColor: C.border }}>
                         <div>
                           <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">1. Cari Alamat (Geocoding)</label>
                           <div className="flex gap-2 mt-1.5">
                             <input 
                               type="text" 
                               value={manualAddress}
                               onChange={(e) => setManualAddress(e.target.value)}
                               placeholder="Ketik alamat untuk dikonversi..."
                               className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border outline-none border-slate-200 focus:border-orange-500"
                             />
                             <button 
                               onClick={handleManualGeocoding}
                               disabled={isLocating || manualAddress.length < 5}
                               className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {isLocating ? <Loader2 size={14} className="animate-spin" /> : "Cari"}
                             </button>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="flex-1 h-px bg-slate-200" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Atau</p>
                           <div className="flex-1 h-px bg-slate-200" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">2. Pinpoint Langsung</label>
                           <button className="w-full py-2.5 bg-white border text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors text-slate-700 flex items-center justify-center gap-2" style={{ borderColor: C.border }}>
                             <MapIcon size={14} className="text-orange-500" /> Pilih Titik Secara Manual di Peta
                           </button>
                         </div>
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <p className="text-[11px] font-semibold text-emerald-800 leading-tight">Koordinat lokasi berhasil dikunci dan terverifikasi oleh sistem.</p>
                   </div>
                 )}
               </div>
            </section>

            {/* 3. KONFIRMASI LAPANGAN (Tahap 6) */}
            <section className="relative flex flex-col md:flex-row gap-6 items-start">
               <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shrink-0 z-10 md:mx-auto md:order-2 shadow-sm transition-colors duration-300 ${locationData ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"}`}>
                 <FileText size={18} />
               </div>
               
               <div className="flex-1 w-full md:order-3" /> {/* Spacer */}
               
               <div className={`flex-1 w-full md:order-1 bg-white rounded-xl border shadow-sm p-5 space-y-5 transition-all duration-300 ${!locationData ? "opacity-50 pointer-events-none grayscale" : ""}`} style={{ borderColor: C.border }}>
                 <div>
                   <h3 className="text-sm font-bold text-slate-800">2. Laporan Survei Awal</h3>
                   <p className="text-[11px] text-slate-500 mt-0.5">Konfirmasi kondisi lapangan sebelum proyek dimulai.</p>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-bold ml-1 text-slate-700">Catatan Survei & Akses Jalan <span className="text-red-500">*</span></label>
                   <textarea 
                     value={surveyNotes} onChange={(e) => setSurveyNotes(e.target.value)}
                     rows={3}
                     placeholder="Contoh: Akses jalan sempit untuk truk besar, area pemasangan rata..."
                     className="w-full px-4 py-3 rounded-xl border text-xs font-medium outline-none border-slate-200 focus:border-orange-500 transition-colors resize-none bg-slate-50 focus:bg-white"
                   />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-bold ml-1 text-slate-700">Estimasi Material Awal (Opsional)</label>
                   <textarea 
                     value={materialNeeds} onChange={(e) => setMaterialNeeds(e.target.value)}
                     rows={2}
                     placeholder="Contoh: Butuh tambahan semen 2 sak untuk cor tapak..."
                     className="w-full px-4 py-3 rounded-xl border text-xs font-medium outline-none border-slate-200 focus:border-orange-500 transition-colors resize-none bg-slate-50 focus:bg-white"
                   />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold ml-1 text-slate-700">Foto Lokasi Awal</label>
                    <div 
                      onClick={() => setPhotosUploaded(!photosUploaded)}
                      className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${photosUploaded ? "bg-sky-50 border-sky-300" : "bg-slate-50 border-slate-200 hover:border-orange-300"}`}
                    >
                      {photosUploaded ? (
                        <>
                          <div className="flex gap-2 mb-1">
                            <div className="w-10 h-10 rounded bg-sky-200/50 flex items-center justify-center"><Camera size={14} className="text-sky-600"/></div>
                            <div className="w-10 h-10 rounded bg-sky-200/50 flex items-center justify-center"><Camera size={14} className="text-sky-600"/></div>
                          </div>
                          <p className="text-[11px] font-bold text-sky-700">2 Foto Diunggah</p>
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="text-slate-400" />
                          <p className="text-[11px] font-bold text-slate-600">Klik untuk upload foto (Max 3)</p>
                        </>
                      )}
                    </div>
                 </div>
               </div>
            </section>

          </div>

          <div className="h-24" /> {/* Bottom Spacer */}
        </main>

        {/* BOTTOM ACTION BAR (Tahap 7) */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t transition-all duration-500 transform ${locationData ? "translate-y-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]" : "translate-y-full"}`} style={{ borderColor: C.border }}>
           <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-500 w-full sm:w-auto">
                 <AlertCircle size={16} className="shrink-0" />
                 <p className="text-[10px] font-medium leading-snug">Pastikan data valid. Menekan tombol ini akan mengubah status proyek menjadi <span className="font-bold text-orange-600">On Progress</span>.</p>
              </div>
              <button 
                onClick={handleSubmitValidation}
                disabled={!isFormComplete || isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isSubmitting ? "Memproses Validasi..." : "Validasi & Mulai Proyek"}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
