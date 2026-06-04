/**
 * /dashboard/supervisor/mockup
 *
 * Halaman STATIC khusus untuk keperluan screenshot proposal TA.
 * Sidebar selalu terlihat berdampingan dengan konten utama
 * sehingga perbedaan menu Supervisor vs Owner dapat ditunjukkan.
 *
 * Viewport yang direkomendasikan saat screenshot: 600 × 1800 px
 */

import Image from "next/image";
import {
  LayoutGrid,
  FolderOpen,
  TrendingUp,
  Package,
  LogOut,
  Bell,
  ChevronRight,
  Activity,
  Upload,
  MapPin,
  Camera,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Navigation,
  FileText,
  CalendarClock,
  ImageIcon,
  CheckCheck,
} from "lucide-react";

// ── Design tokens — identical to owner dashboard ───────────
const C = {
  bg:      "#F8FAFC",
  card:    "#FFFFFF",
  border:  "#E2E8F0",
  text:    "#0F172A",
  subtext: "#334155",
  muted:   "#64748B",
  sidebar: "#F1F5F9",
  header:  "#FFFFFF",
};

// ── Mock data (same as supervisor/page.tsx) ────────────────
const ACTIVE_PROJECT = {
  name: "Fabrikasi Pintu Gerbang Industri",
  location: "Jl. Industri Raya No. 12, Banda Aceh",
  status: "on_progress",
  pct: 45,
  deadline: "12 Jul 2025",
};

const SCHEDULES = [
  { task: "Pemotongan Besi Hollow 4×4 cm", target: 60, deadline: "13 Mei 2025", status: "on_progress" },
  { task: "Pengelasan Rangka Utama", target: 40, deadline: "18 Mei 2025", status: "pending" },
  { task: "Pemasangan Engsel & Kunci", target: 100, deadline: "25 Mei 2025", status: "pending" },
  { task: "Pengecatan Anti Karat", target: 30, deadline: "30 Mei 2025", status: "pending" },
];

const ACTIVITIES = [
  { Icon: Activity, text: "Update progres 45%",              project: "Fabrikasi Pintu Gerbang Industri", time: "10 menit lalu",  color: "text-orange-600", bg: "bg-orange-50"  },
  { Icon: Upload,   text: "Upload foto dokumentasi (3 foto)", project: "Fabrikasi Pintu Gerbang Industri", time: "2 jam lalu",     color: "text-sky-600",    bg: "bg-sky-50"     },
  { Icon: MapPin,   text: "Validasi lokasi berhasil",         project: "Fabrikasi Pintu Gerbang Industri", time: "2 jam lalu",     color: "text-emerald-600",bg: "bg-emerald-50" },
  { Icon: FileText, text: "Catatan: rangka selesai 50%",      project: "Fabrikasi Pintu Gerbang Industri", time: "Kemarin, 16.30", color: "text-violet-600", bg: "bg-violet-50"  },
];

const RECENT_DOCS = [
  { label: "Foto Pekerjaan 1" },
  { label: "Foto Pekerjaan 2" },
  { label: "Foto Pekerjaan 3" },
];

// Supervisor-specific nav — TIDAK ada Supplier, Evaluasi, Settings
const NAV = [
  { label: "Dashboard", Icon: LayoutGrid, active: true },
  { label: "Proyek", Icon: FolderOpen, active: false },
  { label: "Progress", Icon: TrendingUp, active: false },
  { label: "Material", Icon: Package, active: false },
];

const QUICK_ACTIONS = [
  { label: "Update Progress",    Icon: RefreshCw, color: "text-orange-600", iconBg: "bg-orange-50",  border: "border-orange-200" },
  { label: "Upload Dokumentasi", Icon: Camera,    color: "text-sky-600",    iconBg: "bg-sky-50",     border: "border-sky-200"    },
  { label: "Validasi Lokasi",    Icon: MapPin,    color: "text-emerald-600",iconBg: "bg-emerald-50", border: "border-emerald-200" },
  { label: "Lihat Detail",       Icon: FolderOpen,color: "text-violet-600", iconBg: "bg-violet-50",  border: "border-violet-200" },
];

