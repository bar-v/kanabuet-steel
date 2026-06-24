"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  MapPin, CalendarClock, Camera, FileText, Save, ChevronDown, Search, X, Plus
} from "lucide-react";
import type { Project } from "@/lib/types/database";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/utils/fetcher";
import { C, getProgressColor } from "@/lib/utils/theme";
import { formatDate } from "@/lib/utils/formatters";
import DashboardShell from "@/components/layout/DashboardShell";
import { useUI } from "@/contexts/UIContext";

export default function UpdateProgressPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useUI();

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");

  // SWR data fetching
  const { data: projectsData, isLoading: projectsLoading } = useSWR('/api/supervisor/projects', fetcher);
  const projects = (projectsData?.projects as (Project & { latest_progress?: number })[]) || [];
  const isLoading = projectsLoading;

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
  const [updateDate, setUpdateDate] = useState("");
  useEffect(() => {
    setUpdateDate(new Date().toISOString().split("T")[0]);
  }, []);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);



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

  const [isCompressing, setIsCompressing] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Tambahkan preview sementara
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: false,
      };

      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            const compressed = await imageCompression(file, options);
            return new File([compressed], file.name, { type: compressed.type });
          } catch (err) {
            console.error("Gagal mengompres gambar:", file.name, err);
            return file; // Fallback original
          }
        })
      );

      setPhotoFiles(prev => [...prev, ...compressedFiles]);
      // Update preview dengan file yg sudah dikompresi (opsional, tp kita timpa saja)
      setPhotoPreviews(prev => {
        // ganti n element terakhir dgn url baru
        const copy = [...prev];
        const startIdx = copy.length - files.length;
        compressedFiles.forEach((cf, i) => {
          copy[startIdx + i] = URL.createObjectURL(cf);
        });
        return copy;
      });
    } catch (error) {
      console.error("Error saat memproses gambar:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) { showToast("Pilih proyek terlebih dahulu.", "error"); return; }

    const selectedProject = projects.find(p => p.project_id === Number(selectedProjectId));
    const currentLastPct = selectedProject?.latest_progress ?? 0;

    if (pct < currentLastPct) {
      showToast(`Progress tidak boleh mundur atau lebih kecil dari progress sebelumnya (${currentLastPct}%).`, "error");
      return;
    }

    if (photoFiles.length === 0) {
      showToast("Setiap update progress wajib melampirkan minimal 1 foto bukti fisik.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl: string | null = null;
      const uploadedUrls: string[] = [];

      // Upload foto via API jika ada
      if (photoFiles.length > 0) {
        for (const file of photoFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("project_id", String(selectedProjectId));

          const uploadRes = await fetch('/api/supervisor/upload', {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            uploadedUrls.push(url);
          } else {
            const errData = await uploadRes.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(`Upload foto gagal: ${errData.error || uploadRes.statusText}`);
          }
        }
        if (uploadedUrls.length > 0) {
          photoUrl = uploadedUrls.join(",");
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
      showToast("Progress berhasil disimpan!", "success");
      setNotes("");
      setPhotoFiles([]);
      setPhotoPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh data
      mutate('/api/supervisor/projects');
      mutate('/api/supervisor/progress');
    } catch (err: unknown) {
      showToast("Gagal menyimpan progress: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProject = selectedProjectId !== "" ? projects.find(p => p.project_id === Number(selectedProjectId)) : null;
  const lastPct = selectedProject?.latest_progress ?? 0;

  return (
    <DashboardShell role="supervisor" title="Update Progress" subtitle="Perbarui progres pekerjaan proyek">

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
                    <div className={`h-full rounded-full ${getProgressColor(lastPct)}`} style={{ width: `${lastPct}%` }} />
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
                <div className={`h-full rounded-full transition-all duration-300 ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Dokumentasi Foto</h2>
            {photoPreviews.length > 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <Plus size={14} /> Tambah Foto
              </button>
            )}
          </div>
          <div className="rounded-xl border p-4" style={{ background: C.card, borderColor: C.border }}>
            {photoPreviews.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photoPreviews.map((preview, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border aspect-square" style={{ borderColor: C.border }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                        setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 hover:border-orange-300 hover:bg-orange-50 transition-all duration-150"
                style={{ borderColor: C.border }}
              >
                <Camera size={28} style={{ color: C.muted }} />
                <p className="text-sm font-semibold" style={{ color: C.muted }}>Tap untuk ambil / pilih foto</p>
                <p className="text-[10px]" style={{ color: C.muted }}>Gunakan kamera atau pilih dari galeri · Maks. 5MB per file</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </section>

        {/* 4. Actions */}
        <section className="space-y-3 pb-2">
          <button
            type="submit"
            disabled={isSubmitting || selectedProjectId === "" || isCompressing}
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

    </DashboardShell>
  );
}
