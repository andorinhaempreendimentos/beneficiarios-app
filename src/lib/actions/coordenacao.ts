"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  fecharCicloPeriodicoSchema,
  salvarRascunhoSinteseSchema,
  type FecharCicloPeriodicoInput,
  type SalvarRascunhoSinteseInput,
} from "@/lib/validations/fase-5";

export interface IndicadoresCoordenador {
  totalPolosAtivos: number;
  supervisoesConcluidasMes: number;
  inconformidadesAbertas: number;
  taxaConformidadeRegional: number;
  totalAlunosAtendidos: number;
}

export interface PoloRegionalItem {
  id: string;
  nome: string;
  bairro: string | null;
  total_turmas: number;
  total_alunos: number;
  ultima_supervisao_data: string | null;
  ultima_situacao: "Regular" | "Requer Atenção" | "Crítica" | null;
}

export interface OcorrenciaPendenteItem {
  visita_id: string;
  data_visita: string;
  local_id: string;
  local_nome: string;
  instrutor_nome: string;
  situacao: "Regular" | "Requer Atenção" | "Crítica";
  ocorrencias: string | null;
  providencias: string | null;
  prazo_regularizacao: string | null;
  dias_restantes: number | null;
  vencida: boolean;
}

export interface PainelCoordenadorData {
  coordenador: {
    id: string;
    nome: string;
  } | null;
  regioes: { id: string; nome: string; objeto_id: string; coordenador_id: string | null }[];
  regiaoAtiva: { id: string; nome: string; objeto_id: string; coordenador_id: string | null } | null;
  indicadores: IndicadoresCoordenador;
  polos: PoloRegionalItem[];
  ocorrencias: OcorrenciaPendenteItem[];
  relatoriosRecentes: {
    id: string;
    rotulo_periodo: string;
    status: string;
    fechado_em: string | null;
    versao: number;
  }[];
}

