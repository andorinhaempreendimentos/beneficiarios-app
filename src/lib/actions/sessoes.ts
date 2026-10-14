"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  iniciarSessaoSchema,
  concluirSessaoSchema,
  type IniciarSessaoInput,
  type ConcluirSessaoInput,
} from "@/lib/validations/fase-3";

export interface IndicadoresInstrutor {
  totalSessoesMes: number;
  totalHorasFormatadas: string;
  taxaPresencaMedia: number;
  totalAtendimentos: number;
}

export interface SessaoResumoItem {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string | null;
  status: "em_andamento" | "concluida";
  local_nome: string;
  modalidade_nome: string | null;
  turmas_nomes: string[];
  total_presentes: number;
  fotos_urls: string[];
}

export interface BlocoHojeItem {
  bloco_id: string;
  hora_inicio: string;
  hora_fim: string;
  local_id: string;
  local_nome: string;
  modalidade_id: string | null;
  modalidade_nome: string | null;
  grupos: { id: string; nome: string }[];
  sessao?: {
    id: string;
    status: "em_andamento" | "concluida";
    hora_inicio: string;
    hora_fim: string | null;
  } | null;
}

export interface PainelInstrutorData {
  isInstrutorLogado?: boolean;
  instrutor: {
    id: string;
    nome_completo: string;
    cargo: string;
    objeto_id: string;
    objeto_nome: string;
  } | null;
  indicadores: IndicadoresInstrutor;
  blocosHoje: BlocoHojeItem[];
  programacaoSemana: {
    dia_semana: number;
    dia_nome: string;
    total_blocos: number;
    blocos: {
      id: string;
      hora_inicio: string;
      hora_fim: string;
      local_nome: string;
      grupos_nomes: string[];
    }[];
  }[];
  sessoesRecentes: SessaoResumoItem[];
}

