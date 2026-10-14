"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/database.types";
import {
  autoinscricaoPublicaSchema,
  type AutoinscricaoPublicaInput,
} from "@/lib/validations/fase-2";
import type { PerguntaInscricaoItem } from "@/lib/actions/perguntas-inscricao";

export interface BlocoPublico {
  id: string;
  dia_semana: number | null;
  hora_inicio: string;
  hora_fim: string;
  data_especifica: string | null;
}

export interface GrupoPublico {
  id: string;
  nome: string;
  faixa_etaria_min: number;
  faixa_etaria_max: number;
  vagas: number;
  modalidade_nome: string;
  total_ativas: number;
  total_fila: number;
  vagas_disponiveis: number;
  blocos: BlocoPublico[];
}

export interface DadosPublicosLocal {
  local: {
    id: string;
    nome: string;
    slug: string | null;
    endereco_logradouro: string | null;
    endereco_numero: string | null;
    endereco_bairro: string | null;
    endereco_cidade: string | null;
    endereco_uf: string | null;
    endereco_cep: string | null;
  };
  objeto: {
    id: string;
    nome: string;
    termo_beneficiario: string;
    termo_grupo: string;
    termo_local: string;
    termo_instrutor: string;
    termo_sessao: string;
  };
  grupos: GrupoPublico[];
  perguntas: PerguntaInscricaoItem[];
}

export interface DadosPublicosGrupo {
  grupo: GrupoPublico;
  local: DadosPublicosLocal["local"];
  objeto: DadosPublicosLocal["objeto"];
  perguntas: PerguntaInscricaoItem[];
}

interface RawContagemVagas {
  grupo_id: string;
  total_ativas: number;
  total_fila: number;
}

interface RawBlocoComGrupos {
  id: string;
  dia_semana: number | null;
  hora_inicio: string;
  hora_fim: string;
  data_especifica: string | null;
  bloco_grupos: Array<{ grupo_id: string }>;
}

