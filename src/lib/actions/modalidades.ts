"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  modalidadeSchema,
  ModalidadeInput,
  modalidadeChecklistItemSchema,
} from "@/lib/validations/admin";

export async function getModalidades() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modalidades")
    .select(`
      *,
      checklist_itens:modalidade_checklist_itens(*)
    `)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar modalidades: ${error.message}`);
  }

  return data ?? [];
}

export async function createModalidade(input: ModalidadeInput) {
  const supabase = await createClient();

  const parsed = modalidadeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("modalidades")
    .insert({
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/modalidades");
  return { success: true, data };
}

export async function updateModalidade(id: string, input: ModalidadeInput) {
  const supabase = await createClient();

  const parsed = modalidadeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { error } = await supabase
    .from("modalidades")
    .update({
      ...parsed.data,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/modalidades");
  return { success: true };
}

export async function toggleModalidadeAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("modalidades")
    .update({
      ativo,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/modalidades");
  return { success: true };
}

export async function addChecklistItem(modalidade_id: string, descricao: string) {
  const supabase = await createClient();

  const parsed = modalidadeChecklistItemSchema.safeParse({
    modalidade_id,
    descricao,
    ordem: 0,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { error } = await supabase.from("modalidade_checklist_itens").insert({
    modalidade_id,
    descricao: parsed.data.descricao,
    ordem: 0,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/modalidades");
  return { success: true };
}

export async function removeChecklistItem(item_id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("modalidade_checklist_itens")
    .delete()
    .eq("id", item_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/modalidades");
  return { success: true };
}