const DIAS_SEMANA_MAP = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export async function getPainelInstrutorData(
  funcionarioIdFiltro?: string,
  objetoIdFiltro?: string
): Promise<PainelInstrutorData> {
  const supabase = await createClient();

  // 1. Identificar o usuário autenticado e verificar se possui papel de instrutor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  interface FuncionarioItem {
    id: string;
    nome_completo: string;
    cargo: string;
    objeto_id: string;
    objeto?: { id: string; nome: string } | null;
  }

  let isInstrutorLogado = false;
  let funcionarioAtivo: FuncionarioItem | null = null;

  if (user) {
    const { data: usuarioPerfil } = await supabase
      .from("usuarios")
      .select("papel")
      .eq("id", user.id)
      .single();

    if (usuarioPerfil?.papel === "instrutor") {
      // Regra Canônica §4.2: Instrutor logado vê estritamente o seu painel exclusivo
      const { data: funcInstrutor } = await supabase
        .from("funcionarios")
        .select("id, nome_completo, cargo, objeto_id, objeto:objetos(id, nome)")
        .eq("usuario_id", user.id)
        .eq("situacao", "ativo")
        .single();

      if (funcInstrutor) {
        funcionarioAtivo = funcInstrutor as unknown as FuncionarioItem;
        isInstrutorLogado = true;
      }
    }
  }

  // Se não for um instrutor logado com vínculo próprio, permite busca/filtro (modo administrador/coordenador)
  if (!funcionarioAtivo) {
    let funcionarioQuery = supabase
      .from("funcionarios")
      .select("id, nome_completo, cargo, objeto_id, objeto:objetos(id, nome)")
      .eq("situacao", "ativo");

    if (funcionarioIdFiltro && funcionarioIdFiltro !== "todos") {
      funcionarioQuery = funcionarioQuery.eq("id", funcionarioIdFiltro);
    }

    const { data: funcionarios } = await funcionarioQuery.limit(10);
    const primeiro = funcionarios && funcionarios.length > 0 ? funcionarios[0] : null;
    if (primeiro) {
      funcionarioAtivo = primeiro as unknown as FuncionarioItem;
    }
  }

  if (!funcionarioAtivo) {
    return {
      isInstrutorLogado: false,
      instrutor: null,
      indicadores: {
        totalSessoesMes: 0,
        totalHorasFormatadas: "0h",
        taxaPresencaMedia: 0,
        totalAtendimentos: 0,
      },
      blocosHoje: [],
      programacaoSemana: [],
      sessoesRecentes: [],
    };
  }

  const funcId = funcionarioAtivo.id;
  const objId = objetoIdFiltro || funcionarioAtivo.objeto_id;
  const objetoNome =
    funcionarioAtivo.objeto && typeof funcionarioAtivo.objeto === "object" && "nome" in funcionarioAtivo.objeto
      ? (funcionarioAtivo.objeto as { nome: string }).nome
      : "Projeto Social";

  // Data atual e dia da semana
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];
  const diaSemanaHoje = hoje.getDay(); // 0 a 6

  // 2. Blocos semanais cadastrados para o instrutor
  const { data: blocosRaw } = await supabase
    .from("blocos")
    .select(`
      id,
      dia_semana,
      hora_inicio,
      hora_fim,
      local_id,
      local:locais(id, nome),
      bloco_grupos(
        grupo:grupos(
          id,
          nome,
          modalidade_id,
          modalidade:modalidades(id, nome)
        )
      )
    `)
    .eq("instrutor_id", funcId)
    .order("hora_inicio", { ascending: true });

  const todosBlocos = blocosRaw ?? [];

  // 3. Sessões realizadas hoje pelo instrutor
  const { data: sessoesHoje } = await supabase
    .from("sessoes")
    .select("id, bloco_id, status, hora_inicio, hora_fim")
    .eq("funcionario_id", funcId)
    .eq("data", hojeStr);

  const sessoesHojeMap = new Map((sessoesHoje ?? []).map((s) => [s.bloco_id, s]));

  // Montar blocos de hoje
  const blocosHoje: BlocoHojeItem[] = todosBlocos
    .filter((b) => b.dia_semana === diaSemanaHoje)
    .map((b) => {
      const sessaoVinculada = sessoesHojeMap.get(b.id) ?? null;
      const localData = b.local as { id: string; nome: string } | null;
      const bgList = b.bloco_grupos ?? [];
      const primeiroBg = bgList[0];
      const grupoPrincipal = primeiroBg?.grupo as {
        id: string;
        nome: string;
        modalidade_id: string | null;
        modalidade: { id: string; nome: string } | null;
      } | null;

      const grupos = bgList
        .map((bg) => bg.grupo as { id: string; nome: string } | null)
        .filter((g): g is { id: string; nome: string } => Boolean(g));

      return {
        bloco_id: b.id,
        hora_inicio: b.hora_inicio.slice(0, 5),
        hora_fim: b.hora_fim.slice(0, 5),
        local_id: b.local_id,
        local_nome: localData?.nome ?? "Polo não informado",
        modalidade_id: grupoPrincipal?.modalidade_id ?? null,
        modalidade_nome: grupoPrincipal?.modalidade?.nome ?? null,
        grupos,
        sessao: sessaoVinculada
          ? {
              id: sessaoVinculada.id,
              status: sessaoVinculada.status as "em_andamento" | "concluida",
              hora_inicio: sessaoVinculada.hora_inicio.slice(0, 5),
              hora_fim: sessaoVinculada.hora_fim ? sessaoVinculada.hora_fim.slice(0, 5) : null,
            }
          : null,
      };
    });

  // Montar visão semanal dos próximos dias úteis
  const programacaoSemana = [1, 2, 3, 4, 5, 6].map((diaNum) => {
    const blocosDoDia = todosBlocos.filter((b) => b.dia_semana === diaNum);
    return {
      dia_semana: diaNum,
      dia_nome: DIAS_SEMANA_MAP[diaNum],
      total_blocos: blocosDoDia.length,
      blocos: blocosDoDia.map((b) => {
        const localData = b.local as { id: string; nome: string } | null;
        const gruposNomes = (b.bloco_grupos ?? [])
          .map((bg) => (bg.grupo as { nome: string } | null)?.nome)
          .filter(Boolean) as string[];

        return {
          id: b.id,
          hora_inicio: b.hora_inicio.slice(0, 5),
          hora_fim: b.hora_fim.slice(0, 5),
          local_nome: localData?.nome ?? "Polo",
          grupos_nomes: gruposNomes,
        };
      }),
    };
  });

  // 4. Indicadores do Mês Vigente (Sessões Concluídas e Presenças)
  const primeiroDiaMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: sessoesMes } = await supabase
    .from("sessoes")
    .select(`
      id,
      data,
      hora_inicio,
      hora_fim,
      status,
      local:locais(nome),
      modalidade:modalidades(nome),
      fotos_urls
    `)
    .eq("funcionario_id", funcId)
    .gte("data", primeiroDiaMes)
    .order("data", { ascending: false });

  const sessoesConcluidasMes = (sessoesMes ?? []).filter((s) => s.status === "concluida");
  const sessoesIds = sessoesConcluidasMes.map((s) => s.id);

  // Buscar presenças das sessões concluídas no mês
  let totalPresentes = 0;
  let totalPresencasRegistradas = 0;

  if (sessoesIds.length > 0) {
    const { data: presencas } = await supabase
      .from("beneficiarios_presencas")
      .select("status")
      .in("sessao_id", sessoesIds);

    const todasPresencas = presencas ?? [];
    totalPresencasRegistradas = todasPresencas.length;
    totalPresentes = todasPresencas.filter((p) => p.status === "presente").length;
  }

  // Buscar horas acumuladas no ponto eletrônico deste mês
  const { data: pontosMes } = await supabase
    .from("registros_ponto")
    .select("total_minutos")
    .eq("funcionario_id", funcId)
    .gte("data", primeiroDiaMes);

  const totalMinutosPonto = (pontosMes ?? []).reduce(
    (acc, curr) => acc + (curr.total_minutos || 0),
    0
  );

  const horas = Math.floor(totalMinutosPonto / 60);
  const minutos = totalMinutosPonto % 60;
  const totalHorasFormatadas = `${horas}h ${minutos > 0 ? `${minutos}min` : ""}`.trim();

  const taxaPresencaMedia =
    totalPresencasRegistradas > 0
      ? Math.round((totalPresentes / totalPresencasRegistradas) * 100)
      : 0;

  // Sessões recentes
  const sessoesRecentes: SessaoResumoItem[] = (sessoesMes ?? []).slice(0, 10).map((s) => {
    const localData = s.local as { nome: string } | null;
    const modData = s.modalidade as { nome: string } | null;
    return {
      id: s.id,
      data: s.data,
      hora_inicio: s.hora_inicio.slice(0, 5),
      hora_fim: s.hora_fim ? s.hora_fim.slice(0, 5) : null,
      status: s.status as "em_andamento" | "concluida",
      local_nome: localData?.nome ?? "Polo",
      modalidade_nome: modData?.nome ?? null,
      turmas_nomes: [],
      total_presentes: 0,
      fotos_urls: (s.fotos_urls as string[]) ?? [],
    };
  });

  return {
    isInstrutorLogado,
    instrutor: {
      id: funcionarioAtivo.id,
      nome_completo: funcionarioAtivo.nome_completo,
      cargo: funcionarioAtivo.cargo,
      objeto_id: objId,
      objeto_nome: objetoNome,
    },
    indicadores: {
      totalSessoesMes: sessoesConcluidasMes.length,
      totalHorasFormatadas: totalHorasFormatadas || "0h",
      taxaPresencaMedia,
      totalAtendimentos: totalPresentes,
    },
    blocosHoje,
    programacaoSemana,
    sessoesRecentes,
  };
}

