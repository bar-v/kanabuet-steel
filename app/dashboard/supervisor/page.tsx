"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid, FolderOpen, TrendingUp, Package,
  LogOut, Menu, X, Bell, ChevronRight,
  RefreshCw, MapPin, Camera, Navigation,
  CheckCheck, CalendarClock, AlertCircle, Clock,
  CheckCircle2, FileText,
} from "lucide-react";
import type { Project, User, ProjectProgress, ProjectMember } from "@/lib/types/database";

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
  sidebar: "#F1F5F9", header: "#FFFFFF",
};

import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";

// ── Helpers ───────────────────────────────────────────────────
function statusBadge(s: string) {
  if (s === "selesai") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "aktif") return "bg-orange-50  text-orange-700  border border-orange-200";
  if (s === "menunggu_validasi") return "bg-sky-50 text-sky-700 border border-sky-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}
function statusLabel(s: string) {
  if (s === "selesai") return "Selesai";
  if (s === "aktif") return "Aktif";
  if (s === "menunggu_validasi") return "Menunggu Validasi";
  if (s === "tertunda") return "Tertunda";
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

// GPS State
type GpsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; lat: number; lng: number; timestamp: Date }
  | { status: "error"; message: string };

// ── Component ─────────────────────────────────────────────────
export default function SupervisorDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<(Project & { latest_progress?: number })[]>([]);
  const [recentProgress, setRecentProgress] = useState<ProjectProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveProjectId(localStorage.getItem("active_project_id"));
    }
  }, []);

  // GPS state
  const [gps, setGps] = useState<GpsState>({ status: "idle" });

  // Proyek yang dipilih untuk validasi lokasi
  const [selectedValidationProject, setSelectedValidationProject] = useState<number | "">("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ambil user yang login
      const resUser = await fetch('/api/auth/me');
      const { user } = await resUser.json();
      if (!user) return;
      setUser(user as User);

      // Ambil proyek yang ditugaskan via API (sudah termasuk latest_progress)
      const resProjects = await fetch('/api/supervisor/projects');
      const { projects: projectData } = await resProjects.json();
      if (projectData) setProjects(projectData);

      // Ambil progress terbaru via API
      const resProgress = await fetch('/api/supervisor/progress');
      const { progress: progressData } = await resProgress.json();
      if (progressData) {
        setRecentProgress(progressData.slice(0, 5));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Validasi active_project_id
  useEffect(() => {
    if (!isLoading && projects.length > 0 && activeProjectId) {
      const p = projects.find(proj => proj.project_id.toString() === activeProjectId);
      if (!p) {
        localStorage.removeItem("active_project_id");
        setActiveProjectId(null);
      }
    }
  }, [isLoading, projects, activeProjectId]);

  // Ambil GPS perangkat
  const handleAmbilGps = () => {
    if (!("geolocation" in navigator)) {
      setGps({ status: "error", message: "Perangkat tidak mendukung GPS." });
      return;
    }
    setGps({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          status: "success",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date(),
        });
      },
      (err) => {
        setGps({ status: "error", message: `Gagal mengambil GPS: ${err.message}` });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Simpan validasi lokasi via API
  const handleSimpanValidasi = async () => {
    if (gps.status !== "success" || !selectedValidationProject) return;

    try {
      const res = await fetch(`/api/supervisor/projects/${selectedValidationProject}/validate-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: gps.lat,
          longitude: gps.lng,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Gagal menyimpan validasi lokasi.");
        return;
      }

      alert("Lokasi proyek berhasil divalidasi! Status proyek kini: Aktif.");
      setGps({ status: "idle" });
      setSelectedValidationProject("");
      await fetchData();
    } catch {
      alert("Terjadi kesalahan saat menyimpan lokasi.");
    }
  };

  // Update lokasi GPS untuk proyek yang sudah aktif
  const handleUpdateLokasi = async (projectId: number) => {
    if (gps.status !== "success") return;

    try {
      const res = await fetch(`/api/supervisor/projects/${projectId}/update-location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: gps.lat,
          longitude: gps.lng,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Gagal memperbarui lokasi.");
        return;
      }

      alert("Lokasi proyek berhasil diperbarui.");
      await fetchData();
    } catch {
      alert("Terjadi kesalahan saat memperbarui lokasi.");
    }
  };

  const handleLogout = async () => {
    const { logoutAction } = await import('@/app/login/actions');
    await logoutAction();
    document.cookie = "system_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "SV";

  const activeProject = activeProjectId ? projects.find(p => p.project_id.toString() === activeProjectId) : null;
  const pendingProjects = projects.filter(p => p.status === "menunggu_validasi");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, color: C.text }}>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 flex flex-col border-r transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        style={{ background: C.sidebar, borderColor: C.border }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: C.border }}>
          <Image src="/images/logo.png" alt="logo" width={36} height={36}
            className="object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
          <div className="flex-1 min-w-0">
            <p className="text-orange-500 font-black text-sm tracking-wider leading-none truncate">KANABUET STEEL</p>
            <p className="text-[10px] tracking-wide mt-0.5 font-medium" style={{ color: C.subtext }}>
              Fabrication Management System
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden" style={{ color: C.muted }}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {SUPERVISOR_NAV.map(({ label, Icon, href, matchPatterns }) => {
            const active = isNavActive(pathname, href, matchPatterns);
            return (
              <button
                key={label}
                onClick={() => { setSidebarOpen(false); router.push(href); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
                  ${active
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                    : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                style={!active ? { color: C.subtext } : undefined}
              >
                <Icon size={17} style={!active ? { color: C.muted } : undefined} className={active ? "text-orange-400" : ""} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-4" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: C.text }}>{user?.fullname ?? "Memuat..."}</p>
              <p className="text-[11px] font-medium" style={{ color: C.muted }}>Supervisor</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOP HEADER */}
        <header
          className="sticky top-0 z-20 flex items-center gap-4 px-5 backdrop-blur border-b"
          style={{ height: 60, background: `${C.header}E6`, borderColor: C.border }}
        >
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" style={{ color: C.muted }}>
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold" style={{ color: C.text }}>Dashboard Supervisor</h1>
            <p className="text-[10px] font-medium tracking-wide" style={{ color: C.subtext }}>
              {user?.fullname ?? ""}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-slate-100" style={{ color: C.muted }}>
              <Bell size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l" style={{ borderColor: C.border }}>
              <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 space-y-7">

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
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusBadge(activeProject.status)}`}>
                        {statusLabel(activeProject.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3" style={{ color: C.muted }}>
                      <MapPin size={11} className="shrink-0" />
                      <span className="text-[11px] font-medium truncate">{activeProject.project_address}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressColor(activeProject.latest_progress ?? 0)}`}
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
                { label: "Update Progress", Icon: RefreshCw, color: "text-orange-600", iconBg: "bg-orange-50", border: "border-orange-200", href: "/dashboard/supervisor/progress", requiresValidation: true },
                { label: "Upload Dokumentasi", Icon: Camera, color: "text-sky-600", iconBg: "bg-sky-50", border: "border-sky-200", href: "/dashboard/supervisor/progress", requiresValidation: true },
                { label: "Validasi Lokasi GPS", Icon: MapPin, color: "text-emerald-600", iconBg: "bg-emerald-50", border: "border-emerald-200", href: "/dashboard/supervisor/location", requiresValidation: false },
                { label: "Catat Material Keluar", Icon: Package, color: "text-violet-600", iconBg: "bg-violet-50", border: "border-violet-200", href: "/dashboard/supervisor/materials", requiresValidation: true },
              ].map(({ label, Icon, color, iconBg, border, href, requiresValidation }) => {
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
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-150 
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

          {/* 3. AKTIVITAS PROGRESS TERBARU */}
          {!isLoading && recentProgress.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Update Progress Terbaru</h2>
              <div className="rounded-xl border divide-y" style={{ background: C.card, borderColor: C.border }}>
                {recentProgress.map((prog) => {
                  const proj = projects.find(p => p.project_id === prog.project_id);
                  return (
                    <div key={prog.progress_id} className="flex items-start gap-3 p-4" style={{ borderColor: C.border }}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-orange-50 text-orange-600">
                        <TrendingUp size={15} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug" style={{ color: C.text }}>
                          Update {prog.percentage}%
                        </p>
                        <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: C.muted }}>
                          {proj?.project_name ?? `Proyek #${prog.project_id}`}
                        </p>
                        {prog.notes && (
                          <p className="text-[11px] mt-0.5 italic truncate" style={{ color: C.muted }}>&quot;{prog.notes}&quot;</p>
                        )}
                      </div>
                      <span className="text-[10px] font-medium shrink-0 mt-0.5 whitespace-nowrap" style={{ color: C.muted }}>
                        {formatDate(prog.update_date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}


          <div className="h-24 lg:h-4" />
        </main>
      </div>
    </div>
  );
}
