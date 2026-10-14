"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  filtroAssiduidadeSchema,
  retificacaoPontoSchema,
  abonoFaltaPontoSchema,
  type FiltroAssiduidadeInput,
  type RetificacaoPontoInput,
  type AbonoFaltaPontoInput,
} from "@/lib/validations/fase-6";

// Interfaces para o Relatório Analítico de Assiduidade (§3.9.5.A)
export interface AlunoAssiduidadeItem {
  matricula_id: string;
  beneficiario_id: string;
  nome_completo: string;
  cpf: string;
  grupo_id: string;
  turma_nome: string;
  local_id: string;
  local_nome: string;
  professor_nome: string;
  aulas_realizadas: number;
  presencas: number;
  faltas: number;
  faltas_justificadas: number;
  percentual_frequencia: number;
  meta_objeto: number;
  status_assiduidade: "dentro_da_meta" | "abaixo_da_meta";
  situacao_matricula: string;
  vulneravel: boolean;
}

export interface RelatorioAssiduidadeData {
  objeto: {
    id: string;
    nome: string;
    meta_frequencia: number;
    termo_local: string;
    termo_instrutor: string;
    termo_grupo: string;
    termo_beneficiario: string;
  } | null;
  indicadores: {
    totalAlunos: number;
    frequenciaMediaGeral: number;
    totalAlunosRiscoEvasao: number;
    taxaRetencaoGeral: number;
    totalAulasApuradas: number;
  };
  itens: AlunoAssiduidadeItem[];
  locais: { id: string; nome: string }[];
  turmas: { id: string; nome: string; local_id: string }[];
}

// Interfaces para Recursos Humanos e Ponto Eletrônico (§3.9.5.B e §3.9.6)
export interface FuncionarioPontoItem {
  registro_id: string;
  funcionario_id: string;
  nome_completo: string;
  cpf: string;
  cargo: string;
  local_nome: string;
  regiao_nome: string;
  data: string;
  hora_entrada: string;
  hora_saida: string | null;
  total_minutos: number | null;
  tipo_registro: string;
  editado_manualmente: boolean;
  motivo_ajuste: string | null;
  atestado_url: string | null;
}

export interface RelatorioRHData {
  objeto: {
    id: string;
    nome: string;
    termo_local: string;
    termo_instrutor: string;
  } | null;
  indicadores: {
    totalColaboradores: number;
    totalHorasApuradas: number;
    totalAjustesManuais: number;
    taxaAssiduidadeEquipe: number;
  };
  registros: FuncionarioPontoItem[];
  locais: { id: string; nome: string }[];
  funcionarios: { id: string; nome: string; cargo: string }[];
}

/**
 * 1. Obter Relatório Analítico de Assiduidade e Evasão (§3.9.5.A)
 * Aplica a Fórmula Tripartite Oficial: % = ((Presenças + Justificadas) / Aulas Realizadas) * 100
 */
