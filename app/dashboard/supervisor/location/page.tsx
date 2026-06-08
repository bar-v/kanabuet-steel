"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut, Menu, X, ArrowLeft,
  MapPin, Navigation, Camera, CheckCircle2, AlertCircle, FileText, Upload,
  Map as MapIcon, Loader2, ChevronDown, UserCircle2, CalendarClock,
} from "lucide-react";
import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";
import type { Project, User } from "@/lib/types/database";
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full rounded-lg border border-slate-200 bg-slate-50 animate-pulse flex items-center justify-center text-slate-400"><MapPin size={32} /></div>
});

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ── Design tokens — light mode ──
const C = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#334155",
  muted: "#64748B",
  sidebar: "#F1F5F9",
  header: "#FFFFFF",
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
  const [locationData, setLocationData] = useState<{ lat: number, lng: number } | null>(null);
  const [surveyNotes, setSurveyNotes] = useState("");
  const [materialEstimate, setMaterialEstimate] = useState("");
  const [photosUploaded, setPhotosUploaded] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
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

  // Restore active project from localStorage
  useEffect(() => {
    if (pendingProjects.length > 0 && selectedProjectId === "") {
      const active = localStorage.getItem("active_project_id");
      if (active && pendingProjects.some(p => p.project_id.toString() === active)) {
        setSelectedProjectId(active);
      }
    }
  }, [pendingProjects, selectedProjectId]);

  const selectedProject = pendingProjects.find(
    p => p.project_id.toString() === selectedProjectId
  );

  const initialLocation = selectedProject?.latitude && selectedProject?.longitude
    ? { lat: selectedProject.latitude, lng: selectedProject.longitude }
    : null;

  // Helper untuk hitung jarak (Haversine formula)
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // dalam meter
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // GPS fetch dari perangkat
  const handleGetLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Perangkat tidak mendukung GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const actualLat = pos.coords.latitude;
        const actualLng = pos.coords.longitude;

        if (initialLocation) {
          const distance = getDistanceInMeters(initialLocation.lat, initialLocation.lng, actualLat, actualLng);
          if (distance > 50) {
            alert(`Lokasi Anda (${distance.toFixed(1)} meter) berada di luar radius 50 meter dari inisial pin proyek. Silakan mendekat ke lokasi proyek.`);
            setIsLocating(false);
            return;
          }
        }

        setLocationData({
          lat: actualLat,
          lng: actualLng,
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
      const photoUrls: string[] = [];

      // Upload photos first
      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          setUploadStatus(`Mengunggah foto ${i + 1}/${photoFiles.length}...`);
          const file = photoFiles[i];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("project_id", String(selectedProjectId));

          const uploadRes = await fetch('/api/supervisor/upload', {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            photoUrls.push(url);
          } else {
            console.warn("Upload foto gagal untuk file:", file.name);
          }
        }
      }

      setUploadStatus("Menyimpan data...");

      const res = await fetch(`/api/supervisor/projects/${selectedProjectId}/validate-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: locationData.lat,
          longitude: locationData.lng,
          survey_notes: (surveyNotes.trim() + (materialEstimate.trim() ? `\n\n[Estimasi Material Awal]:\n${materialEstimate.trim()}` : "")) || null,
          photo_urls: photoUrls,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Gagal memvalidasi lokasi.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setUploadStatus(null);
      setIsSuccess(true);

      // Redirect setelah sukses
      setTimeout(() => {
        router.push('/dashboard/supervisor');
      }, 2000);
    } catch {
      alert("Terjadi kesalahan saat memvalidasi.");
      setIsSubmitting(false);
      setUploadStatus(null);
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
          {!selectedProject && (
            <section className="rounded-xl border bg-white overflow-hidden shadow-sm p-5" style={{ borderColor: C.border }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Pilih Proyek untuk Divalidasi</p>
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedProjectId(val);
                      if (val) localStorage.setItem("active_project_id", val);
                    }}
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
            </section>
          )}

          {selectedProject && (
            <div className="space-y-4">

              {/* BOX 1: Informasi Inisiasi */}
              <div className="rounded-xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
                <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm sm:text-base font-bold leading-tight" style={{ color: C.text }}>{selectedProject.project_name}</p>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-sky-50 text-sky-700 border border-sky-200">
                      Menunggu Validasi
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-orange-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium" style={{ color: C.muted }}>Lokasi Sementara</p>
                        <p className="text-xs font-semibold leading-snug" style={{ color: C.text }}>{selectedProject.project_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <UserCircle2 size={13} className="text-orange-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium" style={{ color: C.muted }}>Klien</p>
                        <p className="text-xs font-semibold" style={{ color: C.text }}>{selectedProject.client_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarClock size={13} className="text-orange-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium" style={{ color: C.muted }}>Mulai</p>
                        <p className="text-xs font-semibold" style={{ color: C.text }}>{formatDate(selectedProject.start_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarClock size={13} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium" style={{ color: C.muted }}>Tenggat</p>
                        <p className="text-xs font-semibold text-amber-400">{formatDate(selectedProject.estimated_finish)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOX 2: Validasi Lokasi Aktual */}
              <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3" style={{ borderColor: C.border }}>
                <div>
                  <h3 className="text-sm font-black text-slate-800">1. Validasi Lokasi Aktual</h3>
                  <p className="text-xs text-slate-500">Ambil koordinat GPS di lokasi pengerjaan fisik proyek</p>
                </div>

                {locationData || initialLocation ? (
                  <div className="mt-2 animate-in fade-in duration-500">
                    <MapPicker
                      position={locationData}
                      initialPosition={initialLocation}
                      initialRadius={50}
                    />
                    {locationData && (
                      <div className="mt-3 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-lg border border-emerald-200 flex items-center justify-center gap-2">
                        <MapPin size={16} />
                        <p className="text-sm font-bold tracking-wide">
                          {locationData.lat.toFixed(6)}° , {locationData.lng.toFixed(6)}°
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-32 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 flex-col">
                    <MapIcon size={36} className="mb-2 opacity-60" />
                    <p className="text-[11px] font-bold text-slate-500">Peta Belum Tervalidasi</p>
                  </div>
                )}

                {!locationData ? (
                  <button
                    onClick={handleGetLocation} disabled={isLocating}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                  >
                    {isLocating ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isLocating ? "Mengambil GPS..." : "Ambil Titik Koordinat GPS"}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <p className="text-xs font-bold">Titik Koordinat GPS Terkunci</p>
                  </div>
                )}
              </section>

              {/* BOX 3: Laporan Survei Awal */}
              <section className={`rounded-xl border bg-white p-4 shadow-sm space-y-4 transition-all duration-300 ${!locationData ? "opacity-50 pointer-events-none grayscale" : ""}`} style={{ borderColor: C.border }}>
                <div>
                  <h3 className="text-sm font-black text-slate-800">2. Laporan Survei Awal</h3>
                  <p className="text-xs text-slate-500">Konfirmasi kondisi lapangan sebelum proyek dimulai</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Catatan Survei & Akses Jalan <span className="text-red-500">*</span></label>
                  <textarea
                    value={surveyNotes} onChange={(e) => setSurveyNotes(e.target.value)}
                    rows={2}
                    placeholder="Contoh"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none border-slate-200 focus:border-orange-500 transition-colors resize-none bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Estimasi Material Awal (Opsional)</label>
                  <textarea
                    value={materialEstimate} onChange={(e) => setMaterialEstimate(e.target.value)}
                    rows={2}
                    placeholder="Contoh"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none border-slate-200 focus:border-orange-500 transition-colors resize-none bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Foto Lokasi Awal (Maks 3)</label>

                  {photoFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {photoFiles.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newFiles = [...photoFiles];
                              newFiles.splice(idx, 1);
                              setPhotoFiles(newFiles);
                              setPhotosUploaded(newFiles.length > 0);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-white/80 backdrop-blur rounded-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {photoFiles.length < 3 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-slate-300 rounded-xl h-24 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all bg-slate-50 hover:bg-slate-100 hover:border-orange-300"
                    >
                      <Upload size={24} className="text-slate-400" />
                      <p className="text-[11px] font-bold text-slate-500">Klik untuk tambah foto</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const newArr = [...photoFiles, ...Array.from(files)].slice(0, 3);
                      setPhotoFiles(newArr);
                      setPhotosUploaded(newArr.length > 0);
                    }}
                    className="hidden"
                  />
                </div>
              </section>

            </div>
          )}

          <div className="h-24" /> {/* Bottom Spacer */}
        </main>

        {/* BOTTOM ACTION BAR */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-white border-t transition-all duration-500 transform ${locationData && selectedProjectId ? "translate-y-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]" : "translate-y-full"}`} style={{ borderColor: C.border }}>
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-2 text-center">
            <button
              onClick={handleSubmitValidation}
              disabled={!isFormComplete || isSubmitting}
              className="w-full px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSubmitting ? (uploadStatus || "Memproses Validasi...") : "Validasi & Mulai Proyek"}
            </button>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              *Pastikan data valid. Menekan tombol ini akan mengubah status proyek menjadi <span className="font-bold text-orange-500">Aktif</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
