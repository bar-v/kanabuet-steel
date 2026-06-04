"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid, FolderOpen, TrendingUp, Package,
  LogOut, Menu, X, ArrowLeft, MapPin, CalendarClock,
  Camera, FileText, Bell, Save, ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectProgress, User } from "@/lib/types/database";

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
  sidebar: "#F1F5F9", header: "#FFFFFF",
};

import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";

function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-orange-400";
  return "bg-amber-500";
}
function getLatestProgress(projectId: number, list: ProjectProgress[]): number {
  const records = list.filter(p => p.project_id === projectId);
  if (!records.length) return 0;
  return records.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0].percentage;
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function UpdateProgressPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User & data
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [progressList, setProgressList] = useState<ProjectProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
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
      const res = await fetch('/api/auth/me');
      const { user } = await res.json();
      if (user) setUser(user as User);
      const { data: projectData } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (projectData) setProjects(projectData as Project[]);
      const { data: progressData } = await supabase.from("project_progress").select("*").order("created_at", { ascending: false });
      if (progressData) setProgressList(progressData as ProjectProgress[]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sync pct ke latest progress ketika proyek dipilih
  useEffect(() => {
    if (selectedProjectId !== "") {
      const latest = getLatestProgress(Number(selectedProjectId), progressList);
      setPct(latest);
    }
  }, [selectedProjectId, progressList]);

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

      // Upload foto jika ada
      if (photoFile && user) {
        const ext = photoFile.name.split(".").pop();
        const filePath = `progress/${selectedProjectId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("project-photos")
          .upload(filePath, photoFile, { upsert: false });

        if (uploadError) {
          console.warn("Upload foto gagal:", uploadError.message);
          // Lanjut tanpa foto
        } else {
          const { data: urlData } = supabase.storage
            .from("project-photos")
            .getPublicUrl(filePath);
          photoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("project_progress").insert([{
        project_id:  Number(selectedProjectId),
        recorded_by: user?.user_id ?? null,
        percentage:  pct,
        notes:       notes.trim() || null,
        photo_url:   photoUrl,
        update_date: updateDate,
      }]);

      if (error) throw error;

      // Reset form
      setSuccessMsg("Progress berhasil disimpan!");
      setNotes("");
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh progress list
      await fetchData();
    } catch (err: unknown) {
      alert("Gagal menyimpan progress: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const { logoutAction } = await import('@/app/login/actions');
    await logoutAction();
    document.cookie = "system_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const selectedProject = projects.find(p => p.project_id === Number(selectedProjectId));
  const lastPct = selectedProjectId !== "" ? getLatestProgress(Number(selectedProjectId), progressList) : 0;
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
                <div className="relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full appearance-none px-3 py-2.5 rounded-lg border text-sm font-medium pr-9 cursor-pointer outline-none focus:border-orange-500"
                    style={{ borderColor: C.border, background: C.bg, color: C.text }}
                    required
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
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
