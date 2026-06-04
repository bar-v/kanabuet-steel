'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import type { CreateProjectInput, ProjectStatus } from '@/lib/types/database';

// Dynamic import for Leaflet map to avoid SSR issues
const DynamicMapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-brand-bg rounded-lg flex items-center justify-center border border-brand-border text-brand-subtext font-medium text-sm">
      <IconLoader />
      <span className="ml-2">Memuat Peta...</span>
    </div>
  )
});

// Icons inline
function IconArrowLeft() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z" />
      <circle cx="12" cy="8" r="2.5" strokeLinecap="round" />
    </svg>
  );
}
function IconLoader() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

type GpsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export default function CreateProjectPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namaProyek, setNamaProyek] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  
  // Posisi Peta (Manual Pick atau dari GPS)
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);

  // GPS state (khusus untuk tracker status ambil GPS dari device)
  const [gps, setGps] = useState<GpsState>({ status: 'idle' });

  // Ambil koordinat dari GPS perangkat
  const handleAmbilGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGps({ status: 'error', message: 'Perangkat tidak mendukung GPS.' });
      return;
    }
    setGps({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGps({ status: 'success' });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });

        // Reverse geocoding via Nominatim
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          if (data && data.display_name) {
            setProjectAddress(data.display_name);
          }
        } catch (error) {
          console.error('Gagal mendapatkan alamat dari koordinat:', error);
        }
      },
      (err) => {
        setGps({
          status: 'error',
          message: `Gagal mengambil GPS: ${err.message}`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: CreateProjectInput = {
        project_name: namaProyek,
        client_name: clientName,
        client_phone: clientPhone || undefined,
        project_address: projectAddress,
        latitude: position?.lat ?? null,
        longitude: position?.lng ?? null,
        description: description || undefined,
        start_date: startDate || undefined,
        estimated_finish: endDate || undefined,
        status: 'menunggu_validasi' as ProjectStatus,
      };

      const { error } = await supabase.from('projects').insert([payload]);

      if (error) throw error;

      router.push('/dashboard/projects');
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? (error as any).message || JSON.stringify(error) : String(error));
      alert(`Gagal menyimpan proyek: ${msg}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-8 block">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors"
        >
          <IconArrowLeft />
          <span className="ml-1">Kembali ke Manajemen Proyek</span>
        </Link>
      </div>

      <div className="bg-brand-card shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-brand-border rounded-xl p-6 md:p-10 mb-10 overflow-hidden relative">
        {/* Dekorasi pojok */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-full pointer-events-none -z-0 blur-3xl" />

        <div className="relative z-10 mb-8 border-b border-brand-border pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-text mb-2">Buat Proyek Baru</h1>
          <p className="text-brand-subtext">Isi rincian untuk memulai proyek fabrikasi baja/besi baru.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

          {/* ── Informasi Proyek ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Proyek */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-sm text-brand-subtext">
                Nama Proyek <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors"
                placeholder="mis. Pembuatan Kanopi Baja Ringan"
                value={namaProyek}
                onChange={(e) => setNamaProyek(e.target.value)}
                required
              />
            </div>

            {/* Nama Klien */}
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-subtext">
                Nama Klien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors"
                placeholder="mis. PT. Indah Jaya / Bpk. Rudi"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            {/* No. HP Klien */}
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-subtext">
                Nomor Handphone Klien
              </label>
              <input
                type="tel"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors"
                placeholder="mis. 08123456789"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block mb-2 font-medium text-sm text-brand-subtext">
              Deskripsi / Spesifikasi Pekerjaan
            </label>
            <textarea
              className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors"
              rows={4}
              placeholder="Rincikan dimensi tiang, jenis material, ketebalan, dll..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* ── Jadwal ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-bg/50 p-4 rounded-xl border border-brand-border">
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-subtext">
                Tanggal Mulai Target
              </label>
              <input
                type="date"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-card focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text transition-colors custom-date-picker"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-subtext">
                Tenggat Waktu Pekerjaan
              </label>
              <input
                type="date"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-card focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text transition-colors custom-date-picker"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* ── Lokasi Proyek ── */}
          <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-bg/30 p-5">
            <div>
              <h3 className="font-bold text-brand-text flex items-center gap-2">
                <IconMapPin />
                Lokasi Proyek
              </h3>
              <p className="text-sm text-brand-subtext mt-1">
                Tentukan lokasi proyek di peta atau ambil koordinat dari GPS perangkat Anda.
              </p>
            </div>

            {/* Alamat Teks */}
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-subtext">
                Alamat Proyek <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors"
                placeholder="mis. Jl. Merdeka No. 10, Kuta Alam, Banda Aceh"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                required
              />
            </div>
            
            {/* Peta Interaktif */}
            <div className="w-full mt-2 relative z-0">
              <DynamicMapPicker position={position} />
            </div>

            {/* Info Koordinat & Aksi */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
              <button
                type="button"
                onClick={handleAmbilGps}
                disabled={gps.status === 'loading'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border bg-brand-card text-brand-text text-sm font-medium hover:bg-brand-border/50 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {gps.status === 'loading' ? (
                  <><IconLoader /> Membaca GPS...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    Gunakan GPS Saat Ini
                  </>
                )}
              </button>

              <div className="text-xs font-mono text-brand-subtext bg-brand-card px-3 py-2 rounded border border-brand-border">
                {position ? (
                  <span>
                    Lat: <span className="text-emerald-600 font-bold">{position.lat.toFixed(6)}</span>, 
                    Lng: <span className="text-emerald-600 font-bold">{position.lng.toFixed(6)}</span>
                  </span>
                ) : (
                  <span className="text-brand-muted">Koordinat belum ditentukan</span>
                )}
              </div>
            </div>
            {gps.status === 'error' && (
              <div className="flex items-start gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium mt-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {gps.message}
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-6 border-t border-brand-border mt-2">
            <Link
              href="/dashboard/projects"
              className="px-6 py-2.5 border border-brand-border rounded-xl text-brand-text font-medium hover:bg-brand-bg transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-primary text-white font-medium rounded-xl hover:bg-brand-accent transition-colors disabled:opacity-70 shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <IconLoader />
                  Menyimpan...
                </>
              ) : (
                'Simpan Data Proyek'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
