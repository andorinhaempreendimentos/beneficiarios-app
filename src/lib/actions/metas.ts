"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  objetoMetaSchema,
  apuracaoDeclaratoriaSchema,
  type ObjetoMetaInput,
  type ApuracaoDeclaratoriaInput,
  type TipoApuracaoMeta,
} from "@/lib/validations/fase-8";

export interface MetaMroscItem {
  id: string;
  objeto_id: string;
  numero_meta: number;
  descricao: string;
  unidade_medida: string;
  quantidade_prevista: number;
  fonte_verificacao: string;
  tipo_apuracao: TipoApuracaoMeta;
  quantidade_realizada: number;
  quantidade_declarada: number;
  justificativa_declarada: string | null;
  anexos_urls: string[];
  percentual: number;
  situacao: "cumprida" | "parcial" | "pendente";
}

export interface EstatisticasSistema {
  totalLocais: number;
  totalBeneficiarios: number;
  frequenciaMedia: number;
  sessoesRealizadas: number;
  supervisoesRealizadas: number;
  vulnerabilidadeSocial: number;
}

export interface PainelMetasMroscData {
  objeto: {
    id: string;
    nome: string;
    termo_local: string;
    termo_instrutor: string;
    termo_grupo: string;
    termo_beneficiario: string;
  } | null;
  indicadores: {
    totalMetas: number;
    metasCumpridas: number;
    metasParciais: number;
    metasPendentes: number;
    indiceGeralExecucao: number;
  };
  metas: MetaMroscItem[];
  estatisticasSistema: EstatisticasSistema;
}

/**
 * 1. Obter catálogo e apuração completa das metas do Plano de Trabalho MROSC (§3.11)
 */
