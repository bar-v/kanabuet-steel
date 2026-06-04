'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Project, ProjectStatus } from '@/lib/types/database';

type GpsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'error'; message: string };

export default function EditProjectForm({ project }: { project: Partial<Project> & { project_id: number } }) {
  const router = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namaProyek, setNamaProyek] = useState(project.project_name || '');
  const [clientName, setClientName] = useState(project.client_name || '');
  const [clientPhone, setClientPhone] = useState(project.client_phone || '');
  const [description, setDescription] = useState(project.description || '');
  const [startDate, setStartDate] = useState(project.start_date || '');
  const [endDate, setEndDate] = useState(project.estimated_finish || '');
  const [projectAddress, setProjectAddress] = useState(project.project_address || '');
  const [status, setStatus] = useState<ProjectStatus>(project.status || 'menunggu_validasi');

  const [gps, setGps] = useState<GpsState>({ status: 'idle' });

  const handleAmbilGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGps({ status: 'error', message: 'Perangkat tidak mendukung GPS.' });
      return;
    }
    setGps({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ status: 'success', lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setGps({ status: 'error', message: `Gagal mengambil GPS: ${err.message}` });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatePayload: Partial<Project> = {
        project_name:    namaProyek,
        client_name:     clientName,
        client_phone:    clientPhone || undefined,
        description:     description || undefined,
        start_date:      startDate || null,
        estimated_finish: endDate || null,
        project_address: projectAddress,
        status:          status,
        latitude:  gps.status === 'success' ? gps.lat : project.latitude,
        longitude: gps.status === 'success' ? gps.lng : project.longitude,
      };

      const { error } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('project_id', project.project_id);

      if (error) throw error;

      alert('Perubahan proyek berhasil disimpan!');
      router.push('/dashboard/projects');
      router.refresh();
    } catch (error: unknown) {
      alert(`Gagal menyimpan perubahan proyek: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-8 block">
        <Link href="/dashboard/projects" className="inline-flex items-center text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Manajemen Proyek
        </Link>
      </div>

      <div className="bg-brand-card shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-brand-border rounded-xl p-6 md:p-10 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-full pointer-events-none -z-0 blur-3xl" />

        <div className="relative z-10 mb-8 border-b border-brand-border pb-6 flex items-center gap-3">
          <span className="p-2.5 bg-brand-bg text-brand-primary rounded-xl hidden sm:block border border-brand-border">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text mb-1">Edit Proyek</h1>
            <p className="text-brand-subtext text-sm">Update rincian untuk {project.project_name}</p>
          </div>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-sm text-brand-text">Nama Proyek *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text"
                placeholder="mis. Pembuatan Kanopi Baja Ringan"
                value={namaProyek}
                onChange={(e) => setNamaProyek(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-text">Nama Klien *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text"
                placeholder="mis. PT. Indah Jaya / Bpk. Rudi"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-text">Nomor Handphone Klien</label>
              <input
                type="tel"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text"
                placeholder="mis. 08123456789"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-text">Status Proyek *</label>
              <select
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                required
              >
                <option value="menunggu_validasi">Menunggu Validasi</option>
                <option value="aktif">Aktif</option>
                <option value="tertunda">Tertunda</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium text-sm text-brand-text">Deskripsi Proyek</label>
            <textarea
              className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text min-h-[100px]"
              placeholder="Rincian mengenai pengerjaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-text">Tanggal Mulai</label>
              <input
                type="date"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-text">Estimasi Selesai</label>
              <input
                type="date"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <hr className="border-brand-border my-2" />

          {/* Lokasi — GPS only */}
          <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-bg/30 p-5">
            <div>
              <h3 className="font-bold text-brand-text">Lokasi Proyek</h3>
              <p className="text-sm text-brand-subtext mt-1">Masukkan alamat proyek dan ambil koordinat GPS perangkat untuk validasi lokasi.</p>
            </div>
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-text">Alamat Proyek *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text"
                placeholder="mis. Jl. Merdeka No. 10, Kuta Alam, Banda Aceh"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                required
              />
            </div>

            {/* GPS existing & update */}
            {(project.latitude || project.longitude) && gps.status === 'idle' && (
              <div className="text-[11px] font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                GPS saat ini: {project.latitude?.toFixed(6)}, {project.longitude?.toFixed(6)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                type="button"
                onClick={handleAmbilGps}
                disabled={gps.status === 'loading'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-text text-sm font-medium hover:bg-brand-border/50 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {gps.status === 'loading' ? (
                  <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Mengambil GPS...</>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                    Ambil GPS Perangkat
                  </>
                )}
              </button>
              {gps.status === 'success' && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  <span className="text-emerald-700 font-bold">GPS Berhasil</span>
                  <span className="text-emerald-600">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</span>
                </div>
              )}
              {gps.status === 'error' && (
                <p className="text-xs text-red-600 font-medium">{gps.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-brand-border mt-6">
            <Link href="/dashboard/projects" className="px-6 py-2.5 border border-brand-border rounded-xl text-brand-text font-medium hover:bg-brand-bg transition-colors">
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-primary text-white font-medium rounded-xl hover:bg-brand-accent transition-colors disabled:opacity-70 shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Menyimpan Perubahan...
                </>
              ) : 'Perbarui Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
