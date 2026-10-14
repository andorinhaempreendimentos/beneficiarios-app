"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ModalidadeVinculada {
  id: string; // ID da tabela objeto_modalidades
  objeto_id: string;
  modalidade_id: string;
  ativo: boolean;
  criado_em: string | null;
  modalidade: {
    id: string;
    nome: string;
    descricao: string | null;
    ativo: boolean;
  };
}

export async function getModalidadesDoObjeto(objetoId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objeto_modalidades")
    .select(`
      id,
      objeto_id,
      modalidade_id,
      ativo,
      criado_em,
      modalidade:modalidades (
        id,
        nome,
        descricao,
        ativo
      )
    `)
    .eq("objeto_id", objetoId)
    .order("criado_em", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar modalidades do projeto: ${error.message}`);
  }

  // Tratamento de tipagem do Supabase join
  return (data ?? []) as unknown as ModalidadeVinculada[];
}

export async function vincularModalidadeObjeto(objetoId: string, modalidadeId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objeto_modalidades")
    .insert({
      objeto_id: objetoId,
      modalidade_id: modalidadeId,
      ativo: true,
    })
    .select(`
      id,
      objeto_id,
      modalidade_id,
      ativo,
      criado_em,
      modalidade:modalidades (
        id,
        nome,
        descricao,
        ativo
      )
    `)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Esta modalidade já está vinculada a este projeto." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/objetos/${objetoId}`);
  return { success: true, data: data as unknown as ModalidadeVinculada };
}

export async function desvincularModalidadeObjeto(objetoId: string, modalidadeId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("objeto_modalidades")
    .delete()
    .eq("objeto_id", objetoId)
    .eq("modalidade_id", modalidadeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/objetos/${objetoId}`);
  return { success: true };
}

export async function toggleStatusModalidadeObjeto(
  id: string,
  objetoId: string,
  ativo: boolean
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("objeto_modalidades")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/objetos/${objetoId}`);
  return { success: true };
}
