import { Material } from "@/lib/types/database";

export const C = {
  bg: "#F8FAFC", 
  card: "#FFFFFF", 
  border: "#E2E8F0",
  text: "#0F172A", 
  subtext: "#334155", 
  muted: "#64748B",
  sidebar: "#F1F5F9",
  header: "#FFFFFF",
};

export function getStatusStyle(s: string) {
  switch (s) {
    case "aktif": return "bg-orange-50 text-orange-700 border-orange-200";
    case "selesai": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "tertunda": return "bg-amber-50 text-amber-700 border-amber-200";
    case "menunggu_validasi": return "bg-sky-50 text-sky-700 border-sky-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function getStatusLabel(s: string) {
  switch (s) {
    case "aktif": return "Aktif";
    case "selesai": return "Selesai";
    case "tertunda": return "Tertunda";
    case "menunggu_validasi": return "Menunggu Validasi";
    default: return s;
  }
}

export function getProgressColor(pct: number) {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-orange-500";
  return "bg-amber-500";
}

export function getStockStatus(m: Material) {
  if (m.current_stock <= 0) return "habis";
  if (m.current_stock < m.minimum_stock) return "min_stock";
  return "tersedia";
}

export function getStockStatusBadge(s: string) {
  switch (s) {
    case "tersedia": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "min_stock": return "bg-amber-50 text-amber-700 border-amber-200";
    case "habis": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function getStockStatusLabel(s: string) {
  switch (s) {
    case "tersedia": return "Tersedia";
    case "min_stock": return "Minimum";
    case "habis": return "Habis";
    default: return s;
  }
}
