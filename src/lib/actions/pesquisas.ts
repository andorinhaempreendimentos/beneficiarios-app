"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  pesquisaSchema,
  perguntaPesquisaSchema,
  categoriaCampoSchema,
  submissaoPesquisaSchema,
  type PesquisaInput,
  type PerguntaPesquisaInput,
  type CategoriaCampoInput,
  type SubmissaoPesquisaInput,
  type TipoPerguntaPesquisa,
} from "@/lib/validations/fase-9";

export interface PesquisaResumoItem {
  id: string;
  objeto_id: string;
  local_id: string | null;
  grupo_id: string | null;
  titulo: string;
  descricao: string | null;
  token: string;
  publicada: boolean;
  exigir_cpf: boolean;
  criado_em: string;
  local_nome?: string | null;
  grupo_nome?: string | null;
  total_perguntas: number;
  total_respostas: number;
  satisfacao_media: number; // Média de 1 a 5 das perguntas de escala
}

export interface PesquisaPublicaData {
  pesquisa: {
    id: string;
    objeto_id: string;
    titulo: string;
    descricao: string | null;
    token: string;
    publicada: boolean;
    exigir_cpf: boolean;
  };
  objeto: {
    id: string;
    nome: string;
    termo_beneficiario: string;
    termo_local: string;
    termo_grupo: string;
  };
  local?: {
    id: string;
    nome: string;
  } | null;
  grupo?: {
    id: string;
    nome: string;
  } | null;
  categorias: Array<{
    id: string;
    nome: string;
    ordem: number;
  }>;
  perguntas: Array<{
    id: string;
    categoria_id: string | null;
    texto: string;
    tipo: TipoPerguntaPesquisa;
    opcoes: string[];
    min_selecoes: number | null;
    max_selecoes: number | null;
    obrigatoria: boolean;
    ordem: number;
    condicao_pergunta_id: string | null;
    condicao_valor: any;
  }>;
}

export interface PesquisaAnaliticaData {
  pesquisa: PesquisaResumoItem;
  objeto: {
    id: string;
    nome: string;
    termo_beneficiario: string;
    termo_local: string;
    termo_grupo: string;
  };
  categorias: Array<{
    id: string;
    nome: string;
    ordem: number;
    media_satisfacao: number;
  }>;
  perguntas: Array<{
    id: string;
    categoria_id: string | null;
    texto: string;
    tipo: TipoPerguntaPesquisa;
    opcoes: string[];
    ordem: number;
    total_respostas: number;
    media_nota?: number;
    distribuicao_opcoes?: Record<string, number>;
  }>;
  respostas_recentes: Array<{
    id: string;
    criado_em: string;
    beneficiario_nome?: string | null;
    device_fingerprint?: string | null;
    itens: Record<string, any>;
  }>;
}

/**
 * 1. Obter lista de pesquisas do objeto ativo (§3.14)
 */
