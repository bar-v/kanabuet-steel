"use client";

import Image from "next/image";
import { useState, useEffect, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Menu, X, ArrowLeft } from "lucide-react";
import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";
import type { User } from "@/lib/types/database";
import { useLogout } from "@/lib/auth/client";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";

const C = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#334155",
  muted: "#64748B",
  sidebar: "#F1F5F9",
  header: "#FFFFFF",
};

export default function SupervisorProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user || null))
      .catch(() => {});
  }, []);

  const handleLogout = useLogout();

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
          <button onClick={() => router.push('/dashboard/supervisor/projects')} className="p-2 -ml-2 sm:ml-0 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-medium" style={{ color: C.subtext }}>
            <ArrowLeft size={16} />
            <span className="hidden sm:block">Kembali</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate" style={{ color: C.text }}>Detail Proyek</h1>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-7">
          <ProjectDetailClient projectId={projectId} role="supervisor" />
        </main>
      </div>

    </div>
  );
}
