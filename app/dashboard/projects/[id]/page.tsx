"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft, MapPin, CalendarClock, UserCircle2,
  Activity, Upload, ChevronRight, Users, Edit2,
  Package, AlertTriangle, ImageIcon, Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  Project, ProjectProgress, ProjectMember, MaterialUsageWithDetails,
} from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";

const DynamicMap = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
};

function statusBadge(s: string) {
  if (s === "selesai") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "aktif") return "bg-orange-50 text-orange-700 border border-orange-200";
  if (s === "menunggu_validasi") return "bg-sky-50 text-sky-700 border border-sky-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}
function statusLabel(s: string) {
  if (s === "selesai") return "Selesai";
  if (s === "aktif") return "Aktif";
  if (s === "menunggu_validasi") return "Menunggu Validasi";
  return "Tertunda";
}
function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-orange-400";
  return "bg-amber-500";
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const TABS = ["Overview", "Progress", "Material", "Tim"] as const;
type Tab = (typeof TABS)[number];

interface Props { params: Promise<{ id: string }>; }

export default function ProjectDetailPage({ params }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [projectId, setProjectId] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [progressHistory, setProgressHistory] = useState<ProjectProgress[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsageWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => { params.then(({ id }) => setProjectId(Number(id))); }, [params]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const { data: p } = await supabase.from("projects").select("*").eq("project_id", projectId).single();
      if (p) setProject(p as Project);

      const { data: prog } = await supabase.from("project_progress").select("*, users(fullname)").eq("project_id", projectId).order("created_at", { ascending: false });
      if (prog) setProgressHistory(prog as ProjectProgress[]);

      const { data: mem } = await supabase.from("project_members").select("*").eq("project_id", projectId).order("member_id", { ascending: true });
      if (mem) setMembers(mem as ProjectMember[]);

      const { data: mu } = await supabase.from("material_usage").select("*, materials(material_name, unit), projects(project_name)").eq("project_id", projectId).order("usage_date", { ascending: false });
      if (mu) setMaterialUsage(mu as MaterialUsageWithDetails[]);
    } finally { setIsLoading(false); }
  }, [projectId, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const latestPct = progressHistory.length > 0 ? progressHistory[0].percentage : 0;

  const headerActions = project ? (
    <div className="flex items-center gap-2">
      <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusBadge(project.status)}`}>
        {statusLabel(project.status)}
      </span>
      <button
        onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
        className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-all active:scale-95"
      >
        <Edit2 size={14} /> <span className="hidden sm:inline">Edit</span>
      </button>
    </div>
  ) : null;

  if (isLoading || !project) {
    return (
      <DashboardShell title="Detail Proyek" subtitle="Memuat...">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={project.project_name} subtitle="Detail Proyek" headerActions={headerActions}>
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/projects")}
        className="flex items-center gap-1.5 text-sm font-medium hover:text-orange-600 transition-colors -mt-2 mb-2"
        style={{ color: C.subtext }}
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Proyek
      </button>

      {/* Project Info Card */}
      <div className="rounded-xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: C.subtext }}>Progres Pekerjaan</span>
              <span className="text-lg font-black text-orange-400">{latestPct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.border }}>
              <div className={`h-full rounded-full ${progressColor(latestPct)}`} style={{ width: `${latestPct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium" style={{ color: C.muted }}>Lokasi</p>
                <p className="text-xs font-semibold leading-snug" style={{ color: C.text }}>{project.project_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <UserCircle2 size={13} className="text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium" style={{ color: C.muted }}>Klien</p>
                <p className="text-xs font-semibold" style={{ color: C.text }}>{project.client_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarClock size={13} className="text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium" style={{ color: C.muted }}>Mulai</p>
                <p className="text-xs font-semibold" style={{ color: C.text }}>{formatDate(project.start_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarClock size={13} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium" style={{ color: C.muted }}>Tenggat</p>
                <p className="text-xs font-semibold text-amber-400">{formatDate(project.estimated_finish)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl p-1 border" style={{ background: C.card, borderColor: C.border }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150
              ${activeTab === tab ? "bg-orange-500/15 text-orange-400 border border-orange-500/25" : "hover:bg-slate-50"}`}
            style={activeTab !== tab ? { color: C.muted } : undefined}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Overview" && (
        <>
          {project.description && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Deskripsi Proyek</h2>
              <div className="rounded-xl border p-4" style={{ background: C.card, borderColor: C.border }}>
                <p className="text-sm leading-relaxed font-medium" style={{ color: C.subtext }}>{project.description}</p>
              </div>
            </section>
          )}

          {/* Map */}
          {project.latitude && project.longitude && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Lokasi Proyek</h2>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
                <DynamicMap position={{ lat: project.latitude, lng: project.longitude }} />
              </div>
            </section>
          )}

          {/* Recent activity */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Aktivitas Terbaru</h2>
              <button className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-500 font-semibold" onClick={() => setActiveTab("Progress")}>
                Semua <ChevronRight size={13} />
              </button>
            </div>
            <div className="rounded-xl border divide-y" style={{ background: C.card, borderColor: C.border }}>
              {progressHistory.length === 0 ? (
                <div className="p-6 text-center">
                  <Activity size={24} className="mx-auto mb-2" style={{ color: C.muted }} />
                  <p className="text-xs font-medium" style={{ color: C.muted }}>Belum ada aktivitas untuk proyek ini.</p>
                </div>
              ) : (
                progressHistory.slice(0, 3).map((h) => (
                  <div key={h.progress_id} className="flex items-start gap-3 p-4" style={{ borderColor: C.border }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-orange-50 text-orange-600">
                      <Activity size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: C.text }}>
                        Update progres ke {h.percentage}%
                      </p>
                      {h.notes && <p className="text-xs mt-0.5" style={{ color: C.subtext }}>{h.notes}</p>}
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: C.muted }}>{formatDate(h.update_date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === "Progress" && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Histori Update Progress</h2>
          <div className="space-y-3">
            {progressHistory.length === 0 ? (
              <div className="rounded-xl border p-8 text-center" style={{ background: C.card, borderColor: C.border }}>
                <Activity size={32} className="mx-auto mb-2" style={{ color: C.muted }} />
                <p className="text-sm font-medium" style={{ color: C.muted }}>Belum ada update progress.</p>
              </div>
            ) : (
              progressHistory.map((p) => (
                <div key={p.progress_id} className="rounded-xl border p-4" style={{ background: C.card, borderColor: C.border }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-black text-orange-400">{p.percentage}%</span>
                    <span className="text-[10px] font-medium" style={{ color: C.muted }}>{formatDate(p.update_date)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: C.border }}>
                    <div className={`h-full rounded-full ${progressColor(p.percentage)}`} style={{ width: `${p.percentage}%` }} />
                  </div>
                  {p.notes && <p className="text-xs font-medium" style={{ color: C.subtext }}>{p.notes}</p>}
                  {p.photo_url && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-sky-600 font-medium">
                      <ImageIcon size={12} /> Foto terlampir
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "Material" && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Penggunaan Material</h2>
          <div className="space-y-3">
            {materialUsage.length === 0 ? (
              <div className="rounded-xl border p-8 text-center" style={{ background: C.card, borderColor: C.border }}>
                <Package size={32} className="mx-auto mb-2" style={{ color: C.muted }} />
                <p className="text-sm font-medium" style={{ color: C.muted }}>Belum ada penggunaan material untuk proyek ini.</p>
              </div>
            ) : (
              materialUsage.map((m) => (
                <div key={m.usage_id} className="rounded-xl border p-4 flex items-center justify-between gap-3" style={{ background: C.card, borderColor: C.border }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: C.text }}>{m.materials?.material_name ?? "—"}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: C.muted }}>
                      Digunakan: {m.quantity} {m.materials?.unit ?? ""} · {formatDate(m.usage_date)}
                    </p>
                    {m.notes && <p className="text-[11px] mt-1" style={{ color: C.subtext }}>{m.notes}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "Tim" && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Anggota Tim</h2>
            <button
              onClick={() => router.push(`/dashboard/projects/${projectId}/members`)}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <Plus size={13} /> Kelola Anggota
            </button>
          </div>
          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="rounded-xl border p-8 text-center" style={{ background: C.card, borderColor: C.border }}>
                <Users size={32} className="mx-auto mb-2" style={{ color: C.muted }} />
                <p className="text-sm font-medium" style={{ color: C.muted }}>Belum ada anggota tim.</p>
                <button
                  onClick={() => router.push(`/dashboard/projects/${projectId}/members`)}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  + Tambah Anggota
                </button>
              </div>
            ) : (
              members.map((m) => (
                <div key={m.member_id} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: C.card, borderColor: C.border }}>
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                    {m.member_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: C.text }}>{m.member_name}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: C.muted }}>{m.project_role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