export async function getPesquisas(objetoIdFiltro?: string): Promise<{
  objeto: {
    id: string;
    nome: string;
    termo_beneficiario: string;
    termo_local: string;
    termo_grupo: string;
  } | null;
  pesquisas: PesquisaResumoItem[];
}> {
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
    return { objeto: null, pesquisas: [] };
  }

  // 2. Metadados do Objeto
  const { data: obj } = await supabase
    .from("objetos")
    .select("id, nome, termo_beneficiario, termo_local, termo_grupo")
    .eq("id", objetoId)
    .single();

  // 3. Buscar Pesquisas
  const { data: listaPesquisas, error } = await supabase
    .from("pesquisas")
    .select(`
      id,
      objeto_id,
      local_id,
      grupo_id,
      titulo,
      descricao,
      token,
      publicada,
      exigir_cpf,
      criado_em,
      locais:local_id(nome),
      grupos:grupo_id(nome)
    `)
    .eq("objeto_id", objetoId)
    .order("criado_em", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar pesquisas: ${error.message}`);
  }

  // 4. Buscar estatísticas agregadas de perguntas e respostas
  const pesquisasComStats: PesquisaResumoItem[] = [];

  for (const p of listaPesquisas || []) {
    // Total de perguntas
    const { count: totalPerguntas } = await supabase
      .from("perguntas_pesquisa")
      .select("*", { count: "exact", head: true })
      .eq("pesquisa_id", p.id);

    // Total de respostas
    const { data: respostasData, count: totalRespostas } = await supabase
      .from("respostas")
      .select("id", { count: "exact" })
      .eq("pesquisa_id", p.id);

    // Média de satisfação para perguntas tipo 'escala'
    let satisfacaoMedia = 0;
    if (respostasData && respostasData.length > 0) {
      const respostaIds = respostasData.map((r) => r.id);

      // Buscar perguntas de escala da pesquisa
      const { data: perguntasEscala } = await supabase
        .from("perguntas_pesquisa")
        .select("id")
        .eq("pesquisa_id", p.id)
        .eq("tipo", "escala");

      if (perguntasEscala && perguntasEscala.length > 0) {
        const perguntaIds = perguntasEscala.map((pe) => pe.id);

        const { data: itensEscala } = await supabase
          .from("resposta_itens")
          .select("valor")
          .in("resposta_id", respostaIds)
          .in("pergunta_id", perguntaIds);

        if (itensEscala && itensEscala.length > 0) {
          const notasValidas = itensEscala
            .map((item) => Number(item.valor))
            .filter((n) => !isNaN(n) && n >= 1 && n <= 5);

          if (notasValidas.length > 0) {
            const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
            satisfacaoMedia = Number((soma / notasValidas.length).toFixed(1));
          }
        }
      }
    }

    const localData = p.locais as any;
    const grupoData = p.grupos as any;

    pesquisasComStats.push({
      id: p.id,
      objeto_id: p.objeto_id,
      local_id: p.local_id,
      grupo_id: p.grupo_id,
      titulo: p.titulo,
      descricao: p.descricao,
      token: p.token,
      publicada: p.publicada,
      exigir_cpf: p.exigir_cpf,
      criado_em: p.criado_em || new Date().toISOString(),
      local_nome: localData?.nome || null,
      grupo_nome: grupoData?.nome || null,
      total_perguntas: totalPerguntas || 0,
      total_respostas: totalRespostas || 0,
      satisfacao_media: satisfacaoMedia,
    });
  }

  return {
    objeto: obj || null,
    pesquisas: pesquisasComStats,
  };
}

/**
 * 2. Obter dados públicos da pesquisa por token para preenchimento (/r/[token])
 */
export async function getPesquisaPorToken(
  token: string
): Promise<PesquisaPublicaData | null> {
  const supabase = await createClient();

  const { data: pesquisa, error } = await supabase
    .from("pesquisas")
    .select(`
      id,
      objeto_id,
      local_id,
      grupo_id,
      titulo,
      descricao,
      token,
      publicada,
      exigir_cpf,
      locais:local_id(id, nome),
      grupos:grupo_id(id, nome),
      objetos:objeto_id(id, nome, termo_beneficiario, termo_local, termo_grupo)
    `)
    .eq("token", token)
    .maybeSingle();

  if (error || !pesquisa) {
    return null;
  }

  if (!pesquisa.publicada) {
    return null; // Pesquisa pausada / em rascunho
  }

  // Buscar categorias da pesquisa
  const { data: categorias } = await supabase
    .from("categorias_campo")
    .select("id, nome, ordem")
    .eq("pesquisa_id", pesquisa.id)
    .order("ordem", { ascending: true });

  // Buscar perguntas da pesquisa
  const { data: perguntas } = await supabase
    .from("perguntas_pesquisa")
    .select("*")
    .eq("pesquisa_id", pesquisa.id)
    .order("ordem", { ascending: true });

  const objData = pesquisa.objetos as any;
  const localData = pesquisa.locais as any;
  const grupoData = pesquisa.grupos as any;

  return {
    pesquisa: {
      id: pesquisa.id,
      objeto_id: pesquisa.objeto_id,
      titulo: pesquisa.titulo,
      descricao: pesquisa.descricao,
      token: pesquisa.token,
      publicada: pesquisa.publicada,
      exigir_cpf: pesquisa.exigir_cpf,
    },
    objeto: {
      id: objData?.id || pesquisa.objeto_id,
      nome: objData?.nome || "Projeto Social",
      termo_beneficiario: objData?.termo_beneficiario || "Beneficiário",
      termo_local: objData?.termo_local || "Polo",
      termo_grupo: objData?.termo_grupo || "Turma",
    },
    local: localData ? { id: localData.id, nome: localData.nome } : null,
    grupo: grupoData ? { id: grupoData.id, nome: grupoData.nome } : null,
    categorias: categorias || [],
    perguntas: (perguntas || []).map((perg) => ({
      id: perg.id,
      categoria_id: perg.categoria_id,
      texto: perg.texto,
      tipo: perg.tipo as TipoPerguntaPesquisa,
      opcoes: Array.isArray(perg.opcoes) ? (perg.opcoes as string[]) : [],
      min_selecoes: perg.min_selecoes,
      max_selecoes: perg.max_selecoes,
      obrigatoria: perg.obrigatoria,
      ordem: perg.ordem,
      condicao_pergunta_id: perg.condicao_pergunta_id,
      condicao_valor: perg.condicao_valor,
    })),
  };
}

/**
 * 3. Submeter Resposta com Proteção Anti-Fraude (§3.14 item 2)
 */
export async function submeterRespostaPesquisa(
  input: SubmissaoPesquisaInput
): Promise<{ success: boolean; error?: string; respostaId?: string }> {
  const parsed = submissaoPesquisaSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();

  // 1. Verificar pesquisa e status
  const { data: pesquisa, error: pError } = await supabase
    .from("pesquisas")
    .select("id, token, publicada, exigir_cpf, objeto_id")
    .eq("id", parsed.data.pesquisa_id)
    .single();

  if (pError || !pesquisa) {
    return { success: false, error: "Pesquisa não localizada." };
  }

  if (!pesquisa.publicada) {
    return { success: false, error: "Esta pesquisa não está aceitando respostas no momento." };
  }

  if (pesquisa.token !== parsed.data.token) {
    return { success: false, error: "Token de submissão inválido." };
  }

  // 2. Proteção Anti-Fraude: Device Fingerprint (§3.14 item 2)
  const { data: respostaDispositivo } = await supabase
    .from("respostas")
    .select("id")
    .eq("pesquisa_id", pesquisa.id)
    .eq("device_fingerprint", parsed.data.device_fingerprint)
    .maybeSingle();

  if (respostaDispositivo) {
    return {
      success: false,
      error: "Identificamos que este aparelho já registrou uma resposta para esta pesquisa. Apenas um voto por dispositivo é permitido.",
    };
  }

  // 3. Proteção Anti-Fraude: Validação de CPF e Unicidade de Voto
  let beneficiarioId: string | null = parsed.data.beneficiario_id || null;
  let matriculaId: string | null = parsed.data.matricula_id || null;

  if (pesquisa.exigir_cpf && !parsed.data.cpf) {
    return {
      success: false,
      error: "O fornecimento do CPF é obrigatório para participar desta pesquisa de satisfação.",
    };
  }

  if (parsed.data.cpf) {
    const cpfLimpo = parsed.data.cpf.replace(/\D/g, "");

    // Buscar se o beneficiário existe na base deste objeto
    const { data: bene } = await supabase
      .from("beneficiarios")
      .select("id, nome_completo")
      .eq("cpf", cpfLimpo)
      .maybeSingle();

    if (bene) {
      beneficiarioId = bene.id;

      // Buscar matrícula ativa
      const { data: mat } = await supabase
        .from("matriculas")
        .select("id")
        .eq("beneficiario_id", bene.id)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mat) matriculaId = mat.id;

      // Verificar se este beneficiário já respondeu a esta pesquisa
      const { data: respostaCpf } = await supabase
        .from("respostas")
        .select("id")
        .eq("pesquisa_id", pesquisa.id)
        .eq("beneficiario_id", bene.id)
        .maybeSingle();

      if (respostaCpf) {
        return {
          success: false,
          error: "O CPF informado já registrou uma resposta para esta pesquisa.",
        };
      }
    } else if (pesquisa.exigir_cpf) {
      // Se exige CPF e não encontrou no cadastro de beneficiários
      return {
        success: false,
        error: "CPF não localizado na relação de beneficiários deste projeto social.",
      };
    }
  }

  // 4. Inserir Cabeçalho da Resposta
  const { data: novaResposta, error: rError } = await supabase
    .from("respostas")
    .insert({
      pesquisa_id: pesquisa.id,
      beneficiario_id: beneficiarioId,
      matricula_id: matriculaId,
      device_fingerprint: parsed.data.device_fingerprint,
    })
    .select("id")
    .single();

  if (rError || !novaResposta) {
    return { success: false, error: `Falha ao registrar resposta: ${rError?.message}` };
  }

  // 5. Inserir Itens de Resposta
  const itensParaInserir = parsed.data.respostas.map((item) => ({
    resposta_id: novaResposta.id,
    pergunta_id: item.pergunta_id,
    valor: item.valor,
  }));

  const { error: itensError } = await supabase
    .from("resposta_itens")
    .insert(itensParaInserir);

  if (itensError) {
    // Reverter cabeçalho se houver erro
    await supabase.from("respostas").delete().eq("id", novaResposta.id);
    return { success: false, error: `Falha ao registrar itens da resposta: ${itensError.message}` };
  }

  revalidatePath(`/pesquisas`);
  return { success: true, respostaId: novaResposta.id };
}

/**
 * 4. Salvar ou Criar Campanha de Pesquisa
 */
export async function salvarPesquisa(
  input: PesquisaInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = pesquisaSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();

  const dados = {
    objeto_id: parsed.data.objeto_id,
    local_id: parsed.data.local_id || null,
    grupo_id: parsed.data.grupo_id || null,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    publicada: parsed.data.publicada,
    exigir_cpf: parsed.data.exigir_cpf,
    atualizado_em: new Date().toISOString(),
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("pesquisas")
      .update(dados)
      .eq("id", parsed.data.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/pesquisas");
    return { success: true, id: parsed.data.id };
  } else {
    const { data: inserida, error } = await supabase
      .from("pesquisas")
      .insert(dados)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/pesquisas");
    return { success: true, id: inserida.id };
  }
}

/**
 * 5. Excluir Pesquisa
 */
export async function excluirPesquisa(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Excluir perguntas associadas
  await supabase.from("perguntas_pesquisa").delete().eq("pesquisa_id", id);
  // Excluir categorias associadas
  await supabase.from("categorias_campo").delete().eq("pesquisa_id", id);
  // Excluir respostas associadas
  const { data: respostas } = await supabase
    .from("respostas")
    .select("id")
    .eq("pesquisa_id", id);

  if (respostas && respostas.length > 0) {
    const respIds = respostas.map((r) => r.id);
    await supabase.from("resposta_itens").delete().in("resposta_id", respIds);
    await supabase.from("respostas").delete().eq("pesquisa_id", id);
  }

  const { error } = await supabase.from("pesquisas").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/pesquisas");
  return { success: true };
}

/**
 * 6. Salvar Pergunta da Pesquisa
 */
export async function salvarPerguntaPesquisa(
  input: PerguntaPesquisaInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = perguntaPesquisaSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();

  const dados = {
    pesquisa_id: parsed.data.pesquisa_id,
    categoria_id: parsed.data.categoria_id || null,
    texto: parsed.data.texto,
    tipo: parsed.data.tipo,
    opcoes: parsed.data.opcoes || [],
    min_selecoes: parsed.data.min_selecoes || null,
    max_selecoes: parsed.data.max_selecoes || null,
    obrigatoria: parsed.data.obrigatoria,
    ordem: parsed.data.ordem,
    condicao_pergunta_id: parsed.data.condicao_pergunta_id || null,
    condicao_valor: parsed.data.condicao_valor || null,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("perguntas_pesquisa")
      .update(dados)
      .eq("id", parsed.data.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/pesquisas");
    return { success: true, id: parsed.data.id };
  } else {
    const { data: inserida, error } = await supabase
      .from("perguntas_pesquisa")
      .insert(dados)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/pesquisas");
    return { success: true, id: inserida.id };
  }
}

/**
 * 7. Excluir Pergunta da Pesquisa
 */
export async function excluirPerguntaPesquisa(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  await supabase.from("resposta_itens").delete().eq("pergunta_id", id);
  const { error } = await supabase.from("perguntas_pesquisa").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/pesquisas");
  return { success: true };
}

/**
 * 8. Salvar Categoria de Campo
 */
export async function salvarCategoriaCampo(
  input: CategoriaCampoInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = categoriaCampoSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();

  const dados = {
    pesquisa_id: parsed.data.pesquisa_id,
    nome: parsed.data.nome,
    ordem: parsed.data.ordem,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("categorias_campo")
      .update(dados)
      .eq("id", parsed.data.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/pesquisas");
    return { success: true, id: parsed.data.id };
  } else {
    const { data: inserida, error } = await supabase
      .from("categorias_campo")
      .insert(dados)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/pesquisas");
    return { success: true, id: inserida.id };
  }
}

/**
 * 9. Excluir Categoria de Campo
 */
export async function excluirCategoriaCampo(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  // Limpar vínculo das perguntas com essa categoria
  await supabase
    .from("perguntas_pesquisa")
    .update({ categoria_id: null })
    .eq("categoria_id", id);

  const { error } = await supabase.from("categorias_campo").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/pesquisas");
  return { success: true };
}

/**
 * 10. Obter dados analíticos detalhados de uma pesquisa (§3.14 item 4)
 */
export async function getPesquisaAnalitica(
  id: string
): Promise<PesquisaAnaliticaData | null> {
  const supabase = await createClient();

  const { data: p, error } = await supabase
    .from("pesquisas")
    .select(`
      id,
      objeto_id,
      local_id,
      grupo_id,
      titulo,
      descricao,
      token,
      publicada,
      exigir_cpf,
      criado_em,
      locais:local_id(nome),
      grupos:grupo_id(nome),
      objetos:objeto_id(id, nome, termo_beneficiario, termo_local, termo_grupo)
    `)
    .eq("id", id)
    .single();

  if (error || !p) return null;

  const { data: categorias } = await supabase
    .from("categorias_campo")
    .select("id, nome, ordem")
    .eq("pesquisa_id", id)
    .order("ordem", { ascending: true });

  const { data: perguntas } = await supabase
    .from("perguntas_pesquisa")
    .select("*")
    .eq("pesquisa_id", id)
    .order("ordem", { ascending: true });

  const { data: respostas } = await supabase
    .from("respostas")
    .select(`
      id,
      criado_em,
      device_fingerprint,
      beneficiarios:beneficiario_id(nome_completo)
    `)
    .eq("pesquisa_id", id)
    .order("criado_em", { ascending: false });

  const respostaIds = (respostas || []).map((r) => r.id);

  let itensMap: Record<string, Record<string, any>> = {};
  if (respostaIds.length > 0) {
    const { data: itens } = await supabase
      .from("resposta_itens")
      .select("resposta_id, pergunta_id, valor")
      .in("resposta_id", respostaIds);

    for (const item of itens || []) {
      if (!itensMap[item.resposta_id]) {
        itensMap[item.resposta_id] = {};
      }
      itensMap[item.resposta_id][item.pergunta_id] = item.valor;
    }
  }

  // Métricas por pergunta
  const perguntasAnaliticas = (perguntas || []).map((perg) => {
    let totalResp = 0;
    let somaNotas = 0;
    let qtdNotas = 0;
    let distOpcoes: Record<string, number> = {};

    for (const rId of respostaIds) {
      const val = itensMap[rId]?.[perg.id];
      if (val !== undefined && val !== null) {
        totalResp++;
        if (perg.tipo === "escala") {
          const num = Number(val);
          if (!isNaN(num)) {
            somaNotas += num;
            qtdNotas++;
          }
        } else if (perg.tipo === "multipla_escolha") {
          if (Array.isArray(val)) {
            for (const op of val) {
              distOpcoes[String(op)] = (distOpcoes[String(op)] || 0) + 1;
            }
          } else {
            distOpcoes[String(val)] = (distOpcoes[String(val)] || 0) + 1;
          }
        }
      }
    }

    return {
      id: perg.id,
      categoria_id: perg.categoria_id,
      texto: perg.texto,
      tipo: perg.tipo as TipoPerguntaPesquisa,
      opcoes: Array.isArray(perg.opcoes) ? (perg.opcoes as string[]) : [],
      ordem: perg.ordem,
      total_respostas: totalResp,
      media_nota: qtdNotas > 0 ? Number((somaNotas / qtdNotas).toFixed(1)) : undefined,
      distribuicao_opcoes: distOpcoes,
    };
  });

  // Métricas por categoria
  const categoriasAnaliticas = (categorias || []).map((cat) => {
    const perguntasCat = perguntasAnaliticas.filter((pe) => pe.categoria_id === cat.id && pe.tipo === "escala");
    let mediaCat = 0;
    if (perguntasCat.length > 0) {
      const mediasValidas = perguntasCat.filter((p) => p.media_nota !== undefined).map((p) => p.media_nota!);
      if (mediasValidas.length > 0) {
        mediaCat = Number((mediasValidas.reduce((a, b) => a + b, 0) / mediasValidas.length).toFixed(1));
      }
    }
    return {
      id: cat.id,
      nome: cat.nome,
      ordem: cat.ordem,
      media_satisfacao: mediaCat,
    };
  });

  const objData = p.objetos as any;
  const localData = p.locais as any;
  const grupoData = p.grupos as any;

  // Satisfação média geral
  const perguntasEscala = perguntasAnaliticas.filter((pe) => pe.tipo === "escala" && pe.media_nota !== undefined);
  let satisfacaoGeral = 0;
  if (perguntasEscala.length > 0) {
    const soma = perguntasEscala.reduce((a, b) => a + b.media_nota!, 0);
    satisfacaoGeral = Number((soma / perguntasEscala.length).toFixed(1));
  }

  return {
    pesquisa: {
      id: p.id,
      objeto_id: p.objeto_id,
      local_id: p.local_id,
      grupo_id: p.grupo_id,
      titulo: p.titulo,
      descricao: p.descricao,
      token: p.token,
      publicada: p.publicada,
      exigir_cpf: p.exigir_cpf,
      criado_em: p.criado_em || new Date().toISOString(),
      local_nome: localData?.nome || null,
      grupo_nome: grupoData?.nome || null,
      total_perguntas: perguntas?.length || 0,
      total_respostas: respostas?.length || 0,
      satisfacao_media: satisfacaoGeral,
    },
    objeto: {
      id: objData?.id || p.objeto_id,
      nome: objData?.nome || "Projeto Social",
      termo_beneficiario: objData?.termo_beneficiario || "Beneficiário",
      termo_local: objData?.termo_local || "Polo",
      termo_grupo: objData?.termo_grupo || "Turma",
    },
    categorias: categoriasAnaliticas,
    perguntas: perguntasAnaliticas,
    respostas_recentes: (respostas || []).slice(0, 50).map((r) => {
      const bData = r.beneficiarios as any;
      return {
        id: r.id,
        criado_em: r.criado_em || new Date().toISOString(),
        beneficiario_nome: bData?.nome_completo || null,
        device_fingerprint: r.device_fingerprint || null,
        itens: itensMap[r.id] || {},
      };
    }),
  };
}

/**
 * 11. Obter dados auxiliares para o painel de pesquisas (locais, grupos e total de alunos para taxa de conversão)
 */
export async function getAuxiliaresPesquisa(objetoId: string): Promise<{
  locais: Array<{ id: string; nome: string }>;
  grupos: Array<{ id: string; nome: string; local_id: string }>;
  totalAlunos: number;
}> {
  const supabase = await createClient();

  const { data: locais } = await supabase
    .from("locais")
    .select("id, nome")
    .eq("objeto_id", objetoId)
    .order("nome");

  const { data: grupos } = await supabase
    .from("grupos")
    .select("id, nome, local_id")
    .eq("objeto_id", objetoId)
    .order("nome");

  // Total de matrículas ativas no objeto
  const { count: totalAlunos } = await supabase
    .from("matriculas")
    .select("id, grupos!inner(objeto_id)", { count: "exact", head: true })
    .eq("grupos.objeto_id", objetoId)
    .eq("status", "ativa");

  return {
    locais: locais || [],
    grupos: (grupos || []).map((g) => ({ id: g.id, nome: g.nome, local_id: g.local_id || "" })),
    totalAlunos: totalAlunos || 0,
  };
}

/**
 * 12. Obter perguntas e categorias de uma pesquisa para edição no construtor
 */
export async function getPerguntasECategoriasPesquisa(pesquisaId: string) {
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias_campo")
    .select("*")
    .eq("pesquisa_id", pesquisaId)
    .order("ordem", { ascending: true });

  const { data: perguntas } = await supabase
    .from("perguntas_pesquisa")
    .select("*")
    .eq("pesquisa_id", pesquisaId)
    .order("ordem", { ascending: true });

  return {
    categorias: categorias || [],
    perguntas: (perguntas || []).map((p) => ({
      ...p,
      opcoes: Array.isArray(p.opcoes) ? (p.opcoes as string[]) : [],
    })),
  };
}

