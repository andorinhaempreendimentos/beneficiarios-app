"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  iniciarSupervisaoSchema,
  atualizarSupervisaoSchema,
  concluirSupervisaoSchema,
  type IniciarSupervisaoInput,
  type AtualizarSupervisaoInput,
  type ConcluirSupervisaoInput,
  type FotosSupervisao,
} from "@/lib/validations/fase-4";

export interface IndicadoresSupervisor {
  totalVisitasMes: number;
  polosCobertos: number;
  totalPolos: number;
  inconformidadesAbertas: number;
  taxaConformidade: number;
}

export interface VisitaResumoItem {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string | null;
  status: "em_andamento" | "concluida";
  situacao: "Regular" | "Requer Atenção" | "Crítica";
  local_id: string;
  local_nome: string;
  instrutor_id: string;
  instrutor_nome: string;
  supervisor_nome: string;
  qtd_beneficiarios_presentes: number;
  nota_media: number | null;
  total_fotos: number;
  prazo_regularizacao: string | null;
}

export interface PainelSupervisorData {
  indicadores: IndicadoresSupervisor;
  visitas: VisitaResumoItem[];
  locaisDisponiveis: { id: string; nome: string; objeto_id: string }[];
  instrutoresDisponiveis: { id: string; nome_completo: string; cargo: string; local_id: string | null }[];
}

