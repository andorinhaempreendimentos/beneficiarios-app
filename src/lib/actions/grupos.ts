"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { grupoSchema, type GrupoInput } from "@/lib/validations/fase-2";

export interface GrupoListItem {
  id: string;
  nome: string;
  objeto_id: string;
  local_id: string;
  modalidade_id: string | null;
  capacidade_maxima: number;
  idade_minima: number | null;
  idade_maxima: number | null;
  ativo: boolean;
  criado_em: string | null;
  atualizado_em: string | null;
  objeto: { id: string; nome: string; termo_grupo: string } | null;
  local: { id: string; nome: string; regiao: { id: string; nome: string } | null } | null;
  modalidade: { id: string; nome: string } | null;
  vagas_ocupadas: number;
  lista_espera_qtd: number;
  pre_inscritos_qtd: number;
}

export async function getGrupos(
  objetoId?: string,
  localId?: string,
  modalidadeId?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from("grupos")
    .select(`
      *,
      objeto:objetos(id, nome, termo_grupo),
      local:locais(id, nome, regiao:regioes(id, nome)),
      modalidade:modalidades(id, nome)
    `)
    .order("nome", { ascending: true });

  if (objetoId && objetoId !== "todos") {
    query = query.eq("objeto_id", objetoId);
  }

  if (localId && localId !== "todos") {
    query = query.eq("local_id", localId);
  }

  if (modalidadeId && modalidadeId !== "todos") {
    query = query.eq("modalidade_id", modalidadeId);
  }

  const { data: grupos, error: gruposError } = await query;

  if (gruposError) {
    throw new Error(`Erro ao buscar turmas: ${gruposError.message}`);
  }

  const grupoIds = (grupos ?? []).map((g) => g.id);

  // Buscar contagem de matrículas agrupadas
  const contagens: Record<
    string,
    { ativas: number; espera: number; pre: number }
  > = {};

  if (grupoIds.length > 0) {
    const { data: matriculas } = await supabase
      .from("matriculas")
      .select("grupo_id, status")
      .in("grupo_id", grupoIds);

    for (const m of matriculas ?? []) {
      const cur = contagens[m.grupo_id] ?? { ativas: 0, espera: 0, pre: 0 };
      if (m.status === "ativo") cur.ativas++;
      else if (m.status === "lista_espera") cur.espera++;
      else if (m.status === "pre_inscrito") cur.pre++;
      contagens[m.grupo_id] = cur;
    }
  }

  const resultado: GrupoListItem[] = (grupos ?? []).map((g) => {
    const c = contagens[g.id] ?? { ativas: 0, espera: 0, pre: 0 };
    return {
      id: g.id,
      nome: g.nome,
      objeto_id: g.objeto_id,
      local_id: g.local_id,
      modalidade_id: g.modalidade_id,
      capacidade_maxima: g.capacidade_maxima,
      idade_minima: g.idade_minima,
      idade_maxima: g.idade_maxima,
      ativo: g.ativo,
      criado_em: g.criado_em,
      atualizado_em: g.atualizado_em,
      objeto: g.objeto as unknown as { id: string; nome: string; termo_grupo: string } | null,
      local: g.local as unknown as { id: string; nome: string; regiao: { id: string; nome: string } | null } | null,
      modalidade: g.modalidade as unknown as { id: string; nome: string } | null,
      vagas_ocupadas: c.ativas,
      lista_espera_qtd: c.espera,
      pre_inscritos_qtd: c.pre,
    };
  });

  return resultado;
}

