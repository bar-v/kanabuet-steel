"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Search, UserCircle2 } from "lucide-react";
import type { WorkerHistoryItem } from "@/lib/types/database";

import { C } from "@/lib/utils/theme";

interface AddMemberModalProps {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberModal({ projectId, onClose, onSuccess }: AddMemberModalProps) {
  const supabase = createClient();

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [workerHistory, setWorkerHistory] = useState<WorkerHistoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formMode, setFormMode] = useState<'dropdown' | 'new'>('dropdown');
  const [workerSearch, setWorkerSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<WorkerHistoryItem | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      const { data } = await supabase.from("project_members").select("member_name, phone_number, project_role");
      const uniqueHistory: WorkerHistoryItem[] = [];
      if (data) {
        const seen = new Set<string>();
        for (const item of data as WorkerHistoryItem[]) {
          if (!seen.has(item.member_name)) {
            seen.add(item.member_name);
            uniqueHistory.push(item);
          }
        }
        uniqueHistory.sort((a, b) => a.member_name.localeCompare(b.member_name));
      }
      setWorkerHistory(uniqueHistory);
      setIsLoadingHistory(false);
    };
    fetchHistory();
  }, [supabase]);

  const handleSelectWorker = (worker: WorkerHistoryItem) => {
    setSelectedWorker(worker);
    setNewRole(worker.project_role);
    setWorkerSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let memberName: string;
      let phoneNumber: string | null;
      let projectRole: string;

      if (formMode === 'dropdown' && selectedWorker) {
        memberName = selectedWorker.member_name;
        phoneNumber = selectedWorker.phone_number ?? null;
        projectRole = newRole || selectedWorker.project_role;
      } else {
        memberName = newName.trim();
        phoneNumber = newPhone.trim() || null;
        projectRole = newRole.trim();
      }

      if (!memberName || !projectRole) {
        alert('Nama dan jabatan wajib diisi.');
        return;
      }

      const { error } = await supabase
        .from('project_members')
        .insert([{ project_id: projectId, member_name: memberName, phone_number: phoneNumber, project_role: projectRole }]);

      if (error) throw error;

      onSuccess();
    } catch (err: unknown) {
      alert('Gagal menambah anggota: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHistory = workerHistory.filter(w =>
    w.member_name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    (w.phone_number ?? '').includes(workerSearch)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-orange-200 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800">Tambah Anggota Proyek</h2>
          <button onClick={onClose} className="p-2 hover:bg-orange-50 rounded-full text-orange-400 hover:text-orange-600 transition-colors">
            <X size={20} />
          </button>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500"
                      style={{ borderColor: C.border, background: C.bg }}
                    />
                  </div>
                  {isLoadingHistory ? (
                    <div className="p-4 text-center text-xs text-slate-500">Memuat data pekerja...</div>
                  ) : (
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
                  )}
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
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors text-slate-600"
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
  );
}
