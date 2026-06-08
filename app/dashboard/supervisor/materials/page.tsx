"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Package, LayoutGrid, TrendingUp, LogOut, Menu, X, Plus, AlertCircle, CheckCircle2, ClipboardList,
  Search, ChevronDown
} from "lucide-react";
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

  // Searchable Dropdown States for Project
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  // Searchable Dropdown States for Material
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");

  const filteredProjects = projects.filter(p =>
    p.project_name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    (p.client_name && p.client_name.toLowerCase().includes(projectSearchQuery.toLowerCase()))
  );

  const filteredMaterials = materials.filter(m =>
    m.material_name.toLowerCase().includes(materialSearchQuery.toLowerCase())
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

  useEffect(() => {
    if (!materialDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".material-search-container")) {
        setMaterialDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [materialDropdownOpen]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const resUser = await fetch('/api/auth/me');
      const { user } = await resUser.json();
      if (user) {
        setUser(user as User);
      }

      // Ambil proyek aktif yang ditugaskan via API
      const resProjects = await fetch('/api/supervisor/projects');
      const { projects: projData } = await resProjects.json();
      if (projData) {
        // Filter hanya proyek aktif
        setProjects((projData as Project[]).filter(p => p.status === "aktif"));
      }

      // Ambil material via API
      const resMaterials = await fetch('/api/supervisor/materials');
      const { materials: matData } = await resMaterials.json();
      if (matData) setMaterials(matData as Material[]);

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Restore last selected project from localStorage
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const lastSelected = localStorage.getItem("lastSelectedProject");
      if (lastSelected && projects.some(p => p.project_id.toString() === lastSelected)) {
        setSelectedProjectId(lastSelected);
      }
    }
  }, [projects, selectedProjectId]);

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
      const res = await fetch('/api/supervisor/materials/usage', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: parseInt(selectedProjectId),
          material_id: parseInt(selectedMaterialId),
          quantity: parseInt(quantity),
          notes: notes || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mencatat penggunaan material.");
      }

      setSuccessMsg("Penggunaan material berhasil dicatat.");
      setSelectedProjectId("");
      setSelectedMaterialId("");
      setQuantity("");
      setNotes("");

      // Refresh material stock di state
      await fetchData();
    } catch (error: unknown) {
      console.error("Submit error:", error);
      setErrorMsg(error instanceof Error ? error.message : "Gagal mencatat penggunaan material.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "SP";

  const selectedProject = projects.find(p => p.project_id.toString() === selectedProjectId);
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
                          {selectedProject ? `${selectedProject.project_name} (${selectedProject.client_name})` : "Pilih Proyek"}
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
                                    setSelectedProjectId(p.project_id.toString());
                                    localStorage.setItem("lastSelectedProject", p.project_id.toString());
                                    localStorage.setItem("active_project_id", p.project_id.toString());
                                    setProjectDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-orange-50/30 flex flex-col gap-0.5"
                                >
                                  <span className="font-bold text-slate-800">{p.project_name}</span>
                                  <span className="text-[11px] text-slate-500">Klien: {p.client_name}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Pilih Material <span className="text-red-500">*</span></label>
                    <div className="relative material-search-container">
                      <button
                        type="button"
                        onClick={() => {
                          setMaterialDropdownOpen(!materialDropdownOpen);
                          setMaterialSearchQuery("");
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none text-left flex items-center justify-between bg-white focus:border-orange-500 transition-all"
                        style={{ borderColor: C.border }}
                      >
                        <span className={selectedMaterial ? "text-slate-900" : "text-slate-400"}>
                          {selectedMaterial ? `${selectedMaterial.material_name} (Sisa: ${selectedMaterial.current_stock} ${selectedMaterial.unit})` : "Pilih Material"}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${materialDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {materialDropdownOpen && (
                        <div
                          className="absolute z-[110] left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60 animate-in fade-in slide-in-from-top-1 duration-150"
                          style={{ borderColor: C.border }}
                        >
                          <div className="p-2 border-b flex items-center gap-2 bg-slate-50" style={{ borderColor: C.border }}>
                            <Search size={14} className="text-slate-400 shrink-0" />
                            <input
                              type="text"
                              placeholder="Cari material..."
                              value={materialSearchQuery}
                              onChange={(e) => setMaterialSearchQuery(e.target.value)}
                              className="w-full bg-transparent text-sm outline-none font-medium text-slate-800"
                              autoFocus
                            />
                            {materialSearchQuery && (
                              <button type="button" onClick={() => setMaterialSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-48">
                            {filteredMaterials.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                                Material tidak ditemukan
                              </div>
                            ) : (
                              filteredMaterials.map((m) => {
                                const isOutOfStock = m.current_stock <= 0;
                                return (
                                  <button
                                    key={m.material_id}
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => {
                                      setSelectedMaterialId(m.material_id.toString());
                                      setMaterialDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between hover:bg-orange-50/30 ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-slate-50' : ''}`}
                                  >
                                    <span>{m.material_name}</span>
                                    <span className="text-xs font-semibold text-slate-500">
                                      Stok: {m.current_stock} {m.unit} {isOutOfStock ? '(Habis)' : ''}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
