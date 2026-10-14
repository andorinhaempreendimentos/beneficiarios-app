"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  configuracoesSistemaSchema,
  ConfiguracoesSistemaInput,
} from "@/lib/validations/admin";

export async function getConfiguracoesSistema() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracoes_sistema")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar configurações: ${error.message}`);
  }

  return data;
}

export async function saveConfiguracoesSistema(input: ConfiguracoesSistemaInput) {
  const supabase = await createClient();

  // Verifica se o usuário atual é super_admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (usuario?.papel !== "super_admin") {
    return {
      success: false,
      error: "Apenas Super Administradores podem alterar configurações globais do sistema.",
    };
  }

  const parsed = configuracoesSistemaSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const existing = await getConfiguracoesSistema();

  if (existing) {
    const { error } = await supabase
      .from("configuracoes_sistema")
      .update({
        ...parsed.data,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("configuracoes_sistema")
      .insert({
        ...parsed.data,
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/admin/configuracoes");
  return { success: true };
}
