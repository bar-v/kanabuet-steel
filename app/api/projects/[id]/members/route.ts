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

    // Get project and verify access
    let query = supabaseAdmin
      .from("projects")
      .select("supervisor_id, users!projects_supervisor_id_fkey(fullname)")
      .eq("project_id", projectId);

    if (user.system_role === "supervisor") {
      query = query.eq("supervisor_id", user.user_id);
    }

    const { data: project } = await query.single();
    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan atau Anda tidak memiliki akses." }, { status: 404 });
    }

    const { data: members, error } = await supabaseAdmin
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .order("member_id", { ascending: true });

    if (error) {
       return NextResponse.json({ error: "Gagal mengambil anggota tim." }, { status: 500 });
    }

    const allMembers = [];
    
    // Inject supervisor as a pseudo-member if exists
    if (project.supervisor_id && project.users && !Array.isArray(project.users)) {
      allMembers.push({
        member_id: -1, // pseudo ID
        project_id: projectId,
        member_name: (project.users as { fullname: string }).fullname,
        phone_number: null,
        project_role: "Supervisor Proyek",
      });
    }
    
    allMembers.push(...(members || []));

    return NextResponse.json({ members: allMembers });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
