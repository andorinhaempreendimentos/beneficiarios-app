"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  configuracaoSistemaSchema,
  type ConfiguracaoSistemaInput,
} from "@/lib/validations/fase-9";

export interface ConfiguracaoSistemaData {
  id: string;
  razao_social: string;
  cnpj: string;
  logotipo_url: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  telefone_suporte: string | null;
  email_suporte: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
}

/**
 * 1. Obter configurações globais da empresa gestora da plataforma (§3.13)
 * Leitura liberada para usuários autenticados (branding nos relatórios e layouts).
 */
export async function getConfiguracoesSistema(): Promise<ConfiguracaoSistemaData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracoes_sistema")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar configurações globais do sistema: ${error.message}`);
  }

  return data as ConfiguracaoSistemaData | null;
}

/**
 * 2. Salvar configurações globais da empresa gestora (§3.13)
 * Edição restrita exclusivamente ao Super Administrador.
 */
export async function saveConfiguracoesSistema(
  input: ConfiguracaoSistemaInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verifica se o usuário atual é super_admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuário não autenticado no sistema." };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (usuario?.papel !== "super_admin") {
    return {
      success: false,
      error: "Apenas Super Administradores possuem autorização para alterar configurações globais do sistema.",
    };
  }

  const parsed = configuracaoSistemaSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const existing = await getConfiguracoesSistema();

  if (existing) {
    const { error } = await supabase
      .from("configuracoes_sistema")
      .update({
        razao_social: parsed.data.razao_social,
        cnpj: parsed.data.cnpj,
        logotipo_url: parsed.data.logotipo_url || null,
        logradouro: parsed.data.logradouro || null,
        numero: parsed.data.numero || null,
        bairro: parsed.data.bairro || null,
        cidade: parsed.data.cidade || null,
        uf: parsed.data.uf || null,
        cep: parsed.data.cep || null,
        telefone_suporte: parsed.data.telefone_suporte || null,
        email_suporte: parsed.data.email_suporte || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("configuracoes_sistema")
      .insert({
        razao_social: parsed.data.razao_social,
        cnpj: parsed.data.cnpj,
        logotipo_url: parsed.data.logotipo_url || null,
        logradouro: parsed.data.logradouro || null,
        numero: parsed.data.numero || null,
        bairro: parsed.data.bairro || null,
        cidade: parsed.data.cidade || null,
        uf: parsed.data.uf || null,
        cep: parsed.data.cep || null,
        telefone_suporte: parsed.data.telefone_suporte || null,
        email_suporte: parsed.data.email_suporte || null,
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/admin/configuracoes");
  revalidatePath("/configuracoes/sistema");
  return { success: true };
}
