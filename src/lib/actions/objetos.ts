"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { objetoSchema, ObjetoInput } from "@/lib/validations/admin";

export async function getObjetosAdmin() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objetos")
    .select(`
      *,
      organizacao:organizacoes(id, razao_social, nome_fantasia),
      concedente:concedentes(id, nome, sigla, esfera),
      modalidade_principal:modalidades(id, nome)
    `)
    .order("data_inicio", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar projetos: ${error.message}`);
  }

  return data ?? [];
}

export async function getObjetoByIdAdmin(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objetos")
    .select(`
      *,
      organizacao:organizacoes(id, razao_social, nome_fantasia, cnpj),
      concedente:concedentes(id, nome, sigla, esfera),
      modalidade_principal:modalidades(id, nome),
      regioes(*),
      locais(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar projeto: ${error.message}`);
  }

  return data;
}

export async function createObjeto(input: ObjetoInput) {
  const supabase = await createClient();

  const parsed = objetoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // 1. Insere o Objeto (Projeto)
  const { data: objeto, error: objetoError } = await supabase
    .from("objetos")
    .insert({
      ...parsed.data,
      organizacao_id: parsed.data.organizacao_id || null,
      concedente_id: parsed.data.concedente_id || null,
      modalidade_principal_id: parsed.data.modalidade_principal_id || null,
      uf: parsed.data.uf || null,
      municipio: parsed.data.municipio || null,
      processo_administrativo: parsed.data.processo_administrativo || null,
      edital_chamamento: parsed.data.edital_chamamento || null,
      termo_parceria_numero: parsed.data.termo_parceria_numero || null,
      representante_legal_nome: parsed.data.representante_legal_nome || null,
      representante_legal_cargo: parsed.data.representante_legal_cargo || null,
      descricao: parsed.data.descricao || null,
    })
    .select()
    .single();

  if (objetoError || !objeto) {
    return {
      success: false,
      error: objetoError?.message ?? "Falha ao criar o projeto.",
    };
  }

  // 2. Regra Canônica §3.2 (AGENTS.md):
  // Todo Objeto possui obrigatoriamente pelo menos uma região.
  // Ao criar um projeto sem subdivisões específicas, o sistema gera por padrão a "Região Única".
  const { error: regiaoError } = await supabase.from("regioes").insert({
    objeto_id: objeto.id,
    nome: "Região Única",
  });

  if (regiaoError) {
    // Se a criação da região obrigatória falhar, cancela a operação
    await supabase.from("objetos").delete().eq("id", objeto.id);
    return {
      success: false,
      error: `Falha ao criar a Região Única obrigatória (§3.2): ${regiaoError.message}`,
    };
  }

  revalidatePath("/admin/objetos");
  return { success: true, data: objeto };
}

export async function updateObjeto(id: string, input: ObjetoInput) {
  const supabase = await createClient();

  const parsed = objetoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { error } = await supabase
    .from("objetos")
    .update({
      ...parsed.data,
      organizacao_id: parsed.data.organizacao_id || null,
      concedente_id: parsed.data.concedente_id || null,
      modalidade_principal_id: parsed.data.modalidade_principal_id || null,
      uf: parsed.data.uf || null,
      municipio: parsed.data.municipio || null,
      processo_administrativo: parsed.data.processo_administrativo || null,
      edital_chamamento: parsed.data.edital_chamamento || null,
      termo_parceria_numero: parsed.data.termo_parceria_numero || null,
      representante_legal_nome: parsed.data.representante_legal_nome || null,
      representante_legal_cargo: parsed.data.representante_legal_cargo || null,
      descricao: parsed.data.descricao || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/objetos");
  revalidatePath(`/admin/objetos/${id}`);
  return { success: true };
}

export async function toggleObjetoAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("objetos")
    .update({
      ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/objetos");
  revalidatePath(`/admin/objetos/${id}`);
  return { success: true };
}
