'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ProjectCardActions({ 
  project 
}: { 
  project: { id: string, latitude?: number | null, longitude?: number | null } 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!window.confirm('Yakin ingin menghapus proyek ini? Seluruh data terkait akan hilang permanen.')) {
      return;
    }
    
    setIsDeleting(true);
    setIsOpen(false);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      
      router.refresh(); 
    } catch (err: any) {
      alert("Gagal menghapus proyek: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-brand-muted hover:text-brand-primary hover:bg-brand-bg transition-colors focus:outline-none"
        aria-label="Opsi Proyek"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl bg-brand-card ring-1 ring-brand-border divide-y divide-brand-border z-[100] overflow-hidden transform origin-top-right transition-all">
          <div className="py-1">
            <Link 
              href={`/projects/${project.id}`}
              className="flex items-center px-4 py-2.5 text-sm text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors"
            >
               Lihat Detail
            </Link>
            <Link 
              href={`/projects/${project.id}/edit`}
              className="flex items-center px-4 py-2.5 text-sm text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors"
            >
               Edit Proyek
            </Link>
          </div>
          <div className="py-1">
            {project.latitude && project.longitude && (
              <a 
                href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2.5 text-sm font-medium text-brand-highlight hover:bg-brand-highlight/10 transition-colors"
              >
                 Buka Google Maps
              </a>
            )}
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm font-medium text-state-danger hover:bg-state-danger/10 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus Proyek'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
