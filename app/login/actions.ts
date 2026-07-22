"use server";

import { supabaseAdmin } from "@/lib/supabase/server-admin";
import { createSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  // Cari user berdasarkan email
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("user_id, system_role, password_hash, is_active")
    .ilike("email", email)
    .single();

  if (error || !user) {
    return { error: "Email tidak terdaftar." };
  }

  // Cek apakah akun aktif
  if (user.is_active === false) {
    return { error: "Akun Anda telah dinonaktifkan. Hubungi pemilik." };
  }

  // Jika user belum punya password_hash (misal baru migrasi)
  if (!user.password_hash) {
    return { error: "Akun belum dikonfigurasi. Hubungi admin." };
  }

  // Cek kecocokan password dengan hash
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return { error: "Kata sandi salah." };
  }

  // Login sukses, buat session cookie
  await createSession(user.user_id, user.system_role);

  return { success: true, role: user.system_role };
}

export async function logoutAction() {
  const { logoutSession } = await import("@/lib/auth/session");
  await logoutSession();
}
