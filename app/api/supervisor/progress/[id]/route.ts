import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// PUT /api/supervisor/progress/[id]
// Mengubah progres proyek yang sudah dibuat (hanya oleh pembuat)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(["supervisor"]);
    const { id } = await params;
    const progressId = parseInt(id, 10);

    if (isNaN(progressId)) {
      return NextResponse.json({ error: "ID progress tidak valid." }, { status: 400 });
    }

    // Ambil progress yang ada — validasi kepemilikan
    const { data: existing } = await supabaseAdmin
      .from("project_progress")
      .select("*")
      .eq("progress_id", progressId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Progress tidak ditemukan." }, { status: 404 });
    }

    // Hanya bisa edit progress yang dibuat oleh supervisor ini
    if (existing.recorded_by !== user.user_id) {
      return NextResponse.json(
        { error: "Anda hanya bisa mengubah progress yang Anda buat." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.percentage != null) {
      if (body.percentage < 0 || body.percentage > 100) {
        return NextResponse.json(
          { error: "Percentage harus antara 0 dan 100." },
          { status: 400 }
        );
      }
      updateData.percentage = parseInt(body.percentage);
    }
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url || null;
    if (body.update_date) updateData.update_date = body.update_date;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diubah." }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("project_progress")
      .update(updateData)
      .eq("progress_id", progressId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress: updated });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
