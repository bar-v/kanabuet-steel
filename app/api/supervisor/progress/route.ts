import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// GET /api/supervisor/progress
// Melihat semua progres dari proyek yang ditugaskan ke supervisor
export async function GET() {
  try {
    const { user } = await requireRole(["supervisor"]);

    // Ambil project_id yang ditugaskan ke supervisor ini
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("project_id")
      .eq("supervisor_id", user.user_id);

    const projectIds = (projects || []).map((p: { project_id: number }) => p.project_id);

    if (projectIds.length === 0) {
      return NextResponse.json({ progress: [] });
    }

    const { data: progress, error } = await supabaseAdmin
      .from("project_progress")
      .select("*, users:recorded_by(fullname)")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress: progress || [] });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/supervisor/progress
// Menambahkan progres proyek baru
export async function POST(req: Request) {
  try {
    const { user } = await requireRole(["supervisor"]);

    const body = await req.json();
    const { project_id, percentage, notes, photo_url, update_date } = body;

    if (!project_id || percentage == null) {
      return NextResponse.json(
        { error: "project_id dan percentage wajib diisi." },
        { status: 400 }
      );
    }

    if (percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: "Percentage harus antara 0 dan 100." },
        { status: 400 }
      );
    }

    // Validasi akses — supervisor hanya bisa update proyek yang ditugaskan
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("project_id, status")
      .eq("project_id", project_id)
      .eq("supervisor_id", user.user_id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Proyek tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    const { data: progress, error } = await supabaseAdmin
      .from("project_progress")
      .insert([{
        project_id: parseInt(project_id),
        recorded_by: user.user_id,
        percentage: parseInt(percentage),
        notes: notes?.trim() || null,
        photo_url: photo_url || null,
        update_date: update_date || new Date().toISOString().split("T")[0],
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress }, { status: 201 });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