export async function getMetasMroscData(
  objetoIdFiltro?: string,
  dataInicio?: string,
  dataFim?: string
): Promise<PainelMetasMroscData> {
  const supabase = await createClient();

  // 1. Identificar Objeto
  let objetoId = objetoIdFiltro;
  if (!objetoId) {
    const { data: primeiroObj } = await supabase
      .from("objetos")
      .select("id")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (primeiroObj) objetoId = primeiroObj.id;
  }

  if (!objetoId) {
    return {
      objeto: null,
      indicadores: {
        totalMetas: 0,
        metasCumpridas: 0,
        metasParciais: 0,
        metasPendentes: 0,
        indiceGeralExecucao: 0,
      },
      metas: [],
      estatisticasSistema: {
        totalLocais: 0,
        totalBeneficiarios: 0,
        frequenciaMedia: 0,
        sessoesRealizadas: 0,
        supervisoesRealizadas: 0,
        vulnerabilidadeSocial: 0,
      },
    };
  }

  // 2. Metadados e Vocabulário do Objeto
  const { data: obj } = await supabase
    .from("objetos")
    .select("id, nome, termo_local, termo_instrutor, termo_grupo, termo_beneficiario")
    .eq("id", objetoId)
    .single();

  // 3. Engine de Apuração Automatizada: Coletar métricas operacionais reais
  // A. Total de Locais Ativos
  const { count: countLocais } = await supabase
    .from("locais")
    .select("id", { count: "exact", head: true })
    .eq("objeto_id", objetoId)
    .eq("ativo", true);

  const totalLocais = countLocais ?? 0;

  // B. Total de Beneficiários com Matrícula Ativa
  const { count: countMatriculas } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("objeto_id", objetoId)
    .eq("status", "ativa");

  const totalBeneficiarios = countMatriculas ?? 0;

  // C. Vulnerabilidade Social (% de matriculados com cota social)
  const { count: countVulneraveis } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("objeto_id", objetoId)
    .eq("status", "ativa")
    .eq("vulneravel", true);

  const vulnerabilidadeSocial =
    totalBeneficiarios > 0
      ? Math.round(((countVulneraveis ?? 0) / totalBeneficiarios) * 100 * 10) / 10
      : 0;

  // D. Sessões Concluídas com Evidências Probatórias
  let sessoesQuery = supabase
    .from("sessoes")
    .select("id", { count: "exact", head: true })
    .eq("objeto_id", objetoId)
    .eq("status", "concluida");

  if (dataInicio) sessoesQuery = sessoesQuery.gte("data", dataInicio);
  if (dataFim) sessoesQuery = sessoesQuery.lte("data", dataFim);

  const { count: countSessoes } = await sessoesQuery;
  const sessoesRealizadas = countSessoes ?? 0;

  // E. Supervisões de Campo Concluídas
  let supervisoesQuery = supabase
    .from("visitas_supervisao")
    .select("id", { count: "exact", head: true })
    .eq("objeto_id", objetoId)
    .eq("status", "concluida");

  if (dataInicio) supervisoesQuery = supervisoesQuery.gte("data", dataInicio);
  if (dataFim) supervisoesQuery = supervisoesQuery.lte("data", dataFim);

  const { count: countSupervisoes } = await supervisoesQuery;
  const supervisoesRealizadas = countSupervisoes ?? 0;

  // F. Frequência Média nas Chamadas Nominais
  // Busca todas as sessões do objeto para filtrar presenças
  let sessoesIdsQuery = supabase
    .from("sessoes")
    .select("id")
    .eq("objeto_id", objetoId)
    .eq("status", "concluida");

  if (dataInicio) sessoesIdsQuery = sessoesIdsQuery.gte("data", dataInicio);
  if (dataFim) sessoesIdsQuery = sessoesIdsQuery.lte("data", dataFim);

  const { data: sessoesIdsRaw } = await sessoesIdsQuery;
  const sessoesIds = (sessoesIdsRaw ?? []).map((s) => s.id);

  let frequenciaMedia = 0;
  if (sessoesIds.length > 0) {
    const { data: presencasRaw } = await supabase
      .from("beneficiarios_presencas")
      .select("status")
      .in("sessao_id", sessoesIds);

    const totalChamadas = presencasRaw?.length ?? 0;
    const totalPresentes = (presencasRaw ?? []).filter((p) => p.status === "presente").length;

    if (totalChamadas > 0) {
      frequenciaMedia = Math.round((totalPresentes / totalChamadas) * 100 * 10) / 10;
    }
  }

  const estatisticasSistema: EstatisticasSistema = {
    totalLocais,
    totalBeneficiarios,
    frequenciaMedia,
    sessoesRealizadas,
    supervisoesRealizadas,
    vulnerabilidadeSocial,
  };

  // 4. Buscar Catálogo de Metas do Objeto
  const { data: metasRaw } = await supabase
    .from("objeto_metas")
    .select("*")
    .eq("objeto_id", objetoId)
    .order("numero_meta", { ascending: true });

  const metasLista = metasRaw ?? [];

  // 5. Cruzar cada meta com seu respectivo mecanismo de apuração
  let somaPercentuais = 0;
  let metasCumpridasCount = 0;
  let metasParciaisCount = 0;
  let metasPendentesCount = 0;

  const metas: MetaMroscItem[] = metasLista.map((meta) => {
    const tipo = (meta.tipo_apuracao as TipoApuracaoMeta) || "manual";
    const qtdPrevista = Number(meta.quantidade_prevista) || 0;
    const qtdDeclarada = Number(meta.quantidade_declarada) || 0;

    let quantidadeRealizada = 0;

    switch (tipo) {
      case "total_locais":
        quantidadeRealizada = totalLocais;
        break;
      case "total_beneficiarios":
        quantidadeRealizada = totalBeneficiarios;
        break;
      case "frequencia_media":
        quantidadeRealizada = frequenciaMedia;
        break;
      case "sessoes_realizadas":
        quantidadeRealizada = sessoesRealizadas;
        break;
      case "supervisoes_realizadas":
        quantidadeRealizada = supervisoesRealizadas;
        break;
      case "vulnerabilidade_social":
        quantidadeRealizada = vulnerabilidadeSocial;
        break;
      case "manual":
      default:
        quantidadeRealizada = qtdDeclarada;
        break;
    }

    // Percentual de atingimento da meta
    const percentual =
      qtdPrevista > 0
        ? Math.round((quantidadeRealizada / qtdPrevista) * 100 * 10) / 10
        : 0;

    // Classificação Canônica (§3.11):
    // >= 100% -> Cumprida; 1% a 99% -> Parcial; 0% -> Pendente
    let situacao: "cumprida" | "parcial" | "pendente" = "pendente";
    if (percentual >= 100) {
      situacao = "cumprida";
      metasCumpridasCount++;
    } else if (percentual > 0) {
      situacao = "parcial";
      metasParciaisCount++;
    } else {
      situacao = "pendente";
      metasPendentesCount++;
    }

    // Para o índice geral, capamos cada meta em no máximo 100% para não distorcer a média contratual
    somaPercentuais += Math.min(percentual, 100);

    return {
      id: meta.id,
      objeto_id: meta.objeto_id,
      numero_meta: meta.numero_meta,
      descricao: meta.descricao,
      unidade_medida: meta.unidade_medida,
      quantidade_prevista: qtdPrevista,
      fonte_verificacao: meta.fonte_verificacao,
      tipo_apuracao: tipo,
      quantidade_realizada: quantidadeRealizada,
      quantidade_declarada: qtdDeclarada,
      justificativa_declarada: meta.justificativa_declarada,
      anexos_urls: Array.isArray(meta.anexos_urls) ? (meta.anexos_urls as string[]) : [],
      percentual,
      situacao,
    };
  });

  const totalMetas = metas.length;
  const indiceGeralExecucao =
    totalMetas > 0 ? Math.round((somaPercentuais / totalMetas) * 10) / 10 : 0;

  return {
    objeto: obj
      ? {
          id: obj.id,
          nome: obj.nome,
          termo_local: obj.termo_local || "Polo",
          termo_instrutor: obj.termo_instrutor || "Professor",
          termo_grupo: obj.termo_grupo || "Turma",
          termo_beneficiario: obj.termo_beneficiario || "Aluno",
        }
      : null,
    indicadores: {
      totalMetas,
      metasCumpridas: metasCumpridasCount,
      metasParciais: metasParciaisCount,
      metasPendentes: metasPendentesCount,
      indiceGeralExecucao,
    },
    metas,
    estatisticasSistema,
  };
}

