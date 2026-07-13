"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen, Package, ChevronRight,
  RefreshCw, MapPin, CalendarClock, AlertCircle,
  FileText, Activity, Upload,
} from "lucide-react";
import type { Project, User, ProjectProgress } from "@/lib/types/database";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/utils/fetcher";
import { C, getStatusStyle, getStatusLabel, getProgressColor } from "@/lib/utils/theme";
import { formatDate } from "@/lib/utils/formatters";
import DashboardShell from "@/components/layout/DashboardShell";
import { useUI } from "@/contexts/UIContext";

//  Design tokens 




//  Component 
export default function SupervisorDashboard() {
  const router = useRouter();
  const { showToast } = useUI();

  // SWR data fetching
  const { data: authData, isLoading: authLoading } = useSWR('/api/auth/me', fetcher);
  const { data: projectsData, isLoading: projectsLoading } = useSWR('/api/supervisor/projects', fetcher);
  const { data: progressData, isLoading: progressLoading } = useSWR('/api/supervisor/progress', fetcher);

  const user = authData?.user as User | undefined;
  const projects = useMemo(() => (projectsData?.projects as (Project & { latest_progress?: number })[]) || [], [projectsData?.projects]);

  // --- Parse Activities ---
  type ActivityType = 'progress' | 'photo' | 'validation' | 'note';
  interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    projectName: string;
    date: Date;
  }

  const rawProgress = (progressData?.progress as ProjectProgress[]) || [];
  const allActivities: ActivityItem[] = [];

  rawProgress.forEach((prog, index) => {
    const projName = projects.find(p => p.project_id === prog.project_id)?.project_name || `Proyek #${prog.project_id}`;

    // Fix timezone issue: Supabase might return timestamp without timezone 'Z'
    let dateStr = prog.created_at;
    if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+')) {
      dateStr += 'Z';
    }
    const date = new Date(dateStr);

    // Find previous progress for this project (which is chronologically older, so index > current index)
    const previousProg = rawProgress.slice(index + 1).find(p => p.project_id === prog.project_id);
    const previousPercentage = previousProg ? previousProg.percentage : 0;
    const isPercentageChanged = prog.percentage !== previousPercentage;

    if (prog.percentage === 0 && prog.notes?.includes("Tervalidasi")) {
      allActivities.push({ id: `val-${prog.progress_id}`, type: 'validation', title: "Validasi lokasi berhasil", projectName: projName, date });
      if (prog.photo_url) {
        allActivities.push({ id: `photo-${prog.progress_id}`, type: 'photo', title: "Upload foto dokumentasi (1 foto)", projectName: projName, date });
      }
    } else {
      if (isPercentageChanged && prog.percentage > 0) {
        allActivities.push({ id: `prog-${prog.progress_id}`, type: 'progress', title: `Update progres ${prog.percentage}%`, projectName: projName, date });
      } else if (!isPercentageChanged && !prog.photo_url && !prog.notes && prog.percentage > 0) {
        // Fallback: if percentage didn't change and no photo/notes, still show update progress so it's not empty
        allActivities.push({ id: `prog-${prog.progress_id}-fallback`, type: 'progress', title: `Update progres ${prog.percentage}%`, projectName: projName, date });
      }

      if (prog.photo_url) {
        const count = prog.photo_url.split(',').length;
        allActivities.push({ id: `photo-${prog.progress_id}`, type: 'photo', title: `Upload foto dokumentasi (${count} foto)`, projectName: projName, date });
      }
      if (prog.notes && !prog.notes.includes("Tervalidasi") && !prog.notes.includes("Tambahan foto")) {
        allActivities.push({ id: `note-${prog.progress_id}`, type: 'note', title: `Catatan: ${prog.notes}`, projectName: projName, date });
      }
    }
  });

  const recentActivities = allActivities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${Math.max(1, diffSecs)} detik lalu`;
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;

    if (diffDays === 1) {
      return `Kemarin, ${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
    }

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const isLoading = authLoading || projectsLoading || progressLoading;
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = localStorage.getItem("active_project_id");
      if (id) {
        setTimeout(() => setActiveProjectId(id), 0);
      }
    }
  }, []);





  // Validasi active_project_id
  useEffect(() => {
    if (!isLoading && projects.length > 0 && activeProjectId) {
      const p = projects.find(proj => proj.project_id.toString() === activeProjectId);
      if (!p) {
        localStorage.removeItem("active_project_id");
        setTimeout(() => setActiveProjectId(null), 0);
      }
    }
  }, [isLoading, projects, activeProjectId]);

  const activeProject = activeProjectId ? projects.find(p => p.project_id.toString() === activeProjectId) : null;

  return (
    <DashboardShell role="supervisor" title="Dashboard Pengawas" subtitle={user?.fullname ?? ""}>

      {/* 1. RINGKASAN PROYEK AKTIF */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Proyek Aktif</h2>
          <button
            onClick={() => router.push("/dashboard/supervisor/projects")}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold"
          >
            Lihat Semua <ChevronRight size={13} />
          </button>
        </div>

        {isLoading ? (
          <div className="h-32 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
        ) : !activeProject ? (
          <div className="rounded-xl border p-6 text-center" style={{ background: C.card, borderColor: C.border }}>
            <FolderOpen size={28} className="mx-auto mb-2" style={{ color: C.muted }} />
            <p className="text-sm font-medium mb-3" style={{ color: C.muted }}>Belum ada proyek aktif yang dipilih.</p>
            <button
              onClick={() => router.push("/dashboard/supervisor/projects")}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Pilih Proyek dari Semua Proyek
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              onClick={() => router.push(`/dashboard/supervisor/projects/${activeProject.project_id}`)}
              className="rounded-xl border hover:border-orange-500/40 transition-colors cursor-pointer"
              style={{ background: C.card, borderColor: C.border }}>
              <div className="h-1 rounded-t-xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-bold line-clamp-2" style={{ color: C.text }}>{activeProject.project_name}</p>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${getStatusStyle(activeProject.status)}`}>
                    {getStatusLabel(activeProject.status)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-3" style={{ color: C.muted }}>
                  <MapPin size={11} className="shrink-0" />
                  <span className="text-[11px] font-medium truncate">{activeProject.project_address}</span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(activeProject.latest_progress ?? 0)}`}
                      style={{ width: `${activeProject.latest_progress ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-9 text-right" style={{ color: C.subtext }}>{activeProject.latest_progress ?? 0}%</span>
                </div>
                {activeProject.estimated_finish && (
                  <div className="flex items-center gap-1.5 mt-2" style={{ color: C.muted }}>
                    <CalendarClock size={11} className="shrink-0" />
                    <span className="text-[11px] font-medium">
                      Tenggat: <span className="text-amber-600 font-bold">{formatDate(activeProject.estimated_finish)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. QUICK ACTIONS */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Aksi Cepat</h2>

        {activeProject?.status === "menunggu_validasi" && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-red-700 leading-relaxed">
              Lokasi proyek harus divalidasi terlebih dahulu sebelum progres dapat diperbarui.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Update Progress & Foto", Icon: RefreshCw, color: "text-orange-600", iconBg: "bg-orange-50", border: "border-orange-200", href: "/dashboard/supervisor/progress", requiresValidation: true, colSpan: "col-span-2" },
            { label: "Validasi Lokasi GPS", Icon: MapPin, color: "text-emerald-600", iconBg: "bg-emerald-50", border: "border-emerald-200", href: "/dashboard/supervisor/location", requiresValidation: false, colSpan: "" },
            { label: "Catat Material Keluar", Icon: Package, color: "text-violet-600", iconBg: "bg-violet-50", border: "border-violet-200", href: "/dashboard/supervisor/materials", requiresValidation: true, colSpan: "" },
          ].map(({ label, Icon, color, iconBg, border, href, requiresValidation, colSpan }) => {
            const isDisabled = requiresValidation && activeProject?.status === "menunggu_validasi";
            return (
              <button
                key={label}
                disabled={isDisabled}
                onClick={() => {
                  if (href === "#validasi-lokasi") {
                    document.getElementById("validasi-lokasi")?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    router.push(href);
                  }
                }}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-150 ${colSpan} 
                      ${isDisabled ? "opacity-50 cursor-not-allowed grayscale bg-slate-50" : `hover:shadow-lg active:scale-95 ${border}`}
                    `}
                style={isDisabled ? undefined : { background: C.card }}
              >
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} ${color}`}>
                  <Icon size={20} />
                </span>
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: C.subtext }}>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. AKTIVITAS TERBARU */}
      {!isLoading && recentActivities.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Aktivitas Terbaru</h2>
          <div className="rounded-xl border divide-y" style={{ background: C.card, borderColor: C.border }}>
            {recentActivities.map((activity) => {
              let Icon = Activity;
              let colorClass = "text-orange-600";
              let bgClass = "bg-orange-50";

              if (activity.type === 'photo') {
                Icon = Upload;
                colorClass = "text-sky-600";
                bgClass = "bg-sky-50";
              } else if (activity.type === 'validation') {
                Icon = MapPin;
                colorClass = "text-emerald-600";
                bgClass = "bg-emerald-50";
              } else if (activity.type === 'note') {
                Icon = FileText;
                colorClass = "text-violet-600";
                bgClass = "bg-violet-50";
              }

              return (
                <div key={activity.id} className="flex items-center gap-4 p-5" style={{ borderColor: C.border }}>
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[15px] font-semibold leading-snug" style={{ color: C.text }}>
                      {activity.title}
                    </p>
                    <p className="text-[13px] font-medium mt-0.5 truncate" style={{ color: C.muted }}>
                      {activity.projectName}
                    </p>
                  </div>
                  <span className="text-[13px] font-medium shrink-0 whitespace-nowrap" style={{ color: C.muted }}>
                    {formatRelativeTime(activity.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}


    </DashboardShell>
  );
}