export async function getPainelSupervisorData(
  objetoIdFiltro?: string,
  localIdFiltro?: string,
  situacaoFiltro?: string
): Promise<PainelSupervisorData> {
  const supabase = await createClient();

  // 1. Obter locais do objeto ativo
  let locaisQuery = supabase.from("locais").select("id, nome, objeto_id").eq("ativo", true).order("nome");
  if (objetoIdFiltro && objetoIdFiltro !== "todos") {
    locaisQuery = locaisQuery.eq("objeto_id", objetoIdFiltro);
  }
  const { data: locaisRaw } = await locaisQuery;
  const locaisDisponiveis = locaisRaw ?? [];

  // 2. Obter instrutores ativos
  let instrutoresQuery = supabase
    .from("funcionarios")
    .select("id, nome_completo, cargo, local_id")
    .eq("situacao", "ativo")
    .order("nome_completo");
  if (objetoIdFiltro && objetoIdFiltro !== "todos") {
    instrutoresQuery = instrutoresQuery.eq("objeto_id", objetoIdFiltro);
  }
  const { data: instrutoresRaw } = await instrutoresQuery;
  const instrutoresDisponiveis = instrutoresRaw ?? [];

  // 3. Obter visitas de supervisão
  let visitasQuery = supabase
    .from("visitas_supervisao")
    .select(`
      id,
      supervisor_id,
      data,
      hora_inicio,
      hora_fim,
      status,
      situacao,
      local_id,
      local:locais(id, nome),
      instrutor_funcionario_id,
      instrutor:funcionarios(id, nome_completo),
      qtd_beneficiarios_presentes,
      nota_estrutura,
      nota_materiais_coletivos,
      nota_materiais_concedidos,
      fotos,
      prazo_regularizacao
    `)
    .order("data", { ascending: false })
    .order("hora_inicio", { ascending: false });

  if (objetoIdFiltro && objetoIdFiltro !== "todos") {
    visitasQuery = visitasQuery.eq("objeto_id", objetoIdFiltro);
  }
  if (localIdFiltro && localIdFiltro !== "todos") {
    visitasQuery = visitasQuery.eq("local_id", localIdFiltro);
  }
  if (situacaoFiltro && situacaoFiltro !== "todos") {
    visitasQuery = visitasQuery.eq("situacao", situacaoFiltro);
  }

  const { data: visitasRaw } = await visitasQuery.limit(50);
  const visitas = visitasRaw ?? [];

  // 4. Calcular Indicadores do Mês
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0];
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split("T")[0];

  const visitasMes = visitas.filter((v) => v.data >= inicioMes && v.data <= fimMes);
  const totalVisitasMes = visitasMes.length;

  const polosVisitadosSet = new Set(visitasMes.map((v) => v.local_id));
  const polosCobertos = polosVisitadosSet.size;
  const totalPolos = locaisDisponiveis.length;

  const inconformidadesAbertas = visitas.filter(
    (v) => (v.situacao === "Requer Atenção" || v.situacao === "Crítica") && v.status === "concluida"
  ).length;

  const visitasConcluidas = visitas.filter((v) => v.status === "concluida");
  const regulares = visitasConcluidas.filter((v) => v.situacao === "Regular").length;
  const taxaConformidade =
    visitasConcluidas.length > 0 ? Math.round((regulares / visitasConcluidas.length) * 100) : 100;

  // 5. Obter nomes dos supervisores envolvidos
  const supervisorIds = Array.from(new Set(visitas.map((v) => v.supervisor_id).filter(Boolean)));
  let supervisoresMap = new Map<string, string>();
  if (supervisorIds.length > 0) {
    const { data: sups } = await supabase
      .from("usuarios")
      .select("id, nome_completo")
      .in("id", supervisorIds);
    supervisoresMap = new Map((sups ?? []).map((s) => [s.id, s.nome_completo ?? "Supervisor"]));
  }

  // 6. Montar lista de resumos
  const listaFormatada: VisitaResumoItem[] = visitas.map((v) => {
    const loc = v.local as { id: string; nome: string } | null;
    const inst = v.instrutor as { id: string; nome_completo: string } | null;
    const supervisorNome = supervisoresMap.get(v.supervisor_id) ?? "Supervisor";

    // Calcular nota média
    const notasValidas = [v.nota_estrutura, v.nota_materiais_coletivos, v.nota_materiais_concedidos].filter(
      (n): n is number => typeof n === "number" && n > 0
    );
    const notaMedia =
      notasValidas.length > 0
        ? Number((notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(1))
        : null;

    // Total de fotos
    let totalFotos = 0;
    if (v.fotos && typeof v.fotos === "object") {
      const f = v.fotos as unknown as FotosSupervisao;
      totalFotos =
        (Array.isArray(f.atividade) ? f.atividade.length : 0) +
        (Array.isArray(f.estrutura) ? f.estrutura.length : 0) +
        (Array.isArray(f.materiais_coletivos) ? f.materiais_coletivos.length : 0) +
        (Array.isArray(f.materiais_concedidos) ? f.materiais_concedidos.length : 0);
    }

    return {
      id: v.id,
      data: v.data,
      hora_inicio: v.hora_inicio.slice(0, 5),
      hora_fim: v.hora_fim ? v.hora_fim.slice(0, 5) : null,
      status: v.status as "em_andamento" | "concluida",
      situacao: (v.situacao as "Regular" | "Requer Atenção" | "Crítica") || "Regular",
      local_id: v.local_id,
      local_nome: loc?.nome ?? "Polo",
      instrutor_id: v.instrutor_funcionario_id,
      instrutor_nome: inst?.nome_completo ?? "Instrutor",
      supervisor_nome: supervisorNome,
      qtd_beneficiarios_presentes: v.qtd_beneficiarios_presentes ?? 0,
      nota_media: notaMedia,
      total_fotos: totalFotos,
      prazo_regularizacao: v.prazo_regularizacao,
    };
  });

  return {
    indicadores: {
      totalVisitasMes,
      polosCobertos,
      totalPolos,
      inconformidadesAbertas,
      taxaConformidade,
    },
    visitas: listaFormatada,
    locaisDisponiveis,
    instrutoresDisponiveis,
  };
}

