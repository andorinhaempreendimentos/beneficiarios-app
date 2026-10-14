"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { blocoSchema, type BlocoInput } from "@/lib/validations/fase-2";

export interface BlocoItem {
  id: string;
  nome: string | null;
  objeto_id: string;
  local_id: string;
  dia_semana: number | null;
  data_especifica: string | null;
  hora_inicio: string;
  hora_fim: string;
  instrutor_id: string | null;
  ativo: boolean;
  criado_em: string | null;
  atualizado_em: string | null;
  objeto: { id: string; nome: string; termo_bloco: string; tipo: string } | null;
  local: { id: string; nome: string } | null;
  instrutor: { id: string; nome_completo: string } | null;
  turmas: { id: string; nome: string }[];
}

export async function getBlocosAdmin(
  objetoId?: string,
  localId?: string,
  diaSemana?: number,
  instrutorId?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from("blocos")
    .select(`
      *,
      objeto:objetos(id, nome, termo_bloco, tipo),
      local:locais(id, nome),
      instrutor:funcionarios(id, nome_completo),
      bloco_grupos(
        grupo:grupos(id, nome)
      )
    `)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (objetoId && objetoId !== "todos") {
    query = query.eq("objeto_id", objetoId);
  }

  if (localId && localId !== "todos") {
    query = query.eq("local_id", localId);
  }

  if (diaSemana !== undefined && diaSemana !== null) {
    query = query.eq("dia_semana", diaSemana);
  }

  if (instrutorId && instrutorId !== "todos") {
    query = query.eq("instrutor_id", instrutorId);
  }

  const { data: blocos, error: blocosError } = await query;

  if (blocosError) {
    throw new Error(`Erro ao buscar blocos de horário: ${blocosError.message}`);
  }

  const resultado: BlocoItem[] = (blocos ?? []).map((b) => {
    const rawGrupos = b.bloco_grupos as unknown as { grupo: { id: string; nome: string } | null }[];
    const turmas = (rawGrupos ?? [])
      .map((bg) => bg.grupo)
      .filter((g): g is { id: string; nome: string } => Boolean(g));

    return {
      id: b.id,
      nome: b.nome,
      objeto_id: b.objeto_id,
      local_id: b.local_id,
      dia_semana: b.dia_semana,
      data_especifica: b.data_especifica,
      hora_inicio: b.hora_inicio,
      hora_fim: b.hora_fim,
      instrutor_id: b.instrutor_id,
      ativo: b.ativo,
      criado_em: b.criado_em,
      atualizado_em: b.atualizado_em,
      objeto: b.objeto as unknown as { id: string; nome: string; termo_bloco: string; tipo: string } | null,
      local: b.local as unknown as { id: string; nome: string } | null,
      instrutor: b.instrutor as unknown as { id: string; nome_completo: string } | null,
      turmas,
    };
  });

  return resultado;
}

export async function createBloco(input: BlocoInput) {
  const supabase = await createClient();

  const parsed = blocoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const diaSemanaVal =
    parsed.data.dia_semana !== null && parsed.data.dia_semana !== ""
      ? Number(parsed.data.dia_semana)
      : null;

  // 1. Inserir o bloco
  const { data: bloco, error: blocoError } = await supabase
    .from("blocos")
    .insert({
      nome: parsed.data.nome || null,
      objeto_id: parsed.data.objeto_id,
      local_id: parsed.data.local_id,
      tipo_recorrencia: parsed.data.tipo_recorrencia || "semanal",
      dia_semana: diaSemanaVal,
      dia_mes: parsed.data.dia_mes || null,
      ordem_semana_mes: parsed.data.ordem_semana_mes || null,
      ajuste_fim_de_semana: parsed.data.ajuste_fim_de_semana || "exato",
      data_especifica: parsed.data.data_especifica || null,
      hora_inicio: parsed.data.hora_inicio,
      hora_fim: parsed.data.hora_fim,
      instrutor_id: parsed.data.instrutor_id || null,
      ativo: parsed.data.ativo,
    })
    .select()
    .single();

  if (blocoError || !bloco) {
    return { success: false, error: blocoError?.message ?? "Falha ao criar bloco." };
  }

  // 2. Vincular turmas em bloco_grupos
  if (parsed.data.grupos_ids && parsed.data.grupos_ids.length > 0) {
    const vinculos = parsed.data.grupos_ids.map((gid) => ({
      bloco_id: bloco.id,
      grupo_id: gid,
    }));

    const { error: bgError } = await supabase.from("bloco_grupos").insert(vinculos);
    if (bgError) {
      return { success: false, error: `Bloco criado, mas erro ao vincular turmas: ${bgError.message}` };
    }
  }

  revalidatePath("/planejamento");
  revalidatePath("/calendario");
  revalidatePath("/grupos");
  revalidatePath(`/admin/locais/${parsed.data.local_id}`);
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data: bloco };
}

