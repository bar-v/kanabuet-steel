import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// GET /api/supervisor/projects/[id]/documentation
// Melihat dokumentasi foto proyek
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(["supervisor"]);
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "ID proyek tidak valid." }, { status: 400 });
    }

    // Validasi akses
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("project_id")
      .eq("project_id", projectId)
      .eq("supervisor_id", user.user_id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Proyek tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    // Ambil semua progress yang memiliki foto
    const { data: photos, error } = await supabaseAdmin
      .from("project_progress")
      .select("progress_id, photo_url, update_date, notes, percentage, created_at")
      .eq("project_id", projectId)
      .not("photo_url", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ photos: photos || [] });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
