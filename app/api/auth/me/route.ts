import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server-admin";

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
