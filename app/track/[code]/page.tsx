"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { MapPin, CalendarClock, Activity, ImageIcon, ChevronLeft, Search, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { formatDate } from "@/lib/utils/formatters";
import { C, getStatusStyle, getStatusLabel, getProgressColor } from "@/lib/utils/theme";

// const DynamicMap = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PublicTrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useSWR(`/api/track/${resolvedParams.code}`, fetcher, {
    dedupingInterval: 7 * 24 * 60 * 60 * 1000, // 1 minggu
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 size={32} className="animate-spin text-orange-500 mb-4" />
        <p className="text-slate-500 font-medium">Mencari data proyek...</p>
      </div>
    );
  }

  if (error || (data && data.error)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Proyek Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-6 text-sm">{data?.error || "Kode pelacakan tidak valid atau proyek tidak ada."}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const { project, progressHistory } = data;
  const latestProgress = project.latest_progress || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/login')} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors">
            <ChevronLeft size={18} /> Kembali
          </button>
          <div className="font-black text-orange-600 uppercase tracking-wider text-sm">Kanabuet Steel</div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Project Info Card */}
        <div className="rounded-2xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: C.border }}>
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Kode Resi: {project.tracking_code}</p>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{project.project_name}</h1>
              </div>
              <span className={`shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${getStatusStyle(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Progres Keseluruhan</span>
                <span className="text-2xl font-black text-orange-500">{latestProgress}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-slate-100">
                <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(latestProgress)}`} style={{ width: `${latestProgress}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <CalendarClock size={16} className="text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Mulai</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">{formatDate(project.start_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarClock size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Selesai</p>
                  <p className="text-xs sm:text-sm font-semibold text-amber-600">{formatDate(project.estimated_finish)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 col-span-2">
                <MapPin size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Proyek</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">{project.project_address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="rounded-2xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: C.border }}>
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
            <Activity size={16} className="text-orange-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">Histori Pekerjaan</h2>
          </div>

          <div className="p-5 sm:p-6">
            {!progressHistory || progressHistory.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Belum ada pembaruan progres pada proyek ini.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {progressHistory.map((p: any, i: number, arr: any[]) => {
                  const prev = arr[i + 1];
                  const isJustDocs = prev && p.percentage === prev.percentage;

                  return (
                    <div key={p.progress_id} className="relative pl-6 sm:pl-8 border-l-2 border-slate-100 last:border-transparent pb-6 last:pb-0">
                      {/* Timeline dot */}
                      <div className="absolute left-[calc(-1px-0.5rem)] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm bg-orange-500" />

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-orange-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          {isJustDocs ? (
                            <span className="text-sm font-black text-sky-500 flex items-center gap-1.5"><ImageIcon size={16} /> Update Dokumentasi</span>
                          ) : (
                            <span className="text-lg font-black text-orange-500">Progres: {p.percentage}%</span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">{formatDate(p.update_date || p.created_at)}</span>
                        </div>

                        {p.notes && <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">{p.notes}</p>}

                        {p.photo_url && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {p.photo_url.split(',').map((url: string, idx: number) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative group rounded-lg overflow-hidden border border-slate-200">
                                <img src={url} alt={`Dokumentasi ${idx + 1}`} className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
