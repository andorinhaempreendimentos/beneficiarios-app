"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { localSchema, type LocalInput } from "@/lib/validations/admin";
import type { Database } from "@/lib/database.types";

function generateSlug(nome: string): string {
  const base = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function getLocaisAdmin(objetoId?: string, regiaoId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("locais")
    .select(`
      *,
      objeto:objetos(id, nome, termo_local),
      regiao:regioes(id, nome),
      grupos(id, nome)
    `)
    .order("nome", { ascending: true });

  if (objetoId && objetoId !== "todos") {
    query = query.eq("objeto_id", objetoId);
  }

  if (regiaoId && regiaoId !== "todos") {
    query = query.eq("regiao_id", regiaoId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar locais/polos: ${error.message}`);
  }

  return data ?? [];
}

export async function getRegioesParaSelecao(objetoId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("regioes")
    .select("id, nome, objeto_id")
    .order("nome", { ascending: true });

  if (objetoId && objetoId !== "todos") {
    query = query.eq("objeto_id", objetoId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar regiões: ${error.message}`);
  }

  return data ?? [];
}

export async function createLocal(input: LocalInput) {
  const supabase = await createClient();

  const parsed = localSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // Regra Canônica §3.2: Garantir que regiao_id pertence ao objeto_id
  const { data: regiao, error: regiaoError } = await supabase
    .from("regioes")
    .select("id, objeto_id")
    .eq("id", parsed.data.regiao_id)
    .single();

  if (regiaoError || !regiao) {
    return { success: false, error: "A região informada não existe." };
  }

  if (regiao.objeto_id !== parsed.data.objeto_id) {
    return {
      success: false,
      error:
        "Regra Canônica §3.2: A região selecionada não pertence ao projeto selecionado.",
    };
  }

  const slug = parsed.data.slug?.trim() || generateSlug(parsed.data.nome);

  const { data, error } = await supabase
    .from("locais")
    .insert({
      nome: parsed.data.nome,
      objeto_id: parsed.data.objeto_id,
      regiao_id: parsed.data.regiao_id,
      descricao: parsed.data.descricao || null,
      endereco_logradouro: parsed.data.endereco_logradouro || null,
      endereco_numero: parsed.data.endereco_numero || null,
      endereco_bairro: parsed.data.endereco_bairro || null,
      endereco_cidade: parsed.data.endereco_cidade || null,
      endereco_uf: parsed.data.endereco_uf || null,
      endereco_cep: parsed.data.endereco_cep || null,
      slug,
      ativo: parsed.data.ativo,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/locais");
  revalidatePath("/admin/regioes");
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data };
}

export async function updateLocal(id: string, input: LocalInput) {
  const supabase = await createClient();

  const parsed = localSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // Regra Canônica §3.2: Garantir que regiao_id pertence ao objeto_id
  const { data: regiao, error: regiaoError } = await supabase
    .from("regioes")
    .select("id, objeto_id")
    .eq("id", parsed.data.regiao_id)
    .single();

  if (regiaoError || !regiao) {
    return { success: false, error: "A região informada não existe." };
  }

  if (regiao.objeto_id !== parsed.data.objeto_id) {
    return {
      success: false,
      error:
        "Regra Canônica §3.2: A região selecionada não pertence ao projeto selecionado.",
    };
  }

  const slug = parsed.data.slug?.trim() || generateSlug(parsed.data.nome);

  const { data, error } = await supabase
    .from("locais")
    .update({
      nome: parsed.data.nome,
      objeto_id: parsed.data.objeto_id,
      regiao_id: parsed.data.regiao_id,
      descricao: parsed.data.descricao || null,
      endereco_logradouro: parsed.data.endereco_logradouro || null,
      endereco_numero: parsed.data.endereco_numero || null,
      endereco_bairro: parsed.data.endereco_bairro || null,
      endereco_cidade: parsed.data.endereco_cidade || null,
      endereco_uf: parsed.data.endereco_uf || null,
      endereco_cep: parsed.data.endereco_cep || null,
      slug,
      ativo: parsed.data.ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/locais");
  revalidatePath(`/admin/locais/${id}`);
  revalidatePath("/admin/regioes");
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data };
}

export async function toggleLocalAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locais")
    .update({
      ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, objeto_id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/locais");
  if (data?.objeto_id) {
    revalidatePath(`/admin/objetos/${data.objeto_id}`);
  }
  return { success: true };
}

export async function deleteLocal(id: string) {
  const supabase = await createClient();

  const { data: local, error: fetchError } = await supabase
    .from("locais")
    .select("id, objeto_id, nome")
    .eq("id", id)
    .single();

  if (fetchError || !local) {
    return { success: false, error: "Polo/Local não encontrado." };
  }

  // Verificar se há turmas vinculadas
  const { count: gruposCount, error: gruposError } = await supabase
    .from("grupos")
    .select("*", { count: "exact", head: true })
    .eq("local_id", id);

  if (gruposError) {
    return { success: false, error: gruposError.message };
  }

  if (gruposCount !== null && gruposCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir este local pois existem ${gruposCount} turma(s)/grupo(s) cadastrado(s) nele. Desative o local em vez de excluí-lo.`,
    };
  }

  // Verificar se há visitas de supervisão
  const { count: visitasCount, error: visitasError } = await supabase
    .from("visitas_supervisao")
    .select("*", { count: "exact", head: true })
    .eq("local_id", id);

  if (visitasError) {
    return { success: false, error: visitasError.message };
  }

  if (visitasCount !== null && visitasCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir este local pois existem ${visitasCount} vistoria(s) de supervisão registradas nele. Desative o local em vez de excluí-lo.`,
    };
  }

  const { error: deleteError } = await supabase
    .from("locais")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/admin/locais");
  revalidatePath(`/admin/objetos/${local.objeto_id}`);
  return { success: true };
}

export async function getLocalById(id: string) {
  const supabase = await createClient();

  const { data: local, error } = await supabase
    .from("locais")
    .select(`
      *,
      objeto:objetos(id, nome, termo_local, termo_bloco, termo_grupo, termo_instrutor, tipo),
      regiao:regioes(id, nome, coordenador_id),
      grupos(id, nome, modalidade_id, capacidade_maxima, idade_minima, idade_maxima, ativo),
      blocos(
        *,
        instrutor:funcionarios(id, nome_completo),
        bloco_grupos(
          grupo:grupos(id, nome)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !local) {
    return null;
  }

  // Mapear turmas de bloco_grupos
  type RawBlocoType = Database["public"]["Tables"]["blocos"]["Row"] & {
    instrutor: { id: string; nome_completo: string } | null;
    bloco_grupos: { grupo: { id: string; nome: string } | null }[];
  };
  const rawBlocos = (local.blocos ?? []) as unknown as RawBlocoType[];
  const blocosFormatados = rawBlocos.map((b) => {
    const turmas = (b.bloco_grupos ?? [])
      .map((bg) => bg.grupo)
      .filter((g): g is { id: string; nome: string } => Boolean(g));

    return {
      ...b,
      turmas,
    };
  });

  return {
    ...local,
    blocos: blocosFormatados,
  };
}
