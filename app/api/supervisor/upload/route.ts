import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// POST /api/supervisor/upload
// Upload foto dokumentasi ke Supabase Storage
export async function POST(req: Request) {
  try {
    const { user } = await requireRole(["supervisor"]);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("project_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File wajib disertakan." }, { status: 400 });
    }

    // Validasi ukuran file (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas 5MB." },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    // Buat path file
    const ext = file.name.split(".").pop() || "jpg";
    const folder = projectId ? `progress/${projectId}` : `progress/general`;
    const filePath = `${folder}/${Date.now()}_${user.user_id}.${ext}`;

    // Konversi file ke buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("project-photos")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload gagal: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("project-photos")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
