"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, X, Users, Edit2, Shield, ShieldOff,
  Mail, Calendar, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types/database";
import DashboardShell from "@/components/layout/DashboardShell";
import StatCard from "@/components/ui/StatCard";
import useSWR, { mutate } from "swr";
import { formatDate } from "@/lib/utils/formatters";
import { C } from "@/lib/utils/theme";



export default function UserManagementPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const fetchUsersData = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("system_role", "supervisor")
      .order("created_at", { ascending: false });
    return (data || []) as User[];
  };

  const { data: usersData, isLoading } = useSWR('admin_users', fetchUsersData);
  const users = usersData || [];

  const resetForm = () => { setFormName(""); setFormEmail(""); setFormPassword(""); setEditingUser(null); };

  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormName(u.fullname);
    setFormEmail(u.email);
    setFormPassword("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update user
        const payload: Record<string, unknown> = {
          fullname: formName,
          email: formEmail,
        };
        // If password is provided, hash it via API
        if (formPassword) {
          const res = await fetch("/api/auth/hash-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: formPassword }),
          });
          const { hash } = await res.json();
          payload.password_hash = hash;
        }
        const { error } = await supabase.from("users").update(payload).eq("user_id", editingUser.user_id);
        if (error) throw error;
      } else {
        // Create new supervisor
        if (!formPassword) { alert("Password wajib diisi untuk supervisor baru."); setIsSubmitting(false); return; }
        const res = await fetch("/api/auth/hash-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: formPassword }),
        });
        const { hash } = await res.json();

        const { error } = await supabase.from("users").insert([{
          fullname: formName,
          email: formEmail,
          password_hash: hash,
          system_role: "supervisor",
          is_active: true,
        }]);
        if (error) throw error;
      }
      setShowModal(false);
      resetForm();
      mutate('admin_users');
    } catch (err: unknown) {
      alert("Gagal menyimpan: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    const action = u.is_active ? "nonaktifkan" : "aktifkan";
    if (!confirm(`${u.is_active ? "Nonaktifkan" : "Aktifkan"} supervisor "${u.fullname}"?`)) return;
    const { error } = await supabase.from("users").update({ is_active: !u.is_active }).eq("user_id", u.user_id);
    if (error) { alert("Gagal: " + error.message); return; }
    mutate('admin_users');
  };

  const filtered = users.filter((u) =>
    u.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  const headerActions = (
    <button onClick={openAdd}
      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95">
      <Plus size={16} /> <span className="hidden sm:inline">Tambah Supervisor</span>
    </button>
  );

  return (
    <DashboardShell title="Manajemen Pengguna" subtitle="Kelola akun supervisor sistem" headerActions={headerActions}>
      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Supervisor"
          value={users.length}
          color="text-slate-600"
          iconBg="bg-slate-50"
          Icon={Users}
          isLoading={isLoading}
          size="sm"
          layout="row"
        />
        <StatCard
          label="Aktif"
          value={activeCount}
          color="text-emerald-600"
          iconBg="bg-emerald-50"
          Icon={Shield}
          isLoading={isLoading}
          size="sm"
          layout="row"
        />
        <StatCard
          label="Nonaktif"
          value={inactiveCount}
          color="text-red-600"
          iconBg="bg-red-50"
          Icon={ShieldOff}
          isLoading={isLoading}
          size="sm"
          layout="row"
        />
      </section>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
        <input type="text" placeholder="Cari supervisor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 transition-colors"
          style={{ borderColor: C.border, background: C.card }} />
      </div>

      {/* User List */}
      <section>
        <div className="rounded-xl border overflow-hidden shadow-sm" style={{ background: C.card, borderColor: C.border }}>
          {isLoading ? (
            <div className="p-8 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-18 rounded-lg animate-pulse" style={{ background: C.border }} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto mb-3" style={{ color: C.muted }} />
              <p className="text-sm font-semibold" style={{ color: C.muted }}>
                {searchQuery ? "Tidak ditemukan." : "Belum ada supervisor. Tambahkan yang pertama."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((u) => (
                <div key={u.user_id} className={`p-4 flex items-center gap-4 border-b hover:bg-slate-50/50 transition-colors group ${!u.is_active ? "opacity-60" : ""}`} style={{ borderColor: C.border }}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                    u.is_active
                      ? "bg-orange-100 border-orange-200 text-orange-600"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}>
                    {u.fullname.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: C.text }}>{u.fullname}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        u.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: C.muted }}>
                        <Mail size={10} /> {u.email}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: C.muted }}>
                        <Calendar size={10} /> Terdaftar {formatDate(u.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggleActive(u)}
                      className={`p-1.5 rounded-md ${u.is_active ? "hover:bg-red-50 text-red-500" : "hover:bg-emerald-50 text-emerald-500"}`}
                      title={u.is_active ? "Nonaktifkan" : "Aktifkan"}>
                      {u.is_active ? <ShieldOff size={14} /> : <Shield size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs mt-2 text-right font-medium" style={{ color: C.muted }}>
            Menampilkan {filtered.length} dari {users.length} supervisor
          </p>
        )}
      </section>

      {/* ═══════════ ADD/EDIT MODAL ═══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-orange-200 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-800">{editingUser ? "Edit Supervisor" : "Tambah Supervisor"}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-orange-50 rounded-full text-orange-400 hover:text-orange-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">Nama Lengkap *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="mis. Ahmad Supervisor"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">Email *</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required placeholder="mis. supervisor@kanabuet.com"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Password {editingUser ? "(kosongkan jika tidak diubah)" : "*"}
                </label>
                <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                  required={!editingUser} placeholder="Minimal 6 karakter"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-orange-500" style={{ borderColor: C.border }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-3 rounded-xl border font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors" style={{ borderColor: C.border }}>Batal</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60">
                  {isSubmitting ? "Menyimpan..." : editingUser ? "Simpan Perubahan" : "Tambah Supervisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
