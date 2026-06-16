"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, Clock, CheckCircle2, AlertTriangle,
  FolderOpen, Plus, ChevronRight, UserCircle2, Package, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Project, Material, DashboardStats, ProjectProgress } from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import StatCard from "@/components/ui/StatCard";
import useSWR, { mutate } from "swr";
import { formatRelativeTime, getLatestProgress } from "@/lib/utils/formatters";
import { C, getStatusStyle, getStatusLabel, getProgressColor } from "@/lib/utils/theme";



// We will define QUICK_ACTIONS inside the component so it can access setShowCreateModal
// ── Component ─────────────────────────────────────────────────
export default function OwnerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [fabOpen, setFabOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const QUICK_ACTIONS = [
    { label: "Lihat Semua Proyek", Icon: FolderOpen, action: () => router.push("/dashboard/projects") },
    { label: "Tambah Proyek", Icon: Plus, action: () => setShowCreateModal(true) },
    { label: "Kelola Material", Icon: Package, action: () => router.push("/dashboard/materials") },
  ];

  const fetchDashboardData = async () => {
    const supabase = createClient();
    const [resProjects, resProgress, resMaterials] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("project_progress").select("*").order("created_at", { ascending: false }),
      supabase.from("materials").select("*").order("current_stock", { ascending: true })
    ]);
    return {
      projects: (resProjects.data || []) as Project[],
      progress: (resProgress.data || []) as ProjectProgress[],
      materials: (resMaterials.data || []) as Material[]
    };
  };

  const { data, isLoading } = useSWR('admin_dashboard_data', fetchDashboardData);

  const projects = data?.projects || [];
  const progressList = data?.progress || [];
  const materials = data?.materials || [];

  const activeProjects = projects.filter(p => p.status === "aktif").length;
  const completedProjects = projects.filter(p => p.status === "selesai").length;
  const pendingProjects = projects.filter(p => p.status === "tertunda" || p.status === "menunggu_validasi").length;
  
  const lowStockMaterials = materials.filter(m => m.current_stock < m.minimum_stock).slice(0, 5);
  
  const stats = {
    total_projects: projects.length,
    active_projects: activeProjects,
    completed_projects: completedProjects,
    pending_projects: pendingProjects,
    low_stock_count: materials.filter(m => m.current_stock < m.minimum_stock).length,
  };

  const recentProjects = projects.slice(0, 3);
  const recentActivities = progressList.slice(0, 3);

  const STATS = [
    { label: "Total Proyek", value: stats.total_projects, color: "text-orange-600", iconBg: "bg-orange-50", border: "border-orange-200", Icon: LayoutGrid },
    { label: "Proyek Aktif", value: stats.active_projects, color: "text-sky-600", iconBg: "bg-sky-50", border: "border-sky-200", Icon: Clock },
    { label: "Proyek Selesai", value: stats.completed_projects, color: "text-emerald-600", iconBg: "bg-emerald-50", border: "border-emerald-200", Icon: CheckCircle2 },
    { label: "Warning Material", value: stats.low_stock_count, color: "text-amber-600", iconBg: "bg-amber-50", border: "border-amber-200", Icon: AlertTriangle },
  ];

  return (
    <DashboardShell title="Dashboard" subtitle="Ikhtisar Operasional">
      {/* Loading skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
          ))}
        </div>
      ) : (
        <>
          {/* 1. STATS */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Ringkasan</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STATS.map(({ label, value, color, iconBg, border, Icon }) => (
                <StatCard
                  key={label}
                  label={label}
                  value={value}
                  color={color}
                  iconBg={iconBg}
                  border={border}
                  Icon={Icon}
                  size="md"
                />
              ))}
            </div>
          </section>

          {/* 2. PROJECTS & ACTIVITIES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>
                  Ringkasan Progress Proyek
                </h2>
                <button
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold"
                  onClick={() => router.push("/dashboard/projects")}
                >
                  Semua <ChevronRight size={13} />
                </button>
              </div>
              <div className="space-y-3">
                {recentProjects.length === 0 ? (
                  <div className="rounded-xl border p-8 text-center" style={{ background: C.card, borderColor: C.border }}>
                    <FolderOpen size={32} className="mx-auto mb-2" style={{ color: C.muted }} />
                    <p className="text-sm font-medium" style={{ color: C.muted }}>Belum ada proyek.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-3 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      + Buat Proyek
                    </button>
                  </div>
                ) : (
                  recentProjects.map((p) => {
                    const pct = getLatestProgress(p.project_id, progressList);
                    return (
                      <div
                        key={p.project_id}
                        onClick={() => router.push(`/dashboard/projects/${p.project_id}`)}
                        className="rounded-xl border p-4 text-left hover:border-orange-300 hover:shadow-sm transition-all duration-150 cursor-pointer"
                        style={{ background: C.card, borderColor: C.border }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <p className="text-sm font-bold line-clamp-1" style={{ color: C.text }}>{p.project_name}</p>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-end justify-between text-[11px] font-medium" style={{ color: C.muted }}>
                          <div>
                            <span className="font-bold block mb-0.5" style={{ color: C.subtext }}>{pct}% Selesai</span>
                            <span className="font-semibold block">{p.client_name}</span>
                          </div>
                          <span>
                            {p.estimated_finish ? `Tenggat:` : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>
                  Aktivitas Terbaru
                </h2>
              </div>
              <div className="space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="rounded-xl border p-8 text-center" style={{ background: C.card, borderColor: C.border }}>
                    <p className="text-sm font-medium" style={{ color: C.muted }}>Belum ada aktivitas.</p>
                  </div>
                ) : (
                  recentActivities.map((act) => {
                    const project = projects.find(p => p.project_id === act.project_id);
                    const title = act.percentage === 100 ? "Status diubah ke Selesai" : `Pembaruan Progres ${act.percentage}%`;
                    return (
                      <div
                        key={act.progress_id}
                        className="rounded-xl border p-4 text-left hover:border-orange-300 hover:shadow-sm transition-all duration-150"
                        style={{ background: C.card, borderColor: C.border }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm font-bold" style={{ color: C.text }}>{title}</p>
                          <span className="text-[10px] font-semibold text-right shrink-0" style={{ color: C.muted }}>{formatRelativeTime(act.created_at)}</span>
                        </div>
                        <p className="text-[11px] font-semibold" style={{ color: C.muted }}>
                          {project?.project_name || "Proyek Tidak Diketahui"} {project?.client_name ? `- ${project.client_name}` : ""}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* 3. MATERIAL WARNING */}
          {lowStockMaterials.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>
                    Warning Stok Material
                  </h2>
                </div>
                <button
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold"
                  onClick={() => router.push("/dashboard/materials")}
                >
                  Kelola <ChevronRight size={13} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {lowStockMaterials.map((m) => {
                  const pct = m.minimum_stock > 0
                    ? Math.round((m.current_stock / m.minimum_stock) * 100)
                    : 0;
                  return (
                    <div key={m.material_id} className="rounded-xl p-4 border border-amber-500/35" style={{ background: C.card }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold" style={{ color: C.text }}>{m.material_name}</p>
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                          <AlertTriangle size={9} /> Minimum
                        </span>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-2xl font-black text-amber-400">{m.current_stock}</p>
                          <p className="text-[11px] font-semibold" style={{ color: C.muted }}>{m.unit} tersisa</p>
                        </div>
                        <p className="text-[11px] font-semibold" style={{ color: C.muted }}>Min. {m.minimum_stock} {m.unit}</p>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <p className="text-[10px] font-semibold mt-1 text-right" style={{ color: C.muted }}>{pct}% dari minimum</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* FAB mobile */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden flex flex-col items-end gap-3">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {QUICK_ACTIONS.map(({ label, Icon, action }) => (
              <button
                key={label}
                onClick={() => { setFabOpen(false); action(); }}
                className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-semibold shadow-sm hover:border-orange-300 hover:bg-orange-50 transition-colors"
                style={{ background: C.card, borderColor: C.border, color: C.text }}
              >
                <Icon size={15} className="text-orange-400" /> {label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setFabOpen((v) => !v)}
          className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)] flex items-center justify-center transition-all duration-200"
        >
          {fabOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Quick actions bar desktop */}
      <div className="hidden lg:flex fixed bottom-6 right-7 z-30 items-center gap-3">
        {QUICK_ACTIONS.map(({ label, Icon, action }) => (
          <button
            key={label}
            onClick={() => action()}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-full text-sm font-semibold shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all duration-150"
            style={{ background: C.card, borderColor: C.border, color: C.text }}
          >
            <Icon size={14} className="text-orange-400" /> {label}
          </button>
        ))}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            mutate('admin_dashboard_data');
            mutate('admin_projects'); // Also mutate projects list
          }}
        />
      )}
    </DashboardShell>
  );
}
