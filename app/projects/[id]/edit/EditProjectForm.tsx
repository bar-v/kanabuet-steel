'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationPicker, { LocationData } from '@/components/LocationPicker';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function EditProjectForm({ project }: { project: any }) {
  const router = useRouter();
  const supabase = createClient();
  
  // States - Inisialisasi dari props "project"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namaProyek, setNamaProyek] = useState(project.name || '');
  const [clientName, setClientName] = useState(project.client_name || '');
  const [clientPhone, setClientPhone] = useState(project.client_phone || '');
  const [description, setDescription] = useState(project.description || '');
  const [startDate, setStartDate] = useState(project.start_date || '');
  const [endDate, setEndDate] = useState(project.end_date || '');
  const [status, setStatus] = useState(project.status || 'planning');
  
  const [location, setLocation] = useState<LocationData>({
    address: project.address || '',
    rawAddress: project.raw_address || '',
    lat: project.latitude || null,
    lng: project.longitude || null,
    geocodeLat: project.geocode_latitude || null,
    geocodeLng: project.geocode_longitude || null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update({
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
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) throw error;

      alert('Perubahan proyek berhasil disimpan!');
      router.push('/projects');
      router.refresh(); 
    } catch (error: any) {
      alert(`Gagal menyimpan perubahan proyek: ${error.message}`);
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
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-full pointer-events-none -z-0 blur-3xl"></div>
        
        <div className="relative z-10 mb-8 border-b border-brand-border pb-6 flex items-center gap-3">
           <span className="p-2.5 bg-brand-bg text-brand-primary rounded-xl hidden sm:block border border-brand-border">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
           </span>
           <div>
             <h1 className="text-2xl md:text-3xl font-bold text-brand-text mb-1">Edit Proyek</h1>
             <p className="text-brand-subtext text-sm">Update rincian untuk {project.name}</p>
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
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="planning">Perencanaan (Planning)</option>
                <option value="in_progress">Dalam Pengerjaan (In Progress)</option>
                <option value="completed">Selesai (Completed)</option>
                <option value="cancelled">Dibatalkan (Cancelled)</option>
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

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-brand-text">Lokasi Proyek</h3>
              <p className="text-sm text-brand-subtext">Pastikan kordinat pembangunan akurat agar material tidak salah kirim.</p>
            </div>

            <div>
             <label className="block mb-2 font-medium text-sm text-brand-text">Catatan Alamat / Nama Lokasi</label>
             <input 
               type="text" 
               className="w-full p-2.5 border border-brand-border rounded-lg bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none text-brand-text" 
               placeholder="Alamat akan otomatis terisi jika Anda memilih kordinat..." 
               value={location.address}
               onChange={(e) => setLocation({ ...location, address: e.target.value })}
             />
            </div>

            <div className="mt-2">
               <LocationPicker 
                 location={location} 
                 onChange={setLocation} 
               />
            </div>
          </div>

          {/* Submit Actions */}
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
                  Menyimpan Perubahan...
                </>
              ) : (
                'Perbarui Proyek'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
