"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function esqueciSenhaAction(
  _prevState: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Informe o endereço de e-mail cadastrado." };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("host") || "beneficiarios-app.vercel.app";
  const proto = headersList.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
