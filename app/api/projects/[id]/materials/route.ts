import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(["owner", "supervisor"]);
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "ID proyek tidak valid." }, { status: 400 });
    }

    // Verify access
    if (user.system_role === "supervisor") {
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("project_id")
        .eq("project_id", projectId)
        .eq("supervisor_id", user.user_id)
        .single();
        
      if (!project) {
        return NextResponse.json({ error: "Proyek tidak ditemukan atau Anda tidak memiliki akses." }, { status: 404 });
      }
    }

    const { data: usage, error } = await supabaseAdmin
      .from("material_usage")
      .select("*, materials(material_name, specification, unit), projects(project_name)")
      .eq("project_id", projectId)
      .order("usage_date", { ascending: false });

    if (error) {
       return NextResponse.json({ error: "Gagal mengambil penggunaan material." }, { status: 500 });
    }

    return NextResponse.json({ usage: usage || [] });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