export async function getPainelCoordenadorData(
  regiaoIdFiltro?: string,
  objetoIdFiltro?: string
): Promise<PainelCoordenadorData> {
  const supabase = await createClient();

  // 1. Obter usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let coordenadorNome = "Coordenador Regional";
  if (user) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("nome_completo")
      .eq("id", user.id)
      .single();
    if (usuario?.nome_completo) coordenadorNome = usuario.nome_completo;
  }

  // 2. Buscar regiões disponíveis
  let regioesQuery = supabase.from("regioes").select("id, nome, objeto_id, coordenador_id").order("nome");
  if (objetoIdFiltro && objetoIdFiltro !== "todos") {
    regioesQuery = regioesQuery.eq("objeto_id", objetoIdFiltro);
  }
  const { data: regioesRaw } = await regioesQuery;
  const regioes = regioesRaw ?? [];

  // Região ativa: filtro selecionado ou a primeira da lista
  let regiaoAtiva =
    regioes.find((r) => r.id === regiaoIdFiltro) ||
    (regioes.length > 0 ? regioes[0] : null);

  // Se não existir nenhuma região, identificar se há objetos cadastrados
  if (!regiaoAtiva && objetoIdFiltro && objetoIdFiltro !== "todos") {
    regiaoAtiva = {
      id: "regiao-geral",
      nome: "Região Geral",
      objeto_id: objetoIdFiltro,
      coordenador_id: null,
    };
  }

  // 3. Buscar polos da região ativa (ou todos do objeto)
  let locaisQuery = supabase
    .from("locais")
    .select(`
      id,
      nome,
      endereco_bairro,
      regiao_id,
      ativo,
      grupos:grupos(
        id,
        matriculas:matriculas(id, status)
      )
    `)
    .eq("ativo", true)
    .order("nome");

  if (regiaoAtiva && regiaoAtiva.id !== "regiao-geral") {
    locaisQuery = locaisQuery.eq("regiao_id", regiaoAtiva.id);
  } else if (objetoIdFiltro && objetoIdFiltro !== "todos") {
    locaisQuery = locaisQuery.eq("objeto_id", objetoIdFiltro);
  }

  const { data: locaisRaw } = await locaisQuery;
  const locais = locaisRaw ?? [];
  const locaisIds = locais.map((l) => l.id);

  // 4. Buscar visitas de supervisão dos polos desta região
  let visitas: {
    id: string;
    data: string;
    hora_inicio: string;
    hora_fim: string | null;
    status: string;
    situacao: string;
    local_id: string;
    local: { nome: string } | null;
    instrutor: { nome_completo: string } | null;
    ocorrencias: string | null;
    providencias: string | null;
    prazo_regularizacao: string | null;
    qtd_beneficiarios_presentes: number;
  }[] = [];

  if (locaisIds.length > 0) {
    const { data: visitasRaw } = await supabase
      .from("visitas_supervisao")
      .select(`
        id,
        data,
        hora_inicio,
        hora_fim,
        status,
        situacao,
        local_id,
        local:locais(nome),
        instrutor:funcionarios(nome_completo),
        ocorrencias,
        providencias,
        prazo_regularizacao,
        qtd_beneficiarios_presentes
      `)
      .in("local_id", locaisIds)
      .order("data", { ascending: false });

    visitas = (visitasRaw ?? []).map((v) => ({
      ...v,
      local: v.local as { nome: string } | null,
      instrutor: v.instrutor as { nome_completo: string } | null,
    }));
  }

  // 5. Montar indicadores do ciclo atual (Mês corrente)
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0];
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split("T")[0];

  const visitasMes = visitas.filter((v) => v.data >= inicioMes && v.data <= fimMes && v.status === "concluida");
  const supervisoesConcluidasMes = visitasMes.length;

  const inconformidadesAbertas = visitas.filter(
    (v) => (v.situacao === "Requer Atenção" || v.situacao === "Crítica") && v.status === "concluida"
  ).length;

  const regulares = visitasMes.filter((v) => v.situacao === "Regular").length;
  const taxaConformidadeRegional =
    visitasMes.length > 0 ? Math.round((regulares / visitasMes.length) * 100) : 100;

  // Total de beneficiários atendidos nos polos
  let totalAlunos = 0;
  const polosFormatados: PoloRegionalItem[] = locais.map((loc) => {
    const gruposList = (loc.grupos ?? []) as unknown as { id: string; matriculas: { id: string; status: string }[] }[];
    const matriculasAtivas = gruposList
      .flatMap((g) => g.matriculas ?? [])
      .filter((m) => m.status === "ativa");
    totalAlunos += matriculasAtivas.length;

    // Última supervisão deste polo
    const visitasDoPolo = visitas.filter((v) => v.local_id === loc.id);
    const ultimaVisita = visitasDoPolo[0] ?? null;

    return {
      id: loc.id,
      nome: loc.nome,
      bairro: loc.endereco_bairro,
      total_turmas: (loc.grupos ?? []).length,
      total_alunos: matriculasAtivas.length,
      ultima_supervisao_data: ultimaVisita?.data ?? null,
      ultima_situacao: (ultimaVisita?.situacao as "Regular" | "Requer Atenção" | "Crítica") || null,
    };
  });

  // 6. Central de Ocorrências e Prazos de Regularização
  const hojeTimestamp = new Date().setHours(0, 0, 0, 0);
  const ocorrencias: OcorrenciaPendenteItem[] = visitas
    .filter((v) => v.situacao === "Requer Atenção" || v.situacao === "Crítica" || v.prazo_regularizacao)
    .map((v) => {
      let diasRestantes: number | null = null;
      let vencida = false;

      if (v.prazo_regularizacao) {
        const prazoDate = new Date(v.prazo_regularizacao + "T00:00:00").getTime();
        const diffMs = prazoDate - hojeTimestamp;
        diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        vencida = diasRestantes < 0;
      }

      return {
        visita_id: v.id,
        data_visita: v.data,
        local_id: v.local_id,
        local_nome: v.local?.nome ?? "Polo",
        instrutor_nome: v.instrutor?.nome_completo ?? "Instrutor",
        situacao: (v.situacao as "Regular" | "Requer Atenção" | "Crítica") || "Regular",
        ocorrencias: v.ocorrencias,
        providencias: v.providencias,
        prazo_regularizacao: v.prazo_regularizacao,
        dias_restantes: diasRestantes,
        vencida,
      };
    });

  // 7. Relatórios periódicos recentes
  let relatoriosQuery = supabase
    .from("relatorios_prestacao_contas")
    .select("id, rotulo_periodo, status, fechado_em, versao")
    .order("criado_em", { ascending: false })
    .limit(10);

  if (regiaoAtiva && regiaoAtiva.id !== "regiao-geral") {
    relatoriosQuery = relatoriosQuery.eq("regiao_id", regiaoAtiva.id);
  } else if (objetoIdFiltro && objetoIdFiltro !== "todos") {
    relatoriosQuery = relatoriosQuery.eq("objeto_id", objetoIdFiltro);
  }

  const { data: relatoriosRaw } = await relatoriosQuery;

  return {
    coordenador: user ? { id: user.id, nome: coordenadorNome } : null,
    regioes: regioes.map((r) => ({
      id: r.id,
      nome: r.nome,
      objeto_id: r.objeto_id,
      coordenador_id: r.coordenador_id,
    })),
    regiaoAtiva,
    indicadores: {
      totalPolosAtivos: locais.length,
      supervisoesConcluidasMes,
      inconformidadesAbertas,
      taxaConformidadeRegional,
      totalAlunosAtendidos: totalAlunos,
    },
    polos: polosFormatados,
    ocorrencias,
    relatoriosRecentes: relatoriosRaw ?? [],
  };
}

