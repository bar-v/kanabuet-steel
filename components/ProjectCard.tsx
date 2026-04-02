import ProjectCardActions from '@/components/ProjectCardActions';

export default function ProjectCard({ project }: { project: any }) {

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-state-success/10 text-state-success border border-state-success/20';
      case 'in_progress': return 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20';
      default: return 'bg-state-warning/10 text-state-warning border border-state-warning/20';
    }
  };

  const getStatusText = (status: string) => {
     switch(status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Aktif';
      default: return 'Planning';
    }
  };

  const formatDate = (dateString?: string) => {
     if (!dateString) return '-';
     return new Date(dateString).toLocaleDateString('id-ID', {
       day: 'numeric', month: 'short', year: 'numeric'
     });
  };

  return (
    <div className="flex flex-col bg-brand-card border border-brand-border rounded-2xl p-5 shadow-sm hover:shadow-[0_0_20px_rgba(234,88,12,0.1)] hover:border-brand-primary/40 hover:-translate-y-1 transition-all duration-300 relative group h-full">
      
      {/* Header Card */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-brand-text line-clamp-1 group-hover:text-brand-accent transition-colors" title={project.name}>
            {project.name}
          </h2>
          <span className={`inline-block mt-2 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full ${getStatusStyle(project.status)}`}>
            {getStatusText(project.status)}
          </span>
        </div>
        {/* Absolute override or specific margin structure for dot actions */}
        <div className="mt-[-4px] mr-[-4px]">
          <ProjectCardActions project={project} />
        </div>
      </div>

      {/* Deskripsi */}
      <p className="text-brand-subtext text-sm line-clamp-2 mb-4 min-h-[40px]">
        {project.description || 'Tidak ada spesifikasi pekerjaan.'}
      </p>

      {/* Klien / Identitas */}
      <div className="flex flex-col mb-4 bg-brand-bg/50 p-3 rounded-lg border border-brand-border/50">
        <span className="text-[10px] tracking-widest font-bold text-brand-muted mb-0.5">KLIEN TARGET</span>
        <div className="flex justify-between items-center gap-2">
          <span className="text-sm font-bold text-brand-text truncate">{project.client_name || 'Anonim'}</span>
          {project.client_phone && (
            <a href={`tel:${project.client_phone}`} className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-brand-highlight bg-brand-highlight/10 hover:bg-brand-highlight/20 px-2 py-1 rounded-md transition-colors border border-brand-highlight/20" title={`Hubungi ${project.client_phone}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/></svg>
              {project.client_phone}
            </a>
          )}
        </div>
      </div>

      {/* Metadata Dates Layout */}
      <div className="mt-auto grid grid-cols-2 gap-3 text-sm border-t border-brand-border pt-4 mb-4">
        <div>
           <p className="text-brand-muted text-[11px] tracking-wide font-bold mb-1">TGL MULAI</p>
           <p className="text-brand-text font-medium text-sm">{formatDate(project.start_date)}</p>
        </div>
        <div>
           <p className="text-brand-muted text-[11px] tracking-wide font-bold mb-1">TENGGAT WAKTU</p>
           <p className="text-brand-text font-medium text-sm">{formatDate(project.end_date)}</p>
        </div>
      </div>

      {/* Lokasi Indicator */}
      <div className="flex items-center gap-3 p-3 bg-brand-bg rounded-xl border border-brand-border">
         <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>
         </span>
         <span className="text-sm font-medium text-brand-subtext truncate" title={project.address || 'Lokasi Belum Ditentukan'}>
            {project.address || 'Lokasi Belum Ditentukan'}
         </span>
      </div>

    </div>
  );
}
