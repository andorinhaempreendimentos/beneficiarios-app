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

  const { modalidades_ids, metas, ...objetoFields } = parsed.data;

  // 1. Insere o Objeto (Projeto)
  const { data: objeto, error: objetoError } = await supabase
    .from("objetos")
    .insert({
      ...objetoFields,
      organizacao_id: objetoFields.organizacao_id || null,
      concedente_id: objetoFields.concedente_id || null,
      modalidade_principal_id: objetoFields.modalidade_principal_id || null,
      uf: objetoFields.uf || null,
      municipio: objetoFields.municipio || null,
      processo_administrativo: objetoFields.processo_administrativo || null,
      edital_chamamento: objetoFields.edital_chamamento || null,
      termo_parceria_numero: objetoFields.termo_parceria_numero || null,
      representante_legal_nome: objetoFields.representante_legal_nome || null,
      representante_legal_cargo: objetoFields.representante_legal_cargo || null,
      descricao: objetoFields.descricao || null,
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

  // 3. Persistência em lote das modalidades vinculadas na Aba 3
  if (modalidades_ids && modalidades_ids.length > 0) {
    const modalidadesPayload = modalidades_ids.map((modalidade_id) => ({
      objeto_id: objeto.id,
      modalidade_id,
      ativo: true,
    }));

    const { error: modError } = await supabase
      .from("objeto_modalidades")
      .insert(modalidadesPayload);

    if (modError) {
      console.error("Erro ao vincular modalidades ao objeto:", modError.message);
    }
  }

  // 4. Persistência em lote do quadro de metas pactuadas na Aba 4 (MROSC)
  if (metas && metas.length > 0) {
    const metasPayload = metas.map((m) => ({
      objeto_id: objeto.id,
      numero_meta: m.numero_meta,
      descricao: m.descricao,
      tipo_apuracao: m.tipo_apuracao,
      quantidade_prevista: m.quantidade_prevista,
      unidade_medida: m.unidade_medida,
      fonte_verificacao: m.fonte_verificacao,
    }));

    const { error: metasError } = await supabase
      .from("objeto_metas")
      .insert(metasPayload);

    if (metasError) {
      console.error("Erro ao cadastrar metas do objeto:", metasError.message);
    }
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

  const { modalidades_ids, metas, ...objetoFields } = parsed.data;

  const { error } = await supabase
    .from("objetos")
    .update({
      ...objetoFields,
      organizacao_id: objetoFields.organizacao_id || null,
      concedente_id: objetoFields.concedente_id || null,
      modalidade_principal_id: objetoFields.modalidade_principal_id || null,
      uf: objetoFields.uf || null,
      municipio: objetoFields.municipio || null,
      processo_administrativo: objetoFields.processo_administrativo || null,
      edital_chamamento: objetoFields.edital_chamamento || null,
      termo_parceria_numero: objetoFields.termo_parceria_numero || null,
      representante_legal_nome: objetoFields.representante_legal_nome || null,
      representante_legal_cargo: objetoFields.representante_legal_cargo || null,
      descricao: objetoFields.descricao || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Sincronização incremental de modalidades recém-adicionadas
  if (modalidades_ids && modalidades_ids.length > 0) {
    const { data: existingMods } = await supabase
      .from("objeto_modalidades")
      .select("modalidade_id")
      .eq("objeto_id", id);

    const existingIds = (existingMods ?? []).map((m) => m.modalidade_id);
    const novasModalidades = modalidades_ids
      .filter((modId) => !existingIds.includes(modId))
      .map((modId) => ({
        objeto_id: id,
        modalidade_id: modId,
        ativo: true,
      }));

    if (novasModalidades.length > 0) {
      await supabase.from("objeto_modalidades").insert(novasModalidades);
    }
  }

  // Sincronização incremental de metas adicionadas
  if (metas && metas.length > 0) {
    const novasMetas = metas.filter((m) => !m.id);
    if (novasMetas.length > 0) {
      const payloadNovas = novasMetas.map((m) => ({
        objeto_id: id,
        numero_meta: m.numero_meta,
        descricao: m.descricao,
        tipo_apuracao: m.tipo_apuracao,
        quantidade_prevista: m.quantidade_prevista,
        unidade_medida: m.unidade_medida,
        fonte_verificacao: m.fonte_verificacao,
      }));
      await supabase.from("objeto_metas").insert(payloadNovas);
    }
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
