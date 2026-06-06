import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// GET /api/supervisor/materials
// Melihat daftar semua material yang tersedia
export async function GET() {
  try {
    await requireRole(["supervisor"]);

    const { data: materials, error } = await supabaseAdmin
      .from("materials")
      .select("*, suppliers:supplier_id(supplier_name)")
      .order("material_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ materials: materials || [] });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
