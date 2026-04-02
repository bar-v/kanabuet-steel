'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import ProjectCard from '@/components/ProjectCard';

interface ProjectsViewClientProps {
  projects: any[];
}

export default function ProjectsViewClient({ projects }: ProjectsViewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  
  const itemsPerPage = 12;

  // Derived Statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const planningProjects = projects.filter(p => p.status === 'planning' || p.status === null).length;

  // Filter Logic
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Status Filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
         // handle edge case where old db records have null status
         if (statusFilter === 'planning' && !project.status) return true;
         return false;
      }
      
      // Search By Title, Location, Client, or Phone
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const titleMatch = project.name?.toLowerCase().includes(query);
        const locMatch = project.address?.toLowerCase().includes(query);
        const clientMatch = project.client_name?.toLowerCase().includes(query);
        const phoneMatch = project.client_phone?.toLowerCase().includes(query);
        if (!titleMatch && !locMatch && !clientMatch && !phoneMatch) return false;
      }
      
      return true;
    });
  }, [projects, searchQuery, statusFilter]);

  // Sort Logic
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime();
      }
      if (sortBy === 'deadline') {
        const dA = a.end_date ? new Date(a.end_date).getTime() : Infinity;
        const dB = b.end_date ? new Date(b.end_date).getTime() : Infinity;
        return dA - dB;
      }
      return 0;
    });
  }, [filteredProjects, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const paginatedProjects = sortedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Pagination Change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state to URL 
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) params.set('search', searchQuery); else params.delete('search');
    if (statusFilter !== 'all') params.set('status', statusFilter); else params.delete('status');
    if (sortBy !== 'newest') params.set('sort', sortBy); else params.delete('sort');
    if (currentPage !== 1) params.set('page', currentPage.toString()); else params.delete('page');

    const newUrl = `${pathname}?${params.toString()}`;
    // prevent pushing the exact same URL if it hasn't technically changed to avoid infinite loops
    if (newUrl !== `${pathname}?${searchParams.toString()}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [searchQuery, statusFilter, sortBy, currentPage, pathname, router, searchParams]);

  // Reset pagination if filters change, but we don't want to reset if the page is currently loading from URL
  // We handle page reset slightly differently: 
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-text mb-1">Manajemen Proyek</h1>
          <p className="text-brand-subtext">Pantau operasional dan kemajuan fabrikasi Anda.</p>
        </div>
        <Link href="/projects/create" className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm hover:shadow-lg hover:shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 w-full md:w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Proyek
        </Link>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-sm hover:border-brand-primary/50 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-brand-bg rounded-lg text-brand-highlight">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </span>
            <h3 className="text-sm font-semibold text-brand-subtext">Total Proyek</h3>
          </div>
          <p className="text-3xl font-bold text-brand-text">{totalProjects}</p>
        </div>
        
        <div className="bg-brand-card border border-state-danger/30 rounded-2xl p-5 flex flex-col justify-between shadow-[0_0_15px_rgba(234,88,12,0.1)] hover:border-state-danger/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-brand-bg rounded-lg text-state-danger">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </span>
            <h3 className="text-sm font-semibold text-brand-subtext">Aktif Dikerjakan</h3>
          </div>
          <p className="text-3xl font-bold text-brand-text">{activeProjects}</p>
        </div>

        <div className="bg-brand-card border border-state-success/30 rounded-2xl p-5 flex flex-col justify-between shadow-[0_0_15px_rgba(34,197,94,0.05)] hover:border-state-success/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
             <span className="p-2 bg-brand-bg rounded-lg text-state-success">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <h3 className="text-sm font-semibold text-brand-subtext">Selesai</h3>
          </div>
          <p className="text-3xl font-bold text-brand-text">{completedProjects}</p>
        </div>

        <div className="bg-brand-card border border-state-warning/30 rounded-2xl p-5 flex flex-col justify-between shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-state-warning/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
             <span className="p-2 bg-brand-bg rounded-lg text-state-warning">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </span>
            <h3 className="text-sm font-semibold text-brand-subtext">Tahap Perencanaan</h3>
          </div>
          <p className="text-3xl font-bold text-brand-text">{planningProjects}</p>
        </div>
      </div>

      {/* Filter / Control Bar */}
      <div className="bg-brand-card p-4 rounded-xl border border-brand-border mb-6 flex flex-col md:flex-row gap-4 items-center shadow-sm">
         
         <div className="relative w-full md:flex-1">
           <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-brand-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
           <input 
             type="text" 
             className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary block pl-10 p-2.5 placeholder-brand-muted" 
             placeholder="Cari proyek, klien, no hp, atau lokasi..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
         </div>

         <div className="flex w-full md:w-auto gap-4">
           {/* Dropdown Status */}
           <div className="w-full md:w-48 relative">
              <select 
                className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary block p-2.5 custom-select-appearance"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="planning">Planning</option>
                <option value="in_progress">Aktif (In Progress)</option>
                <option value="completed">Selesai</option>
              </select>
           </div>

           {/* Dropdown Sort */}
           <div className="w-full md:w-56 relative">
              <select 
                className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary block p-2.5 custom-select-appearance"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Terbaru Ditambahkan</option>
                <option value="oldest">Terlama</option>
                <option value="deadline">Tanggal Tenggat Terdekat</option>
              </select>
           </div>
         </div>
      </div>

      {/* List / Empty State */}
      {paginatedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-brand-card/50 border border-brand-border border-dashed rounded-3xl">
          <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mb-4 text-brand-highlight">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-xl font-bold text-brand-text mb-2">
            {projects.length === 0 ? "Belum ada proyek." : "Tidak ada hasil pencarian"}
          </h3>
          <p className="text-brand-subtext text-center max-w-sm mb-6">
            {projects.length === 0 
              ? "Klik tombol 'Tambah Proyek' untuk membuat proyek pertama." 
              : "Sistem tidak menemukan proyek yang cocok dengan filter atau kata kunci Anda saat ini."}
          </p>
          {projects.length === 0 && (
             <Link href="/projects/create" className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-2.5 px-6 rounded-xl flex shadow-sm transition-all">
               Tambah Proyek
             </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-brand-border bg-brand-card rounded-lg text-sm font-medium hover:bg-brand-border disabled:opacity-50 disabled:cursor-not-allowed text-brand-text transition-colors"
               >
                Kembali
              </button>
              
              <div className="flex gap-1 text-sm bg-brand-card border border-brand-border rounded-lg p-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors font-medium
                         ${currentPage === p 
                            ? 'bg-brand-primary text-white shadow-sm' 
                            : 'text-brand-subtext hover:bg-brand-border'
                         }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-brand-border bg-brand-card rounded-lg text-sm font-medium hover:bg-brand-border disabled:opacity-50 disabled:cursor-not-allowed text-brand-text transition-colors"
               >
                Lanjut
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
