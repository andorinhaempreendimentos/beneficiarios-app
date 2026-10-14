"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/database.types";
import {
  matriculaSchema,
  type MatriculaInput,
} from "@/lib/validations/fase-2";

export interface MatriculaListItem {
  id: string;
  objeto_id: string;
  grupo_id: string;
  beneficiario_id: string;
  status: "ativo" | "pre_inscrito" | "lista_espera" | "concluido" | "cancelado";
  vulneravel: boolean;
  dados_adicionais: Record<string, unknown>;
  data_matricula: string;
  data_cancelamento: string | null;
  motivo_cancelamento: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  beneficiario: {
    id: string;
    nome_completo: string;
    cpf: string;
    data_nascimento: string;
    genero: string;
    telefone: string | null;
    nome_responsavel: string | null;
    telefone_responsavel: string | null;
    idade: number;
  };
  objeto: {
    id: string;
    nome: string;
    tipo: "continuo" | "pontual";
    termo_grupo: string;
    termo_beneficiario: string;
    termo_local: string;
  };
  grupo: {
    id: string;
    nome: string;
    capacidade_maxima: number;
    idade_minima: number | null;
    idade_maxima: number | null;
    ativo: boolean;
    local: {
      id: string;
      nome: string;
    } | null;
    modalidade: {
      id: string;
      nome: string;
    } | null;
  };
}

export interface GetMatriculasFilters {
  objetoId?: string;
  grupoId?: string;
  localId?: string;
  status?: string;
  vulneravel?: boolean;
  search?: string;
}

interface RawMatriculaQueryRow {
  id: string;
  objeto_id: string;
  grupo_id: string;
  beneficiario_id: string;
  status: string;
  vulneravel: boolean | null;
  dados_adicionais: Record<string, unknown> | null;
  data_matricula: string;
  data_cancelamento: string | null;
  motivo_cancelamento: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  beneficiario: {
    id: string;
    nome_completo: string;
    cpf: string;
    data_nascimento: string;
    genero: string;
    telefone: string | null;
    nome_responsavel: string | null;
    telefone_responsavel: string | null;
  } | null;
  objeto: {
    id: string;
    nome: string;
    tipo: string;
    termo_grupo: string | null;
    termo_beneficiario: string | null;
    termo_local: string | null;
  } | null;
  grupo: {
    id: string;
    nome: string;
    capacidade_maxima: number;
    idade_minima: number | null;
    idade_maxima: number | null;
    ativo: boolean;
    local_id?: string;
    local: {
      id: string;
      nome: string;
    } | null;
    modalidade: {
      id: string;
      nome: string;
    } | null;
  } | null;
}

function calcularIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0;
  const parts = dataNascimento.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return 0;
  }
  const [ano, mes, dia] = parts;
  const nasc = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade >= 0 ? idade : 0;
}