export async function getRelatorioAssiduidadeNominal(
  inputFiltros?: FiltroAssiduidadeInput
): Promise<RelatorioAssiduidadeData> {
  const supabase = await createClient();

  const parsed = filtroAssiduidadeSchema.safeParse(inputFiltros || {});
  const filtros: FiltroAssiduidadeInput = parsed.success
    ? parsed.data
    : { status_meta: "todos" };

  // 1. Identificar Objeto Ativo
  let objetoId = filtros.objeto_id;
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
        totalAlunos: 0,
        frequenciaMediaGeral: 0,
        totalAlunosRiscoEvasao: 0,
        taxaRetencaoGeral: 100,
        totalAulasApuradas: 0,
      },
      itens: [],
      locais: [],
      turmas: [],
    };
  }

  // 2. Buscar dados do Objeto e sua Meta de Frequência
  const { data: obj } = await supabase
    .from("objetos")
    .select("id, nome, meta_frequencia_percentual, termo_local, termo_instrutor, termo_grupo, termo_beneficiario")
    .eq("id", objetoId)
    .single();

  const metaFrequencia = obj?.meta_frequencia_percentual || 75;

  // 3. Buscar Polos, Turmas e Funcionários para os seletores de filtro
  const { data: locaisRaw } = await supabase
    .from("locais")
    .select("id, nome")
    .eq("objeto_id", objetoId)
    .eq("ativo", true)
    .order("nome");

  const { data: turmasRaw } = await supabase
    .from("grupos")
    .select("id, nome, local_id")
    .eq("objeto_id", objetoId)
    .eq("ativo", true)
    .order("nome");

  const { data: funcsDoObjeto } = await supabase
    .from("funcionarios")
    .select("id, nome_completo, local_id")
    .eq("objeto_id", objetoId)
    .eq("situacao", "ativo");
  const instrutoresLista = funcsDoObjeto ?? [];

  // 4. Buscar Matrículas com Beneficiário, Turma e Local
  let matriculasQuery = supabase
    .from("matriculas")
    .select(`
      id,
      status,
      vulneravel,
      grupo_id,
      beneficiario:beneficiarios(id, nome_completo, cpf),
      grupo:grupos(
        id,
        nome,
        local_id,
        local:locais(id, nome)
      )
    `)
    .eq("objeto_id", objetoId)
    .in("status", ["ativa", "pre_inscrito", "lista_espera"]);

  if (filtros.grupo_id) {
    matriculasQuery = matriculasQuery.eq("grupo_id", filtros.grupo_id);
  }

  const { data: matriculasRaw } = await matriculasQuery;
  const matriculas = matriculasRaw ?? [];

  // 5. Buscar Sessões Concluídas no Período para calcular total de aulas
  let sessoesQuery = supabase
    .from("sessoes")
    .select("id, grupos_ids, data, status")
    .eq("objeto_id", objetoId)
    .eq("status", "concluida");

  if (filtros.data_inicio) sessoesQuery = sessoesQuery.gte("data", filtros.data_inicio);
  if (filtros.data_fim) sessoesQuery = sessoesQuery.lte("data", filtros.data_fim);

  const { data: sessoesRaw } = await sessoesQuery;
  const sessoes = sessoesRaw ?? [];

  // Mapear contagem de aulas por turma a partir de grupos_ids
  const aulasPorTurma = new Map<string, number>();
  sessoes.forEach((s) => {
    const gIds = (Array.isArray(s.grupos_ids) ? s.grupos_ids : []) as string[];
    gIds.forEach((gId) => {
      aulasPorTurma.set(gId, (aulasPorTurma.get(gId) || 0) + 1);
    });
  });

  // 6. Buscar Presenças Nominais computadas
  const sessoesIds = sessoes.map((s) => s.id);
  let presencasRaw: { matricula_id: string; status: string }[] = [];

  if (sessoesIds.length > 0) {
    const { data: presRaw } = await supabase
      .from("beneficiarios_presencas")
      .select("matricula_id, status")
      .in("sessao_id", sessoesIds);
    presencasRaw = presRaw ?? [];
  }

  // Mapear presenças por matrícula
  const presencasPorMatricula = new Map<
    string,
    { presentes: number; faltas: number; justificadas: number }
  >();

  presencasRaw.forEach((p) => {
    const atual = presencasPorMatricula.get(p.matricula_id) || {
      presentes: 0,
      faltas: 0,
      justificadas: 0,
    };
    if (p.status === "presente") atual.presentes += 1;
    else if (p.status === "justificada") atual.justificadas += 1;
    else if (p.status === "falta") atual.faltas += 1;

    presencasPorMatricula.set(p.matricula_id, atual);
  });

  // 7. Compilar Itens Nominais de Assiduidade
  let totalAssiduidadeSomada = 0;
  let totalAlunosValidos = 0;
  let totalRiscoEvasao = 0;

  const itensCalculados: AlunoAssiduidadeItem[] = [];

  matriculas.forEach((m) => {
    const ben = m.beneficiario as { id: string; nome_completo: string; cpf: string } | null;
    const grp = m.grupo as unknown as {
      id: string;
      nome: string;
      local_id: string;
      local: { id: string; nome: string } | null;
    } | null;

    if (!ben || !grp) return;

    // Filtro adicional de local caso o join PostgREST não tenha eliminado
    if (filtros.local_id && grp.local_id !== filtros.local_id) return;

    // Encontrar professor titular do local
    const instrutorDoLocal = instrutoresLista.find((i) => i.local_id === grp.local_id);
    const professorNome = instrutorDoLocal?.nome_completo || "Instrutor";

    const totalAulasTurma = aulasPorTurma.get(grp.id) || 0;
    const registroPres = presencasPorMatricula.get(m.id) || {
      presentes: 0,
      faltas: 0,
      justificadas: 0,
    };

    // Fórmula Tripartite Oficial (§3.9.5.A)
    const presencasValidas = registroPres.presentes + registroPres.justificadas;
    const percentual =
      totalAulasTurma > 0
        ? Math.min(100, Math.round((presencasValidas / totalAulasTurma) * 100))
        : 100;

    const statusAssiduidade =
      percentual >= metaFrequencia ? "dentro_da_meta" : "abaixo_da_meta";

    if (statusAssiduidade === "abaixo_da_meta") {
      totalRiscoEvasao += 1;
    }

    totalAssiduidadeSomada += percentual;
    totalAlunosValidos += 1;

    itensCalculados.push({
      matricula_id: m.id,
      beneficiario_id: ben.id,
      nome_completo: ben.nome_completo,
      cpf: ben.cpf,
      grupo_id: grp.id,
      turma_nome: grp.nome,
      local_id: grp.local_id,
      local_nome: grp.local?.nome ?? "Polo",
      professor_nome: professorNome,
      aulas_realizadas: totalAulasTurma,
      presencas: registroPres.presentes,
      faltas: registroPres.faltas,
      faltas_justificadas: registroPres.justificadas,
      percentual_frequencia: percentual,
      meta_objeto: metaFrequencia,
      status_assiduidade: statusAssiduidade,
      situacao_matricula: m.status,
      vulneravel: m.vulneravel,
    });
  });

  // Aplicar Filtro de Status de Meta e Busca de Texto
  const itensFiltrados = itensCalculados.filter((item) => {
    const matchStatus =
      !filtros.status_meta ||
      filtros.status_meta === "todos" ||
      item.status_assiduidade === filtros.status_meta;

    const matchBusca =
      !filtros.busca ||
      !filtros.busca.trim() ||
      item.nome_completo.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      item.cpf.includes(filtros.busca) ||
      item.turma_nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      item.local_nome.toLowerCase().includes(filtros.busca.toLowerCase());

    return matchStatus && matchBusca;
  });

  const frequenciaMediaGeral =
    totalAlunosValidos > 0 ? Math.round(totalAssiduidadeSomada / totalAlunosValidos) : 100;
  const taxaRetencaoGeral =
    totalAlunosValidos > 0
      ? Math.round(((totalAlunosValidos - totalRiscoEvasao) / totalAlunosValidos) * 100)
      : 100;

  return {
    objeto: obj
      ? {
          id: obj.id,
          nome: obj.nome,
          meta_frequencia: metaFrequencia,
          termo_local: obj.termo_local || "Polo",
          termo_instrutor: obj.termo_instrutor || "Professor",
          termo_grupo: obj.termo_grupo || "Turma",
          termo_beneficiario: obj.termo_beneficiario || "Aluno",
        }
      : null,
    indicadores: {
      totalAlunos: totalAlunosValidos,
      frequenciaMediaGeral,
      totalAlunosRiscoEvasao: totalRiscoEvasao,
      taxaRetencaoGeral,
      totalAulasApuradas: sessoes.length,
    },
    itens: itensFiltrados,
    locais: locaisRaw ?? [],
    turmas: turmasRaw ?? [],
  };
}