export async function iniciarSessao(input: IniciarSessaoInput) {
  const supabase = await createClient();

  const parsed = iniciarSessaoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // 1. Obter organização vinculada ao objeto
  const { data: objeto, error: objetoError } = await supabase
    .from("objetos")
    .select("id, organizacao_id")
    .eq("id", parsed.data.objeto_id)
    .single();

  if (objetoError || !objeto) {
    return { success: false, error: "Projeto social não encontrado." };
  }

  // 2. Verificar se já existe uma sessão em andamento para o mesmo bloco e data
  if (parsed.data.bloco_id) {
    const { data: sessaoExistente } = await supabase
      .from("sessoes")
      .select("id, status")
      .eq("bloco_id", parsed.data.bloco_id)
      .eq("data", parsed.data.data)
      .maybeSingle();

    if (sessaoExistente) {
      if (sessaoExistente.status === "em_andamento") {
        return { success: true, data: sessaoExistente, jaExistia: true };
      }
      return {
        success: false,
        error: "Este bloco já teve uma sessão concluída e travada para a data de hoje.",
      };
    }
  }

  // Formata hora_inicio
  const horaInicioFormatada =
    parsed.data.hora_inicio.length === 5
      ? `${parsed.data.hora_inicio}:00`
      : parsed.data.hora_inicio;

  // 3. Criar a sessão com status 'em_andamento'
  const { data: sessao, error: sessaoError } = await supabase
    .from("sessoes")
    .insert({
      objeto_id: parsed.data.objeto_id,
      organizacao_id: objeto.organizacao_id,
      local_id: parsed.data.local_id,
      bloco_id: parsed.data.bloco_id || null,
      funcionario_id: parsed.data.funcionario_id,
      modalidade_id: parsed.data.modalidade_id || null,
      grupos_ids: parsed.data.grupos_ids,
      data: parsed.data.data,
      hora_inicio: horaInicioFormatada,
      status: "em_andamento",
      fotos_urls: [],
    })
    .select()
    .single();

  if (sessaoError || !sessao) {
    return { success: false, error: sessaoError?.message ?? "Erro ao iniciar sessão." };
  }

  // 4. Ponto Eletrônico Integrado (Clock-in): registrar início da jornada de trabalho
  const { error: pontoError } = await supabase.from("registros_ponto").insert({
    objeto_id: parsed.data.objeto_id,
    local_id: parsed.data.local_id,
    funcionario_id: parsed.data.funcionario_id,
    sessao_id: sessao.id,
    data: parsed.data.data,
    hora_entrada: horaInicioFormatada,
    tipo_registro: "app_sessao",
  });

  if (pontoError) {
    console.error("Erro ao registrar ponto eletrônico:", pontoError.message);
  }

  revalidatePath("/sessoes");
  revalidatePath(`/sessoes/${sessao.id}`);
  return { success: true, data: sessao };
}

