"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid, FolderOpen, TrendingUp, Package,
  LogOut, Menu, X, ArrowLeft, MapPin, CalendarClock,
  Camera, FileText, Bell, Save, ChevronDown, Search,
} from "lucide-react";
import type { Project, ProjectProgress, User } from "@/lib/types/database";

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
  sidebar: "#F1F5F9", header: "#FFFFFF",
};

import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";
import { useLogout } from "@/lib/auth/client";

function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-orange-400";
  return "bg-amber-500";
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function UpdateProgressPage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User & data
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<(Project & { latest_progress?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">(""); 

  // Searchable Dropdown States
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  const filteredProjects = projects
    .filter(p => p.status === "aktif")
    .filter(p =>
      p.project_name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.client_name && p.client_name.toLowerCase().includes(projectSearchQuery.toLowerCase()))
    );

  useEffect(() => {
    if (!projectDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".project-search-container")) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [projectDropdownOpen]);

  const [pct, setPct] = useState(0);
  const [notes, setNotes] = useState("");
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split("T")[0]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const resUser = await fetch('/api/auth/me');
      const { user } = await resUser.json();
      if (user) setUser(user as User);

      // Ambil proyek yang ditugaskan via API
      const resProjects = await fetch('/api/supervisor/projects');
      const { projects: projectData } = await resProjects.json();
      if (projectData) setProjects(projectData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sync pct ke latest progress ketika proyek dipilih
  useEffect(() => {
    if (selectedProjectId !== "") {
      const project = projects.find(p => p.project_id === Number(selectedProjectId));
      if (project) {
        setPct(project.latest_progress ?? 0);
      }
    }
  }, [selectedProjectId, projects]);

  // Restore active project from localStorage
  useEffect(() => {
    if (projects.length > 0 && selectedProjectId === "") {
      const lastSelected = localStorage.getItem("active_project_id");
      if (lastSelected && projects.some(p => p.project_id.toString() === lastSelected && p.status === "aktif")) {
        setSelectedProjectId(Number(lastSelected));
      }
    }
  }, [projects, selectedProjectId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) { alert("Pilih proyek terlebih dahulu."); return; }
    setIsSubmitting(true);
    setSuccessMsg(null);

    try {
      let photoUrl: string | null = null;

      // Upload foto via API jika ada
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("project_id", String(selectedProjectId));

        const uploadRes = await fetch('/api/supervisor/upload', {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          photoUrl = url;
        } else {
          console.warn("Upload foto gagal");
        }
      }

      // Simpan progress via API
      const res = await fetch('/api/supervisor/progress', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: Number(selectedProjectId),
          percentage: pct,
          notes: notes.trim() || null,
          photo_url: photoUrl,
          update_date: updateDate,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal menyimpan progress");
      }

      // Reset form
      setSuccessMsg("Progress berhasil disimpan!");
      setNotes("");
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh data
      await fetchData();
    } catch (err: unknown) {
      alert("Gagal menyimpan progress: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = useLogout();

  const selectedProject = projects.find(p => p.project_id === Number(selectedProjectId));
  const lastPct = selectedProject?.latest_progress ?? 0;
  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "SV";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, color: C.text }}>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 flex flex-col border-r transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        style={{ background: C.sidebar, borderColor: C.border }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: C.border }}>
          <Image src="/images/logo.png" alt="logo" width={36} height={36} className="object-contain" />
          <div className="flex-1 min-w-0">
            <p className="text-orange-600 font-black text-sm tracking-wider leading-none truncate">KANABUET STEEL</p>
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
            <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm">{initials}</div>
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-5 border-b"
          style={{ height: 60, background: C.header, borderColor: C.border }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" style={{ color: C.muted }}>
            <Menu size={20} />
          </button>
          <button onClick={() => router.push("/dashboard/supervisor")}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-medium" style={{ color: C.subtext }}>
            <ArrowLeft size={16} />
            <span className="hidden sm:block">Kembali</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold" style={{ color: C.text }}>Update Progress</h1>
            <p className="text-[10px] font-medium" style={{ color: C.subtext }}>Perbarui progres pekerjaan proyek</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-slate-100" style={{ color: C.muted }}>
              <Bell size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l" style={{ borderColor: C.border }}>
              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-xs">{initials}</div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 space-y-5">

          {/* Success message */}
          {successMsg && (
            <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 1. Pilih Proyek */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Pilih Proyek</h2>
              <div className="rounded-xl border p-4 space-y-3" style={{ background: C.card, borderColor: C.border }}>
                <div className="relative project-search-container">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectDropdownOpen(!projectDropdownOpen);
                      setProjectSearchQuery("");
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none text-left flex items-center justify-between bg-white focus:border-orange-500 transition-all"
                    style={{ borderColor: C.border }}
                  >
                    <span className={selectedProject ? "text-slate-900" : "text-slate-400"}>
                      {selectedProject ? `${selectedProject.project_name} (${selectedProject.client_name || 'Tanpa Klien'})` : "Pilih Proyek"}
                    </span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${projectDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {projectDropdownOpen && (
                    <div
                      className="absolute z-[110] left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60 animate-in fade-in slide-in-from-top-1 duration-150"
                      style={{ borderColor: C.border }}
                    >
                      <div className="p-2 border-b flex items-center gap-2 bg-slate-50" style={{ borderColor: C.border }}>
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Cari proyek..."
                          value={projectSearchQuery}
                          onChange={(e) => setProjectSearchQuery(e.target.value)}
                          className="w-full bg-transparent text-sm outline-none font-medium text-slate-800"
                          autoFocus
                        />
                        {projectSearchQuery && (
                          <button type="button" onClick={() => setProjectSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-48">
                        {filteredProjects.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                            Proyek tidak ditemukan
                          </div>
                        ) : (
                          filteredProjects.map((p) => (
                            <button
                              key={p.project_id}
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(p.project_id);
                                localStorage.setItem("active_project_id", p.project_id.toString());
                                setProjectDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-orange-50/30 flex flex-col gap-0.5"
                            >
                              <span className="font-bold text-slate-800">{p.project_name}</span>
                              <span className="text-[11px] text-slate-500">Klien: {p.client_name || 'Tanpa Klien'}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedProject && (
                  <div className="rounded-lg overflow-hidden border" style={{ borderColor: C.border }}>
                    <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-2" style={{ color: C.muted }}>
                        <MapPin size={11} className="shrink-0" />
                        <span className="text-[11px] font-medium truncate">{selectedProject.project_address}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: C.muted }}>Progress terakhir</span>
                        <span className="text-sm font-black text-orange-600">{lastPct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
                        <div className={`h-full rounded-full ${progressColor(lastPct)}`} style={{ width: `${lastPct}%` }} />
                      </div>
                      {selectedProject.estimated_finish && (
                        <div className="flex items-center gap-1.5 mt-2" style={{ color: C.muted }}>
                          <CalendarClock size={10} />
                          <span className="text-[10px]">Tenggat: {formatDate(selectedProject.estimated_finish)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Form Update */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Form Update Progress</h2>
              <div className="rounded-xl border p-4 space-y-4" style={{ background: C.card, borderColor: C.border }}>

                {/* Persentase */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: C.subtext }}>
                    Persentase Progress Saat Ini
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <input
                      type="range" min={0} max={100} value={pct}
                      onChange={(e) => setPct(Number(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-orange-500"
                      style={{ background: `linear-gradient(to right, #F97316 ${pct}%, #E2E8F0 ${pct}%)` }}
                    />
                    <div className="w-16 h-10 rounded-lg border flex items-center justify-center font-black text-orange-600 text-lg shrink-0"
                      style={{ borderColor: C.border, background: C.bg }}>
                      {pct}%
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div className={`h-full rounded-full transition-all duration-300 ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.subtext }}>Tanggal Update</label>
                  <input
                    type="date"
                    value={updateDate}
                    onChange={(e) => setUpdateDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500"
                    style={{ borderColor: C.border, background: C.bg, color: C.text }}
                    required
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.subtext }}>Catatan Pekerjaan</label>
                  <div className="relative">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Tuliskan catatan pekerjaan, kendala, atau aktivitas..."
                      className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none leading-relaxed outline-none focus:border-orange-500"
                      style={{ borderColor: C.border, background: C.bg, color: C.text }}
                    />
                    <FileText size={14} className="absolute top-3 right-3 pointer-events-none" style={{ color: C.muted }} />
                  </div>
                  <p className="text-[10px] mt-1 text-right" style={{ color: C.muted }}>{notes.length} karakter</p>
                </div>
              </div>
            </section>

            {/* 3. Upload Foto */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Dokumentasi Foto</h2>
              <div className="rounded-xl border p-4" style={{ background: C.card, borderColor: C.border }}>
                {photoPreview ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: C.border }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] text-center font-medium" style={{ color: C.muted }}>{photoFile?.name}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 hover:border-orange-300 hover:bg-orange-50 transition-all duration-150"
                    style={{ borderColor: C.border }}
                  >
                    <Camera size={28} style={{ color: C.muted }} />
                    <p className="text-sm font-semibold" style={{ color: C.muted }}>Tap untuk ambil foto</p>
                    <p className="text-[10px]" style={{ color: C.muted }}>Gunakan kamera atau pilih dari galeri · Maks. 5MB</p>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </section>

            {/* 4. Actions */}
            <section className="space-y-3 pb-2">
              <button
                type="submit"
                disabled={isSubmitting || !selectedProjectId}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all duration-150 active:scale-[0.98] shadow-[0_4px_14px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <><svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Menyimpan...</>
                ) : (
                  <><Save size={17} /> Simpan Progress</>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/supervisor")}
                className="w-full py-3 rounded-xl border font-semibold text-sm transition-all duration-150 hover:bg-slate-100"
                style={{ borderColor: C.border, color: C.subtext, background: C.card }}
              >
                Batal
              </button>
            </section>

          </form>

          <div className="h-6 lg:h-2" />
        </main>
      </div>
    </div>
  );
}