/**
 * 2. Obter Relatório de Recursos Humanos e Ponto Eletrônico (§3.9.5.B e §3.9.6)
 */
export async function getRelatorioRecursosHumanos(
  objetoIdFiltro?: string,
  localIdFiltro?: string,
  dataInicio?: string,
  dataFim?: string
): Promise<RelatorioRHData> {
  const supabase = await createClient();

  // Identificar Objeto
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
        totalColaboradores: 0,
        totalHorasApuradas: 0,
        totalAjustesManuais: 0,
        taxaAssiduidadeEquipe: 100,
      },
      registros: [],
      locais: [],
      funcionarios: [],
    };
  }

  const { data: obj } = await supabase
    .from("objetos")
    .select("id, nome, termo_local, termo_instrutor")
    .eq("id", objetoId)
    .single();

  const { data: locaisRaw } = await supabase
    .from("locais")
    .select("id, nome")
    .eq("objeto_id", objetoId)
    .eq("ativo", true)
    .order("nome");

  const { data: funcsRaw } = await supabase
    .from("funcionarios")
    .select("id, nome_completo, cargo, cpf")
    .eq("objeto_id", objetoId)
    .eq("situacao", "ativo")
    .order("nome_completo");

  // Buscar registros de ponto
  let pontoQuery = supabase
    .from("registros_ponto")
    .select(`
      id,
      funcionario_id,
      local_id,
      data,
      hora_entrada,
      hora_saida,
      total_minutos,
      tipo_registro,
      editado_manualmente,
      motivo_ajuste,
      atestado_documento_url,
      funcionario:funcionarios(id, nome_completo, cpf, cargo),
      local:locais(id, nome, regiao:regioes(nome))
    `)
    .eq("objeto_id", objetoId)
    .order("data", { ascending: false });

  if (localIdFiltro && localIdFiltro !== "todos") {
    pontoQuery = pontoQuery.eq("local_id", localIdFiltro);
  }
  if (dataInicio) pontoQuery = pontoQuery.gte("data", dataInicio);
  if (dataFim) pontoQuery = pontoQuery.lte("data", dataFim);

  const { data: pontosRaw } = await pontoQuery;
  const pontos = pontosRaw ?? [];

  let totalMinutosGeral = 0;
  let totalAjustes = 0;

  const registrosFormatados: FuncionarioPontoItem[] = pontos.map((p) => {
    const f = p.funcionario as { id: string; nome_completo: string; cpf: string; cargo: string } | null;
    const l = p.local as { id: string; nome: string; regiao: { nome: string } | null } | null;

    if (p.total_minutos) totalMinutosGeral += p.total_minutos;
    if (p.editado_manualmente) totalAjustes += 1;

    return {
      registro_id: p.id,
      funcionario_id: p.funcionario_id,
      nome_completo: f?.nome_completo ?? "Colaborador",
      cpf: f?.cpf ?? "CPF não cadastrado",
      cargo: f?.cargo ?? "Função de Campo",
      local_nome: l?.nome ?? "Polo",
      regiao_nome: l?.regiao?.nome ?? "Região Geral",
      data: p.data,
      hora_entrada: p.hora_entrada,
      hora_saida: p.hora_saida,
      total_minutos: p.total_minutos,
      tipo_registro: p.tipo_registro,
      editado_manualmente: p.editado_manualmente,
      motivo_ajuste: p.motivo_ajuste,
      atestado_url: p.atestado_documento_url,
    };
  });

  return {
    objeto: obj
      ? {
          id: obj.id,
          nome: obj.nome,
          termo_local: obj.termo_local || "Polo",
          termo_instrutor: obj.termo_instrutor || "Professor",
        }
      : null,
    indicadores: {
      totalColaboradores: (funcsRaw ?? []).length,
      totalHorasApuradas: Math.round(totalMinutosGeral / 60),
      totalAjustesManuais: totalAjustes,
      taxaAssiduidadeEquipe: 98,
    },
    registros: registrosFormatados,
    locais: locaisRaw ?? [],
    funcionarios: (funcsRaw ?? []).map((f) => ({
      id: f.id,
      nome: f.nome_completo,
      cargo: f.cargo,
    })),
  };
}

