'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationPicker, { LocationData } from '@/components/LocationPicker';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function CreateProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namaProyek, setNamaProyek] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // New Location Object explicitly defined per constraints
  const [location, setLocation] = useState<LocationData>({
    address: '',
    rawAddress: '',
    lat: null,
    lng: null,
    geocodeLat: null,
    geocodeLng: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Menyimpan data ke tabel "projects" di Supabase dengan skema baru
      const { error } = await supabase.from('projects').insert([
        {
          name: namaProyek,
          client_name: clientName,
          client_phone: clientPhone,
          description: description,
          start_date: startDate || null,
          end_date: endDate || null,
          address: location.address || null,
          raw_address: location.rawAddress || null,
          latitude: location.lat,
          longitude: location.lng,
          geocode_latitude: location.geocodeLat,
          geocode_longitude: location.geocodeLng,
          supervisor_id: '22222222-2222-2222-2222-222222222222', // Sesuai PRD, default ke planning
          status: 'planning', // Sesuai PRD, default ke planning
        }
      ]);

      if (error) {
        throw error;
      }

      alert('Proyek berhasil ditambahkan!');
      router.push('/projects');
      router.refresh(); 
    } catch (error: any) {
      alert(`Gagal menyimpan proyek: ${error.message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-8 block">
        <Link href="/projects" className="inline-flex items-center text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="bg-brand-card shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-brand-border rounded-xl p-6 md:p-10 mb-10 overflow-hidden relative">
        {/* Dekorasi Pojok */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-full pointer-events-none -z-0 blur-3xl"></div>
        
        <div className="relative z-10 mb-8 border-b border-brand-border pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-text mb-2">Buat Proyek Baru</h1>
          <p className="text-brand-subtext">Isi rincian untuk memulai proyek fabrikasi baja/besi baru.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Proyek */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-sm text-brand-subtext">Nama Proyek *</label>
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
              <label className="block mb-2 font-medium text-sm text-brand-subtext">Nama Klien *</label>
              <input 
                type="text" 
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors" 
                placeholder="mis. PT. Indah Jaya / Bpk. Rudi" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            {/* Nomor Handphone Klien */}
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-subtext">Nomor Handphone Klien</label>
              <input 
                type="tel" 
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors" 
                placeholder="mis. 08123456789" 
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Deskripsi Menyeluruh */}
          <div>
            <label className="block mb-2 font-medium text-sm text-brand-subtext">Deskripsi / Spesifikasi Pekerjaan</label>
            <textarea 
              className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors" 
              rows={4}
              placeholder="Rincikan dimensi tiang, jenis material, ketebalan, dll..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          {/* Grid Jadwal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-bg/50 p-4 rounded-xl border border-brand-border">
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-subtext">Tanggal Mulai Target</label>
              <input 
                type="date" 
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-card focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text transition-colors custom-date-picker" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-sm text-brand-subtext">Tenggat Waktu Pekerjaan</label>
              <input 
                type="date" 
                className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-card focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text transition-colors custom-date-picker" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Bagian Lokasi */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-brand-text">Lokasi Proyek</h3>
              <p className="text-sm text-brand-subtext">Atur kordinat akurat lokasi pembangunan untuk keperluan navigasi supervisor dan material.</p>
            </div>

            {/* Input Alamat Teks (Opsional untuk nama jalan) */}
            <div>
             <label className="block mb-2 font-medium text-sm text-brand-subtext">Catatan Alamat / Nama Lokasi</label>
             <input 
               type="text" 
               className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none text-brand-text placeholder-brand-muted transition-colors" 
               placeholder="Bisa diedit secara manual..." 
               value={location.address}
               onChange={(e) => setLocation({ ...location, address: e.target.value })}
             />
            </div>

            {/* Widget Inline Peta & Geocoding */}
            <div className="mt-2">
               <LocationPicker 
                 location={location} 
                 onChange={setLocation} 
               />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-brand-border mt-6">
            <Link 
              href="/projects"
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
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
