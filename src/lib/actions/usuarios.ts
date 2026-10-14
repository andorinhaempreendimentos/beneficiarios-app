"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { usuarioSchema, type UsuarioInput } from "@/lib/validations/admin";

export interface UsuarioComDetalhes {
  id: string;
  nome_completo: string | null;
  email: string | null;
  papel: string;
  ativo: boolean;
  criado_em: string | null;
  acessos: { id: string; objeto_id: string; objeto_nome: string }[];
  funcionario: { id: string; nome_completo: string; cargo: string } | null;
}

export async function getUsuariosAdmin(objetoId?: string, papel?: string) {
  const supabase = await createClient();

  // 1. Buscar todos os usuários através da view com e-mail
  let query = supabase
    .from("usuarios_com_email")
    .select("*")
    .order("criado_em", { ascending: false });

  if (papel && papel !== "todos") {
    query = query.eq("papel", papel);
  }

  const { data: users, error: usersError } = await query;

  if (usersError) {
    throw new Error(`Erro ao buscar usuários: ${usersError.message}`);
  }

  // 2. Buscar acessos escopados a projetos
  const { data: acessos, error: acessosError } = await supabase
    .from("usuario_acessos")
    .select(`
      id,
      usuario_id,
      objeto_id,
      objeto:objetos(id, nome)
    `);

  if (acessosError) {
    throw new Error(`Erro ao buscar acessos de projetos: ${acessosError.message}`);
  }

  // 3. Buscar funcionários vinculados
  const { data: funcionarios, error: funcError } = await supabase
    .from("funcionarios")
    .select("id, nome_completo, cargo, usuario_id");

  if (funcError) {
    throw new Error(`Erro ao buscar vínculos com funcionários: ${funcError.message}`);
  }

  // Agrupar acessos por usuário
  const acessosMap: Record<
    string,
    { id: string; objeto_id: string; objeto_nome: string }[]
  > = {};

  for (const ac of acessos ?? []) {
    const list = acessosMap[ac.usuario_id] ?? [];
    const objeto = ac.objeto as unknown as { id: string; nome: string } | null;
    list.push({
      id: ac.id,
      objeto_id: ac.objeto_id,
      objeto_nome: objeto?.nome ?? "Projeto não informado",
    });
    acessosMap[ac.usuario_id] = list;
  }

  // Mapear funcionário por usuário
  const funcMap: Record<
    string,
    { id: string; nome_completo: string; cargo: string }
  > = {};

  for (const f of funcionarios ?? []) {
    if (f.usuario_id) {
      funcMap[f.usuario_id] = {
        id: f.id,
        nome_completo: f.nome_completo,
        cargo: f.cargo,
      };
    }
  }

  // Montar lista completa
  let resultado: UsuarioComDetalhes[] = (users ?? []).map((u) => ({
    id: u.id,
    nome_completo: u.nome_completo,
    email: u.email,
    papel: u.papel,
    ativo: u.ativo,
    criado_em: u.criado_em,
    acessos: acessosMap[u.id] ?? [],
    funcionario: funcMap[u.id] ?? null,
  }));

  // Filtrar por projeto se especificado
  if (objetoId && objetoId !== "todos") {
    resultado = resultado.filter(
      (u) =>
        u.papel === "super_admin" ||
        u.papel === "admin_geral" ||
        u.acessos.some((a) => a.objeto_id === objetoId)
    );
  }

  return resultado;
}

