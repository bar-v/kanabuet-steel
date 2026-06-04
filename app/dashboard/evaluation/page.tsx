"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Package, Activity, Clock,
  CheckCircle2, AlertTriangle, Calendar, ChevronRight,
  Image as ImageIcon, Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectProgress, MaterialUsageWithDetails } from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function getProgressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-orange-500";
  return "bg-amber-500";
}

export default function EvaluationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [progressData, setProgressData] = useState<ProjectProgress[]>([]);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsageWithDetails[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: proj } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (proj) setProjects(proj as Project[]);

      const { data: prog } = await supabase.from("project_progress").select("*, users(fullname)").order("created_at", { ascending: false }).limit(20);
      if (prog) setProgressData(prog as ProjectProgress[]);

      const { data: mu } = await supabase.from("material_usage").select("*, materials(material_name, unit), projects(project_name)").order("usage_date", { ascending: false }).limit(10);
      if (mu) setMaterialUsage(mu as MaterialUsageWithDetails[]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute stats
  const activeProjects = projects.filter((p) => p.status === "aktif").length;
  const completedProjects = projects.filter((p) => p.status === "selesai").length;

  // Calculate average progress
  const getLatestProgress = (pid: number) => {
    const records = progressData.filter((p) => p.project_id === pid);
    if (records.length === 0) return 0;
    return records[0].percentage;
  };
  const activeProjectsList = projects.filter((p) => p.status === "aktif");
  const avgProgress = activeProjectsList.length > 0
    ? Math.round(activeProjectsList.reduce((sum, p) => sum + getLatestProgress(p.project_id), 0) / activeProjectsList.length)
    : 0;

  // Late projects: deadline passed but not completed
  const now = new Date();
  const lateProjects = projects.filter((p) =>
    p.status !== "selesai" && p.estimated_finish && new Date(p.estimated_finish) < now
  ).length;

  // Build project progress summary for display
  const progressSummary = projects
    .filter((p) => p.status === "aktif" || p.status === "menunggu_validasi")
    .slice(0, 5)
    .map((p) => ({
      ...p,
      pct: getLatestProgress(p.project_id),
      isLate: p.estimated_finish ? new Date(p.estimated_finish) < now : false,
    }));

  const handleCloseProject = async (projectId: number, projectName: string) => {
    if (!confirm(`Tutup proyek "${projectName}" dan ubah statusnya menjadi "Selesai"?`)) return;
    const { error } = await supabase.from("projects").update({ status: "selesai" }).eq("project_id", projectId);
    if (error) { alert("Gagal menutup proyek: " + error.message); return; }
    fetchData();
  };

  const STATS = [
    { label: "Proyek Aktif", value: activeProjects, color: "text-orange-600", iconBg: "bg-orange-50", Icon: Activity },
    { label: "Proyek Selesai", value: completedProjects, color: "text-emerald-600", iconBg: "bg-emerald-50", Icon: CheckCircle2 },
    { label: "Rata-rata Progres", value: `${avgProgress}%`, color: "text-blue-600", iconBg: "bg-blue-50", Icon: TrendingUp },
    { label: "Terlambat / Kritis", value: lateProjects, color: "text-red-600", iconBg: "bg-red-50", Icon: Clock },
  ];

  return (
    <DashboardShell title="Evaluasi Proyek" subtitle="Monitoring performa dan aktivitas proyek">
      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, color, iconBg, Icon }) => (
          <div key={label} className="p-4 rounded-xl border flex flex-col gap-2 shadow-sm" style={{ background: C.card, borderColor: C.border }}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-black ${color}`}>
                {isLoading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : value}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: C.muted }}>{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Ringkasan Progress */}
          <section className="p-5 rounded-xl border shadow-sm" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-500" /> Ringkasan Progres Proyek
              </h2>
              <button onClick={() => router.push("/dashboard/projects")}
                className="text-[11px] font-bold text-orange-600 hover:underline">Lihat Semua</button>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: C.border }} />)}</div>
            ) : progressSummary.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: C.muted }}>Belum ada proyek aktif.</p>
            ) : (
              <div className="space-y-4">
                {progressSummary.map((proj) => (
                  <div key={proj.project_id} className="p-3 border rounded-lg hover:border-orange-200 transition-colors cursor-pointer"
                    style={{ borderColor: C.border }}
                    onClick={() => router.push(`/dashboard/projects/${proj.project_id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold leading-tight">{proj.project_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={12} style={{ color: C.muted }} />
                          <p className="text-[10px] font-medium" style={{ color: C.muted }}>Deadline: {formatDate(proj.estimated_finish)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {proj.isLate && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-red-50 text-red-700 border-red-200">Terlambat</span>
                        )}
                        {proj.pct >= 90 && proj.status !== "selesai" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCloseProject(proj.project_id, proj.project_name); }}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                          >
                            Tutup Proyek
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${getProgressColor(proj.pct)}`} style={{ width: `${proj.pct}%` }} />
                      </div>
                      <span className="text-xs font-black w-8 text-right" style={{ color: C.subtext }}>{proj.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Penggunaan Material */}
          <section className="p-5 rounded-xl border shadow-sm" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Package size={16} className="text-blue-500" /> Pemakaian Material Terbaru
              </h2>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: C.border }} />)}</div>
            ) : materialUsage.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: C.muted }}>Belum ada data pemakaian material.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: C.border, color: C.muted }}>
                      <th className="pb-2 font-semibold">Material</th>
                      <th className="pb-2 font-semibold">Terpakai</th>
                      <th className="pb-2 font-semibold">Proyek</th>
                      <th className="pb-2 font-semibold">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: C.border }}>
                    {materialUsage.map((mu) => (
                      <tr key={mu.usage_id}>
                        <td className="py-3">
                          <p className="font-bold text-xs">{mu.materials?.material_name ?? "—"}</p>
                        </td>
                        <td className="py-3 text-xs font-bold text-slate-700">
                          {mu.quantity} <span className="font-medium text-slate-500">{mu.materials?.unit ?? ""}</span>
                        </td>
                        <td className="py-3 text-[11px] text-slate-600">{mu.projects?.project_name ?? "—"}</td>
                        <td className="py-3 text-[11px]" style={{ color: C.muted }}>{formatDate(mu.usage_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <section className="p-5 rounded-xl border shadow-sm h-fit" style={{ background: C.card, borderColor: C.border }}>
            <h2 className="text-sm font-bold flex items-center gap-2 mb-5">
              <Activity size={16} className="text-emerald-500" /> Timeline Aktivitas
            </h2>
            {isLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: C.border }} />)}</div>
            ) : progressData.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: C.muted }}>Belum ada aktivitas.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
                {progressData.slice(0, 8).map((item) => (
                  <div key={item.progress_id} className="relative flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white z-10 bg-orange-50 text-orange-600">
                      <Activity size={16} />
                    </div>
                    <div className="pt-1 pb-4">
                      <p className="text-xs font-bold leading-tight" style={{ color: C.text }}>
                        Update progres ke {item.percentage}%
                      </p>
                      {item.notes && <p className="text-[10px] mt-0.5" style={{ color: C.subtext }}>{item.notes}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-[10px] font-medium" style={{ color: C.muted }}>{formatDate(item.update_date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed projects list */}
          <section className="p-5 rounded-xl border shadow-sm" style={{ background: C.card, borderColor: C.border }}>
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-emerald-500" /> Proyek Selesai
            </h2>
            {projects.filter((p) => p.status === "selesai").length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: C.muted }}>Belum ada proyek selesai.</p>
            ) : (
              <div className="space-y-2">
                {projects.filter((p) => p.status === "selesai").slice(0, 5).map((p) => (
                  <div key={p.project_id}
                    className="p-3 rounded-lg border hover:border-emerald-300 transition-colors cursor-pointer"
                    style={{ borderColor: C.border }}
                    onClick={() => router.push(`/dashboard/projects/${p.project_id}`)}>
                    <p className="text-xs font-bold" style={{ color: C.text }}>{p.project_name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{p.client_name} · {formatDate(p.estimated_finish)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