export async function getDadosPublicosLocal(
  slugOuId: string
): Promise<DadosPublicosLocal | null> {
  const supabase = await createClient();

  // 1. Buscar local por slug ou ID
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      slugOuId
    );

  let localQuery = supabase
    .from("locais")
    .select("id, nome, slug, objeto_id, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, ativo");

  if (isUuid) {
    localQuery = localQuery.eq("id", slugOuId);
  } else {
    localQuery = localQuery.eq("slug", slugOuId);
  }

  const { data: localData, error: localError } = await localQuery.maybeSingle();

  if (localError || !localData || !localData.ativo) {
    return null;
  }

  // 2. Buscar objeto e termos
  const { data: objetoData, error: objetoError } = await supabase
    .from("objetos")
    .select("id, nome, termo_beneficiario, termo_grupo, termo_local, termo_instrutor, termo_sessao")
    .eq("id", localData.objeto_id)
    .single();

  if (objetoError || !objetoData) {
    return null;
  }

  // 3. Buscar grupos do local
  const { data: gruposData, error: gruposError } = await supabase
    .from("grupos")
    .select(`
      id,
      nome,
      idade_minima,
      idade_maxima,
      capacidade_maxima,
      modalidades (nome)
    `)
    .eq("local_id", localData.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (gruposError) {
    throw new Error(`Erro ao buscar grupos: ${gruposError.message}`);
  }

  const gruposIds = (gruposData || []).map((g) => g.id);

  // 4. Buscar vagas ocupadas via RPC
  const contagensMap = new Map<string, { ativas: number; fila: number }>();
  if (gruposIds.length > 0) {
    const { data: contagensData } = await supabase.rpc(
      "obter_contagem_vagas_grupos",
      { p_grupo_ids: gruposIds }
    );

    const contagens = (contagensData || []) as unknown as RawContagemVagas[];
    for (const c of contagens) {
      contagensMap.set(c.grupo_id, {
        ativas: Number(c.total_ativas) || 0,
        fila: Number(c.total_fila) || 0,
      });
    }
  }

  // 5. Buscar blocos de horários vinculados aos grupos
  const blocosPorGrupo = new Map<string, BlocoPublico[]>();
  if (gruposIds.length > 0) {
    const { data: blocosData } = await supabase
      .from("blocos")
      .select(`
        id,
        dia_semana,
        hora_inicio,
        hora_fim,
        data_especifica,
        bloco_grupos (grupo_id)
      `)
      .eq("local_id", localData.id)
      .eq("ativo", true);

    const blocosComGrupos = (blocosData || []) as unknown as RawBlocoComGrupos[];
    for (const b of blocosComGrupos) {
      for (const bg of b.bloco_grupos || []) {
        const list = blocosPorGrupo.get(bg.grupo_id) || [];
        list.push({
          id: b.id,
          dia_semana: b.dia_semana,
          hora_inicio: b.hora_inicio,
          hora_fim: b.hora_fim,
          data_especifica: b.data_especifica,
        });
        blocosPorGrupo.set(bg.grupo_id, list);
      }
    }
  }

  const gruposFormatados: GrupoPublico[] = (gruposData || []).map((g) => {
    const contagem = contagensMap.get(g.id) || { ativas: 0, fila: 0 };
    const vagasDisponiveis = Math.max(0, g.capacidade_maxima - contagem.ativas);
    const modNome = g.modalidades ? (g.modalidades as { nome: string }).nome : "";

    return {
      id: g.id,
      nome: g.nome,
      faixa_etaria_min: g.idade_minima ?? 0,
      faixa_etaria_max: g.idade_maxima ?? 99,
      vagas: g.capacidade_maxima,
      modalidade_nome: modNome,
      total_ativas: contagem.ativas,
      total_fila: contagem.fila,
      vagas_disponiveis: vagasDisponiveis,
      blocos: blocosPorGrupo.get(g.id) || [],
    };
  });

  // 6. Buscar perguntas customizadas públicas
  const { data: perguntasData } = await supabase
    .from("objeto_perguntas_inscricao")
    .select("*")
    .eq("objeto_id", objetoData.id)
    .eq("exibir_autoinscricao", true)
    .order("ordem", { ascending: true });

  const perguntasFormatadas: PerguntaInscricaoItem[] = (perguntasData || []).map(
    (p) => {
      let parsedOpcoes: string[] = [];
      if (Array.isArray(p.opcoes)) {
        parsedOpcoes = (p.opcoes as unknown[]).map((o) => String(o));
      }

      return {
        id: p.id,
        objeto_id: p.objeto_id,
        titulo: p.titulo,
        tipo: p.tipo as PerguntaInscricaoItem["tipo"],
        opcoes: parsedOpcoes,
        obrigatorio: Boolean(p.obrigatorio),
        exibir_autoinscricao: Boolean(p.exibir_autoinscricao),
        ordem: p.ordem,
        criado_em: p.criado_em,
      };
    }
  );

  return {
    local: {
      id: localData.id,
      nome: localData.nome,
      slug: localData.slug,
      endereco_logradouro: localData.endereco_logradouro,
      endereco_numero: localData.endereco_numero,
      endereco_bairro: localData.endereco_bairro,
      endereco_cidade: localData.endereco_cidade,
      endereco_uf: localData.endereco_uf,
      endereco_cep: localData.endereco_cep,
    },
    objeto: {
      id: objetoData.id,
      nome: objetoData.nome,
      termo_beneficiario: objetoData.termo_beneficiario,
      termo_grupo: objetoData.termo_grupo,
      termo_local: objetoData.termo_local,
      termo_instrutor: objetoData.termo_instrutor,
      termo_sessao: objetoData.termo_sessao,
    },
    grupos: gruposFormatados,
    perguntas: perguntasFormatadas,
  };
}