/**
 * 2. Salvar Meta no Plano de Trabalho do Objeto (Criar ou Atualizar)
 */
export async function salvarObjetoMeta(input: ObjetoMetaInput) {
  const supabase = await createClient();

  const parsed = objetoMetaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { id, ...dados } = parsed.data;

  if (id) {
    // Atualizar meta existente
    const { error } = await supabase
      .from("objeto_metas")
      .update({
        ...dados,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Inserir nova meta
    const { error } = await supabase.from("objeto_metas").insert(dados);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/metas");
  revalidatePath("/relatorios");
  return { success: true };
}

/**
 * 3. Excluir Meta do Plano de Trabalho
 */
export async function excluirObjetoMeta(metaId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("objeto_metas").delete().eq("id", metaId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/metas");
  revalidatePath("/relatorios");
  return { success: true };
}

/**
 * 4. Registrar Apuração Declaratória / Manual (Ações Externas - §3.11)
 * Nunca bloqueia por ausência de anexos (atas e fotos 100% facultativas).
 */
export async function registrarApuracaoDeclaratoria(input: ApuracaoDeclaratoriaInput) {
  const supabase = await createClient();

  const parsed = apuracaoDeclaratoriaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { error } = await supabase
    .from("objeto_metas")
    .update({
      quantidade_declarada: parsed.data.quantidade_declarada,
      justificativa_declarada: parsed.data.justificativa_declarada,
      anexos_urls: parsed.data.anexos_urls || [],
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", parsed.data.meta_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/metas");
  revalidatePath("/relatorios");
  return { success: true };
}

/**
 * 5. Upload de Anexo/Ata Probatória Facultativa no bucket 'metas-anexos'
 */
export async function uploadAnexoMeta(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("arquivo") as File | null;
  if (!file) {
    return { success: false, error: "Nenhum arquivo enviado." };
  }

  // Limite de 15MB
  if (file.size > 15 * 1024 * 1024) {
    return { success: false, error: "O arquivo não pode ultrapassar 15MB." };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `anexos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("metas-anexos")
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("metas-anexos").getPublicUrl(filePath);

  return { success: true, url: publicUrl, nomeArquivo: file.name };
}