export async function createUsuario(input: UsuarioInput) {
  const supabase = await createClient();

  const parsed = usuarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  if (!parsed.data.senha || parsed.data.senha.length < 6) {
    return {
      success: false,
      error: "Defina uma senha com no mínimo 6 caracteres para o novo usuário.",
    };
  }

  // 1. Criar usuário em Supabase Auth
  // O trigger public.on_auth_user_created insere automaticamente em public.usuarios
  // O trigger public.auto_confirm_user_email confirma o e-mail imediatamente
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.senha,
    options: {
      data: {
        nome_completo: parsed.data.nome_completo,
        papel: parsed.data.papel,
      },
    },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message ?? "Falha ao criar usuário de autenticação.",
    };
  }

  const userId = authData.user.id;

  // 2. Garantir que os dados em public.usuarios refletem o ativo configurado
  await supabase
    .from("usuarios")
    .update({
      ativo: parsed.data.ativo,
      papel: parsed.data.papel,
      nome_completo: parsed.data.nome_completo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", userId);

  // 3. Inserir acessos escopados a projetos (§4.2)
  if (parsed.data.objetos_ids && parsed.data.objetos_ids.length > 0) {
    const acessosParaInserir = parsed.data.objetos_ids.map((objId) => ({
      usuario_id: userId,
      objeto_id: objId,
      perfil: parsed.data.papel,
    }));

    await supabase.from("usuario_acessos").insert(acessosParaInserir);
  }

  // 4. Vincular funcionário se especificado (§3.2 e §4.1)
  if (parsed.data.funcionario_id) {
    await supabase
      .from("funcionarios")
      .update({ usuario_id: userId, atualizado_em: new Date().toISOString() })
      .eq("id", parsed.data.funcionario_id);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/funcionarios");
  return { success: true, userId };
}

export async function updateUsuario(id: string, input: UsuarioInput) {
  const supabase = await createClient();

  const parsed = usuarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // 1. Atualizar dados no perfil público
  const { error: userError } = await supabase
    .from("usuarios")
    .update({
      nome_completo: parsed.data.nome_completo,
      papel: parsed.data.papel,
      ativo: parsed.data.ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (userError) {
    return { success: false, error: userError.message };
  }

  // 2. Redefinir senha se fornecida
  if (parsed.data.senha && parsed.data.senha.trim().length >= 6) {
    const { error: pwError } = await supabase.rpc("admin_redefinir_senha", {
      p_user_id: id,
      p_nova_senha: parsed.data.senha.trim(),
    });

    if (pwError) {
      return {
        success: false,
        error: `Erro ao atualizar senha: ${pwError.message}`,
      };
    }
  }

  // 3. Sincronizar escopo de projetos (usuario_acessos)
  await supabase.from("usuario_acessos").delete().eq("usuario_id", id);

  if (parsed.data.objetos_ids && parsed.data.objetos_ids.length > 0) {
    const acessosParaInserir = parsed.data.objetos_ids.map((objId) => ({
      usuario_id: id,
      objeto_id: objId,
      perfil: parsed.data.papel,
    }));

    await supabase.from("usuario_acessos").insert(acessosParaInserir);
  }

  // 4. Sincronizar vínculo com funcionário
  // Desvincula outros que apontavam para este usuário
  await supabase
    .from("funcionarios")
    .update({ usuario_id: null, atualizado_em: new Date().toISOString() })
    .eq("usuario_id", id);

  if (parsed.data.funcionario_id) {
    await supabase
      .from("funcionarios")
      .update({ usuario_id: id, atualizado_em: new Date().toISOString() })
      .eq("id", parsed.data.funcionario_id);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/funcionarios");
  return { success: true };
}

export async function toggleUsuarioAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser && currentUser.id === id) {
    return {
      success: false,
      error: "Você não pode desativar seu próprio usuário de login.",
    };
  }

  const { error } = await supabase
    .from("usuarios")
    .update({
      ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function deleteUsuario(id: string) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser && currentUser.id === id) {
    return {
      success: false,
      error: "Você não pode excluir seu próprio usuário de login.",
    };
  }

  // Desvincular de funcionários
  await supabase
    .from("funcionarios")
    .update({ usuario_id: null, atualizado_em: new Date().toISOString() })
    .eq("usuario_id", id);

  // Excluir de usuarios (dispara cascade em usuario_acessos)
  const { error } = await supabase.from("usuarios").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/funcionarios");
  return { success: true };
}
