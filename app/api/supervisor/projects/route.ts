import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// GET /api/supervisor/projects
// Melihat proyek yang ditugaskan ke supervisor yang sedang login
export async function GET() {
  try {
    const { user } = await requireRole(["supervisor"]);

    const { data: projects, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("supervisor_id", user.user_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ambil progress terbaru untuk setiap proyek
    const projectIds = (projects || []).map((p: { project_id: number }) => p.project_id);

    let progressMap: Record<number, number> = {};
    if (projectIds.length > 0) {
      const { data: progressData } = await supabaseAdmin
        .from("project_progress")
        .select("project_id, percentage, created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      if (progressData) {
        for (const p of progressData) {
          // Ambil yang terbaru saja per project
          if (!(p.project_id in progressMap)) {
            progressMap[p.project_id] = p.percentage;
          }
        }
      }
    }

    // Gabungkan progress ke project data
    const projectsWithProgress = (projects || []).map((p: { project_id: number }) => ({
      ...p,
      latest_progress: progressMap[p.project_id] ?? 0,
    }));

    return NextResponse.json({ projects: projectsWithProgress });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
