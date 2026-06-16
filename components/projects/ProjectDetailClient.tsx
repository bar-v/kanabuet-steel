"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft, MapPin, CalendarClock, UserCircle2,
  Activity, ChevronRight, Users, Edit2, TrendingUp,
  Package, AlertTriangle, ImageIcon, Plus, Navigation,
  Search, CheckCircle2, X, Trash2
} from "lucide-react";
import type {
  Project, ProjectProgress, ProjectMember, Material, User
} from "@/lib/types/database";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/utils/fetcher";
import AddMemberModal from "./AddMemberModal";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatRupiah } from "@/lib/utils/formatters";
import { C, getStatusStyle, getStatusLabel, getProgressColor } from "@/lib/utils/theme";

const DynamicMap = dynamic(() => import("@/components/MapPicker"), { ssr: false });



interface MaterialUsageItem {
  usage_id: number;
  project_id: number;
  material_id: number;
  quantity: number;
  usage_date: string;
  notes: string | null;
  total_cost: number;
  created_at: string;
  materials: { material_name: string; unit: string } | null;
}

const TABS = ["Overview", "Progress", "Material", "Tim"] as const;
type Tab = (typeof TABS)[number];

interface ProjectDetailClientProps {
  projectId: string | number;
  role: "owner" | "supervisor";
}

