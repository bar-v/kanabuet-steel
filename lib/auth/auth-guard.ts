import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server-admin";
import type { SystemRole, User } from "@/lib/types/database";

export interface AuthResult {
  user: User;
}

/**
 * Validasi session dan role user di API route.
 *
 * @param allowedRoles - Role yang diizinkan mengakses endpoint
 * @returns `{ user }` jika valid
 * @throws `NextResponse` 401 jika belum login, 403 jika role tidak sesuai
 */
export async function requireRole(
  allowedRoles: SystemRole[]
): Promise<AuthResult> {
  const session = await getSession();

  if (!session || !session.userId) {
    throw NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("user_id", session.userId)
    .single();

  if (error || !user) {
    throw NextResponse.json(
      { error: "User tidak ditemukan." },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(user.system_role as SystemRole)) {
    throw NextResponse.json(
      { error: "Forbidden. Anda tidak memiliki akses ke resource ini." },
      { status: 403 }
    );
  }

  if (!user.is_active) {
    throw NextResponse.json(
      { error: "Akun Anda tidak aktif. Hubungi administrator." },
      { status: 403 }
    );
  }

  return { user: user as User };
}

/**
 * Wrapper untuk API route handler yang membutuhkan autentikasi role.
 * Menangkap thrown NextResponse dari requireRole.
 */
export function withAuth(
  allowedRoles: SystemRole[],
  handler: (req: Request, user: User) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      const { user } = await requireRole(allowedRoles);
      return await handler(req, user);
    } catch (response) {
      if (response instanceof NextResponse) {
        return response;
      }
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
