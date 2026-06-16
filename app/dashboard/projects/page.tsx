"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, FolderOpen, TrendingUp, Package,
  BarChart3, Plus, Search, Calendar,
  MoreVertical, MapPin, UserCircle2, Edit2, Trash2, Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectProgress, ProjectStatus } from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import StatCard from "@/components/ui/StatCard";
import useSWR, { mutate } from "swr";
import { formatDate, getLatestProgress } from "@/lib/utils/formatters";
import { C, getStatusStyle, getStatusLabel, getProgressColor } from "@/lib/utils/theme";


const STATUS_FILTERS: { label: string; value: ProjectStatus | "semua" }[] = [
  { label: "Semua", value: "semua" },
  { label: "Aktif", value: "aktif" },
  { label: "Menunggu Validasi", value: "menunggu_validasi" },
  { label: "Tertunda", value: "tertunda" },
  { label: "Selesai", value: "selesai" },
];

// ── Component ─────────────────────────────────────────────────
export default function ProjectManagementPage() {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "semua">("semua");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProjectsData = async () => {
    const supabase = createClient();
    const [projectData, progressData] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("project_progress").select("*").order("created_at", { ascending: false })
    ]);
    return {
      projects: (projectData.data || []) as Project[],
      progressList: (progressData.data || []) as ProjectProgress[]
    };
  };

  const { data, isLoading } = useSWR('admin_projects', fetchProjectsData);
  const projects = data?.projects || [];
  const progressList = data?.progressList || [];

  const handleDelete = async (projectId: number, projectName: string) => {
    if (!confirm(`Hapus proyek "${projectName}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingId(projectId);
    try {
      const { error } = await supabase.from("projects").delete().eq("project_id", projectId);
      if (error) throw error;
      mutate('admin_projects');
      mutate('admin_dashboard_data');
    } catch (err: unknown) {
      alert("Gagal menghapus proyek: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingId(null);
    }
  };

  // Filter
  const filtered = projects.filter(p => {
    const matchSearch = p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "semua" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = [
    { label: "Total Proyek", value: projects.length, color: "text-slate-600", iconBg: "bg-slate-50", Icon: LayoutGrid },
    { label: "Proyek Aktif", value: projects.filter(p => p.status === "aktif").length, color: "text-orange-600", iconBg: "bg-orange-50", Icon: TrendingUp },
    { label: "Proyek Selesai", value: projects.filter(p => p.status === "selesai").length, color: "text-emerald-600", iconBg: "bg-emerald-50", Icon: FolderOpen },
    { label: "Proyek Tertunda", value: projects.filter(p => p.status === "tertunda").length, color: "text-amber-600", iconBg: "bg-amber-50", Icon: BarChart3 },
  ];

  const headerActions = (
    <button
      onClick={() => setShowCreateModal(true)}
      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
    >
      <Plus size={16} />
      <span className="hidden sm:inline">Tambah Proyek</span>
    </button>
  );

  return (
    <DashboardShell title="Manajemen Proyek" subtitle="Kelola dan monitor seluruh data proyek" headerActions={headerActions}>
      {/* 1. STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, color, iconBg, Icon }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            color={color}
            iconBg={iconBg}
            Icon={Icon}
            isLoading={isLoading}
            size="sm"
          />
        ))}
      </section>

      {/* 2. FILTERS & SEARCH */}
      <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          <input
            type="text"
            placeholder="Cari nama proyek / klien..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 transition-colors"
            style={{ borderColor: C.border, background: C.card }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 flex-wrap">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${statusFilter === value
                ? "bg-orange-500 border-orange-500 text-white"
                : "hover:bg-slate-50"
                }`}
              style={statusFilter !== value ? { borderColor: C.border, color: C.subtext, background: C.card } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. PROJECTS TABLE */}
      <section>
        <div className="rounded-xl border overflow-hidden shadow-sm" style={{ background: C.card, borderColor: C.border }}>
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: C.border }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen size={40} className="mx-auto mb-3" style={{ color: C.muted }} />
              <p className="text-sm font-semibold" style={{ color: C.muted }}>
                {searchQuery || statusFilter !== "semua"
                  ? "Tidak ada proyek yang cocok dengan filter."
                  : "Belum ada proyek. Klik 'Tambah Proyek' untuk memulai."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ background: C.sidebar, borderColor: C.border }}>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Nama Proyek</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: C.muted }}>Klien</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: C.muted }}>Tenggat</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Progres</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Status</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-right" style={{ color: C.muted }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const pct = getLatestProgress(p.project_id, progressList);
                    const isDeleting = deletingId === p.project_id;
                    return (
                      <tr
                        key={p.project_id}
                        className={`border-b hover:bg-slate-50/50 transition-colors group cursor-pointer ${isDeleting ? "opacity-50" : ""}`}
                        style={{ borderColor: C.border }}
                        onClick={() => router.push(`/dashboard/projects/${p.project_id}`)}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold" style={{ color: C.text }}>{p.project_name}</p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-medium" style={{ color: C.muted }}>
                            <MapPin size={10} /> {p.project_address}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: C.subtext }}>
                            <UserCircle2 size={14} className="text-orange-400" />
                            {p.client_name}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: C.subtext }}>
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(p.estimated_finish)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-[60px] h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className={`h-full rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11px] font-black" style={{ color: C.subtext }}>{pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusStyle(p.status)}`}>
                            {getStatusLabel(p.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/projects/${p.project_id}/edit`);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md" title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.project_id, p.project_name);
                              }}
                              disabled={isDeleting}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-md disabled:opacity-50" title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs mt-2 text-right font-medium" style={{ color: C.muted }}>
            Menampilkan {filtered.length} dari {projects.length} proyek
          </p>
        )}
      </section>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            mutate('admin_projects');
            mutate('admin_dashboard_data');
          }}
        />
      )}
    </DashboardShell>
  );
}
