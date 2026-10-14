"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/database.types";
import {
  perguntaInscricaoSchema,
  type PerguntaInscricaoInput,
} from "@/lib/validations/fase-2";

export interface PerguntaInscricaoItem {
  id: string;
  objeto_id: string;
  titulo: string;
  tipo:
    | "texto_curto"
    | "opcoes"
    | "sim_nao"
    | "numero"
    | "data"
    | "arquivo";
  opcoes: string[];
  obrigatorio: boolean;
  exibir_autoinscricao: boolean;
  ordem: number;
  criado_em: string | null;
}

interface RawPerguntaRow {
  id: string;
  objeto_id: string;
  titulo: string;
  tipo: string;
  opcoes: Json | null;
  obrigatorio: boolean;
  exibir_autoinscricao: boolean;
  ordem: number;
  criado_em: string | null;
}

export async function getPerguntasInscricao(
  objetoId: string
): Promise<PerguntaInscricaoItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objeto_perguntas_inscricao")
    .select("*")
    .eq("objeto_id", objetoId)
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar perguntas da inscrição: ${error.message}`);
  }

  const rows = (data || []) as unknown as RawPerguntaRow[];

  return rows.map((r) => {
    let parsedOpcoes: string[] = [];
    if (Array.isArray(r.opcoes)) {
      parsedOpcoes = r.opcoes.map((o) => String(o));
    }

    return {
      id: r.id,
      objeto_id: r.objeto_id,
      titulo: r.titulo,
      tipo: r.tipo as PerguntaInscricaoItem["tipo"],
      opcoes: parsedOpcoes,
      obrigatorio: Boolean(r.obrigatorio),
      exibir_autoinscricao: Boolean(r.exibir_autoinscricao),
      ordem: r.ordem,
      criado_em: r.criado_em,
    };
  });
}

export async function createPerguntaInscricao(input: PerguntaInscricaoInput) {
  const validated = perguntaInscricaoSchema.safeParse(input);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const supabase = await createClient();

  // Buscar última ordem
  const { data: ultimas } = await supabase
    .from("objeto_perguntas_inscricao")
    .select("ordem")
    .eq("objeto_id", validated.data.objeto_id)
    .order("ordem", { ascending: false })
    .limit(1);

  const proxOrdem = ultimas && ultimas.length > 0 ? (ultimas[0].ordem || 0) + 1 : 1;

  const opcoesJson = (validated.data.opcoes || []) as unknown as Json;

  const { data: inserted, error: insertError } = await supabase
    .from("objeto_perguntas_inscricao")
    .insert({
      objeto_id: validated.data.objeto_id,
      titulo: validated.data.titulo.trim(),
      tipo: validated.data.tipo,
      opcoes: opcoesJson,
      obrigatorio: validated.data.obrigatorio,
      exibir_autoinscricao: validated.data.exibir_autoinscricao,
      ordem: proxOrdem,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: `Erro ao criar pergunta: ${insertError.message}` };
  }

  revalidatePath(`/admin/objetos/${validated.data.objeto_id}`);
  revalidatePath(`/admin/objetos/${validated.data.objeto_id}/perguntas`);

  return { success: true, data: inserted };
}

export async function updatePerguntaInscricao(
  id: string,
  objetoId: string,
  input: Partial<PerguntaInscricaoInput>
) {
  const supabase = await createClient();

  const updatePayload: {
    titulo?: string;
    tipo?: string;
    opcoes?: Json;
    obrigatorio?: boolean;
    exibir_autoinscricao?: boolean;
    ordem?: number;
  } = {};

  if (input.titulo !== undefined) updatePayload.titulo = input.titulo.trim();
  if (input.tipo !== undefined) updatePayload.tipo = input.tipo;
  if (input.opcoes !== undefined) {
    updatePayload.opcoes = input.opcoes as unknown as Json;
  }
  if (input.obrigatorio !== undefined) updatePayload.obrigatorio = input.obrigatorio;
  if (input.exibir_autoinscricao !== undefined) {
    updatePayload.exibir_autoinscricao = input.exibir_autoinscricao;
  }
  if (input.ordem !== undefined) updatePayload.ordem = input.ordem;

  const { data, error } = await supabase
    .from("objeto_perguntas_inscricao")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: `Erro ao atualizar pergunta: ${error.message}` };
  }

  revalidatePath(`/admin/objetos/${objetoId}`);
  revalidatePath(`/admin/objetos/${objetoId}/perguntas`);

  return { success: true, data };
}

export async function reordenarPerguntasInscricao(
  objetoId: string,
  orderedIds: string[]
) {
  const supabase = await createClient();

  // Atualizar cada ordem
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("objeto_perguntas_inscricao")
      .update({ ordem: index + 1 })
      .eq("id", id)
  );

  await Promise.all(updates);

  revalidatePath(`/admin/objetos/${objetoId}`);
  revalidatePath(`/admin/objetos/${objetoId}/perguntas`);

  return { success: true };
}

export async function deletePerguntaInscricao(id: string, objetoId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("objeto_perguntas_inscricao")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: `Erro ao excluir pergunta: ${error.message}` };
  }

  revalidatePath(`/admin/objetos/${objetoId}`);
  revalidatePath(`/admin/objetos/${objetoId}/perguntas`);

  return { success: true };
}