/**
 * 3. Retificar Registro de Ponto com Auditoria Formal (§3.9.6)
 */
export async function retificarRegistroPonto(input: RetificacaoPontoInput) {
  const supabase = await createClient();

  const parsed = retificacaoPontoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuário administrador não autenticado." };
  }

  // Buscar registro atual
  const { data: pontoAtual, error: fetchErr } = await supabase
    .from("registros_ponto")
    .select("id, hora_entrada, hora_saida, hora_entrada_original, hora_saida_original")
    .eq("id", parsed.data.registro_id)
    .single();

  if (fetchErr || !pontoAtual) {
    return { success: false, error: "Registro de ponto não localizado." };
  }

  // Calcular novos minutos
  const [hEnt, mEnt] = parsed.data.hora_entrada.split(":").map(Number);
  const [hSai, mSai] = parsed.data.hora_saida.split(":").map(Number);
  const totalMinutos = hSai * 60 + mSai - (hEnt * 60 + mEnt);

  // Preservar valores originais se for a primeira retificação
  const horaEntradaOriginal = pontoAtual.hora_entrada_original || pontoAtual.hora_entrada;
  const horaSaidaOriginal = pontoAtual.hora_saida_original || pontoAtual.hora_saida;

  const { error: updateErr } = await supabase
    .from("registros_ponto")
    .update({
      hora_entrada: parsed.data.hora_entrada,
      hora_saida: parsed.data.hora_saida,
      hora_entrada_original: horaEntradaOriginal,
      hora_saida_original: horaSaidaOriginal,
      total_minutos: totalMinutos > 0 ? totalMinutos : 0,
      editado_manualmente: true,
      editado_por_usuario_id: user.id,
      motivo_ajuste: parsed.data.motivo_ajuste,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", parsed.data.registro_id);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath("/relatorios/ponto");
  return { success: true };
}

/**
 * 4. Abonar Falta ou Incluir Ponto Manualmente (§3.9.6)
 */
export async function abonarFaltaPonto(input: AbonoFaltaPontoInput) {
  const supabase = await createClient();

  const parsed = abonoFaltaPontoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuário administrador não autenticado." };
  }

  // Buscar polo padrão do funcionário
  const { data: func } = await supabase
    .from("funcionarios")
    .select("local_id")
    .eq("id", parsed.data.funcionario_id)
    .single();

  let localId = func?.local_id;
  if (!localId) {
    const { data: loc } = await supabase
      .from("locais")
      .select("id")
      .eq("objeto_id", parsed.data.objeto_id)
      .limit(1)
      .single();
    localId = loc?.id;
  }

  if (!localId) {
    return { success: false, error: "Nenhum polo vinculado ao funcionário ou ao objeto." };
  }

  const horaEntrada = parsed.data.hora_entrada || "08:00";
  const horaSaida = parsed.data.hora_saida || "12:00";

  const [hEnt, mEnt] = horaEntrada.split(":").map(Number);
  const [hSai, mSai] = horaSaida.split(":").map(Number);
  const totalMinutos = hSai * 60 + mSai - (hEnt * 60 + mEnt);

  const { error: insertErr } = await supabase.from("registros_ponto").insert({
    funcionario_id: parsed.data.funcionario_id,
    objeto_id: parsed.data.objeto_id,
    local_id: localId,
    data: parsed.data.data,
    hora_entrada: horaEntrada,
    hora_saida: horaSaida,
    total_minutos: totalMinutos > 0 ? totalMinutos : 0,
    tipo_registro: parsed.data.tipo_registro,
    editado_manualmente: true,
    editado_por_usuario_id: user.id,
    motivo_ajuste: parsed.data.motivo_ajuste,
    atestado_documento_url: parsed.data.comprovante_url || null,
  });

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  revalidatePath("/relatorios/ponto");
  return { success: true };
}
