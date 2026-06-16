"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FolderOpen, LogOut, Menu, X, MapPin, CalendarClock,
  TrendingUp, Bell, Search,
} from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import type { Project, User } from "@/lib/types/database";
import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";
import { C, getStatusStyle, getStatusLabel, getProgressColor } from "@/lib/utils/theme";
import { formatDate } from "@/lib/utils/formatters";



export default function SupervisorProjectsListPage() {
  const router = useRouter();

  // SWR Data Fetching
  const { data: projectsData, isLoading: projectsLoading } = useSWR('/api/supervisor/projects', fetcher);

  const projects = (projectsData?.projects as (Project & { latest_progress?: number })[]) || [];
  const isLoading = projectsLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    all: projects.length,
    aktif: projects.filter(p => p.status === "aktif").length,
    menunggu_validasi: projects.filter(p => p.status === "menunggu_validasi").length,
    selesai: projects.filter(p => p.status === "selesai").length,
    tertunda: projects.filter(p => p.status === "tertunda").length,
  };

  return (
    <DashboardShell role="supervisor" title="Proyek Saya" subtitle={`${projects.length} proyek ditugaskan`}>
          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari proyek..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                style={{ borderColor: C.border, background: C.card, color: C.text }}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([
                { key: "all", label: "Semua" },
                { key: "aktif", label: "Aktif" },
                { key: "menunggu_validasi", label: "Menunggu" },
                { key: "selesai", label: "Selesai" },
                { key: "tertunda", label: "Tertunda" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    filterStatus === key
                      ? "bg-orange-500 text-white"
                      : "bg-white border text-slate-500 hover:border-orange-300"
                  }`}
                  style={filterStatus !== key ? { borderColor: C.border } : undefined}
                >
                  {label} ({statusCounts[key]})
                </button>
              ))}
            </div>
          </div>

          {/* Projects List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-xl border p-8 text-center" style={{ background: C.card, borderColor: C.border }}>
              <FolderOpen size={32} className="mx-auto mb-2" style={{ color: C.muted }} />
              <p className="text-sm font-medium" style={{ color: C.muted }}>
                {searchTerm || filterStatus !== "all" ? "Tidak ada proyek yang sesuai filter." : "Belum ada proyek yang ditugaskan."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => {
                const pct = project.latest_progress ?? 0;
                return (
                  <div
                    key={project.project_id}
                    onClick={() => {
                      localStorage.setItem("active_project_id", project.project_id.toString());
                      router.push(`/dashboard/supervisor`);
                    }}
                    className="rounded-xl border hover:border-orange-500/40 transition-all duration-150 cursor-pointer hover:shadow-sm"
                    style={{ background: C.card, borderColor: C.border }}
                  >
                    <div className="h-1 rounded-t-xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-bold line-clamp-2" style={{ color: C.text }}>{project.project_name}</p>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${getStatusStyle(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2" style={{ color: C.muted }}>
                        <MapPin size={11} className="shrink-0" />
                        <span className="text-[11px] font-medium truncate">{project.project_address}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
                          <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold w-9 text-right" style={{ color: C.subtext }}>{pct}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] font-medium" style={{ color: C.muted }}>
                        <span>{project.client_name}</span>
                        {project.estimated_finish && (
                          <span className="flex items-center gap-1">
                            <CalendarClock size={10} /> {formatDate(project.estimated_finish)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

    </DashboardShell>
  );
}