export async function updateBloco(id: string, input: BlocoInput) {
  const supabase = await createClient();

  const parsed = blocoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const diaSemanaVal =
    parsed.data.dia_semana !== null && parsed.data.dia_semana !== ""
      ? Number(parsed.data.dia_semana)
      : null;

  // 1. Atualizar o bloco
  const { data: bloco, error: blocoError } = await supabase
    .from("blocos")
    .update({
      nome: parsed.data.nome || null,
      objeto_id: parsed.data.objeto_id,
      local_id: parsed.data.local_id,
      tipo_recorrencia: parsed.data.tipo_recorrencia || "semanal",
      dia_semana: diaSemanaVal,
      dia_mes: parsed.data.dia_mes || null,
      ordem_semana_mes: parsed.data.ordem_semana_mes || null,
      ajuste_fim_de_semana: parsed.data.ajuste_fim_de_semana || "exato",
      data_especifica: parsed.data.data_especifica || null,
      hora_inicio: parsed.data.hora_inicio,
      hora_fim: parsed.data.hora_fim,
      instrutor_id: parsed.data.instrutor_id || null,
      ativo: parsed.data.ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (blocoError) {
    return { success: false, error: blocoError.message };
  }

  // 2. Sincronizar turmas associadas em bloco_grupos
  await supabase.from("bloco_grupos").delete().eq("bloco_id", id);

  if (parsed.data.grupos_ids && parsed.data.grupos_ids.length > 0) {
    const vinculos = parsed.data.grupos_ids.map((gid) => ({
      bloco_id: id,
      grupo_id: gid,
    }));

    await supabase.from("bloco_grupos").insert(vinculos);
  }

  revalidatePath("/planejamento");
  revalidatePath("/calendario");
  revalidatePath("/grupos");
  revalidatePath(`/admin/locais/${parsed.data.local_id}`);
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data: bloco };
}

export async function toggleBlocoAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blocos")
    .update({
      ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select("objeto_id, local_id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/planejamento");
  if (data?.local_id) {
    revalidatePath(`/admin/locais/${data.local_id}`);
  }
  if (data?.objeto_id) {
    revalidatePath(`/admin/objetos/${data.objeto_id}`);
  }
  return { success: true };
}

export async function deleteBloco(id: string) {
  const supabase = await createClient();

  // Verificar se há sessões geradas
  const { count: sessoesCount, error: sessoesError } = await supabase
    .from("sessoes")
    .select("*", { count: "exact", head: true })
    .eq("bloco_id", id);

  if (sessoesError) {
    return { success: false, error: sessoesError.message };
  }

  if (sessoesCount !== null && sessoesCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir este bloco de horário pois existem ${sessoesCount} sessão(ões) de atividade registradas para ele. Desative o bloco em vez de excluí-lo.`,
    };
  }

  // Desvincular turmas
  await supabase.from("bloco_grupos").delete().eq("bloco_id", id);

  const { data: bloco, error: fetchError } = await supabase
    .from("blocos")
    .select("objeto_id, local_id")
    .eq("id", id)
    .single();

  if (fetchError || !bloco) {
    return { success: false, error: "Bloco de horário não encontrado." };
  }

  const { error: delError } = await supabase.from("blocos").delete().eq("id", id);

  if (delError) {
    return { success: false, error: delError.message };
  }

  revalidatePath("/planejamento");
  if (bloco.local_id) {
    revalidatePath(`/admin/locais/${bloco.local_id}`);
  }
  revalidatePath(`/admin/objetos/${bloco.objeto_id}`);
  return { success: true };
}
