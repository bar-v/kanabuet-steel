"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { CreateProjectInput, ProjectStatus } from "@/lib/types/database";
import { X } from "lucide-react";
import { formatAddressFromNominatim } from "@/lib/utils/formatters";

// Dynamic import for Leaflet map to avoid SSR issues
const DynamicMapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 font-medium text-sm">
      <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      Memuat Peta...
    </div>
  ),
});

type GpsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const supabase = createClient();

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namaProyek, setNamaProyek] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectAddress, setProjectAddress] = useState("");

  // Supervisor
  const [supervisors, setSupervisors] = useState<{ user_id: number; fullname: string }[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

  // Fetch supervisors
  useEffect(() => {
    const fetchSupervisors = async () => {
      const { data } = await supabase
        .from("users")
        .select("user_id, fullname")
        .eq("system_role", "supervisor")
        .eq("is_active", true)
        .order("fullname");
      if (data) setSupervisors(data);
    };
    fetchSupervisors();
  }, [supabase]);

  // Posisi Peta
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gps, setGps] = useState<GpsState>({ status: "idle" });

  const handleAmbilGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGps({ status: "error", message: "Perangkat tidak mendukung GPS." });
      return;
    }
    setGps({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGps((prev) => {
          if (prev.status === "idle") return prev;
          return { status: "success" };
        });

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          const maskedAddress = formatAddressFromNominatim(data);
          if (maskedAddress) {
            setProjectAddress(maskedAddress);
          }
        } catch (error) {
          console.error("Gagal mendapatkan alamat:", error);
        }
      },
      (err) => {
        setGps((prev) => {
          if (prev.status === "idle") return prev;
          return {
            status: "error",
            message: `Gagal mengambil GPS: ${err.message}`,
          };
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleBatalkanGps = useCallback(() => {
    setGps({ status: "idle" });
    setPosition(null);
    setProjectAddress("");
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const maskedAddress = formatAddressFromNominatim(data);
      if (maskedAddress) {
        setProjectAddress(maskedAddress);
      }
    } catch (error) {
      console.error("Gagal mendapatkan alamat:", error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: CreateProjectInput = {
        project_name: namaProyek,
        client_name: clientName,
        client_phone: clientPhone || undefined,
        project_address: projectAddress,
        latitude: position?.lat ?? null,
        longitude: position?.lng ?? null,
        description: description || undefined,
        start_date: startDate || undefined,
        estimated_finish: endDate || undefined,
        status: "menunggu_validasi" as ProjectStatus,
        supervisor_id: selectedSupervisorId ? parseInt(selectedSupervisorId) : null,
      };

      const { error } = await supabase.from("projects").insert([payload]);
      if (error) throw error;

      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Gagal menyimpan proyek: ${msg}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-xl text-slate-800">Buat Proyek Baru</h2>
            <p className="text-xs text-slate-500 mt-0.5">Isi rincian untuk memulai proyek fabrikasi baja/besi baru.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-50 rounded-full text-orange-400 hover:text-orange-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="createProjectForm" className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Informasi Proyek */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block mb-1.5 font-bold text-xs text-slate-700">Nama Proyek *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm transition-all"
                  placeholder="mis. Pembuatan Kanopi Baja Ringan"
                  value={namaProyek}
                  onChange={(e) => setNamaProyek(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-xs text-slate-700">Nama Klien *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm transition-all"
                  placeholder="mis. PT. Indah Jaya / Bpk. Rudi"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-xs text-slate-700">Nomor Handphone Klien</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm transition-all"
                  placeholder="mis. 08123456789"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block mb-1.5 font-bold text-xs text-slate-700">Deskripsi / Spesifikasi Pekerjaan</label>
              <textarea
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm transition-all min-h-[100px]"
                placeholder="Rincikan dimensi tiang, jenis material, ketebalan, dll..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Supervisor */}
            <div>
              <label className="block mb-1.5 font-bold text-xs text-slate-700">Pengawas Proyek (Opsional)</label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm transition-all"
                value={selectedSupervisorId}
                onChange={(e) => setSelectedSupervisorId(e.target.value)}
              >
                <option value="">Kosongkan / Pilih Nanti</option>
                {supervisors.map((s) => (
                  <option key={s.user_id} value={s.user_id}>{s.fullname}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Jika diisi, proyek akan langsung masuk ke dashboard pengawas tersebut.</p>
            </div>

            {/* Jadwal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block mb-1.5 font-bold text-xs text-slate-700">Tanggal Mulai Target</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold text-xs text-slate-700">Tenggat Waktu Pekerjaan</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Lokasi Proyek */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">Lokasi Proyek</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tentukan lokasi proyek di peta atau ambil koordinat dari GPS perangkat Anda.</p>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-xs text-slate-700">Alamat Proyek *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm transition-all"
                  placeholder="mis. Jl. Merdeka No. 10, Kuta Alam, Banda Aceh"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  required
                />
              </div>

              <div className="w-full mt-2 relative z-0">
                <DynamicMapPicker position={position} onLocationSelect={handleMapClick} />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAmbilGps}
                    disabled={gps.status === "loading"}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {gps.status === "loading" ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                        Membaca GPS...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        Gunakan GPS Saat Ini
                      </>
                    )}
                  </button>
                  {position !== null && (
                    <button
                      type="button"
                      onClick={handleBatalkanGps}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors whitespace-nowrap"
                    >
                      Batal
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-500 bg-white px-3 py-2 rounded border border-slate-200">
                  {position ? (
                    <span>
                      Lat: <span className="text-emerald-600 font-bold">{position.lat.toFixed(6)}</span>,
                      Lng: <span className="text-emerald-600 font-bold">{position.lng.toFixed(6)}</span>
                    </span>
                  ) : (
                    <span>Koordinat belum ditentukan</span>
                  )}
                </div>
              </div>
              {gps.status === "error" && (
                <div className="flex items-start gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium mt-1">
                  {gps.message}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-orange-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="createProjectForm"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70 shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Menyimpan...
              </>
            ) : (
              "Simpan Data Proyek"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