export async function getMatriculas(
  filters?: GetMatriculasFilters
): Promise<MatriculaListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("matriculas")
    .select(`
      id,
      objeto_id,
      grupo_id,
      beneficiario_id,
      status,
      vulneravel,
      dados_adicionais,
      data_matricula,
      data_cancelamento,
      motivo_cancelamento,
      criado_em,
      atualizado_em,
      beneficiario:beneficiarios(
        id,
        nome_completo,
        cpf,
        data_nascimento,
        genero,
        telefone,
        nome_responsavel,
        telefone_responsavel
      ),
      objeto:objetos(
        id,
        nome,
        tipo,
        termo_grupo,
        termo_beneficiario,
        termo_local
      ),
      grupo:grupos(
        id,
        nome,
        capacidade_maxima,
        idade_minima,
        idade_maxima,
        ativo,
        local_id,
        local:locais(id, nome),
        modalidade:modalidades(id, nome)
      )
    `)
    .order("criado_em", { ascending: false });

  if (filters?.objetoId && filters.objetoId !== "todos") {
    query = query.eq("objeto_id", filters.objetoId);
  }

  if (filters?.grupoId && filters.grupoId !== "todos") {
    query = query.eq("grupo_id", filters.grupoId);
  }

  if (filters?.status && filters.status !== "todos") {
    query = query.eq("status", filters.status);
  }

  if (filters?.vulneravel !== undefined) {
    query = query.eq("vulneravel", filters.vulneravel);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar matrículas: ${error.message}`);
  }

  const rows = (data || []) as unknown as RawMatriculaQueryRow[];

  let result: MatriculaListItem[] = rows.map((r) => {
    const b = r.beneficiario || {
      id: r.beneficiario_id,
      nome_completo: "Beneficiário Desconhecido",
      cpf: "",
      data_nascimento: "",
      genero: "Nao_informado",
      telefone: null,
      nome_responsavel: null,
      telefone_responsavel: null,
    };

    const obj = r.objeto || {
      id: r.objeto_id,
      nome: "Projeto Desconhecido",
      tipo: "continuo",
      termo_grupo: "Grupo",
      termo_beneficiario: "Beneficiário",
      termo_local: "Local",
    };

    const grp = r.grupo || {
      id: r.grupo_id,
      nome: "Grupo Desconhecido",
      capacidade_maxima: 0,
      idade_minima: null,
      idade_maxima: null,
      ativo: false,
      local: null,
      modalidade: null,
    };

    return {
      id: r.id,
      objeto_id: r.objeto_id,
      grupo_id: r.grupo_id,
      beneficiario_id: r.beneficiario_id,
      status: r.status as MatriculaListItem["status"],
      vulneravel: Boolean(r.vulneravel),
      dados_adicionais: r.dados_adicionais || {},
      data_matricula: r.data_matricula,
      data_cancelamento: r.data_cancelamento,
      motivo_cancelamento: r.motivo_cancelamento,
      criado_em: r.criado_em,
      atualizado_em: r.atualizado_em,
      beneficiario: {
        id: b.id,
        nome_completo: b.nome_completo,
        cpf: b.cpf,
        data_nascimento: b.data_nascimento,
        genero: b.genero,
        telefone: b.telefone,
        nome_responsavel: b.nome_responsavel,
        telefone_responsavel: b.telefone_responsavel,
        idade: calcularIdade(b.data_nascimento),
      },
      objeto: {
        id: obj.id,
        nome: obj.nome,
        tipo: obj.tipo === "pontual" ? "pontual" : "continuo",
        termo_grupo: obj.termo_grupo || "Grupo",
        termo_beneficiario: obj.termo_beneficiario || "Beneficiário",
        termo_local: obj.termo_local || "Local",
      },
      grupo: {
        id: grp.id,
        nome: grp.nome,
        capacidade_maxima: grp.capacidade_maxima,
        idade_minima: grp.idade_minima,
        idade_maxima: grp.idade_maxima,
        ativo: grp.ativo,
        local: grp.local,
        modalidade: grp.modalidade,
      },
    };
  });

  if (filters?.localId && filters.localId !== "todos") {
    result = result.filter((m) => m.grupo.local?.id === filters.localId);
  }

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.toLowerCase().trim();
    const cleanDigits = term.replace(/\D/g, "");
    result = result.filter((m) => {
      const nomeMatch = m.beneficiario.nome_completo
        .toLowerCase()
        .includes(term);
      const cpfMatch = cleanDigits.length >= 3 && m.beneficiario.cpf.includes(cleanDigits);
      const grupoMatch = m.grupo.nome.toLowerCase().includes(term);
      return nomeMatch || cpfMatch || grupoMatch;
    });
  }

  return result;
}

export async function getMatriculaById(
  id: string
): Promise<MatriculaListItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matriculas")
    .select(`
      id,
      objeto_id,
      grupo_id,
      beneficiario_id,
      status,
      vulneravel,
      dados_adicionais,
      data_matricula,
      data_cancelamento,
      motivo_cancelamento,
      criado_em,
      atualizado_em,
      beneficiario:beneficiarios(
        id,
        nome_completo,
        cpf,
        data_nascimento,
        genero,
        telefone,
        nome_responsavel,
        telefone_responsavel
      ),
      objeto:objetos(
        id,
        nome,
        tipo,
        termo_grupo,
        termo_beneficiario,
        termo_local
      ),
      grupo:grupos(
        id,
        nome,
        capacidade_maxima,
        idade_minima,
        idade_maxima,
        ativo,
        local:locais(id, nome),
        modalidade:modalidades(id, nome)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Erro ao buscar matrícula: ${error.message}`);
  }

  const r = data as unknown as RawMatriculaQueryRow;

  return {
    id: r.id,
    objeto_id: r.objeto_id,
    grupo_id: r.grupo_id,
    beneficiario_id: r.beneficiario_id,
    status: r.status as MatriculaListItem["status"],
    vulneravel: Boolean(r.vulneravel),
    dados_adicionais: r.dados_adicionais || {},
    data_matricula: r.data_matricula,
    data_cancelamento: r.data_cancelamento,
    motivo_cancelamento: r.motivo_cancelamento,
    criado_em: r.criado_em,
    atualizado_em: r.atualizado_em,
    beneficiario: {
      id: r.beneficiario?.id || r.beneficiario_id,
      nome_completo: r.beneficiario?.nome_completo || "Beneficiário",
      cpf: r.beneficiario?.cpf || "",
      data_nascimento: r.beneficiario?.data_nascimento || "",
      genero: r.beneficiario?.genero || "Nao_informado",
      telefone: r.beneficiario?.telefone || null,
      nome_responsavel: r.beneficiario?.nome_responsavel || null,
      telefone_responsavel: r.beneficiario?.telefone_responsavel || null,
      idade: calcularIdade(r.beneficiario?.data_nascimento || ""),
    },
    objeto: {
      id: r.objeto?.id || r.objeto_id,
      nome: r.objeto?.nome || "Projeto",
      tipo: r.objeto?.tipo === "pontual" ? "pontual" : "continuo",
      termo_grupo: r.objeto?.termo_grupo || "Grupo",
      termo_beneficiario: r.objeto?.termo_beneficiario || "Beneficiário",
      termo_local: r.objeto?.termo_local || "Local",
    },
    grupo: {
      id: r.grupo?.id || r.grupo_id,
      nome: r.grupo?.nome || "Grupo",
      capacidade_maxima: r.grupo?.capacidade_maxima || 0,
      idade_minima: r.grupo?.idade_minima ?? null,
      idade_maxima: r.grupo?.idade_maxima ?? null,
      ativo: Boolean(r.grupo?.ativo),
      local: r.grupo?.local || null,
      modalidade: r.grupo?.modalidade || null,
    },
  };
}

export async function createMatricula(input: MatriculaInput) {
  const validated = matriculaSchema.safeParse(input);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const supabase = await createClient();

  // 1. Verificar beneficiário e calcular idade
  const { data: benef, error: benefError } = await supabase
    .from("beneficiarios")
    .select("id, nome_completo, data_nascimento")
    .eq("id", validated.data.beneficiario_id)
    .single();

  if (benefError || !benef) {
    return { success: false, error: "Beneficiário não localizado no sistema." };
  }

  const idade = calcularIdade(benef.data_nascimento);

  // 2. Verificar o grupo, local e regras de restrição etária
  const { data: grp, error: grpError } = await supabase
    .from("grupos")
    .select("id, nome, capacidade_maxima, idade_minima, idade_maxima, ativo")
    .eq("id", validated.data.grupo_id)
    .single();

  if (grpError || !grp) {
    return { success: false, error: "Grupo não localizado no sistema." };
  }

  if (!grp.ativo) {
    return {
      success: false,
      error: `O grupo "${grp.nome}" está inativo e não pode receber novas matrículas.`,
    };
  }

  // Validação rígida de faixa etária (§3.3)
  if (grp.idade_minima !== null && idade < grp.idade_minima) {
    return {
      success: false,
      error: `Restrição etária não atendida: o participante tem ${idade} anos, mas a idade mínima deste grupo é ${grp.idade_minima} anos.`,
    };
  }

  if (grp.idade_maxima !== null && idade > grp.idade_maxima) {
    return {
      success: false,
      error: `Restrição etária não atendida: o participante tem ${idade} anos, mas a idade máxima deste grupo é ${grp.idade_maxima} anos.`,
    };
  }

  // 3. Verificar duplicidade de matrícula no mesmo grupo
  const { data: dup, error: dupError } = await supabase
    .from("matriculas")
    .select("id, status")
    .eq("beneficiario_id", validated.data.beneficiario_id)
    .eq("grupo_id", validated.data.grupo_id)
    .in("status", ["ativo", "lista_espera", "pre_inscrito"])
    .maybeSingle();

  if (dupError) {
    return { success: false, error: `Erro ao verificar duplicidade: ${dupError.message}` };
  }

  if (dup) {
    return {
      success: false,
      error: `Este participante já possui uma matrícula com status "${dup.status}" neste mesmo grupo.`,
    };
  }

  // 4. Se status for "ativo", verificar capacidade de vagas
  const statusFinal = validated.data.status;
  if (statusFinal === "ativo") {
    const { count: ativasCount, error: countError } = await supabase
      .from("matriculas")
      .select("id", { count: "exact", head: true })
      .eq("grupo_id", validated.data.grupo_id)
      .eq("status", "ativo");

    if (countError) {
      return { success: false, error: `Erro ao verificar lotação: ${countError.message}` };
    }

    if (ativasCount !== null && ativasCount >= grp.capacidade_maxima) {
      return {
        success: false,
        error: `O grupo "${grp.nome}" atingiu a capacidade máxima de ${grp.capacidade_maxima} vagas (${ativasCount} preenchidas). Cadastre na Lista de Espera ou aumente a capacidade do grupo.`,
      };
    }
  }

  // 5. Inserir matrícula
  const { data: inserted, error: insertError } = await supabase
    .from("matriculas")
    .insert({
      objeto_id: validated.data.objeto_id,
      grupo_id: validated.data.grupo_id,
      beneficiario_id: validated.data.beneficiario_id,
      data_matricula: validated.data.data_matricula,
      status: statusFinal,
      vulneravel: validated.data.vulneravel,
      dados_adicionais: (validated.data.dados_adicionais || {}) as unknown as Json,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: `Erro ao criar matrícula: ${insertError.message}` };
  }

  revalidatePath("/matriculas");
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${validated.data.grupo_id}`);
  revalidatePath(`/beneficiarios/${validated.data.beneficiario_id}`);

  return { success: true, data: inserted };
}

