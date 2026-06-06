import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// PATCH /api/supervisor/projects/[id]/update-location
// Memperbarui titik lokasi proyek
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(["supervisor"]);
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "ID proyek tidak valid." }, { status: 400 });
    }

    const body = await req.json();
    const { latitude, longitude } = body;

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Latitude dan longitude wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi akses — hanya proyek yang ditugaskan ke supervisor ini
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

    const { data: updatedProject, error } = await supabaseAdmin
      .from("projects")
      .update({ latitude, longitude })
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: updatedProject });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