export async function salvarRascunhoSintese(input: SalvarRascunhoSinteseInput) {
  const supabase = await createClient();

  const parsed = salvarRascunhoSinteseSchema.safeParse(input);
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
    return { success: false, error: "Usuário não autenticado." };
  }

  // Verificar se já existe relatório em elaboração para este período e região
  let checkQuery = supabase
    .from("relatorios_prestacao_contas")
    .select("id")
    .eq("objeto_id", parsed.data.objeto_id)
    .eq("status", "em_elaboracao")
    .eq("rotulo_periodo", parsed.data.rotulo_periodo);

  if (parsed.data.regiao_id) {
    checkQuery = checkQuery.eq("regiao_id", parsed.data.regiao_id);
  }

  const { data: existente } = await checkQuery.maybeSingle();

  if (existente) {
    const { error: updateError } = await supabase
      .from("relatorios_prestacao_contas")
      .update({
        resumo_execucao: parsed.data.pontos_positivos,
        analise_cumprimento_metas: parsed.data.dificuldades,
        resultados_alcancados: parsed.data.pendencias,
        conclusao: parsed.data.providencias,
      })
      .eq("id", existente.id);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true, id: existente.id };
  } else {
    const { data: novo, error: insertError } = await supabase
      .from("relatorios_prestacao_contas")
      .insert({
        objeto_id: parsed.data.objeto_id,
        regiao_id: parsed.data.regiao_id || null,
        elaborador_id: user.id,
        rotulo_periodo: parsed.data.rotulo_periodo,
        data_inicio: parsed.data.data_inicio,
        data_fim: parsed.data.data_fim,
        resumo_execucao: parsed.data.pontos_positivos,
        analise_cumprimento_metas: parsed.data.dificuldades,
        resultados_alcancados: parsed.data.pendencias,
        conclusao: parsed.data.providencias,
        anexos_dados: {},
        versao: 1,
        status: "em_elaboracao",
      })
      .select()
      .single();

    if (insertError || !novo) return { success: false, error: insertError?.message ?? "Erro ao salvar." };
    return { success: true, id: novo.id };
  }
}