export async function getSessaoDetalhes(sessaoId: string) {
  const supabase = await createClient();

  // 1. Obter a sessão
  const { data: sessao, error: sessaoError } = await supabase
    .from("sessoes")
    .select(`
      *,
      objeto:objetos(id, nome, termo_sessao, termo_instrutor, termo_local, termo_grupo),
      local:locais(id, nome, endereco_logradouro, endereco_numero, endereco_bairro),
      funcionario:funcionarios(id, nome_completo, cargo),
      modalidade:modalidades(id, nome)
    `)
    .eq("id", sessaoId)
    .single();

  if (sessaoError || !sessao) {
    return { success: false, error: "Sessão não encontrada." };
  }

  // 2. Obter as turmas/grupos vinculadas a esta sessão
  const gruposIds = (sessao.grupos_ids as string[]) ?? [];
  let grupos: { id: string; nome: string }[] = [];

  if (gruposIds.length > 0) {
    const { data: gruposData } = await supabase
      .from("grupos")
      .select("id, nome")
      .in("id", gruposIds);
    grupos = gruposData ?? [];
  }

  // 3. Obter as matrículas ativas dessas turmas com dados civis dos alunos
  let alunos: {
    matricula_id: string;
    beneficiario_id: string;
    grupo_id: string;
    grupo_nome: string;
    nome_completo: string;
    cpf: string | null;
    data_nascimento: string;
    vulneravel: boolean;
    status_presenca: "presente" | "falta" | "justificada";
    justificativa?: string | null;
  }[] = [];

  if (gruposIds.length > 0) {
    const { data: matriculas } = await supabase
      .from("matriculas")
      .select(`
        id,
        grupo_id,
        vulneravel,
        grupo:grupos(nome),
        beneficiario_id,
        beneficiario:beneficiarios(
          id,
          nome_completo,
          cpf,
          data_nascimento
        )
      `)
      .in("grupo_id", gruposIds)
      .eq("status", "ativa")
      .order("criado_em", { ascending: true });

    // 4. Buscar presenças já salvas (se existirem)
    const { data: presencasSalvas } = await supabase
      .from("beneficiarios_presencas")
      .select("matricula_id, status, justificativa")
      .eq("sessao_id", sessaoId);

    const presencasMap = new Map(
      (presencasSalvas ?? []).map((p) => [p.matricula_id, p])
    );

    alunos = (matriculas ?? []).map((m) => {
      const b = m.beneficiario as {
        id: string;
        nome_completo: string;
        cpf: string | null;
        data_nascimento: string;
      } | null;
      const g = m.grupo as { nome: string } | null;
      const presencaExistente = presencasMap.get(m.id);

      return {
        matricula_id: m.id,
        beneficiario_id: m.beneficiario_id,
        grupo_id: m.grupo_id,
        grupo_nome: g?.nome ?? "Turma",
        nome_completo: b?.nome_completo ?? "Beneficiário",
        cpf: b?.cpf ?? null,
        data_nascimento: b?.data_nascimento ?? "",
        vulneravel: Boolean(m.vulneravel),
        status_presenca: (presencaExistente?.status as "presente" | "falta" | "justificada") ?? "presente",
        justificativa: presencaExistente?.justificativa ?? null,
      };
    });
  }

  return {
    success: true,
    data: {
      sessao,
      grupos,
      alunos,
    },
  };
}

