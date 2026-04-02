import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditProjectForm from './EditProjectForm';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Mengambil data spesifik proyek dari DB secara aman dari Server
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound(); // Mengarahkan ke halaman 404 jika project tidak ada
  }

  return <EditProjectForm project={project} />;
}
