"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Menu, X, ArrowLeft, Settings } from "lucide-react";
import { OWNER_NAV, SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";
import type { User } from "@/lib/types/database";
import { useLogout } from "@/lib/auth/client";
import EditProfileModal from "./EditProfileModal";

import { C } from "@/lib/utils/theme";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  role?: "owner" | "supervisor";
  backUrl?: string;
}

export default function DashboardShell({
  children,
  title,
  subtitle,
  headerActions,
  role = "owner",
  backUrl,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(({ user }) => {
        if (user) {
          const isSupervisorRoute = pathname.startsWith('/dashboard/supervisor');

          if (user.system_role === 'supervisor' && !isSupervisorRoute) {
            window.location.replace('/dashboard/supervisor');
            return;
          } else if (user.system_role === 'owner' && isSupervisorRoute) {
            window.location.replace('/dashboard');
            return;
          }

          setUser(user);
          setIsAuthorized(true);
        } else {
          window.location.replace('/login');
        }
      })
      .catch(() => {
        window.location.replace('/login');
      });

    if (process.env.NODE_ENV === "development" && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    // Listen for logout events from other tabs to instantly synchronize session destruction
    if (typeof window !== "undefined") {
      const channel = new BroadcastChannel("auth_sync");
      channel.onmessage = (e) => {
        if (e.data === "LOGOUT") {
          window.location.href = "/login";
        }
      };
      return () => channel.close();
    }
  }, [pathname]);

  const handleLogout = useLogout();

  const initials = user?.fullname
    ? user.fullname.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : role === "supervisor" ? "SV" : "OW";

  const navItems = role === "supervisor" ? SUPERVISOR_NAV : OWNER_NAV;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: C.bg }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, color: C.text }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 flex flex-col border-r transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        style={{ background: C.sidebar, borderColor: C.border }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: C.border }}>
          <Image
            src="/images/logo.png"
            alt="logo"
            width={36}
            height={36}
            className="object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-orange-500 font-black text-sm tracking-wider leading-none truncate">
              KANABUET STEEL
            </p>
            <p
              className="text-[10px] tracking-wide mt-0.5 font-medium"
              style={{ color: C.subtext }}
            >
              Sistem Manajemen Fabrikasi
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden"
            style={{ color: C.muted }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ label, Icon, href, matchPatterns }) => {
            const active = isNavActive(pathname, href, matchPatterns);
            return (
              <button
                key={label}
                onClick={() => {
                  setSidebarOpen(false);
                  router.push(href);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
                  ${active
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                    : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                style={!active ? { color: C.subtext } : undefined}
              >
                <Icon
                  size={17}
                  style={!active ? { color: C.muted } : undefined}
                  className={active ? "text-orange-400" : ""}
                />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-4" style={{ borderColor: C.border }}>
          <div
            className="flex items-center gap-3 mb-3 group cursor-pointer hover:bg-slate-100/50 p-2 -mx-2 rounded-xl transition-colors"
            onClick={() => setIsEditProfileOpen(true)}
            title="Edit Profil"
          >
            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate group-hover:text-orange-500 transition-colors" style={{ color: C.text }}>
                {user?.fullname ?? "Memuat..."}
              </p>
              <p className="text-[11px] font-medium capitalize" style={{ color: C.muted }}>
                {role === "owner" ? "Pemilik" : "Pengawas"}
              </p>
            </div>
            <Settings size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header
          className="sticky top-0 z-20 flex items-center gap-4 px-4 backdrop-blur border-b"
          style={{ height: 56, background: `${C.header}E6`, borderColor: C.border }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            style={{ color: C.muted }}
          >
            <Menu size={20} />
          </button>
          {backUrl && (
            <button
              onClick={() => router.push(backUrl)}
              className="p-2 -ml-2 sm:ml-0 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-medium"
              style={{ color: C.subtext }}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:block">Kembali</span>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate" style={{ color: C.text }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] font-medium tracking-wide" style={{ color: C.subtext }}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <div
              className="hidden sm:flex items-center gap-2 pl-2 border-l"
              style={{ borderColor: C.border }}
            >
              <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4">
          {children}
          <div className="h-6 lg:h-2" />
        </main>
      </div>

      {/* ═══════════ MODALS ═══════════ */}
      {user && (
        <EditProfileModal
          user={user}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSuccess={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </div>
  );
}
