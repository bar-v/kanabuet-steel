"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  LayoutGrid, FolderOpen, TrendingUp, Package, LogOut, Menu, X, ArrowLeft,
  MapPin, CalendarClock, Activity, Upload, ImageIcon, ChevronRight, Plus,
  Search, AlertTriangle, CheckCircle2, Users, Clock, FileText, UserCircle2
} from "lucide-react";
import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";
import type { Project, ProjectProgress, ProjectMember, Material, User } from "@/lib/types/database";

// ── Design tokens — light mode ──
const C = {
  bg:      "#F8FAFC",
  card:    "#FFFFFF",
  border:  "#E2E8F0",
  text:    "#0F172A",
  subtext: "#334155",
  muted:   "#64748B",
  sidebar: "#F1F5F9",
  header:  "#FFFFFF",
};

// ── Helpers ───────────────────────────────────────────────
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

interface MaterialUsageItem {
  usage_id: number;
  project_id: number;
  material_id: number;
  quantity: number;
  usage_date: string;
  notes: string | null;
  created_at: string;
  materials: { material_name: string; unit: string } | null;
}

const TABS = ["Overview", "Anggota", "Material", "Dokumentasi"] as const;
type Tab = typeof TABS[number];

// ── Component ─────────────────────────────────────────────
export default function SupervisorProjectDetail() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  // Data state
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [latestProgress, setLatestProgress] = useState(0);
  const [progressHistory, setProgressHistory] = useState<ProjectProgress[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsageItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [photos, setPhotos] = useState<{ progress_id: number; photo_url: string; update_date: string; notes: string | null; percentage: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [usageQuantity, setUsageQuantity] = useState("");
  const [usageNotes, setUsageNotes] = useState("");
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // User info
      const resUser = await fetch('/api/auth/me');
      const { user } = await resUser.json();
      if (user) setUser(user as User);

      // Project detail
      const resProject = await fetch(`/api/supervisor/projects/${projectId}`);
      if (resProject.ok) {
        const data = await resProject.json();
        setProject(data.project);
        setLatestProgress(data.latestProgress);
        setProgressHistory(data.progressHistory);
        setMembersCount(data.membersCount);
      }

      // Members
      const resMembers = await fetch(`/api/supervisor/projects/${projectId}/members`);
      if (resMembers.ok) {
        const { members: m } = await resMembers.json();
        setMembers(m || []);
      }

      // Material usage
      const resUsage = await fetch(`/api/supervisor/materials/usage?project_id=${projectId}`);
      if (resUsage.ok) {
        const { usage } = await resUsage.json();
        setMaterialUsage(usage || []);
      }

      // Materials list for modal
      const resMaterials = await fetch('/api/supervisor/materials');
      if (resMaterials.ok) {
        const { materials: m } = await resMaterials.json();
        setMaterials(m || []);
      }

      // Documentation
      const resDocs = await fetch(`/api/supervisor/projects/${projectId}/documentation`);
      if (resDocs.ok) {
        const { photos: p } = await resDocs.json();
        setPhotos(p || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    const { logoutAction } = await import('@/app/login/actions');
    await logoutAction();
    document.cookie = "system_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const handleSubmitUsage = async () => {
    if (!selectedMaterialId || !usageQuantity || Number(usageQuantity) <= 0) return;
    setIsSubmittingUsage(true);

    try {
      const res = await fetch('/api/supervisor/materials/usage', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: parseInt(projectId),
          material_id: parseInt(selectedMaterialId),
          quantity: parseInt(usageQuantity),
          notes: usageNotes.trim() || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Gagal mencatat penggunaan.");
        return;
      }

      setShowModal(false);
      setSelectedMaterialId("");
      setUsageQuantity("");
      setUsageNotes("");
      await fetchData();
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setIsSubmittingUsage(false);
    }
  };

  const selectedMaterial = materials.find(m => m.material_id.toString() === selectedMaterialId);
  const isCritical = selectedMaterial ? selectedMaterial.current_stock <= selectedMaterial.minimum_stock : false;

  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "SV";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, color: C.text }}>

      {/* Mobile backdrop */}
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
          <Image src="/images/logo.png" alt="logo" width={36} height={36} className="object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
          <div className="flex-1 min-w-0">
            <p className="text-orange-500 font-black text-sm tracking-wider leading-none truncate">KANABUET STEEL</p>
            <p className="text-[10px] tracking-wide mt-0.5 font-medium" style={{ color: C.subtext }}>Fabrication Management System</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden hover:text-slate-900 transition-colors" style={{ color: C.muted }}>
            <X size={18} />
          </button>
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
            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 font-bold text-sm">{initials}</div>
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

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-5 backdrop-blur border-b" style={{ height: 60, background: `${C.header}E6`, borderColor: C.border }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: C.muted }}>
            <Menu size={20} />
          </button>
          <button onClick={() => router.push('/dashboard/supervisor')} className="p-2 -ml-2 sm:ml-0 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-medium" style={{ color: C.subtext }}>
            <ArrowLeft size={16} />
            <span className="hidden sm:block">Kembali</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate" style={{ color: C.text }}>Detail Proyek</h1>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto">

          {isLoading ? (
            <div className="p-5 space-y-4">
              <div className="h-32 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
              <div className="h-10 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
              <div className="h-48 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
            </div>
          ) : !project ? (
            <div className="p-5 text-center">
              <p className="text-sm text-slate-500">Proyek tidak ditemukan.</p>
            </div>
          ) : (
            <>
              {/* Project Info Card */}
              <div className="p-4 sm:p-5 lg:p-7 pb-0">
                <div className="rounded-xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
                  <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm sm:text-base font-bold leading-tight" style={{ color: C.text }}>{project.project_name}</p>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusBadge(project.status)}`}>
                        {statusLabel(project.status)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold" style={{ color: C.subtext }}>Progres Pekerjaan</span>
                        <span className="text-lg font-black text-orange-400">{latestProgress}%</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                        <div className={`h-full rounded-full transition-all duration-500 ${progressColor(latestProgress)}`} style={{ width: `${latestProgress}%` }} />
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
              </div>

              {/* Tabs Navigation */}
              <div className="sticky top-0 z-10 px-4 sm:px-5 lg:px-7 pt-4 pb-0 bg-slate-50/80 backdrop-blur-md">
                <div className="flex gap-1 rounded-xl p-1 border bg-white shadow-sm" style={{ borderColor: C.border }}>
                  {TABS.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ${activeTab === tab ? "bg-orange-500 text-white shadow-sm" : "hover:bg-slate-50 text-slate-500"}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-5 lg:p-7 pt-4 space-y-5 pb-24">

                {/* TAB: Overview */}
                {activeTab === "Overview" && (
                  <div className="space-y-4">
                    {project.description && (
                      <div className="rounded-xl border p-4 bg-white" style={{ borderColor: C.border }}>
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Deskripsi Pekerjaan</h2>
                        <p className="text-sm leading-relaxed font-medium" style={{ color: C.subtext }}>{project.description}</p>
                      </div>
                    )}

                    {/* Progress History */}
                    <div className="rounded-xl border p-4 bg-white" style={{ borderColor: C.border }}>
                      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Riwayat Progress</h2>
                      {progressHistory.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">Belum ada data progress.</p>
                      ) : (
                        <div className="space-y-3">
                          {progressHistory.slice(0, 5).map((p) => (
                            <div key={p.progress_id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: C.border }}>
                              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                <TrendingUp size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-bold text-orange-600">{p.percentage}%</span>
                                  <span className="text-[10px] font-medium" style={{ color: C.muted }}>{formatDate(p.update_date)}</span>
                                </div>
                                {p.notes && <p className="text-[11px] mt-1 leading-snug" style={{ color: C.subtext }}>{p.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Info Lokasi */}
                    {(project.latitude && project.longitude) && (
                      <div className="rounded-xl border p-4 bg-white" style={{ borderColor: C.border }}>
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Lokasi GPS</h2>
                        <div className="flex items-center gap-2" style={{ color: C.subtext }}>
                          <MapPin size={14} className="text-emerald-500" />
                          <span className="text-sm font-medium">{project.latitude}°, {project.longitude}°</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Anggota */}
                {activeTab === "Anggota" && (
                  <div className="space-y-3">
                    {members.length === 0 ? (
                      <div className="rounded-xl border p-6 bg-white text-center" style={{ borderColor: C.border }}>
                        <Users size={28} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm text-slate-400">Belum ada anggota proyek.</p>
                      </div>
                    ) : (
                      members.map((m) => (
                        <div key={m.member_id} className="rounded-xl border p-4 bg-white flex items-center gap-3" style={{ borderColor: C.border }}>
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 font-bold text-sm">
                            {m.member_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: C.text }}>{m.member_name}</p>
                            <p className="text-[11px] font-medium" style={{ color: C.muted }}>{m.project_role}</p>
                          </div>
                          {m.phone_number && (
                            <span className="text-[11px] font-medium shrink-0" style={{ color: C.muted }}>{m.phone_number}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: Material */}
                {activeTab === "Material" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Riwayat Penggunaan</h2>
                    </div>
                    
                    {materialUsage.length === 0 ? (
                      <div className="rounded-xl border p-6 bg-white text-center" style={{ borderColor: C.border }}>
                        <Package size={28} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm text-slate-400">Belum ada penggunaan material.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {materialUsage.map((m) => (
                          <div key={m.usage_id} className="rounded-xl border p-4 flex items-center justify-between gap-3 bg-white" style={{ borderColor: C.border }}>
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                <Package size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color: C.text }}>{m.materials?.material_name ?? "Material"}</p>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(m.usage_date)}</p>
                                {m.notes && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{m.notes}</p>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-orange-600">-{m.quantity}</p>
                              <p className="text-[10px] font-bold text-slate-400">{m.materials?.unit ?? ""}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Dokumentasi */}
                {activeTab === "Dokumentasi" && (
                  <div className="space-y-4">
                    {photos.length === 0 ? (
                      <div className="rounded-xl border p-6 bg-white text-center" style={{ borderColor: C.border }}>
                        <ImageIcon size={28} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm text-slate-400">Belum ada dokumentasi foto.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {photos.map((photo) => (
                          <div key={photo.progress_id} className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: C.border }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.photo_url} alt="Dokumentasi" className="w-full h-32 object-cover" />
                            <div className="p-2">
                              <p className="text-[10px] font-bold text-orange-600">{photo.percentage}%</p>
                              <p className="text-[10px] font-medium" style={{ color: C.muted }}>{formatDate(photo.update_date)}</p>
                              {photo.notes && <p className="text-[10px] truncate mt-0.5" style={{ color: C.muted }}>{photo.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}
        </main>

        {/* FAB for Material tab */}
        {activeTab === "Material" && project && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-8 pointer-events-none">
            <button 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-orange-500/30 transition-all active:scale-95 pointer-events-auto"
            >
              <Plus size={18} /> Catat Penggunaan Material
            </button>
          </div>
        )}
      </div>

      {/* ═══════════ MODAL PENCATATAN MATERIAL ═══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between bg-white rounded-t-3xl sm:rounded-t-2xl sticky top-0 z-10" style={{ borderColor: C.border }}>
              <div>
                <h2 className="font-bold text-base text-slate-900">Penggunaan Material</h2>
                <p className="text-[10px] font-medium text-slate-500 line-clamp-1">{project?.project_name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 bg-slate-50 rounded-full transition-colors text-slate-500">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* 1. Pilih Material */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 text-slate-700">Pilih Material</label>
                <div className="relative">
                  <select 
                    className="w-full pl-4 pr-10 py-3 rounded-xl border text-sm font-bold outline-none appearance-none focus:border-orange-500 transition-colors bg-slate-50 border-slate-200"
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                  >
                    <option value="" disabled>Cari atau pilih material...</option>
                    {materials.map(m => (
                      <option key={m.material_id} value={m.material_id} disabled={m.current_stock <= 0}>
                        {m.material_name} — Sisa: {m.current_stock} {m.unit} {m.current_stock <= 0 ? '(Habis)' : ''}
                      </option>
                    ))}
                  </select>
                  <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. Informasi Stok */}
              {selectedMaterial && (
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${isCritical ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCritical ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                      {isCritical ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stok Tersedia</p>
                      <p className={`text-base font-black ${isCritical ? "text-amber-700" : "text-emerald-700"}`}>
                        {selectedMaterial.current_stock} <span className="text-xs font-bold opacity-70">{selectedMaterial.unit}</span>
                      </p>
                    </div>
                  </div>
                  {isCritical && (
                    <span className="text-[9px] font-bold px-2 py-1 rounded border bg-amber-100 text-amber-700 border-amber-200">
                      Stok Menipis
                    </span>
                  )}
                </div>
              )}

              {/* 3. Input Jumlah */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 text-slate-700">Jumlah Digunakan</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0"
                    min="1"
                    max={selectedMaterial?.current_stock}
                    value={usageQuantity}
                    onChange={(e) => setUsageQuantity(e.target.value)}
                    className="w-full pl-4 pr-16 py-3 rounded-xl border text-sm font-bold outline-none border-slate-200 focus:border-orange-500 transition-colors"
                  />
                  <div className="absolute right-1 top-1 bottom-1 px-3 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {selectedMaterial?.unit || "UNIT"}
                    </span>
                  </div>
                </div>
                {selectedMaterial && (
                  <p className="text-[10px] text-slate-500 ml-1 mt-1">Sisa stok setelah penggunaan akan otomatis diperbarui.</p>
                )}
              </div>

              {/* 4. Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 text-slate-700">Catatan Penggunaan (Opsional)</label>
                <textarea 
                  rows={2}
                  value={usageNotes}
                  onChange={(e) => setUsageNotes(e.target.value)}
                  placeholder="Contoh: Digunakan untuk area lantai 2..."
                  className="w-full px-4 py-3 rounded-xl border text-xs font-medium outline-none border-slate-200 focus:border-orange-500 transition-colors resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t flex gap-3 bg-slate-50 sm:rounded-b-2xl pb-8 sm:pb-4" style={{ borderColor: C.border }}>
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmitUsage}
                disabled={!selectedMaterialId || !usageQuantity || Number(usageQuantity) <= 0 || isSubmittingUsage}
                className="flex-[2] py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmittingUsage ? "Menyimpan..." : "Simpan Data"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