export default function ProjectDetailClient({ projectId, role }: ProjectDetailClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  // SWR Fetching
  const { data: projectData, isLoading: projectLoading } = useSWR(`/api/projects/${projectId}`, fetcher);
  const { data: progressData, isLoading: progressLoading } = useSWR(`/api/projects/${projectId}/progress`, fetcher);
  const { data: membersData, isLoading: membersLoading } = useSWR(`/api/projects/${projectId}/members`, fetcher);
  const { data: usageData, isLoading: usageLoading } = useSWR(`/api/projects/${projectId}/materials`, fetcher);
  const { data: docsData, isLoading: docsLoading } = useSWR(`/api/projects/${projectId}/documentation`, fetcher);
  const { data: materialsData, isLoading: materialsLoading } = useSWR(role === "supervisor" ? '/api/supervisor/materials' : null, fetcher);

  const project = projectData?.project as Project | undefined;
  const latestProgress = projectData?.latestProgress as number | undefined ?? 0;
  const progressHistory = progressData?.progressHistory as any[] | undefined ?? [];
  const members = membersData?.members as ProjectMember[] | undefined ?? [];
  const materialUsage = usageData?.usage as MaterialUsageItem[] | undefined ?? [];
  const photos = docsData?.photos as any[] | undefined ?? [];
  const materials = materialsData?.materials as Material[] | undefined ?? [];

  const isLoading = projectLoading || progressLoading || membersLoading || usageLoading || docsLoading || (role === "supervisor" && materialsLoading);

  // Modal State
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [usageQuantity, setUsageQuantity] = useState("");
  const [usageNotes, setUsageNotes] = useState("");
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Hapus "${memberName}" dari proyek ini?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('member_id', memberId);
    if (error) { alert('Gagal menghapus: ' + error.message); return; }
    mutate(`/api/projects/${projectId}/members`);
  };

  const handleSubmitUsage = async () => {
    if (!selectedMaterialId || !usageQuantity || Number(usageQuantity) <= 0) return;
    setIsSubmittingUsage(true);

    try {
      const res = await fetch('/api/supervisor/materials/usage', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: parseInt(projectId.toString()),
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

      setShowMaterialModal(false);
      setSelectedMaterialId("");
      setUsageQuantity("");
      setUsageNotes("");
      mutate(`/api/projects/${projectId}/materials`);
      if (role === "supervisor") mutate('/api/supervisor/materials');
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setIsSubmittingUsage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
        ))}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center rounded-xl border" style={{ background: C.card, borderColor: C.border }}>
        <p className="text-sm font-medium" style={{ color: C.muted }}>Proyek tidak ditemukan atau Anda tidak memiliki akses.</p>
      </div>
    );
  }

  const selectedMaterial = materials.find(m => m.material_id.toString() === selectedMaterialId);
  const isCritical = selectedMaterial ? selectedMaterial.current_stock <= selectedMaterial.minimum_stock : false;

  const groupedPhotos = photos.reduce((acc, photo) => {
    const date = formatDate(photo.update_date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(photo);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-5 pb-24 relative">
      {/* 1. Header / Project Info Card */}
      <div className="rounded-xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-sm sm:text-lg font-bold leading-tight" style={{ color: C.text }}>{project.project_name}</h1>
            <div className="flex items-center gap-2">
              <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${getStatusStyle(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
              {role === "owner" && (
                <button
                  onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  <Edit2 size={13} /> <span className="hidden sm:inline">Edit</span>
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: C.subtext }}>Progres Pekerjaan</span>
              <span className="text-lg font-black text-orange-400">{latestProgress}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.border }}>
              <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(latestProgress)}`} style={{ width: `${latestProgress}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium" style={{ color: C.muted }}>Lokasi</p>
                <p className="text-xs font-semibold leading-snug" style={{ color: C.text }}>{project.project_address}</p>
                {project.latitude && project.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-sky-500 hover:text-sky-600 hover:underline transition-colors"
                  >
                    <Navigation size={10} /> Buka di Maps
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <UserCircle2 size={14} className="text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium" style={{ color: C.muted }}>Klien</p>
                <p className="text-xs font-semibold" style={{ color: C.text }}>{project.client_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarClock size={14} className="text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium" style={{ color: C.muted }}>Mulai</p>
                <p className="text-xs font-semibold" style={{ color: C.text }}>{formatDate(project.start_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarClock size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium" style={{ color: C.muted }}>Tenggat</p>
                <p className="text-xs font-semibold text-amber-400">{formatDate(project.estimated_finish)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabs Navigation */}
      <div className="sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 bg-slate-50/80 sm:bg-transparent backdrop-blur-md pb-2 pt-2 sm:pt-0">
        <div className="flex gap-1 rounded-xl p-1 border shadow-sm" style={{ background: C.card, borderColor: C.border }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150
                ${activeTab === tab ? "bg-orange-500/15 text-orange-500 shadow-sm border border-orange-500/20" : "hover:bg-slate-50"}`}
              style={activeTab !== tab ? { color: C.muted } : undefined}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tab Content */}
      <div className="space-y-4">
        {/* TAB: Overview */}
        {activeTab === "Overview" && (
          <>
            {project.description && (
              <section className="rounded-xl border p-4 bg-white" style={{ borderColor: C.border }}>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Deskripsi Proyek</h2>
                <p className="text-sm leading-relaxed font-medium" style={{ color: C.subtext }}>{project.description}</p>
              </section>
            )}

            {/* Map */}
            {project.latitude && project.longitude && (
              <section className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
                <div className="bg-white p-3 border-b flex items-center gap-2" style={{ borderColor: C.border }}>
                  <MapPin size={14} className="text-emerald-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Peta Lokasi</h2>
                </div>
                <DynamicMap position={{ lat: project.latitude, lng: project.longitude }} />
              </section>
            )}

            {/* Recent activity */}
            <section className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: C.border }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: C.border }}>
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Aktivitas Terbaru</h2>
                <button className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-bold" onClick={() => setActiveTab("Progress")}>
                  Lihat Semua <ChevronRight size={13} />
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: C.border }}>
                {progressHistory.length === 0 ? (
                  <div className="p-6 text-center">
                    <Activity size={24} className="mx-auto mb-2 opacity-30" style={{ color: C.muted }} />
                    <p className="text-xs font-medium" style={{ color: C.muted }}>Belum ada aktivitas untuk proyek ini.</p>
                  </div>
                ) : (
                  progressHistory.slice(0, 3).map((h) => (
                    <div key={h.progress_id} className="flex items-start gap-3 p-4" style={{ borderColor: C.border }}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-orange-50 text-orange-600">
                        <TrendingUp size={14} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-orange-600">Pembaruan progres ke {h.percentage}%</p>
                          <span className="text-[10px] font-medium shrink-0" style={{ color: C.muted }}>{formatDate(h.update_date)}</span>
                        </div>
                        {h.notes && <p className="text-xs mt-1 leading-snug" style={{ color: C.subtext }}>{h.notes}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Documentation Preview */}
            <section className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: C.border }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: C.border }}>
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Preview Dokumentasi</h2>
                <button className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-bold" onClick={() => setShowDocsModal(true)}>
                  Lihat Semua <ChevronRight size={13} />
                </button>
              </div>
              <div className="p-4">
                {photos.length === 0 ? (
                  <div className="text-center py-4">
                    <ImageIcon size={24} className="mx-auto mb-2 opacity-30" style={{ color: C.muted }} />
                    <p className="text-xs font-medium" style={{ color: C.muted }}>Belum ada dokumentasi.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.slice(0, 3).map((photo) => (
                      <div key={photo.progress_id} className="rounded-lg border overflow-hidden relative group" style={{ borderColor: C.border }}>
                        <img src={photo.photo_url} alt="Dokumentasi" className="w-full h-24 object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-[10px] font-bold text-white">{photo.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* TAB: Progress */}
        {activeTab === "Progress" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Histori Progress & Dokumentasi</h2>
              {role === "supervisor" && (
                <button
                  onClick={() => {
                    localStorage.setItem("active_project_id", projectId.toString());
                    router.push(`/dashboard/supervisor/progress`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all"
                >
                  <Plus size={13} /> Tambah Progress
                </button>
              )}
            </div>
            <div className="space-y-4">
              {progressHistory.length === 0 ? (
                <div className="rounded-xl border p-8 text-center bg-white" style={{ borderColor: C.border }}>
                  <Activity size={32} className="mx-auto mb-2 opacity-30" style={{ color: C.muted }} />
                  <p className="text-sm font-medium" style={{ color: C.muted }}>Belum ada update progress.</p>
                </div>
              ) : (
                progressHistory.map((p, index, arr) => {
                  const prev = arr[index + 1];
                  const isJustDocs = prev && p.percentage === prev.percentage;

                  return (
                    <div key={p.progress_id} className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: C.border }}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          {isJustDocs ? (
                            <span className="text-sm font-black text-sky-500 flex items-center gap-1.5"><ImageIcon size={16} /> Dokumentasi Tambahan</span>
                          ) : (
                            <span className="text-xl font-black text-orange-500">{p.percentage}%</span>
                          )}
                          <span className="text-[10px] font-medium bg-slate-100 px-2 py-1 rounded-md" style={{ color: C.subtext }}>{formatDate(p.update_date)}</span>
                        </div>
                        {!isJustDocs && (
                          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: C.border }}>
                            <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(p.percentage)}`} style={{ width: `${p.percentage}%` }} />
                          </div>
                        )}
                        {p.notes && <p className="text-sm font-medium mt-1" style={{ color: C.subtext }}>{p.notes}</p>}
                        {p.users?.fullname && <p className="text-[10px] mt-2 font-medium" style={{ color: C.muted }}>Dicatat oleh: {p.users.fullname}</p>}
                      </div>
                      {p.photo_url && (
                        <div className="border-t p-3 bg-slate-50 flex items-start gap-3" style={{ borderColor: C.border }}>
                          <img src={p.photo_url} alt="Dokumentasi" className="w-16 h-16 rounded-lg object-cover border" style={{ borderColor: C.border }} />
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dokumentasi</p>
                            <a href={p.photo_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-sky-600 hover:underline">
                              Lihat Foto Penuh
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* TAB: Material */}
        {activeTab === "Material" && (
          <section>
            {role === "owner" && materialUsage.length > 0 && (
              <div className="mb-6 rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: C.border }}>
                <div className="bg-slate-50 p-3 border-b flex items-center gap-2" style={{ borderColor: C.border }}>
                  <Activity size={14} className="text-orange-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Estimasi Pengeluaran Material</h2>
                </div>
                <div className="p-5 bg-white flex flex-col items-start">
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Total Biaya Material</p>
                  <p className="text-2xl font-black text-orange-600">
                    {formatRupiah(materialUsage.reduce((acc, curr) => acc + (curr.total_cost || 0), 0))}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Riwayat Penggunaan Material</h2>
            </div>
            <div className="space-y-3">
              {materialUsage.length === 0 ? (
                <div className="rounded-xl border p-8 text-center bg-white" style={{ borderColor: C.border }}>
                  <Package size={32} className="mx-auto mb-2 opacity-30" style={{ color: C.muted }} />
                  <p className="text-sm font-medium" style={{ color: C.muted }}>Belum ada penggunaan material untuk proyek ini.</p>
                </div>
              ) : (
                materialUsage.map((m) => (
                  <div key={m.usage_id} className="rounded-xl border p-4 flex items-center justify-between gap-3 bg-white" style={{ borderColor: C.border }}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Package size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: C.text }}>{m.materials?.material_name ?? "—"}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(m.usage_date)}</p>
                        {m.notes && <p className="text-[11px] text-slate-400 mt-1 truncate">{m.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-orange-600">-{m.quantity}</p>
                      <p className="text-[10px] font-bold text-slate-400">{m.materials?.unit ?? ""}</p>
                      {role === "owner" && m.total_cost > 0 && (
                        <p className="text-[11px] font-bold text-slate-700 mt-1">{formatRupiah(m.total_cost)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* FAB for Material tab (Supervisor Only) */}
            {role === "supervisor" && (
              <div className="fixed sm:absolute bottom-4 sm:bottom-0 left-4 right-4 sm:left-0 sm:right-0 sm:p-4 sm:bg-gradient-to-t from-slate-50 via-slate-50 to-transparent sm:pt-8 pointer-events-none z-20">
                <button
                  onClick={() => setShowMaterialModal(true)}
                  className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-orange-500/30 transition-all active:scale-95 pointer-events-auto"
                >
                  <Plus size={18} /> Catat Penggunaan Material
                </button>
              </div>
            )}
          </section>
        )}

        {/* TAB: Tim */}
        {activeTab === "Tim" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>Anggota Tim</h2>
              {role === "owner" && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus size={14} /> Tambah Anggota
                </button>
              )}
            </div>
            <div className="space-y-3">
              {members.length === 0 ? (
                <div className="rounded-xl border p-8 text-center bg-white" style={{ borderColor: C.border }}>
                  <Users size={32} className="mx-auto mb-2 opacity-30" style={{ color: C.muted }} />
                  <p className="text-sm font-medium mb-3" style={{ color: C.muted }}>Belum ada anggota tim.</p>
                </div>
              ) : (
                members.map((m) => (
                  <div key={m.member_id} className="rounded-xl border p-4 bg-white flex items-center gap-3 group" style={{ borderColor: C.border }}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${m.member_id === -1 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                      {m.member_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate" style={{ color: C.text }}>{m.member_name}</p>
                        {m.member_id === -1 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider">
                            Supervisor
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium" style={{ color: C.muted }}>{m.project_role}</p>
                    </div>
                    {m.phone_number && (
                      <span className="text-[11px] font-medium shrink-0 bg-slate-50 px-2 py-1 rounded" style={{ color: C.muted }}>{m.phone_number}</span>
                    )}
                    {role === "owner" && m.member_id !== -1 && (
                      <button
                        onClick={() => handleDeleteMember(m.member_id, m.member_name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all shrink-0"
                        title="Hapus anggota"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* ═══════════ MODAL PENCATATAN MATERIAL (SUPERVISOR ONLY) ═══════════ */}
      {showMaterialModal && role === "supervisor" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMaterialModal(false)} />
          <div className="relative w-full max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between bg-white rounded-t-3xl sm:rounded-t-2xl sticky top-0 z-10" style={{ borderColor: C.border }}>
              <div>
                <h2 className="font-bold text-base text-slate-900">Penggunaan Material</h2>
                <p className="text-[10px] font-medium text-slate-500 line-clamp-1">{project?.project_name}</p>
              </div>
              <button onClick={() => setShowMaterialModal(false)} className="p-2 hover:bg-slate-100 bg-slate-50 rounded-full transition-colors text-slate-500">
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
                onClick={() => setShowMaterialModal(false)}
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

      {/* ═══════════ MODAL DOKUMENTASI FOTO ═══════════ */}
      {showDocsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowDocsModal(false)} />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between bg-white rounded-t-2xl sticky top-0 z-10" style={{ borderColor: C.border }}>
              <div>
                <h2 className="font-bold text-base text-slate-900">Galeri Dokumentasi</h2>
                <p className="text-[10px] font-medium text-slate-500">{project?.project_name}</p>
              </div>
              <button onClick={() => setShowDocsModal(false)} className="p-2 hover:bg-slate-100 bg-slate-50 rounded-full transition-colors text-slate-500">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8 bg-slate-50 rounded-b-2xl">
              {Object.keys(groupedPhotos).length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={32} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-medium text-slate-500">Belum ada dokumentasi untuk proyek ini.</p>
                </div>
              ) : (
                Object.entries(groupedPhotos).map(([date, photosInDate]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{date}</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {(photosInDate as any[]).map((photo) => (
                        <div key={photo.progress_id} className="group relative rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white aspect-square">
                          <img src={photo.photo_url} alt="Dokumentasi" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <span className="text-xs font-black text-white">{photo.percentage}% Progress</span>
                            {photo.notes && <p className="text-[10px] text-slate-200 line-clamp-2 mt-1 leading-snug">{photo.notes}</p>}
                            <a href={photo.photo_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300">
                              Buka Penuh <ChevronRight size={10} />
                            </a>
                          </div>
                          {/* Always visible percentage badge */}
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
                            <span className="text-[10px] font-bold text-white">{photo.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL TAMBAH ANGGOTA (OWNER ONLY) ═══════════ */}
      {showAddMemberModal && role === "owner" && (
        <AddMemberModal
          projectId={parseInt(projectId.toString())}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={() => {
            setShowAddMemberModal(false);
            mutate(`/api/projects/${projectId}/members`);
          }}
        />
      )}
    </div>
  );
}