export async function getGrupoById(id: string) {
  const supabase = await createClient();

  const { data: grupo, error: grupoError } = await supabase
    .from("grupos")
    .select(`
      *,
      objeto:objetos(id, nome, termo_grupo, termo_beneficiario, tipo),
      local:locais(id, nome, regiao:regioes(id, nome), slug),
      modalidade:modalidades(id, nome)
    `)
    .eq("id", id)
    .single();

  if (grupoError || !grupo) {
    throw new Error(`Turma não encontrada: ${grupoError?.message}`);
  }

  // 2. Buscar matrículas vinculadas
  const { data: matriculas, error: matError } = await supabase
    .from("matriculas")
    .select(`
      *,
      beneficiario:beneficiarios(*)
    `)
    .eq("grupo_id", id)
    .order("data_matricula", { ascending: true });

  if (matError) {
    throw new Error(`Erro ao buscar matrículas da turma: ${matError.message}`);
  }

  // 3. Buscar blocos vinculados a esta turma através de bloco_grupos
  const { data: blocoGrupos, error: bgError } = await supabase
    .from("bloco_grupos")
    .select(`
      bloco:blocos(
        id,
        nome,
        dia_semana,
        data_especifica,
        hora_inicio,
        hora_fim,
        ativo,
        instrutor:funcionarios(id, nome_completo)
      )
    `)
    .eq("grupo_id", id);

  if (bgError) {
    throw new Error(`Erro ao buscar blocos da turma: ${bgError.message}`);
  }

  const blocos = (blocoGrupos ?? [])
    .map((bg) => bg.bloco)
    .filter(Boolean);

  return {
    ...grupo,
    matriculas: matriculas ?? [],
    blocos,
  };
}

export async function createGrupo(input: GrupoInput) {
  const supabase = await createClient();

  const parsed = grupoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("grupos")
    .insert({
      nome: parsed.data.nome,
      objeto_id: parsed.data.objeto_id,
      local_id: parsed.data.local_id,
      modalidade_id: parsed.data.modalidade_id || null,
      capacidade_maxima: parsed.data.capacidade_maxima,
      idade_minima: parsed.data.idade_minima !== null && parsed.data.idade_minima !== "" ? Number(parsed.data.idade_minima) : null,
      idade_maxima: parsed.data.idade_maxima !== null && parsed.data.idade_maxima !== "" ? Number(parsed.data.idade_maxima) : null,
      ativo: parsed.data.ativo,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/grupos");
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data };
}

export async function updateGrupo(id: string, input: GrupoInput) {
  const supabase = await createClient();

  const parsed = grupoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("grupos")
    .update({
      nome: parsed.data.nome,
      objeto_id: parsed.data.objeto_id,
      local_id: parsed.data.local_id,
      modalidade_id: parsed.data.modalidade_id || null,
      capacidade_maxima: parsed.data.capacidade_maxima,
      idade_minima: parsed.data.idade_minima !== null && parsed.data.idade_minima !== "" ? Number(parsed.data.idade_minima) : null,
      idade_maxima: parsed.data.idade_maxima !== null && parsed.data.idade_maxima !== "" ? Number(parsed.data.idade_maxima) : null,
      ativo: parsed.data.ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/grupos");
  revalidatePath(`/grupos/${id}`);
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data };
}

export async function toggleGrupoAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("grupos")
    .update({
      ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select("objeto_id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/grupos");
  revalidatePath(`/grupos/${id}`);
  if (data?.objeto_id) {
    revalidatePath(`/admin/objetos/${data.objeto_id}`);
  }
  return { success: true };
}

export async function deleteGrupo(id: string) {
  const supabase = await createClient();

  // Verificar se há matrículas
  const { count: matCount, error: matError } = await supabase
    .from("matriculas")
    .select("*", { count: "exact", head: true })
    .eq("grupo_id", id);

  if (matError) {
    return { success: false, error: matError.message };
  }

  if (matCount !== null && matCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir esta turma pois existem ${matCount} matrícula(s) associada(s) a ela. Desative a turma em vez de excluí-la para preservar o histórico.`,
    };
  }

  // Desvincular de blocos
  await supabase.from("bloco_grupos").delete().eq("grupo_id", id);

  const { data: grupo, error: fetchError } = await supabase
    .from("grupos")
    .select("objeto_id")
    .eq("id", id)
    .single();

  if (fetchError || !grupo) {
    return { success: false, error: "Turma não encontrada." };
  }

  const { error: delError } = await supabase.from("grupos").delete().eq("id", id);

  if (delError) {
    return { success: false, error: delError.message };
  }

  revalidatePath("/grupos");
  revalidatePath(`/admin/objetos/${grupo.objeto_id}`);
  return { success: true };
}
