import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// POST /api/supervisor/projects/[id]/validate-location
// Validasi lokasi proyek dan ubah status ke 'aktif'
export async function POST(
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
    const { latitude, longitude, survey_notes, photo_urls } = body;

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Latitude dan longitude wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi proyek harus milik supervisor ini dan berstatus menunggu_validasi
    const { data: project, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .eq("supervisor_id", user.user_id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Proyek tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    if (project.status !== "menunggu_validasi") {
      return NextResponse.json(
        { error: `Proyek tidak bisa divalidasi karena status saat ini: ${project.status}` },
        { status: 400 }
      );
    }

    // Update lokasi, status, dan start_date
    const updateData: Record<string, unknown> = {
      latitude,
      longitude,
      status: "aktif",
    };

    // Set start_date jika belum diisi
    if (!project.start_date) {
      updateData.start_date = new Date().toISOString().split("T")[0];
    }

    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from("projects")
      .update(updateData)
      .eq("project_id", projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Jika ada survey_notes atau photo_urls, simpan sebagai progress awal 0%
    const notesToSave = survey_notes && survey_notes.trim() ? survey_notes.trim() : null;
    const urlsToSave: string[] = Array.isArray(photo_urls) ? photo_urls : [];

    if (notesToSave || urlsToSave.length > 0) {
      if (urlsToSave.length > 0) {
        // Buat multiple row untuk tiap foto
        const progressRows = urlsToSave.map((url, index) => ({
          project_id: projectId,
          recorded_by: user.user_id,
          percentage: 0,
          notes: index === 0 ? notesToSave : "Tambahan foto validasi lokasi",
          photo_url: url,
          update_date: new Date().toISOString().split("T")[0],
        }));
        await supabaseAdmin.from("project_progress").insert(progressRows);
      } else {
        // Hanya ada text notes
        await supabaseAdmin.from("project_progress").insert([{
          project_id: projectId,
          recorded_by: user.user_id,
          percentage: 0,
          notes: notesToSave,
          update_date: new Date().toISOString().split("T")[0],
        }]);
      }
    }

    return NextResponse.json({ project: updatedProject });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
