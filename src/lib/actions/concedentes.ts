"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { concedenteSchema, ConcedenteInput } from "@/lib/validations/admin";

export async function getConcedentes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("concedentes")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar concedentes: ${error.message}`);
  }

  return data ?? [];
}

export async function createConcedente(input: ConcedenteInput) {
  const supabase = await createClient();

  const parsed = concedenteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("concedentes")
    .insert({
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/concedentes");
  return { success: true, data };
}

export async function updateConcedente(id: string, input: ConcedenteInput) {
  const supabase = await createClient();

  const parsed = concedenteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { error } = await supabase
    .from("concedentes")
    .update({
      ...parsed.data,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/concedentes");
  return { success: true };
}

export async function toggleConcedenteAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("concedentes")
    .update({
      ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/concedentes");
  return { success: true };
}
