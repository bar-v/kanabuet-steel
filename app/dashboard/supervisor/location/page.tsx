"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut, Menu, X, ArrowLeft, Search,
  MapPin, Navigation, Camera, CheckCircle2, AlertCircle, FileText, Upload,
  Map as MapIcon, Loader2, ChevronDown, UserCircle2, CalendarClock,
} from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import type { Project } from "@/lib/types/database";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/utils/fetcher";
import { C } from "@/lib/utils/theme";
import { formatDate } from "@/lib/utils/formatters";
import dynamic from 'next/dynamic';
import { useUI } from "@/contexts/UIContext";

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full rounded-lg border border-slate-200 bg-slate-50 animate-pulse flex items-center justify-center text-slate-400"><MapPin size={32} /></div>
});



export default function LocationValidationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useUI();

  // SWR data fetching
  const { data: projectsData, isLoading: projectsLoading } = useSWR('/api/supervisor/projects', fetcher);
  const pendingProjects = (projectsData?.projects as Project[])?.filter(p => p.status === "menunggu_validasi") || [];
  const isLoading = projectsLoading;

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Searchable Dropdown States
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  const filteredProjects = pendingProjects.filter(p =>
    p.project_name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    (p.client_name && p.client_name.toLowerCase().includes(projectSearchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (!projectDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".project-search-container")) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [projectDropdownOpen]);

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



  // Restore active project from localStorage
  useEffect(() => {
    if (pendingProjects.length > 0 && selectedProjectId === "") {
      const active = localStorage.getItem("active_project_id");
      if (active && pendingProjects.some(p => p.project_id.toString() === active)) {
        setTimeout(() => setSelectedProjectId(active), 0);
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
      showToast("Perangkat tidak mendukung GPS.", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const actualLat = pos.coords.latitude;
        const actualLng = pos.coords.longitude;

        if (initialLocation) {
          const distance = getDistanceInMeters(initialLocation.lat, initialLocation.lng, actualLat, actualLng);
          if (distance > 75) {
            showToast(`Lokasi Anda (${distance.toFixed(1)} meter) berada di luar radius 75 meter dari inisial pin proyek. Silakan mendekat ke lokasi proyek.`, "error");
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
        showToast(`Gagal mengambil GPS: ${err.message}`, "error");
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
        showToast(result.error || "Gagal memvalidasi lokasi.", "error");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setUploadStatus(null);
      setIsSuccess(true);

      mutate('/api/supervisor/projects');

      // Redirect setelah sukses
      setTimeout(() => {
        router.push('/dashboard/supervisor');
      }, 2000);
    } catch {
      showToast("Terjadi kesalahan saat memvalidasi.", "error");
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  const isFormComplete = locationData && surveyNotes.length > 5 && selectedProjectId;

  return (
    <DashboardShell role="supervisor" title="Validasi Lapangan">

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
          <section className="rounded-xl border bg-white shadow-sm p-5" style={{ borderColor: C.border }}>
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
              <div className="relative project-search-container">
                <button
                  type="button"
                  onClick={() => {
                    setProjectDropdownOpen(!projectDropdownOpen);
                    setProjectSearchQuery("");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none text-left flex items-center justify-between bg-white focus:border-orange-500 transition-all"
                  style={{ borderColor: C.border }}
                >
                  <span className={selectedProject ? "text-slate-900" : "text-slate-400"}>
                    {selectedProject ? `${selectedProject.project_name} (${selectedProject.client_name || 'Tanpa Klien'})` : "Pilih Proyek"}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${projectDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {projectDropdownOpen && (
                  <div
                    className="absolute z-[110] left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60 animate-in fade-in slide-in-from-top-1 duration-150"
                    style={{ borderColor: C.border }}
                  >
                    <div className="p-2 border-b flex items-center gap-2 bg-slate-50" style={{ borderColor: C.border }}>
                      <Search size={14} className="text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Cari proyek..."
                        value={projectSearchQuery}
                        onChange={(e) => setProjectSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-sm outline-none font-medium text-slate-800"
                        autoFocus
                      />
                      {projectSearchQuery && (
                        <button type="button" onClick={() => setProjectSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-48">
                      {filteredProjects.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                          Proyek tidak ditemukan
                        </div>
                      ) : (
                        filteredProjects.map((p) => (
                          <button
                            key={p.project_id}
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(p.project_id.toString());
                              localStorage.setItem("active_project_id", p.project_id.toString());
                              setLocationData(null);
                              setSurveyNotes("");
                              setMaterialEstimate("");
                              setPhotoFiles([]);
                              setPhotosUploaded(false);
                              setProjectDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-orange-50/30 flex flex-col gap-0.5"
                          >
                            <span className="font-bold text-slate-800">{p.project_name}</span>
                            <span className="text-[11px] text-slate-500">Klien: {p.client_name || 'Tanpa Klien'}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

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
                        {selectedProject.latitude && selectedProject.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${selectedProject.latitude},${selectedProject.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-sky-500 hover:text-sky-600 hover:underline transition-colors"
                          >
                            <Navigation size={10} /> Buka di Maps
                          </a>
                        )}
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
                      initialRadius={75}
                      onLocationSelect={(lat, lng) => {
                        if (initialLocation) {
                          const distance = getDistanceInMeters(initialLocation.lat, initialLocation.lng, lat, lng);
                          if (distance > 75) {
                            showToast(`Titik yang dipilih (${distance.toFixed(1)} meter) berada di luar radius 75 meter dari inisial pin.`, "error");
                            return;
                          }
                        }
                        setLocationData({ lat, lng });
                      }}
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
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <p className="text-xs font-bold">Titik Koordinat GPS Terkunci</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocationData(null)}
                      className="px-4 py-3 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors whitespace-nowrap active:scale-95"
                    >
                      Batal
                    </button>
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


        {/* BOTTOM ACTION BAR */}
        <div className={`fixed bottom-0 left-0 lg:left-64 right-0 z-30 p-4 sm:p-5 bg-white border-t transition-all duration-500 transform ${locationData && selectedProjectId ? "translate-y-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]" : "translate-y-full"}`} style={{ borderColor: C.border }}>
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

    </DashboardShell>
  );
}
