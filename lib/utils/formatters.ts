import { ProjectProgress } from "@/lib/types/database";

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}

export function formatRelativeTime(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function getLatestProgress(projectId: number, progressList: ProjectProgress[]): number {
  const records = progressList.filter(p => p.project_id === projectId);
  if (records.length === 0) return 0;
  return records.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0].percentage;
}