export async function fecharCicloPeriodico(input: FecharCicloPeriodicoInput) {
  const supabase = await createClient();

  const parsed = fecharCicloPeriodicoSchema.safeParse(input);
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
    return { success: false, error: "Usuário não autenticado." };
  }

  // 1. Buscar dados do Objeto e Região
  const { data: objeto } = await supabase
    .from("objetos")
    .select("id, nome, termo_local, termo_instrutor, termo_grupo, termo_sessao, termo_beneficiario, termo_parceria_numero")
    .eq("id", parsed.data.objeto_id)
    .single();

  let regiaoNome = parsed.data.regiao_nome || "Região Única";
  if (parsed.data.regiao_id) {
    const { data: reg } = await supabase
      .from("regioes")
      .select("nome")
      .eq("id", parsed.data.regiao_id)
      .single();
    if (reg?.nome) regiaoNome = reg.nome;
  }

  // 2. Compilar todas as vistorias de supervisão concluídas no período
  let visitasQuery = supabase
    .from("visitas_supervisao")
    .select(`
      id,
      data,
      hora_inicio,
      hora_fim,
      situacao,
      local:locais(id, nome, regiao_id),
      instrutor:funcionarios(id, nome_completo),
      qtd_beneficiarios_presentes,
      ocorrencias,
      providencias,
      nota_estrutura,
      nota_materiais_coletivos,
      nota_materiais_concedidos
    `)
    .eq("objeto_id", parsed.data.objeto_id)
    .eq("status", "concluida")
    .gte("data", parsed.data.data_inicio)
    .lte("data", parsed.data.data_fim)
    .order("data", { ascending: true });

  const { data: visitasRaw } = await visitasQuery;
  let visitasPeriodo = visitasRaw ?? [];

  if (parsed.data.regiao_id) {
    visitasPeriodo = visitasPeriodo.filter(
      (v) => (v.local as { regiao_id: string } | null)?.regiao_id === parsed.data.regiao_id
    );
  }

  // 3. Montar Tabela Consolidada e Métricas para o Caderno Oficial Nível 2 (§3.9.3)
  const polosAcompanhadosSet = new Set(visitasPeriodo.map((v) => (v.local as { id: string })?.id));
  const totalPolosAcompanhados = polosAcompanhadosSet.size;
  const totalSupervisoesRealizadas = visitasPeriodo.length;

  const regulares = visitasPeriodo.filter((v) => v.situacao === "Regular").length;
  const taxaConformidade =
    totalSupervisoesRealizadas > 0 ? Math.round((regulares / totalSupervisoesRealizadas) * 100) : 100;

  const totalAtendimentosObservados = visitasPeriodo.reduce(
    (acc, v) => acc + (v.qtd_beneficiarios_presentes || 0),
    0
  );

  const tabelaSupervisoes = visitasPeriodo.map((v) => {
    const loc = v.local as { nome: string } | null;
    const inst = v.instrutor as { nome_completo: string } | null;
    return {
      data: v.data,
      local_nome: loc?.nome ?? "Polo",
      instrutor_nome: inst?.nome_completo ?? "Instrutor",
      horario: `${v.hora_inicio.slice(0, 5)} - ${v.hora_fim ? v.hora_fim.slice(0, 5) : ""}`,
      beneficiarios_presentes: v.qtd_beneficiarios_presentes,
      situacao: v.situacao,
      ocorrencias: v.ocorrencias,
      providencias: v.providencias,
    };
  });

  // 4. Snapshot Probatório Imutável do Caderno Oficial
  const snapshot_dados = {
    tipo_documento: "caderno_supervisao_nivel_2",
    objeto_id: parsed.data.objeto_id,
    objeto_nome: objeto?.nome ?? "Projeto Social",
    termo_parceria: objeto?.termo_parceria_numero ?? "S/N",
    regiao_id: parsed.data.regiao_id ?? null,
    regiao_nome: regiaoNome,
    rotulo_periodo: parsed.data.rotulo_periodo,
    data_inicio: parsed.data.data_inicio,
    data_fim: parsed.data.data_fim,
    coordenador_nome: parsed.data.coordenador_nome || "Coordenador Regional",
    indicadores_executivos: {
      polos_acompanhados: totalPolosAcompanhados,
      supervisoes_realizadas: totalSupervisoesRealizadas,
      taxa_conformidade: taxaConformidade,
      total_atendimentos: totalAtendimentosObservados,
    },
    tabela_consolidada: tabelaSupervisoes,
    sintese_qualitativa: parsed.data.sintese,
    fechado_em: new Date().toISOString(),
  };

  // 5. Inserir ou Travar como Fechado em relatorios_prestacao_contas
  const { data: relatorioFechado, error: insertError } = await supabase
    .from("relatorios_prestacao_contas")
    .insert({
      objeto_id: parsed.data.objeto_id,
      regiao_id: parsed.data.regiao_id || null,
      elaborador_id: user.id,
      coordenador_geral_id: user.id,
      rotulo_periodo: parsed.data.rotulo_periodo,
      data_inicio: parsed.data.data_inicio,
      data_fim: parsed.data.data_fim,
      resumo_execucao: parsed.data.sintese.pontos_positivos,
      analise_cumprimento_metas: parsed.data.sintese.dificuldades,
      resultados_alcancados: parsed.data.sintese.pendencias,
      conclusao: parsed.data.sintese.providencias,
      anexos_dados: JSON.parse(JSON.stringify(snapshot_dados)),
      status: "fechado",
      fechado_em: new Date().toISOString(),
      versao: 1,
    })
    .select()
    .single();

  if (insertError || !relatorioFechado) {
    return {
      success: false,
      error: insertError?.message ?? "Erro ao homologar fechamento periódico.",
    };
  }

  revalidatePath("/coordenacao");
  revalidatePath("/relatorios");
  return { success: true, data: relatorioFechado };
}

export async function getRelatorioPeriodicoDetalhes(relatorioId: string) {
  const supabase = await createClient();

  const { data: relatorio, error } = await supabase
    .from("relatorios_prestacao_contas")
    .select(`
      *,
      objeto:objetos(id, nome, termo_local, termo_instrutor, termo_grupo, termo_sessao, termo_beneficiario, termo_parceria_numero),
      regiao:regioes(id, nome)
    `)
    .eq("id", relatorioId)
    .single();

  if (error || !relatorio) {
    return { success: false, error: "Relatório periódico não encontrado." };
  }

  // Buscar nome do elaborador/coordenador
  let elaboradorNome = "Coordenador Regional";
  if (relatorio.elaborador_id) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("nome_completo")
      .eq("id", relatorio.elaborador_id)
      .single();
    if (usuario?.nome_completo) elaboradorNome = usuario.nome_completo;
  }

  return {
    success: true,
    data: {
      relatorio,
      coordenadorNome: elaboradorNome,
    },
  };
}
