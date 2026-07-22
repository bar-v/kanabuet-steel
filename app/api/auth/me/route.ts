import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server-admin";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("user_id", session.userId)
    .single();

  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullname, email, password } = body;

    const updates: any = {};
    if (fullname) updates.fullname = fullname;
    if (email) updates.email = email;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Check if email is already taken by another user
    if (email) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("user_id")
        .eq("email", email)
        .neq("user_id", session.userId)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
      }
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("user_id", session.userId)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
    }

    // If email is changed, might need to update the session or JWT if it uses email
    // but typically we only store userId, systemRole, etc.
    // If the session includes email, we'd need to update it. Let's assume it doesn't strictly need it unless we see it.
    
    return NextResponse.json({ user: updatedUser });
  } catch (err: any) {
    console.error("Error in PUT /api/auth/me:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