// ── Helpers ────────────────────────────────────────────────
function statusBadge(s: string) {
  if (s === "completed")   return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "on_progress") return "bg-orange-50  text-orange-700  border border-orange-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}
function statusLabel(s: string) {
  if (s === "completed") return "Selesai";
  if (s === "on_progress") return "Aktif";
  return "Pending";
}
function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-orange-400";
  return "bg-amber-500";
}
function scheduleIcon(s: string) {
  if (s === "on_progress") return Clock;
  if (s === "completed") return CheckCircle2;
  return AlertCircle;
}

// ── Static Mockup Component ────────────────────────────────
export default function SupervisorMockup() {
  return (
    // Outer wrapper: fixed mobile width, auto height (no clipping)
    <div
      style={{ background: C.bg, color: C.text, minHeight: "100vh" }}
      className="flex"
    >
      {/* ═══════════ SIDEBAR (always visible) ═══════════ */}
      <aside
        className="sticky top-0 h-screen shrink-0 w-56 flex flex-col border-r"
        style={{ background: C.sidebar, borderColor: C.border }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: C.border }}>
          <Image
            src="/images/logo.png"
            alt="logo"
            width={32}
            height={32}
            className="object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-orange-500 font-black text-[11px] tracking-wider leading-none truncate">
              KANABUET STEEL
            </p>
            <p className="text-[9px] tracking-wide mt-0.5 font-medium" style={{ color: C.subtext }}>
              Fabrication Management System
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2.5 space-y-1">
          {NAV.map(({ label, Icon, active }) => (
            <div
              key={label}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold
                ${active
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                  : ""
                }`}
              style={!active ? { color: C.subtext } : undefined}
            >
              <Icon
                size={15}
                style={!active ? { color: C.muted } : undefined}
                className={active ? "text-orange-400" : ""}
              />
              {label}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t p-3" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs shrink-0">
              SV
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: C.text }}>Dummy 3</p>
              <p className="text-[10px] font-medium" style={{ color: C.muted }}>Supervisor</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400 font-medium">
            <LogOut size={13} />
            Logout
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOP HEADER */}
        <header
          className="flex items-center gap-3 px-4 border-b"
          style={{ height: 60, background: `${C.header}E6`, borderColor: C.border }}
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold" style={{ color: C.text }}>Dashboard Supervisor</h1>
            <p className="text-[10px] font-medium" style={{ color: C.subtext }}>Ikhtisar Operasional Lapangan</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative p-1.5 rounded-lg" style={{ color: C.muted }}>
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </div>
            <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-[10px]">
              SV
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-4 space-y-6">

          {/* 1. PROYEK AKTIF */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>Proyek Aktif</h2>
              <button className="flex items-center gap-0.5 text-[10px] text-orange-400 font-semibold">
                Lihat Semua <ChevronRight size={11} />
              </button>
            </div>
            <div className="rounded-xl border hover:border-orange-500/40 transition-colors" style={{ background: C.card, borderColor: C.border }}>
              <div className="h-1 rounded-t-xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-bold line-clamp-2" style={{ color: C.text }}>{ACTIVE_PROJECT.name}</p>
                  <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusBadge(ACTIVE_PROJECT.status)}`}>
                    {statusLabel(ACTIVE_PROJECT.status)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2.5" style={{ color: C.muted }}>
                  <MapPin size={10} className="shrink-0" />
                  <span className="text-[10px] font-medium truncate">{ACTIVE_PROJECT.location}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div className={`h-full rounded-full ${progressColor(ACTIVE_PROJECT.pct)}`} style={{ width: `${ACTIVE_PROJECT.pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right" style={{ color: C.subtext }}>{ACTIVE_PROJECT.pct}%</span>
                </div>
                <div className="flex items-center gap-1 mt-2" style={{ color: C.muted }}>
                  <CalendarClock size={10} className="shrink-0" />
                  <span className="text-[10px] font-medium">
                    Tenggat: <span className="text-amber-600 font-bold">{ACTIVE_PROJECT.deadline}</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. QUICK ACTION */}
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map(({ label, Icon, color, iconBg, border }) => (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${border}`}
                  style={{ background: C.card }}
                >
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} ${color}`}>
                    <Icon size={18} />
                  </span>
                  <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: C.subtext }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. JADWAL & TARGET */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>Jadwal &amp; Target</h2>
              <button className="flex items-center gap-0.5 text-[10px] text-orange-400 font-semibold">
                Semua <ChevronRight size={11} />
              </button>
            </div>
            <div className="space-y-2">
              {SCHEDULES.map((s, i) => {
                const SIcon = scheduleIcon(s.status);
                return (
                  <div key={i} className="rounded-xl p-3 border" style={{ background: C.card, borderColor: C.border }}>
                    <div className="flex items-start gap-2">
                      <SIcon size={13} className={`mt-0.5 shrink-0 ${s.status === "on_progress" ? "text-orange-600" : s.status === "completed" ? "text-emerald-600" : "text-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold leading-snug mb-1.5" style={{ color: C.text }}>{s.task}</p>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
                            <div className={`h-full rounded-full ${progressColor(s.target)}`} style={{ width: `${s.target}%` }} />
                          </div>
                          <span className="text-[9px] font-bold" style={{ color: C.muted }}>{s.target}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${statusBadge(s.status)}`}>
                            {statusLabel(s.status)}
                          </span>
                          <span className="text-[9px] font-medium" style={{ color: C.muted }}>{s.deadline}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. AKTIVITAS TERBARU */}
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Aktivitas Terbaru</h2>
            <div className="rounded-xl border divide-y" style={{ background: C.card, borderColor: C.border }}>
              {ACTIVITIES.map(({ Icon, text, project, time, color, bg }, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3" style={{ borderColor: C.border }}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${bg} ${color}`}>
                    <Icon size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold leading-snug" style={{ color: C.text }}>{text}</p>
                    <p className="text-[10px] font-medium mt-0.5 truncate" style={{ color: C.muted }}>{project}</p>
                  </div>
                  <span className="text-[9px] font-medium shrink-0 mt-0.5 whitespace-nowrap" style={{ color: C.muted }}>{time}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. DOKUMENTASI & LOKASI */}
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Dokumentasi &amp; Lokasi</h2>

            {/* Upload */}
            <div className="rounded-xl border p-3 mb-2.5" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-sky-400/10 flex items-center justify-center text-sky-400">
                    <Camera size={12} />
                  </span>
                  <p className="text-xs font-bold" style={{ color: C.text }}>Upload Dokumentasi</p>
                </div>
                <span className="text-[10px] text-orange-400 font-semibold">Upload Baru</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {RECENT_DOCS.map((doc, i) => (
                  <div key={i} className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1" style={{ background: C.border }}>
                    <ImageIcon size={14} className="text-slate-500" />
                    <span className="text-[8px] font-medium text-center px-1" style={{ color: C.muted }}>{doc.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-medium text-center" style={{ color: C.muted }}>3 foto terbaru · Diperbarui 10 menit lalu</p>
            </div>

            {/* GPS */}
            <div className="rounded-xl border p-3" style={{ background: C.card, borderColor: "rgba(34,197,94,0.3)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                    <Navigation size={12} />
                  </span>
                  <p className="text-xs font-bold" style={{ color: C.text }}>Validasi Lokasi GPS</p>
                </div>
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  <CheckCheck size={9} /> Tervalidasi
                </span>
              </div>
              <div className="space-y-0.5 mb-2">
                <p className="text-[10px]" style={{ color: C.muted }}>Lat: <span className="text-emerald-400 font-bold">5.5483° N</span></p>
                <p className="text-[10px]" style={{ color: C.muted }}>Lng: <span className="text-emerald-400 font-bold">95.3238° E</span></p>
                <p className="text-[9px] mt-1" style={{ color: C.muted }}>Diambil 2 jam lalu · Jl. Industri Raya No. 12</p>
              </div>
              <div className="w-full py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1.5">
                <CheckCheck size={13} /> Lokasi Tervalidasi
              </div>
            </div>
          </section>

          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}