export async function iniciarSupervisao(input: IniciarSupervisaoInput) {
  const supabase = await createClient();

  const parsed = iniciarSupervisaoSchema.safeParse(input);
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

  const agora = new Date();
  const hojeStr = agora.toISOString().split("T")[0];
  const horaInicioFormatada = agora.toTimeString().substring(0, 8); // HH:MM:SS

  // Inserir registro de vistoria com status 'em_andamento'
  const { data: visita, error: visitaError } = await supabase
    .from("visitas_supervisao")
    .insert({
      objeto_id: parsed.data.objeto_id,
      local_id: parsed.data.local_id,
      bloco_id: parsed.data.bloco_id || null,
      instrutor_funcionario_id: parsed.data.instrutor_funcionario_id,
      supervisor_id: user.id,
      data: hojeStr,
      hora_inicio: horaInicioFormatada,
      status: "em_andamento",
      situacao: "Regular",
      professor_presente: true,
      grade_conforme: true,
      chamada_conferida: true,
      qtd_beneficiarios_presentes: 0,
      fotos: {
        atividade: [],
        estrutura: [],
        materiais_coletivos: [],
        materiais_concedidos: [],
      },
    })
    .select()
    .single();

  if (visitaError || !visita) {
    return { success: false, error: visitaError?.message ?? "Erro ao iniciar supervisão." };
  }

  revalidatePath("/supervisoes");
  revalidatePath(`/supervisoes/${visita.id}`);
  return { success: true, data: visita };
}

export async function getSupervisaoDetalhes(visitaId: string) {
  const supabase = await createClient();

  // 1. Buscar a visita
  const { data: visita, error: visitaError } = await supabase
    .from("visitas_supervisao")
    .select(`
      *,
      objeto:objetos(id, nome, termo_local, termo_instrutor, termo_grupo, termo_sessao),
      local:locais(id, nome, endereco_logradouro, endereco_numero, endereco_bairro),
      instrutor:funcionarios(id, nome_completo, cargo),
      bloco:blocos(id, hora_inicio, hora_fim, dia_semana)
    `)
    .eq("id", visitaId)
    .single();

  if (visitaError || !visita) {
    return { success: false, error: "Visita de supervisão não encontrada." };
  }

  // Buscar nome do supervisor na tabela usuarios
  let supervisorNome = "Supervisor";
  if (visita.supervisor_id) {
    const { data: supUser } = await supabase
      .from("usuarios")
      .select("nome_completo")
      .eq("id", visita.supervisor_id)
      .single();
    if (supUser?.nome_completo) {
      supervisorNome = supUser.nome_completo;
    }
  }

  // 2. Buscar instrutores ativos do mesmo objeto/polo para seleção/troca
  const { data: instrutores } = await supabase
    .from("funcionarios")
    .select("id, nome_completo, cargo, local_id")
    .eq("objeto_id", visita.objeto_id)
    .eq("situacao", "ativo")
    .order("nome_completo");

  // 3. Buscar blocos cadastrados para o polo auditado para identificação de turmas
  const { data: blocosDoLocal } = await supabase
    .from("blocos")
    .select(`
      id,
      dia_semana,
      hora_inicio,
      hora_fim,
      bloco_grupos(
        grupo_id,
        grupo:grupos(id, nome, idade_minima, idade_maxima)
      )
    `)
    .eq("local_id", visita.local_id);

  return {
    success: true,
    data: {
      visita: {
        ...visita,
        supervisor: { id: visita.supervisor_id, nome_completo: supervisorNome },
      },
      instrutores: instrutores ?? [],
      blocosDoLocal: blocosDoLocal ?? [],
    },
  };
}

