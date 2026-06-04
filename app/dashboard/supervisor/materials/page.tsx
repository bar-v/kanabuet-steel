"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Package, LayoutGrid, TrendingUp, LogOut, Menu, X, Plus, AlertCircle, CheckCircle2, ClipboardList
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";
import type { Project, Material, User } from "@/lib/types/database";

const C = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", subtext: "#334155", muted: "#64748B",
  sidebar: "#F1F5F9", header: "#FFFFFF",
};

function IconLoader() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default function SupervisorMaterialUsagePage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const { user } = await res.json();
      if (user) {
        setUser(user as User);
      }

      // Ambil proyek aktif
      const { data: projData } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "aktif")
        .order("created_at", { ascending: false });
      if (projData) setProjects(projData as Project[]);

      // Ambil material
      const { data: matData } = await supabase
        .from("materials")
        .select("*")
        .order("material_name", { ascending: true });
      if (matData) setMaterials(matData as Material[]);

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    const { logoutAction } = await import('@/app/login/actions');
    await logoutAction();
    document.cookie = "system_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedMaterialId || !quantity || Number(quantity) <= 0) {
      setErrorMsg("Harap isi semua kolom dengan benar.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.from("material_usage").insert([{
        project_id: parseInt(selectedProjectId),
        material_id: parseInt(selectedMaterialId),
        quantity: parseInt(quantity),
        notes: notes || null
      }]);

      if (error) {
        // Trigger SQL check_material_stock bisa throw error jika stok tidak cukup
        throw error;
      }

      setSuccessMsg("Penggunaan material berhasil dicatat.");
      setSelectedProjectId("");
      setSelectedMaterialId("");
      setQuantity("");
      setNotes("");

      // Refresh material stock di state
      await fetchData();
    } catch (error: any) {
      console.error("Submit error:", error);
      setErrorMsg(error.message || "Gagal mencatat penggunaan material.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "SP";

  // Data stok terpilih untuk validasi max input
  const selectedMaterial = materials.find(m => m.material_id.toString() === selectedMaterialId);

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
            <p className="text-[10px] tracking-wide mt-0.5 font-medium" style={{ color: C.subtext }}>Supervisor Panel</p>
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
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 flex items-center gap-4 px-5 backdrop-blur border-b" style={{ height: 60, background: `${C.header}E6`, borderColor: C.border }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: C.muted }}>
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate" style={{ color: C.text }}>Catat Penggunaan Material</h1>
            <p className="text-[10px] font-medium" style={{ color: C.subtext }}>Supervisor Dashboard</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            
            <div className="bg-white border rounded-xl p-6 lg:p-8 shadow-sm relative overflow-hidden" style={{ borderColor: C.border }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none -z-0 blur-2xl" />
              
              <div className="relative z-10 mb-8 border-b pb-4" style={{ borderColor: C.border }}>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="text-orange-500" size={24} />
                  Lapor Material Keluar
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Catat material yang digunakan untuk proyek aktif hari ini. Stok akan otomatis berkurang.
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <IconLoader />
                  <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  
                  {errorMsg && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Pilih Proyek Aktif <span className="text-red-500">*</span></label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Proyek --</option>
                      {projects.map(p => (
                        <option key={p.project_id} value={p.project_id}>
                          {p.project_name} ({p.client_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Pilih Material <span className="text-red-500">*</span></label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Material --</option>
                      {materials.map(m => (
                        <option key={m.material_id} value={m.material_id} disabled={m.current_stock <= 0}>
                          {m.material_name} - Sisa: {m.current_stock} {m.unit} {m.current_stock <= 0 ? '(Habis)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Jumlah Digunakan <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max={selectedMaterial ? selectedMaterial.current_stock : undefined}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Contoh: 10"
                        required
                      />
                      <span className="inline-flex items-center justify-center px-4 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium">
                        {selectedMaterial ? selectedMaterial.unit : "Unit"}
                      </span>
                    </div>
                    {selectedMaterial && (
                      <p className="text-xs text-slate-500 mt-1">Maksimal yang dapat diambil: {selectedMaterial.current_stock}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Catatan (Opsional)</label>
                    <textarea
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Untuk bagian mana material ini digunakan..."
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? <><IconLoader /> Menyimpan...</> : "Simpan Penggunaan"}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
