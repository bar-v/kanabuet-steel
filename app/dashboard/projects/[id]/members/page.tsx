'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ProjectMember, Project, WorkerHistoryItem } from '@/lib/types/database';
import {
  Users, Plus, Trash2, X, Phone, Briefcase, ChevronLeft,
  UserCircle2, Search,
} from 'lucide-react';
import useSWR, { mutate } from 'swr';

import { C } from "@/lib/utils/theme";
import { useUI } from "@/contexts/UIContext";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectMembersPage({ params }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast, showConfirm } = useUI();

  const [projectId, setProjectId] = useState<number | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formMode, setFormMode] = useState<'dropdown' | 'new'>('dropdown');
  const [selectedWorker, setSelectedWorker] = useState<WorkerHistoryItem | null>(null);
  const [workerSearch, setWorkerSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('');

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setProjectId(Number(id)));
  }, [params]);

  const fetchMembersData = async () => {
    if (!projectId) return null;
    const supabase = createClient();
    
    // Fetch project details
    const { data: projectData } = await supabase
      .from('projects')
      .select('*, supervisor:users!supervisor_id(fullname, email)')
      .eq('project_id', projectId)
      .single();

    // Fetch members for this project
    const { data: memberData } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .order('member_id', { ascending: true });

    // Fetch unique workers from ALL project_members (histori)
    const { data: historyData } = await supabase
      .from('project_members')
      .select('member_name, phone_number, project_role');

    const uniqueHistory: WorkerHistoryItem[] = historyData 
      ? historyData.filter((item, index, self) =>
          index === self.findIndex((t) => t.member_name === item.member_name)
        ).sort((a, b) => a.member_name.localeCompare(b.member_name))
      : [];

    return {
      project: projectData as (Project & { supervisor?: { fullname: string; email: string } | null }) | null,
      members: (memberData || []) as ProjectMember[],
      workerHistory: uniqueHistory
    };
  };

  const { data, isLoading } = useSWR(projectId ? `admin_project_members_${projectId}` : null, fetchMembersData);
  const project = data?.project || null;
  const members = data?.members || [];
  const workerHistory = data?.workerHistory || [];

  const handleSelectWorker = (worker: WorkerHistoryItem) => {
    setSelectedWorker(worker);
    setNewRole(worker.project_role);
    setWorkerSearch('');
  };

  const resetForm = () => {
    setFormMode('dropdown');
    setSelectedWorker(null);
    setWorkerSearch('');
    setNewName('');
    setNewPhone('');
    setNewRole('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsSubmitting(true);

    try {
      let memberName: string;
      let phoneNumber: string | null;
      let projectRole: string;

      if (formMode === 'dropdown' && selectedWorker) {
        memberName  = selectedWorker.member_name;
        phoneNumber = selectedWorker.phone_number ?? null;
        projectRole = newRole || selectedWorker.project_role;
      } else {
        // Mode baru
        memberName  = newName.trim();
        phoneNumber = newPhone.trim() || null;
        projectRole = newRole.trim();
      }

      if (!memberName || !projectRole) {
        showToast('Nama dan jabatan wajib diisi.', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('project_members')
        .insert([{ project_id: projectId, member_name: memberName, phone_number: phoneNumber, project_role: projectRole }])
        .select()
        .single();

      if (error) throw error;

      mutate(`admin_project_members_${projectId}`);
      setShowModal(false);
      resetForm();
      showToast('Berhasil menambahkan anggota', 'success');
    } catch (err: unknown) {
      showToast('Gagal menambah anggota: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (memberId: number, memberName: string) => {
    const confirmed = await showConfirm(`Hapus "${memberName}" dari proyek ini?`, "Tindakan ini tidak bisa dibatalkan.");
    if (!confirmed) return;
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('member_id', memberId);
    if (error) { showToast('Gagal menghapus: ' + error.message, 'error'); return; }
    mutate(`admin_project_members_${projectId}`);
    showToast(`Berhasil menghapus anggota ${memberName}`, 'success');
  };

  const filteredHistory = workerHistory.filter(w =>
    w.member_name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    (w.phone_number ?? '').includes(workerSearch)
  );

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b px-4 sm:px-6 py-4 flex items-center gap-4"
        style={{ background: C.card, borderColor: C.border }}>
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: C.muted }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base truncate" style={{ color: C.text }}>
            {project ? `Anggota: ${project.project_name}` : 'Manajemen Anggota'}
          </h1>
          <p className="text-[11px] font-medium mt-0.5" style={{ color: C.muted }}>
            {members.length} anggota terdaftar
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Tambah Anggota</span>
        </button>
      </header>

      {/* Content */}
      <main className="p-4 sm:p-6 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl border animate-pulse" style={{ background: C.card, borderColor: C.border }} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: C.card, borderColor: C.border }}>
            <Users size={40} className="mx-auto mb-3" style={{ color: C.muted }} />
            <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>Belum ada anggota</p>
            <p className="text-xs mb-4" style={{ color: C.muted }}>Tambahkan anggota tim yang terlibat dalam proyek ini.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
            >
              + Tambah Anggota Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show Supervisor if assigned */}
            {project?.supervisor && (
              <div className="rounded-xl border p-4 flex items-center gap-4 border-orange-300 bg-orange-50/30 group">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm border border-orange-600">
                  {project.supervisor.fullname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-800">{project.supervisor.fullname}</p>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider border border-orange-200">
                      Ditugaskan Pemilik
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-orange-600/80">
                      <Briefcase size={10} /> Supervisor Utama
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <UserCircle2 size={10} /> Akun Terhubung
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Other Members */}
            {members.map((m) => (
              <div key={m.member_id}
                className="rounded-xl border p-4 flex items-center gap-4 hover:border-orange-300 transition-colors group"
                style={{ background: C.card, borderColor: C.border }}
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                  {m.member_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: C.text }}>{m.member_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: C.muted }}>
                      <Briefcase size={10} /> {m.project_role}
                    </span>
                    {m.phone_number && (
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: C.muted }}>
                        <Phone size={10} /> {m.phone_number}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(m.member_id, m.member_name)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Hapus anggota"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal Tambah Anggota ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-orange-200 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-800">Tambah Anggota Proyek</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-orange-50 rounded-full text-orange-400 hover:text-orange-600 transition-colors"><X size={20} /></button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 p-4 pb-0">
              <button
                type="button"
                onClick={() => { setFormMode('dropdown'); setSelectedWorker(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  formMode === 'dropdown'
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pilih dari Histori
              </button>
              <button
                type="button"
                onClick={() => { setFormMode('new'); setSelectedWorker(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  formMode === 'new'
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Pekerja Baru
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">

              {/* Mode: Dropdown Histori */}
              {formMode === 'dropdown' && (
                <div>
                  {!selectedWorker ? (
                    <>
                      <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
                        Cari Pekerja
                      </label>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                        <input
                          type="text"
                          placeholder="Cari nama atau no. HP..."
                          value={workerSearch}
                          onChange={(e) => setWorkerSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500"
                          style={{ borderColor: C.border, background: C.bg }}
                        />
                      </div>
                      <div className="max-h-44 overflow-y-auto rounded-lg border divide-y" style={{ borderColor: C.border }}>
                        {filteredHistory.length === 0 ? (
                          <p className="p-4 text-center text-xs" style={{ color: C.muted }}>
                            {workerHistory.length === 0 ? 'Belum ada histori pekerja.' : 'Tidak ditemukan.'}
                          </p>
                        ) : filteredHistory.map((w, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectWorker(w)}
                            className="w-full text-left px-3 py-2.5 hover:bg-orange-50 transition-colors flex items-center gap-3"
                          >
                            <UserCircle2 size={18} className="text-orange-400 shrink-0" />
                            <div>
                              <p className="text-sm font-bold" style={{ color: C.text }}>{w.member_name}</p>
                              <p className="text-[11px]" style={{ color: C.muted }}>
                                {w.project_role}{w.phone_number ? ` · ${w.phone_number}` : ''}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200 mb-3">
                        <UserCircle2 size={20} className="text-orange-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-orange-800">{selectedWorker.member_name}</p>
                          {selectedWorker.phone_number && (
                            <p className="text-[11px] text-orange-600">{selectedWorker.phone_number}</p>
                          )}
                        </div>
                        <button type="button" onClick={() => setSelectedWorker(null)} className="text-orange-400 hover:text-orange-600">
                          <X size={16} />
                        </button>
                      </div>
                      <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
                        Jabatan dalam Proyek Ini
                      </label>
                      <input
                        type="text"
                        placeholder="mis. Tukang Las, Pengawas, Helper"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500"
                        style={{ borderColor: C.border, background: C.bg }}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Mode: Pekerja Baru */}
              {formMode === 'new' && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
                      Nama Pekerja <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nama lengkap"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500"
                      style={{ borderColor: C.border, background: C.bg }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
                      Nomor HP
                    </label>
                    <input
                      type="tel"
                      placeholder="mis. 08123456789"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500"
                      style={{ borderColor: C.border, background: C.bg }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>
                      Jabatan dalam Proyek <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="mis. Tukang Las, Pengawas, Helper"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500"
                      style={{ borderColor: C.border, background: C.bg }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-semibold hover:bg-slate-50 transition-colors"
                  style={{ borderColor: C.border, color: C.subtext }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (formMode === 'dropdown' && !selectedWorker)}
                  className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