export async function updateMatricula(
  id: string,
  input: {
    vulneravel?: boolean;
    dados_adicionais?: Record<string, unknown>;
  }
) {
  const supabase = await createClient();

  const updatePayload: {
    atualizado_em: string;
    vulneravel?: boolean;
    dados_adicionais?: Json;
  } = {
    atualizado_em: new Date().toISOString(),
  };

  if (input.vulneravel !== undefined) {
    updatePayload.vulneravel = input.vulneravel;
  }

  if (input.dados_adicionais !== undefined) {
    updatePayload.dados_adicionais = input.dados_adicionais as unknown as Json;
  }

  const { data, error } = await supabase
    .from("matriculas")
    .update(updatePayload)
    .eq("id", id)
    .select("id, grupo_id, beneficiario_id")
    .single();

  if (error) {
    return { success: false, error: `Erro ao atualizar matrícula: ${error.message}` };
  }

  revalidatePath("/matriculas");
  revalidatePath(`/grupos/${data.grupo_id}`);
  revalidatePath(`/beneficiarios/${data.beneficiario_id}`);

  return { success: true, data };
}

export async function cancelarMatricula(id: string, motivo: string) {
  if (!motivo || !motivo.trim()) {
    return { success: false, error: "Informe o motivo do cancelamento da matrícula." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matriculas")
    .update({
      status: "cancelado",
      data_cancelamento: new Date().toISOString().split("T")[0],
      motivo_cancelamento: motivo.trim(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, grupo_id, beneficiario_id")
    .single();

  if (error) {
    return { success: false, error: `Erro ao cancelar matrícula: ${error.message}` };
  }

  revalidatePath("/matriculas");
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${data.grupo_id}`);
  revalidatePath(`/beneficiarios/${data.beneficiario_id}`);

  return { success: true, data };
}

export async function reativarMatricula(id: string) {
  const supabase = await createClient();

  // 1. Buscar a matrícula atual com grupo e beneficiário
  const { data: mat, error: matError } = await supabase
    .from("matriculas")
    .select(`
      id,
      grupo_id,
      beneficiario_id,
      beneficiario:beneficiarios(data_nascimento),
      grupo:grupos(capacidade_maxima, idade_minima, idade_maxima, ativo, nome)
    `)
    .eq("id", id)
    .single();

  if (matError || !mat) {
    return { success: false, error: "Matrícula não encontrada." };
  }

  const grp = (mat.grupo as unknown) as {
    capacidade_maxima: number;
    idade_minima: number | null;
    idade_maxima: number | null;
    ativo: boolean;
    nome: string;
  };

  const benef = (mat.beneficiario as unknown) as {
    data_nascimento: string;
  };

  if (!grp.ativo) {
    return { success: false, error: `O grupo "${grp.nome}" está inativo.` };
  }

  // Validar idade atual
  const idade = calcularIdade(benef.data_nascimento);
  if (grp.idade_minima !== null && idade < grp.idade_minima) {
    return {
      success: false,
      error: `O participante tem ${idade} anos (mínimo exigido: ${grp.idade_minima} anos).`,
    };
  }
  if (grp.idade_maxima !== null && idade > grp.idade_maxima) {
    return {
      success: false,
      error: `O participante tem ${idade} anos (máximo permitido: ${grp.idade_maxima} anos).`,
    };
  }

  // Verificar vagas ativas
  const { count: ativasCount } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", mat.grupo_id)
    .eq("status", "ativo");

  let novoStatus: "ativo" | "lista_espera" = "ativo";
  if (ativasCount !== null && ativasCount >= grp.capacidade_maxima) {
    novoStatus = "lista_espera";
  }

  const { data: updated, error: updateError } = await supabase
    .from("matriculas")
    .update({
      status: novoStatus,
      data_cancelamento: null,
      motivo_cancelamento: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: `Erro ao reativar: ${updateError.message}` };
  }

  revalidatePath("/matriculas");
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${mat.grupo_id}`);
  revalidatePath(`/beneficiarios/${mat.beneficiario_id}`);

  return {
    success: true,
    data: updated,
    aviso:
      novoStatus === "lista_espera"
        ? `O grupo atingiu a capacidade máxima. A matrícula foi reativada com status "Lista de Espera".`
        : undefined,
  };
}

export async function promoverFilaEspera(id: string) {
  const supabase = await createClient();

  const { data: mat, error: matError } = await supabase
    .from("matriculas")
    .select(`
      id,
      grupo_id,
      beneficiario_id,
      status,
      grupo:grupos(capacidade_maxima, nome)
    `)
    .eq("id", id)
    .single();

  if (matError || !mat) {
    return { success: false, error: "Matrícula não encontrada." };
  }

  if (mat.status !== "lista_espera" && mat.status !== "pre_inscrito") {
    return {
      success: false,
      error: `Apenas participantes na lista de espera ou pré-inscritos podem ser promovidos para ativo.`,
    };
  }

  const grp = (mat.grupo as unknown) as {
    capacidade_maxima: number;
    nome: string;
  };

  // Verificar vagas no grupo
  const { count: ativasCount, error: countError } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", mat.grupo_id)
    .eq("status", "ativo");

  if (countError) {
    return { success: false, error: countError.message };
  }

  if (ativasCount !== null && ativasCount >= grp.capacidade_maxima) {
    return {
      success: false,
      error: `Não há vagas disponíveis no grupo "${grp.nome}". A capacidade máxima (${grp.capacidade_maxima}) já está preenchida.`,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("matriculas")
    .update({
      status: "ativo",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/matriculas");
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${mat.grupo_id}`);
  revalidatePath(`/beneficiarios/${mat.beneficiario_id}`);

  return { success: true, data: updated };
}

export async function deleteMatricula(id: string) {
  const supabase = await createClient();

  // Verificar se há presenças registradas vinculadas a esta matrícula
  const { count: presencasCount, error: countError } = await supabase
    .from("beneficiarios_presencas")
    .select("id", { count: "exact", head: true })
    .eq("matricula_id", id);

  if (countError) {
    return { success: false, error: countError.message };
  }

  if (presencasCount && presencasCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir esta matrícula pois já existem ${presencasCount} chamada(s) e registros de presença vinculados a ela. Para manter a auditoria governamental (MROSC), utilize a opção "Cancelar Matrícula".`,
    };
  }

  const { data: mat } = await supabase
    .from("matriculas")
    .select("grupo_id, beneficiario_id")
    .eq("id", id)
    .single();

  const { error: delError } = await supabase
    .from("matriculas")
    .delete()
    .eq("id", id);

  if (delError) {
    return { success: false, error: `Erro ao excluir: ${delError.message}` };
  }

  revalidatePath("/matriculas");
  if (mat?.grupo_id) revalidatePath(`/grupos/${mat.grupo_id}`);
  if (mat?.beneficiario_id) revalidatePath(`/beneficiarios/${mat.beneficiario_id}`);

  return { success: true };
}
