"use server";

import { supabaseAdmin } from "@/lib/supabase/server-admin";

export async function createUserAction(payload: {
  fullname: string;
  email: string;
  password_hash: string;
  system_role: string;
  is_active: boolean;
}) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert([payload])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Email ini sudah terdaftar. Silakan gunakan alamat email lain." };
    }
    return { error: error.message };
  }

  return { success: true, data };
}

export async function updateUserAction(
  userId: number,
  payload: {
    fullname?: string;
    email?: string;
    password_hash?: string;
  }
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update(payload)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Email ini sudah terdaftar. Silakan gunakan alamat email lain." };
    }
    return { error: error.message };
  }

  return { success: true, data };
}

export async function toggleUserActiveAction(userId: number, currentStatus: boolean) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ is_active: !currentStatus })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, data };
}
