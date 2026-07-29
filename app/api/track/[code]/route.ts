import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code;
  
  if (!code) {
    return NextResponse.json({ error: 'Kode resi tidak valid' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    // 1. Get project based on tracking code
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id, project_name, status, start_date, estimated_finish, description, latitude, longitude, project_address, tracking_code')
      .eq('tracking_code', code)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    // 2. Get progress history
    const { data: progressHistory, error: progressError } = await supabase
      .from('project_progress')
      .select('progress_id, percentage, notes, photo_url, update_date, created_at')
      .eq('project_id', project.project_id)
      .order('created_at', { ascending: false });

    if (progressError) {
      console.error("Progress Error:", progressError);
      return NextResponse.json({ error: 'Gagal mengambil data progress' }, { status: 500 });
    }

    // Determine latest progress
    const latestProgress = progressHistory && progressHistory.length > 0 
      ? Math.max(...progressHistory.map(p => p.percentage))
      : 0;

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        latest_progress: latestProgress
      },
      progressHistory: progressHistory || []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      }
    });

  } catch (err: any) {
    console.error("Tracking API Error:", err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
