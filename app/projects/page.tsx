import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import ProjectsViewClient from './ProjectsViewClient';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>Gagal memuat daftar proyek: {error.message}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat dashboard proyek...</div>}>
      <ProjectsViewClient projects={projects || []} />
    </Suspense>
  );
}