export async function salvarRascunhoSupervisao(input: AtualizarSupervisaoInput) {
  const supabase = await createClient();

  const parsed = atualizarSupervisaoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // Verificar se a visita já está concluída (imutável)
  const { data: existente } = await supabase
    .from("visitas_supervisao")
    .select("status")
    .eq("id", parsed.data.id)
    .single();

  if (existente?.status === "concluida") {
    return {
      success: false,
      error: "Regra Canônica §3.6: Esta vistoria já foi concluída e está travada como snapshot probatório imutável.",
    };
  }

  const { error: updateError } = await supabase
    .from("visitas_supervisao")
    .update({
      bloco_id: parsed.data.bloco_id ?? undefined,
      instrutor_funcionario_id: parsed.data.instrutor_funcionario_id ?? undefined,
      professor_presente: parsed.data.professor_presente,
      grade_conforme: parsed.data.grade_conforme,
      chamada_conferida: parsed.data.chamada_conferida,
      turmas_auditadas: parsed.data.turmas_auditadas,
      qtd_beneficiarios_presentes: parsed.data.qtd_beneficiarios_presentes,
      atividade_acompanhada: parsed.data.atividade_acompanhada,
      espaco_fisico_status: parsed.data.espaco_fisico_status,
      nota_estrutura: parsed.data.nota_estrutura,
      obs_estrutura: parsed.data.obs_estrutura,
      materiais_coletivos_status: parsed.data.materiais_coletivos_status,
      nota_materiais_coletivos: parsed.data.nota_materiais_coletivos,
      obs_materiais_coletivos: parsed.data.obs_materiais_coletivos,
      materiais_concedidos_status: parsed.data.materiais_concedidos_status,
      nota_materiais_concedidos: parsed.data.nota_materiais_concedidos,
      obs_materiais_concedidos: parsed.data.obs_materiais_concedidos,
      fotos: parsed.data.fotos ? JSON.parse(JSON.stringify(parsed.data.fotos)) : undefined,
      observacoes: parsed.data.observacoes,
      ocorrencias: parsed.data.ocorrencias,
      orientacoes_professor: parsed.data.orientacoes_professor,
      providencias: parsed.data.providencias,
      prazo_regularizacao: parsed.data.prazo_regularizacao,
      situacao: parsed.data.situacao,
    })
    .eq("id", parsed.data.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function concluirSupervisao(input: ConcluirSupervisaoInput) {
  const supabase = await createClient();

  const parsed = concluirSupervisaoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // 1. Verificar se a vistoria existe e se ainda está em andamento
  const { data: visitaExistente, error: getError } = await supabase
    .from("visitas_supervisao")
    .select(`
      *,
      objeto:objetos(id, nome),
      local:locais(id, nome),
      instrutor:funcionarios(id, nome_completo, cargo)
    `)
    .eq("id", parsed.data.id)
    .single();

  if (getError || !visitaExistente) {
    return { success: false, error: "Visita de supervisão não encontrada." };
  }

  if (visitaExistente.status === "concluida") {
    return {
      success: false,
      error: "Regra Canônica §3.6: Esta vistoria já foi concluída e está travada como snapshot probatório imutável.",
    };
  }

  let supervisorNome = "Supervisor";
  if (visitaExistente.supervisor_id) {
    const { data: supUser } = await supabase
      .from("usuarios")
      .select("nome_completo")
      .eq("id", visitaExistente.supervisor_id)
      .single();
    if (supUser?.nome_completo) {
      supervisorNome = supUser.nome_completo;
    }
  }

  const horaFimFormatada =
    parsed.data.hora_fim.length === 5 ? `${parsed.data.hora_fim}:00` : parsed.data.hora_fim;

  // 2. Construir snapshot consolidado dos dados para auditoria governamental
  const snapshot_dados = {
    visita_id: parsed.data.id,
    objeto_id: visitaExistente.objeto_id,
    objeto_nome: visitaExistente.objeto?.nome ?? "Projeto",
    local_id: visitaExistente.local_id,
    local_nome: visitaExistente.local?.nome ?? "Polo",
    supervisor_id: visitaExistente.supervisor_id,
    supervisor_nome: supervisorNome,
    instrutor_id: visitaExistente.instrutor_funcionario_id,
    instrutor_nome: visitaExistente.instrutor?.nome_completo ?? "Instrutor",
    data: visitaExistente.data,
    hora_inicio: visitaExistente.hora_inicio,
    hora_fim: horaFimFormatada,
    professor_presente: parsed.data.professor_presente,
    grade_conforme: parsed.data.grade_conforme,
    chamada_conferida: parsed.data.chamada_conferida,
    turmas_auditadas: parsed.data.turmas_auditadas,
    qtd_beneficiarios_presentes: parsed.data.qtd_beneficiarios_presentes,
    atividade_acompanhada: parsed.data.atividade_acompanhada,
    setores: {
      espaco_fisico: {
        status: parsed.data.espaco_fisico_status,
        nota: parsed.data.nota_estrutura,
        obs: parsed.data.obs_estrutura,
      },
      materiais_coletivos: {
        status: parsed.data.materiais_coletivos_status,
        nota: parsed.data.nota_materiais_coletivos,
        obs: parsed.data.obs_materiais_coletivos,
      },
      materiais_concedidos: {
        status: parsed.data.materiais_concedidos_status,
        nota: parsed.data.nota_materiais_concedidos,
        obs: parsed.data.obs_materiais_concedidos,
      },
    },
    fotos: parsed.data.fotos,
    observacoes: parsed.data.observacoes,
    ocorrencias: parsed.data.ocorrencias,
    orientacoes_professor: parsed.data.orientacoes_professor,
    providencias: parsed.data.providencias,
    prazo_regularizacao: parsed.data.prazo_regularizacao,
    situacao_global: parsed.data.situacao,
    homologado_em: new Date().toISOString(),
  };

  // 3. Atualizar e travar o registro como 'concluida'
  const { data: visitaConcluida, error: updateError } = await supabase
    .from("visitas_supervisao")
    .update({
      hora_fim: horaFimFormatada,
      status: "concluida",
      professor_presente: parsed.data.professor_presente,
      grade_conforme: parsed.data.grade_conforme,
      chamada_conferida: parsed.data.chamada_conferida,
      turmas_auditadas: parsed.data.turmas_auditadas,
      qtd_beneficiarios_presentes: parsed.data.qtd_beneficiarios_presentes,
      atividade_acompanhada: parsed.data.atividade_acompanhada,
      espaco_fisico_status: parsed.data.espaco_fisico_status,
      nota_estrutura: parsed.data.nota_estrutura,
      obs_estrutura: parsed.data.obs_estrutura,
      materiais_coletivos_status: parsed.data.materiais_coletivos_status,
      nota_materiais_coletivos: parsed.data.nota_materiais_coletivos,
      obs_materiais_coletivos: parsed.data.obs_materiais_coletivos,
      materiais_concedidos_status: parsed.data.materiais_concedidos_status,
      nota_materiais_concedidos: parsed.data.nota_materiais_concedidos,
      obs_materiais_concedidos: parsed.data.obs_materiais_concedidos,
      fotos: JSON.parse(JSON.stringify(parsed.data.fotos)),
      observacoes: parsed.data.observacoes,
      ocorrencias: parsed.data.ocorrencias,
      orientacoes_professor: parsed.data.orientacoes_professor,
      providencias: parsed.data.providencias,
      prazo_regularizacao: parsed.data.prazo_regularizacao,
      situacao: parsed.data.situacao,
      snapshot_dados: JSON.parse(JSON.stringify(snapshot_dados)),
    })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (updateError || !visitaConcluida) {
    return { success: false, error: updateError?.message ?? "Erro ao concluir supervisão." };
  }

  revalidatePath("/supervisoes");
  revalidatePath(`/supervisoes/${parsed.data.id}`);
  revalidatePath("/relatorios");
  return { success: true, data: visitaConcluida };
}

export async function uploadFotoSupervisao(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("foto") as File | null;
  if (!file) {
    return { success: false, error: "Nenhum arquivo enviado." };
  }

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "O arquivo deve ser uma imagem válida (JPEG, PNG, WebP)." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "A imagem não pode ultrapassar 10MB." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const filePath = `vistorias/${fileName}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("supervisoes-fotos")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: `Falha no upload: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from("supervisoes-fotos")
    .getPublicUrl(filePath);

  return { success: true, url: publicUrlData.publicUrl };
}