export async function concluirSessao(input: ConcluirSessaoInput) {
  const supabase = await createClient();

  const parsed = concluirSessaoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // 1. Verificar se a sessão existe e se ainda está em andamento
  const { data: sessao, error: sessaoError } = await supabase
    .from("sessoes")
    .select("id, status, objeto_id, local_id, funcionario_id, hora_inicio, data")
    .eq("id", parsed.data.sessao_id)
    .single();

  if (sessaoError || !sessao) {
    return { success: false, error: "Sessão não encontrada." };
  }

  if (sessao.status === "concluida") {
    return {
      success: false,
      error: "Regra Canônica §3.5: Esta sessão já foi concluída e está travada como snapshot probatório imutável.",
    };
  }

  const horaFimFormatada =
    parsed.data.hora_fim.length === 5
      ? `${parsed.data.hora_fim}:00`
      : parsed.data.hora_fim;

  // 2. Travar a sessão como 'concluida' com fotos e observações
  const { data: sessaoAtualizada, error: updateError } = await supabase
    .from("sessoes")
    .update({
      hora_fim: horaFimFormatada,
      status: "concluida",
      fotos_urls: parsed.data.fotos_urls,
      observacoes: parsed.data.observacoes || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", parsed.data.sessao_id)
    .select()
    .single();

  if (updateError || !sessaoAtualizada) {
    return { success: false, error: updateError?.message ?? "Erro ao concluir sessão." };
  }

  // 3. Atualizar o Ponto Eletrônico (Clock-out): registrar saída da jornada
  await supabase
    .from("registros_ponto")
    .update({
      hora_saida: horaFimFormatada,
      atualizado_em: new Date().toISOString(),
    })
    .eq("sessao_id", parsed.data.sessao_id);

  // 4. Salvar chamadas nominais em lote na tabela beneficiarios_presencas
  if (parsed.data.presencas && parsed.data.presencas.length > 0) {
    // Remove presenças parciais se houver
    await supabase
      .from("beneficiarios_presencas")
      .delete()
      .eq("sessao_id", parsed.data.sessao_id);

    const presencasPayload = parsed.data.presencas.map((p) => ({
      sessao_id: parsed.data.sessao_id,
      matricula_id: p.matricula_id,
      beneficiario_id: p.beneficiario_id,
      status: p.status,
      justificativa: p.justificativa || null,
      comprovante_url: p.comprovante_url || null,
    }));

    const { error: presencasError } = await supabase
      .from("beneficiarios_presencas")
      .insert(presencasPayload);

    if (presencasError) {
      console.error("Erro ao salvar presenças dos beneficiários:", presencasError.message);
    }
  }

  revalidatePath("/sessoes");
  revalidatePath(`/sessoes/${parsed.data.sessao_id}`);
  revalidatePath("/calendario");
  revalidatePath("/relatorios");
  return { success: true, data: sessaoAtualizada };
}

export async function uploadFotoSessao(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("foto") as File | null;
  if (!file) {
    return { success: false, error: "Nenhum arquivo enviado." };
  }

  // Validar se é imagem
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "O arquivo deve ser uma imagem válida (JPEG, PNG, WebP)." };
  }

  // Limite de 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "A imagem não pode ultrapassar 10MB." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const filePath = `aulas/${fileName}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("sessoes-fotos")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: `Falha no upload: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from("sessoes-fotos")
    .getPublicUrl(filePath);

  return { success: true, url: publicUrlData.publicUrl };
}
