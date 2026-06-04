import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  // Only authenticated owners can hash passwords (for creating/editing supervisors)
  const session = await getSession();
  if (!session || session.systemRole !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = await request.json();
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  return NextResponse.json({ hash });
}
