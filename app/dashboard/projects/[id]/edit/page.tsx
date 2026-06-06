"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectStatus, User } from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";

const DynamicMapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-[250px] w-full bg-slate-100 rounded-lg flex items-center justify-center text-sm text-slate-400">Memuat Peta...</div>,
});

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
};

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

  const [projectId, setProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => { params.then(({ id }) => setProjectId(Number(id))); }, [params]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const { data: p } = await supabase.from("projects").select("*").eq("project_id", projectId).single();
      if (p) {
        const proj = p as Project;
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
      }

      // Fetch supervisors for dropdown
      const { data: users } = await supabase
        .from("users")
        .select("*")
        .eq("system_role", "supervisor")
        .eq("is_active", true)
        .order("fullname");
      if (users) setSupervisors(users as User[]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsSubmitting(true);
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
      router.push(`/dashboard/projects/${projectId}`);
      router.refresh();
    } catch (err: unknown) {
      alert("Gagal menyimpan: " + (err instanceof Error ? err.message : String(err)));
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
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                    status === value ? "bg-orange-500 border-orange-500 text-white" : "hover:bg-slate-50"
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
            <select 
              value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: C.border }}
            >
              <option value="">-- Belum Ditugaskan --</option>
              {supervisors.map(s => (
                <option key={s.user_id} value={s.user_id}>{s.fullname}</option>
              ))}
            </select>
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
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: C.border, background: C.card }} />
          </div>
        </div>

        {/* Alamat */}
        <div>
          <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
            Alamat Proyek <span className="text-red-500">*</span>
          </label>
          <input type="text" value={projectAddress} onChange={(e) => setProjectAddress(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:border-orange-500 transition-colors"
            style={{ borderColor: C.border }} />
        </div>

        {/* Peta */}
        {position && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
            <DynamicMapPicker position={position} />
          </div>
        )}

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
