import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// GET /api/supervisor/projects/[id]
// Melihat detail proyek beserta progress history
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

    // Ambil proyek — hanya yang ditugaskan ke supervisor ini
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .eq("supervisor_id", user.user_id)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: "Proyek tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    // Ambil history progress
    const { data: progressHistory } = await supabaseAdmin
      .from("project_progress")
      .select("*, users:recorded_by(fullname)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Ambil jumlah member
    const { count: membersCount } = await supabaseAdmin
      .from("project_members")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const latestProgress = progressHistory && progressHistory.length > 0
      ? progressHistory[0].percentage
      : 0;

    return NextResponse.json({
      project,
      latestProgress,
      progressHistory: progressHistory || [],
      membersCount: membersCount || 0,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
