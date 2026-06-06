"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut, Menu, X, ArrowLeft,
  MapPin, Navigation, Camera, CheckCircle2, AlertCircle, FileText, Upload,
  Map as MapIcon, Loader2, ChevronDown,
} from "lucide-react";
import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";
import type { Project, User } from "@/lib/types/database";

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

export default function LocationValidationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [user, setUser] = useState<User | null>(null);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // States for Validation Workflow
  const [isLocating, setIsLocating] = useState(false);
  const [locationData, setLocationData] = useState<{lat: number, lng: number} | null>(null);
  const [surveyNotes, setSurveyNotes] = useState("");
  const [photosUploaded, setPhotosUploaded] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const resUser = await fetch('/api/auth/me');
      const { user } = await resUser.json();
      if (user) setUser(user as User);

      // Ambil proyek yang ditugaskan — filter menunggu_validasi
      const resProjects = await fetch('/api/supervisor/projects');
      const { projects } = await resProjects.json();
      if (projects) {
        setPendingProjects(
          (projects as Project[]).filter(p => p.status === "menunggu_validasi")
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedProject = pendingProjects.find(
    p => p.project_id.toString() === selectedProjectId
  );

  // GPS fetch dari perangkat
  const handleGetLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Perangkat tidak mendukung GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationData({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        alert(`Gagal mengambil GPS: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileList = Array.from(files).slice(0, 3);
    setPhotoFiles(fileList);
    setPhotosUploaded(fileList.length > 0);
  };

  // Submit Validasi via API
  const handleSubmitValidation = async () => {
    if (!selectedProjectId || !locationData) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/supervisor/projects/${selectedProjectId}/validate-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: locationData.lat,
          longitude: locationData.lng,
          survey_notes: surveyNotes.trim() || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Gagal memvalidasi lokasi.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSuccess(true);

      // Redirect setelah sukses
      setTimeout(() => {
        router.push('/dashboard/supervisor');
      }, 2000);
    } catch {
      alert("Terjadi kesalahan saat memvalidasi.");
      setIsSubmitting(false);
    }
  };

  const isFormComplete = locationData && surveyNotes.length > 5 && selectedProjectId;

  const handleLogout = async () => {
    const { logoutAction } = await import('@/app/login/actions');
    await logoutAction();
    document.cookie = "system_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "SV";

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
          {SUPERVISOR_NAV.map(({ label, Icon, href, matchPatterns }) => {
            const active = isNavActive(pathname, href, matchPatterns);
            return (
              <button key={label} onClick={() => { setSidebarOpen(false); router.push(href); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
                  ${active ? "bg-orange-500/15 text-orange-400 border border-orange-500/25" : "hover:bg-slate-100 hover:text-slate-900"}`}
                style={!active ? { color: C.subtext } : undefined}>
                <Icon size={17} style={!active ? { color: C.muted } : undefined} className={active ? "text-orange-400" : ""} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-4" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: C.text }}>{user?.fullname ?? "Memuat..."}</p>
              <p className="text-[11px] font-medium" style={{ color: C.muted }}>Supervisor</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
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

          {/* Success Overlay */}
          {isSuccess && (
            <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
               <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                 <CheckCircle2 size={40} />
               </div>
               <h2 className="text-xl font-black text-slate-800 mb-2">Proyek Tervalidasi!</h2>
               <p className="text-sm font-medium text-slate-500">Status proyek kini menjadi <span className="text-orange-500 font-bold">Aktif</span></p>
               <p className="text-xs text-slate-400 mt-6 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Mengalihkan ke Dashboard...</p>
            </div>
          )}

          {/* 0. PILIH PROYEK */}
          <section className="rounded-xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: C.border }}>
            <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Pilih Proyek untuk Divalidasi</p>

              {isLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500">Memuat proyek...</span>
                </div>
              ) : pendingProjects.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-500">Tidak ada proyek yang menunggu validasi.</p>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full appearance-none px-3 py-2.5 rounded-lg border text-sm font-medium pr-9 cursor-pointer outline-none focus:border-orange-500"
                    style={{ borderColor: C.border, background: C.bg, color: C.text }}
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {pendingProjects.map(p => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_name} — {p.client_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
                </div>
              )}

              {/* Informasi proyek terpilih */}
              {selectedProject && (
                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">Klien</p>
                    <p className="text-sm font-semibold text-slate-700">{selectedProject.client_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">Alamat Sementara (Input Owner)</p>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm font-semibold text-slate-700 leading-snug">{selectedProject.project_address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ALUR VALIDASI FORM — hanya tampil jika proyek dipilih */}
          {selectedProject && (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:md:mx-auto before:md:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
              
              {/* 1. VALIDASI LOKASI */}
              <section className="relative flex flex-col md:flex-row gap-6 items-start">
                 <div className="w-10 h-10 rounded-full bg-orange-100 border-4 border-white text-orange-600 flex items-center justify-center shrink-0 z-10 md:mx-auto md:order-2 shadow-sm">
                   <MapIcon size={18} />
                 </div>
                 <div className="flex-1 w-full md:order-1 md:text-right" /> {/* Spacer */}
                 
                 <div className="flex-1 w-full md:order-3 bg-white rounded-xl border shadow-sm p-5 space-y-4" style={{ borderColor: C.border }}>
                   <div>
                     <h3 className="text-sm font-bold text-slate-800">1. Validasi Lokasi Aktual</h3>
                     <p className="text-[11px] text-slate-500 mt-0.5">Ambil koordinat GPS di lokasi pengerjaan fisik proyek.</p>
                   </div>
                   
                   <div className="relative h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center group">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                      
                      {locationData ? (
                         <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-300">
                            <MapPin size={32} className="text-emerald-500 drop-shadow-md pb-1" />
                            <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-emerald-100 mt-2">
                               <p className="text-xs font-black text-emerald-700 text-center tracking-wide">
                                 {locationData.lat.toFixed(4)}° N , {locationData.lng.toFixed(4)}° E
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
                     <button 
                       onClick={handleGetLocation} disabled={isLocating}
                       className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                     >
                       {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                       {isLocating ? "Mencari Satelit GPS..." : "Ambil Titik Koordinat GPS"}
                     </button>
                   ) : (
                     <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <p className="text-[11px] font-semibold text-emerald-800 leading-tight">Koordinat lokasi berhasil dikunci dan terverifikasi oleh sistem.</p>
                     </div>
                   )}
                 </div>
              </section>

              {/* 2. KONFIRMASI LAPANGAN */}
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
                      <label className="text-xs font-bold ml-1 text-slate-700">Foto Lokasi Awal</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${photosUploaded ? "bg-sky-50 border-sky-300" : "bg-slate-50 border-slate-200 hover:border-orange-300"}`}
                      >
                        {photosUploaded ? (
                          <>
                            <div className="flex gap-2 mb-1">
                              {photoFiles.map((_, i) => (
                                <div key={i} className="w-10 h-10 rounded bg-sky-200/50 flex items-center justify-center"><Camera size={14} className="text-sky-600"/></div>
                              ))}
                            </div>
                            <p className="text-[11px] font-bold text-sky-700">{photoFiles.length} Foto Dipilih</p>
                          </>
                        ) : (
                          <>
                            <Upload size={20} className="text-slate-400" />
                            <p className="text-[11px] font-bold text-slate-600">Klik untuk upload foto (Max 3)</p>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                   </div>
                 </div>
              </section>

            </div>
          )}

          <div className="h-24" /> {/* Bottom Spacer */}
        </main>

        {/* BOTTOM ACTION BAR */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t transition-all duration-500 transform ${locationData && selectedProjectId ? "translate-y-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]" : "translate-y-full"}`} style={{ borderColor: C.border }}>
           <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-500 w-full sm:w-auto">
                 <AlertCircle size={16} className="shrink-0" />
                 <p className="text-[10px] font-medium leading-snug">Pastikan data valid. Menekan tombol ini akan mengubah status proyek menjadi <span className="font-bold text-orange-600">Aktif</span>.</p>
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