export async function getDadosPublicosGrupo(
  grupoId: string
): Promise<DadosPublicosGrupo | null> {
  const supabase = await createClient();

  const { data: grupoData, error: grupoError } = await supabase
    .from("grupos")
    .select(`
      id,
      nome,
      local_id,
      objeto_id,
      idade_minima,
      idade_maxima,
      capacidade_maxima,
      ativo,
      modalidades (nome),
      locais (
        id,
        nome,
        slug,
        endereco_logradouro,
        endereco_numero,
        endereco_bairro,
        endereco_cidade,
        endereco_uf,
        endereco_cep,
        ativo
      ),
      objetos (
        id,
        nome,
        termo_beneficiario,
        termo_grupo,
        termo_local,
        termo_instrutor,
        termo_sessao
      )
    `)
    .eq("id", grupoId)
    .single();

  if (grupoError || !grupoData || !grupoData.ativo) {
    return null;
  }

  const local = grupoData.locais as unknown as DadosPublicosLocal["local"] & { ativo: boolean };
  const objeto = grupoData.objetos as unknown as DadosPublicosLocal["objeto"];

  if (!local || !local.ativo || !objeto) {
    return null;
  }

  // Vagas via RPC
  let totalAtivas = 0;
  let totalFila = 0;
  const { data: contagensData } = await supabase.rpc(
    "obter_contagem_vagas_grupos",
    { p_grupo_ids: [grupoId] }
  );

  const contagens = (contagensData || []) as unknown as RawContagemVagas[];
  if (contagens.length > 0) {
    totalAtivas = Number(contagens[0].total_ativas) || 0;
    totalFila = Number(contagens[0].total_fila) || 0;
  }

  // Blocos do grupo
  const { data: blocosData } = await supabase
    .from("blocos")
    .select(`
      id,
      dia_semana,
      hora_inicio,
      hora_fim,
      data_especifica,
      bloco_grupos!inner (grupo_id)
    `)
    .eq("bloco_grupos.grupo_id", grupoId)
    .eq("ativo", true);

  const blocosFormatados: BlocoPublico[] = (blocosData || []).map((b) => ({
    id: b.id,
    dia_semana: b.dia_semana,
    hora_inicio: b.hora_inicio,
    hora_fim: b.hora_fim,
    data_especifica: b.data_especifica,
  }));

  // Perguntas customizadas públicas do objeto
  const { data: perguntasData } = await supabase
    .from("objeto_perguntas_inscricao")
    .select("*")
    .eq("objeto_id", objeto.id)
    .eq("exibir_autoinscricao", true)
    .order("ordem", { ascending: true });

  const perguntasFormatadas: PerguntaInscricaoItem[] = (perguntasData || []).map(
    (p) => {
      let parsedOpcoes: string[] = [];
      if (Array.isArray(p.opcoes)) {
        parsedOpcoes = (p.opcoes as unknown[]).map((o) => String(o));
      }

      return {
        id: p.id,
        objeto_id: p.objeto_id,
        titulo: p.titulo,
        tipo: p.tipo as PerguntaInscricaoItem["tipo"],
        opcoes: parsedOpcoes,
        obrigatorio: Boolean(p.obrigatorio),
        exibir_autoinscricao: Boolean(p.exibir_autoinscricao),
        ordem: p.ordem,
        criado_em: p.criado_em,
      };
    }
  );

  const modNome = grupoData.modalidades
    ? (grupoData.modalidades as { nome: string }).nome
    : "";

  return {
    grupo: {
      id: grupoData.id,
      nome: grupoData.nome,
      faixa_etaria_min: grupoData.idade_minima ?? 0,
      faixa_etaria_max: grupoData.idade_maxima ?? 99,
      vagas: grupoData.capacidade_maxima,
      modalidade_nome: modNome,
      total_ativas: totalAtivas,
      total_fila: totalFila,
      vagas_disponiveis: Math.max(0, grupoData.capacidade_maxima - totalAtivas),
      blocos: blocosFormatados,
    },
    local: {
      id: local.id,
      nome: local.nome,
      slug: local.slug,
      endereco_logradouro: local.endereco_logradouro,
      endereco_numero: local.endereco_numero,
      endereco_bairro: local.endereco_bairro,
      endereco_cidade: local.endereco_cidade,
      endereco_uf: local.endereco_uf,
      endereco_cep: local.endereco_cep,
    },
    objeto,
    perguntas: perguntasFormatadas,
  };
}

export interface BeneficiarioPreenchimento {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  genero: "M" | "F" | "Outro" | "Nao_informado";
  telefone: string | null;
  nome_responsavel: string | null;
  telefone_responsavel: string | null;
}

export async function buscarBeneficiarioPublicoCpf(
  cpf: string
): Promise<BeneficiarioPreenchimento | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("buscar_beneficiario_por_cpf", {
    p_cpf: cpf,
  });

  if (error || !data) {
    return null;
  }

  return data as unknown as BeneficiarioPreenchimento;
}

export interface ResultadoAutoinscricao {
  success: boolean;
  error?: string;
  matricula_id?: string;
  beneficiario_id?: string;
  status?: "ativa" | "fila_espera";
  posicao_fila?: number;
  grupo_nome?: string;
  vagas_restantes?: number;
}

export async function submeterAutoinscricao(
  input: AutoinscricaoPublicaInput
): Promise<ResultadoAutoinscricao> {
  const validated = autoinscricaoPublicaSchema.safeParse(input);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Dados de inscrição inválidos",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("submeter_autoinscricao", {
      p_dados: validated.data as unknown as Json,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Erro ao processar inscrição",
      };
    }

    const res = data as unknown as {
      success: boolean;
      matricula_id: string;
      beneficiario_id: string;
      status: "ativa" | "fila_espera";
      posicao_fila: number;
      grupo_nome: string;
      vagas_restantes: number;
    };

    revalidatePath("/matriculas");
    revalidatePath(`/grupos/${validated.data.grupo_id}`);

    return {
      success: true,
      matricula_id: res.matricula_id,
      beneficiario_id: res.beneficiario_id,
      status: res.status,
      posicao_fila: res.posicao_fila,
      grupo_nome: res.grupo_nome,
      vagas_restantes: res.vagas_restantes,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Erro inesperado ao realizar inscrição";
    return { success: false, error: msg };
  }
}
