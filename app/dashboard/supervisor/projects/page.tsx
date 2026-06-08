"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FolderOpen, LogOut, Menu, X, MapPin, CalendarClock,
  TrendingUp, Bell, Search,
} from "lucide-react";
import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";
import type { Project, User } from "@/lib/types/database";
import { useLogout } from "@/lib/auth/client";

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
  sidebar: "#F1F5F9", header: "#FFFFFF",
};

function statusBadge(s: string) {
  if (s === "selesai")           return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "aktif")             return "bg-orange-50  text-orange-700  border border-orange-200";
  if (s === "menunggu_validasi") return "bg-sky-50 text-sky-700 border border-sky-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}
function statusLabel(s: string) {
  if (s === "selesai")           return "Selesai";
  if (s === "aktif")             return "Aktif";
  if (s === "menunggu_validasi") return "Menunggu Validasi";
  if (s === "tertunda")          return "Tertunda";
  return s;
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

export default function SupervisorProjectsListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<(Project & { latest_progress?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const resUser = await fetch('/api/auth/me');
      const { user } = await resUser.json();
      if (user) setUser(user as User);

      const resProjects = await fetch('/api/supervisor/projects');
      const { projects: projectData } = await resProjects.json();
      if (projectData) setProjects(projectData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = useLogout();

  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "SV";

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
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, color: C.text }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 flex flex-col border-r transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        style={{ background: C.sidebar, borderColor: C.border }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: C.border }}>
          <Image src="/images/logo.png" alt="logo" width={36} height={36} className="object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
          <div className="flex-1 min-w-0">
            <p className="text-orange-500 font-black text-sm tracking-wider leading-none truncate">KANABUET STEEL</p>
            <p className="text-[10px] tracking-wide mt-0.5 font-medium" style={{ color: C.subtext }}>Fabrication Management System</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden" style={{ color: C.muted }}><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {SUPERVISOR_NAV.map(({ label, Icon, href, matchPatterns }) => {
            const active = isNavActive(pathname, href, matchPatterns);
            return (
              <button key={label} onClick={() => { setSidebarOpen(false); router.push(href); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
                  ${active ? "bg-orange-500/15 text-orange-400 border border-orange-500/25" : "hover:bg-slate-100 hover:text-slate-900"}`}
                style={!active ? { color: C.subtext } : undefined}>
                <Icon size={17} style={!active ? { color: C.muted } : undefined} className={active ? "text-orange-400" : ""} />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="border-t p-4" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: C.text }}>{user?.fullname ?? "Memuat..."}</p>
              <p className="text-[11px] font-medium" style={{ color: C.muted }}>Supervisor</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 flex items-center gap-4 px-5 backdrop-blur border-b" style={{ height: 60, background: `${C.header}E6`, borderColor: C.border }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" style={{ color: C.muted }}>
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold" style={{ color: C.text }}>Proyek Saya</h1>
            <p className="text-[10px] font-medium tracking-wide" style={{ color: C.subtext }}>
              {projects.length} proyek ditugaskan
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-slate-100" style={{ color: C.muted }}><Bell size={20} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7 space-y-5">
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
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusBadge(project.status)}`}>
                          {statusLabel(project.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2" style={{ color: C.muted }}>
                        <MapPin size={11} className="shrink-0" />
                        <span className="text-[11px] font-medium truncate">{project.project_address}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
                          <div className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
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

          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}
