"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { funcionarioSchema, type FuncionarioInput } from "@/lib/validations/admin";

export async function getFuncionariosAdmin(
  objetoId?: string,
  localId?: string,
  situacao?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from("funcionarios")
    .select(`
      *,
      objeto:objetos(id, nome),
      organizacao:organizacoes(id, razao_social, nome_fantasia),
      local:locais(id, nome)
    `)
    .order("nome_completo", { ascending: true });

  if (objetoId && objetoId !== "todos") {
    query = query.eq("objeto_id", objetoId);
  }

  if (localId && localId !== "todos") {
    query = query.eq("local_id", localId);
  }

  if (situacao && situacao !== "todos") {
    query = query.eq("situacao", situacao);
  }

  const { data: funcionarios, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar funcionários: ${error.message}`);
  }

  // Buscar usuários vinculados
  const userIds = Array.from(
    new Set((funcionarios ?? []).map((f) => f.usuario_id).filter(Boolean))
  ) as string[];

  let usuariosMap: Record<
    string,
    { id: string; nome_completo: string | null; papel: string }
  > = {};

  if (userIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, nome_completo, papel")
      .in("id", userIds);

    if (usuarios) {
      usuariosMap = Object.fromEntries(usuarios.map((u) => [u.id, u]));
    }
  }

  return (funcionarios ?? []).map((f) => ({
    ...f,
    usuario: f.usuario_id ? usuariosMap[f.usuario_id] ?? null : null,
  }));
}

export async function getUsuariosParaVinculo() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome_completo, papel")
    .eq("ativo", true)
    .order("nome_completo", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar usuários: ${error.message}`);
  }

  return data ?? [];
}

export async function createFuncionario(input: FuncionarioInput) {
  const supabase = await createClient();

  const parsed = funcionarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const cpfLimpo = parsed.data.cpf.replace(/\D/g, "");

  const { data, error } = await supabase
    .from("funcionarios")
    .insert({
      nome_completo: parsed.data.nome_completo,
      cpf: cpfLimpo,
      cargo: parsed.data.cargo,
      objeto_id: parsed.data.objeto_id,
      organizacao_id: parsed.data.organizacao_id,
      local_id: parsed.data.local_id || null,
      email: parsed.data.email || null,
      telefone: parsed.data.telefone || null,
      data_admissao: parsed.data.data_admissao || null,
      data_desligamento: parsed.data.data_desligamento || null,
      carga_horaria_semanal: parsed.data.carga_horaria_semanal ?? null,
      situacao: parsed.data.situacao,
      usuario_id: parsed.data.usuario_id || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/funcionarios");
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data };
}

export async function updateFuncionario(id: string, input: FuncionarioInput) {
  const supabase = await createClient();

  const parsed = funcionarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const cpfLimpo = parsed.data.cpf.replace(/\D/g, "");

  const { data, error } = await supabase
    .from("funcionarios")
    .update({
      nome_completo: parsed.data.nome_completo,
      cpf: cpfLimpo,
      cargo: parsed.data.cargo,
      objeto_id: parsed.data.objeto_id,
      organizacao_id: parsed.data.organizacao_id,
      local_id: parsed.data.local_id || null,
      email: parsed.data.email || null,
      telefone: parsed.data.telefone || null,
      data_admissao: parsed.data.data_admissao || null,
      data_desligamento: parsed.data.data_desligamento || null,
      carga_horaria_semanal: parsed.data.carga_horaria_semanal ?? null,
      situacao: parsed.data.situacao,
      usuario_id: parsed.data.usuario_id || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/funcionarios");
  revalidatePath(`/admin/objetos/${parsed.data.objeto_id}`);
  return { success: true, data };
}

export async function deleteFuncionario(id: string) {
  const supabase = await createClient();

  // Verificar se há registros de ponto
  const { count: pontosCount, error: pontosError } = await supabase
    .from("registros_ponto")
    .select("*", { count: "exact", head: true })
    .eq("funcionario_id", id);

  if (pontosError) {
    return { success: false, error: pontosError.message };
  }

  if (pontosCount !== null && pontosCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir este funcionário pois existem ${pontosCount} registro(s) de ponto eletrônico associado(s) a ele para comprovação MROSC. Altere a situação para "Desligado".`,
    };
  }

  // Verificar se há vistorias de supervisão onde ele foi o instrutor auditado
  const { count: visitasCount, error: visitasError } = await supabase
    .from("visitas_supervisao")
    .select("*", { count: "exact", head: true })
    .eq("instrutor_funcionario_id", id);

  if (visitasError) {
    return { success: false, error: visitasError.message };
  }

  if (visitasCount !== null && visitasCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir este funcionário pois ele consta como instrutor auditado em ${visitasCount} vistoria(s) de supervisão. Altere a situação para "Desligado".`,
    };
  }

  const { data: funcionario, error: fetchError } = await supabase
    .from("funcionarios")
    .select("objeto_id")
    .eq("id", id)
    .single();

  if (fetchError || !funcionario) {
    return { success: false, error: "Funcionário não encontrado." };
  }

  const { error: deleteError } = await supabase
    .from("funcionarios")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/admin/funcionarios");
  revalidatePath(`/admin/objetos/${funcionario.objeto_id}`);
  return { success: true };
}
