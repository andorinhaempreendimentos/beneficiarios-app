"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { organizacaoSchema, OrganizacaoInput } from "@/lib/validations/admin";

export async function getOrganizacoes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizacoes")
    .select("*")
    .order("razao_social", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar organizações: ${error.message}`);
  }

  return data ?? [];
}

export async function createOrganizacao(input: OrganizacaoInput) {
  const supabase = await createClient();

  const parsed = organizacaoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("organizacoes")
    .insert({
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/organizacoes");
  return { success: true, data };
}

export async function updateOrganizacao(id: string, input: OrganizacaoInput) {
  const supabase = await createClient();

  const parsed = organizacaoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { error } = await supabase
    .from("organizacoes")
    .update({
      ...parsed.data,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/organizacoes");
  return { success: true };
}

export async function toggleOrganizacaoAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organizacoes")
    .update({
      ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/organizacoes");
  return { success: true };
}
