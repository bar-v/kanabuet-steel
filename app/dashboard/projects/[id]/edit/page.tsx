"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectStatus, User } from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";
import useSWR, { mutate } from "swr";
import CustomSelect from "@/components/ui/CustomSelect";

import { formatAddressFromNominatim } from "@/lib/utils/formatters";

const DynamicMapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-[250px] w-full bg-slate-100 rounded-lg flex items-center justify-center text-sm text-slate-400">Memuat Peta...</div>,
});

import { C } from "@/lib/utils/theme";
import { useUI } from "@/contexts/UIContext";

const STATUS_OPTIONS: { label: string; value: ProjectStatus }[] = [
  { label: "Menunggu Validasi", value: "menunggu_validasi" },
  { label: "Aktif", value: "aktif" },
  { label: "Tertunda", value: "tertunda" },
  { label: "Selesai", value: "selesai" },
];

interface Props { params: Promise<{ id: string }>; }

export default function EditProjectPage({ params }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useUI();

  const [projectId, setProjectId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supervisors, setSupervisors] = useState<User[]>([]);

  // Form state
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [description, setDescription] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("menunggu_validasi");
  const [supervisorId, setSupervisorId] = useState("");
  type GpsState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success" }
    | { status: "error"; message: string };

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

  useEffect(() => { params.then(({ id }) => setProjectId(Number(id))); }, [params]);

  const fetchProjectData = async () => {
    if (!projectId) return null;
    const supabase = createClient();
    const [{ data: p }, { data: users }] = await Promise.all([
      supabase.from("projects").select("*").eq("project_id", projectId).single(),
      supabase.from("users").select("*").eq("system_role", "supervisor").eq("is_active", true).order("fullname")
    ]);
    return {
      project: p as Project | null,
      supervisors: (users || []) as User[]
    };
  };

  const { data, isLoading } = useSWR(projectId ? `admin_project_edit_${projectId}` : null, fetchProjectData, { revalidateOnFocus: false });

  useEffect(() => {
    if (data?.project) {
      const proj = data.project;
      setProjectName(proj.project_name);
      setClientName(proj.client_name);
      setClientPhone(proj.client_phone ?? "");
      setDescription(proj.description ?? "");
      setProjectAddress(proj.project_address);
      setStartDate(proj.start_date ?? "");
      setEndDate(proj.estimated_finish ?? "");
      setStatus(proj.status);
      if (proj.supervisor_id) setSupervisorId(proj.supervisor_id.toString());
      if (proj.latitude && proj.longitude) {
        setPosition({ lat: proj.latitude, lng: proj.longitude });
      }
      setSupervisors(data.supervisors);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsSubmitting(true);

    if (projectName.length > 150) {
      showToast("Nama Proyek maksimal 150 karakter.", "error");
      setIsSubmitting(false);
      return;
    }
    if (clientName.length > 100) {
      showToast("Nama Klien maksimal 100 karakter.", "error");
      setIsSubmitting(false);
      return;
    }
    if (clientPhone && clientPhone.length > 20) {
      showToast("Nomor HP Klien maksimal 20 karakter.", "error");
      setIsSubmitting(false);
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      showToast("Tenggat waktu tidak boleh lebih awal dari tanggal mulai.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          project_name: projectName,
          client_name: clientName,
          client_phone: clientPhone || null,
          description: description || null,
          project_address: projectAddress,
          latitude: position?.lat ?? null,
          longitude: position?.lng ?? null,
          start_date: startDate || null,
          estimated_finish: endDate || null,
          status,
          supervisor_id: supervisorId ? parseInt(supervisorId) : null,
        })
        .eq("project_id", projectId);

      if (error) throw error;
      mutate('admin_projects');
      mutate('admin_dashboard_data');
      mutate(`admin_project_edit_${projectId}`);
      showToast(`Berhasil menyimpan perubahan proyek`, "success");
      router.push(`/dashboard/projects/${projectId}`);
      router.refresh();
    } catch (err: unknown) {
      showToast("Gagal menyimpan: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell title="Edit Proyek" subtitle="Memuat...">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Edit Proyek" subtitle="Ubah informasi proyek">
      <button
        onClick={() => router.push(`/dashboard/projects/${projectId}`)}
        className="flex items-center gap-1.5 text-sm font-medium hover:text-orange-600 transition-colors -mt-2 mb-2"
        style={{ color: C.subtext }}
      >
        <ArrowLeft size={16} /> Kembali ke Detail
      </button>

      <form onSubmit={handleSubmit} className="rounded-xl border p-5 lg:p-8 space-y-6" style={{ background: C.card, borderColor: C.border }}>
        {/* Nama Proyek */}
        <div>
          <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
            Nama Proyek <span className="text-red-500">*</span>
          </label>
          <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors"
            style={{ borderColor: C.border }} />
        </div>

        {/* Klien */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
              Nama Klien <span className="text-red-500">*</span>
            </label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: C.border }} />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>No. HP Klien</label>
            <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: C.border }} />
          </div>
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>Status Proyek</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(({ label, value }) => (
                <button key={value} type="button" onClick={() => setStatus(value)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${status === value ? "bg-orange-500 border-orange-500 text-white" : "hover:bg-slate-50"
                    }`}
                  style={status !== value ? { borderColor: C.border, color: C.subtext } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>Supervisor Proyek</label>
            <CustomSelect
              value={supervisorId}
              onChange={setSupervisorId}
              placeholder="Belum Ditugaskan"
              options={[
                { value: "", label: "Belum Ditugaskan" },
                ...supervisors.map(s => ({ value: s.user_id, label: s.fullname }))
              ]}
            />
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>Deskripsi</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors resize-none"
            style={{ borderColor: C.border }} />
        </div>

        {/* Jadwal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border" style={{ borderColor: C.border }}>
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>Tanggal Mulai</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: C.border, background: C.card }} />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>Tenggat Waktu</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: C.border, background: C.card }} />
          </div>
        </div>

        {/* Lokasi Proyek */}
        <div className="flex flex-col gap-4 rounded-xl border p-5 bg-slate-50/50" style={{ borderColor: C.border }}>
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">Lokasi Proyek</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tentukan lokasi proyek di peta atau ambil koordinat dari GPS perangkat Anda.</p>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
              Alamat Proyek <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors bg-white"
              style={{ borderColor: C.border }}
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-60 whitespace-nowrap"
                style={{ borderColor: C.border }}
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

            <div className="text-[11px] font-mono text-slate-500 bg-white px-3 py-2 rounded border" style={{ borderColor: C.border }}>
              {position ? (
                <span>
                  Lat: <span className="text-emerald-600 font-bold">{position.lat.toFixed(6)}</span>,{" "}
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: C.border }}>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 border rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            style={{ borderColor: C.border, color: C.subtext }}>
            Batal
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60">
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Perubahan</>}
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
