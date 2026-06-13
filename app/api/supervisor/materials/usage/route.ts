import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

// GET /api/supervisor/materials/usage?project_id=X
// Melihat riwayat penggunaan material (opsional filter per proyek)
export async function GET(req: Request) {
  try {
    const { user } = await requireRole(["supervisor"]);

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    let query = supabaseAdmin
      .from("material_usage")
      .select("*, materials:material_id(material_name, unit), projects:project_id(project_name)")
      .order("created_at", { ascending: false });

    if (projectId) {
      // Validasi akses ke proyek ini
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("project_id")
        .eq("project_id", parseInt(projectId))
        .eq("supervisor_id", user.user_id)
        .single();

      if (!project) {
        return NextResponse.json(
          { error: "Proyek tidak ditemukan atau Anda tidak memiliki akses." },
          { status: 404 }
        );
      }

      query = query.eq("project_id", parseInt(projectId));
    } else {
      // Tanpa filter proyek — ambil semua usage dari proyek yang ditugaskan
      const { data: projects } = await supabaseAdmin
        .from("projects")
        .select("project_id")
        .eq("supervisor_id", user.user_id);

      const projectIds = (projects || []).map((p: { project_id: number }) => p.project_id);
      if (projectIds.length === 0) {
        return NextResponse.json({ usage: [] });
      }
      query = query.in("project_id", projectIds);
    }

    const { data: usage, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ usage: usage || [] });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/supervisor/materials/usage
// Mencatat penggunaan material proyek
export async function POST(req: Request) {
  try {
    const { user } = await requireRole(["supervisor"]);

    const body = await req.json();
    const { project_id, material_id, quantity, notes } = body;

    if (!project_id || !material_id || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "project_id, material_id, dan quantity (> 0) wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi akses — supervisor hanya bisa catat untuk proyek yang ditugaskan
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("project_id, status")
      .eq("project_id", project_id)
      .eq("supervisor_id", user.user_id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Proyek tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    // Fetch the current unit price of the material
    const { data: material } = await supabaseAdmin
      .from("materials")
      .select("unit_price")
      .eq("material_id", parseInt(material_id))
      .single();

    const unitPrice = material?.unit_price || 0;
    const totalCost = unitPrice * parseInt(quantity);

    // Insert penggunaan material (trigger check_material_stock & reduce_material_stock akan berjalan)
    const { data: usage, error } = await supabaseAdmin
      .from("material_usage")
      .insert([{
        project_id: parseInt(project_id),
        material_id: parseInt(material_id),
        quantity: parseInt(quantity),
        unit_price_snapshot: unitPrice,
        total_cost: totalCost,
        notes: notes?.trim() || null,
      }])
      .select("*, materials:material_id(material_name, unit)")
      .single();

    if (error) {
      // Trigger SQL akan throw error jika stok tidak mencukupi
      if (error.message.includes("Stok material tidak mencukupi")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ usage }, { status: 201 });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
