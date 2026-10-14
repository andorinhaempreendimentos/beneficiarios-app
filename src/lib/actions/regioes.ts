"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { regiaoSchema, type RegiaoInput } from "@/lib/validations/admin";

export async function getRegioes(objetoId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("regioes")
    .select(`
      *,
      objeto:objetos(id, nome),
      locais(id, nome)
    `)
    .order("criado_em", { ascending: true });

  if (objetoId && objetoId !== "todos") {
    query = query.eq("objeto_id", objetoId);
  }

  const { data: regioes, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar regiões: ${error.message}`);
  }

  const coordIds = Array.from(
    new Set((regioes ?? []).map((r) => r.coordenador_id).filter(Boolean))
  ) as string[];

  let usuariosMap: Record<
    string,
    { id: string; nome_completo: string | null; papel: string }
  > = {};

  if (coordIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, nome_completo, papel")
      .in("id", coordIds);

    if (usuarios) {
      usuariosMap = Object.fromEntries(usuarios.map((u) => [u.id, u]));
    }
  }

  return (regioes ?? []).map((r) => ({
    ...r,
    coordenador: r.coordenador_id ? usuariosMap[r.coordenador_id] ?? null : null,
  }));
}

export async function getCoordenadores() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome_completo, papel, ativo")
    .in("papel", ["coordenador", "admin_geral", "super_admin"])
    .eq("ativo", true)
    .order("nome_completo", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar coordenadores: ${error.message}`);
  }

  return data ?? [];
}

export async function createRegiao(input: RegiaoInput) {
  const supabase = await createClient();

  const parsed = regiaoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("regioes")
    .insert({
      nome: parsed.data.nome,
      objeto_id: parsed.data.objeto_id,
      coordenador_id: parsed.data.coordenador_id || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/regioes");
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data };
}

export async function updateRegiao(id: string, input: RegiaoInput) {
  const supabase = await createClient();

  const parsed = regiaoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("regioes")
    .update({
      nome: parsed.data.nome,
      objeto_id: parsed.data.objeto_id,
      coordenador_id: parsed.data.coordenador_id || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/regioes");
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data };
}

export async function deleteRegiao(id: string) {
  const supabase = await createClient();

  // 1. Obter a região atual para saber o objeto_id
  const { data: regiao, error: fetchError } = await supabase
    .from("regioes")
    .select("id, objeto_id, nome")
    .eq("id", id)
    .single();

  if (fetchError || !regiao) {
    return { success: false, error: "Região não encontrada." };
  }

  // 2. Regra Canônica §3.2: Verificar se é a única região do projeto
  const { count: regioesCount, error: countError } = await supabase
    .from("regioes")
    .select("*", { count: "exact", head: true })
    .eq("objeto_id", regiao.objeto_id);

  if (countError) {
    return { success: false, error: countError.message };
  }

  if (regioesCount !== null && regioesCount <= 1) {
    return {
      success: false,
      error:
        "Regra Canônica §3.2: Todo projeto deve possuir obrigatoriamente pelo menos uma região territorial. Não é permitido excluir a única região existente.",
    };
  }

  // 3. Regra Canônica §3.2: Verificar se há locais/polos vinculados a esta região
  const { count: locaisCount, error: locaisError } = await supabase
    .from("locais")
    .select("*", { count: "exact", head: true })
    .eq("regiao_id", id);

  if (locaisError) {
    return { success: false, error: locaisError.message };
  }

  if (locaisCount !== null && locaisCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir esta região pois ela possui ${locaisCount} polo(s)/local(is) vinculado(s). Realoque ou remova os polos antes de excluir a região.`,
    };
  }

  // 4. Executa a exclusão
  const { error: deleteError } = await supabase
    .from("regioes")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/admin/regioes");
  revalidatePath(`/admin/objetos/${regiao.objeto_id}`);
  return { success: true };
}
