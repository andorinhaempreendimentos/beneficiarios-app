"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function redefinirSenhaAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    return { error: "A nova senha deve ter no mínimo 6 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem. Digite novamente." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "Sua sessão de recuperação expirou ou é inválida. Solicite um novo link de redefinição.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?senha_redefinida=sucesso");
}
