"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  beneficiarioSchema,
  type BeneficiarioInput,
} from "@/lib/validations/fase-2";

export interface MatriculaResumo {
  id: string;
  objeto_id: string;
  objeto_nome: string;
  grupo_id: string;
  grupo_nome: string;
  local_nome?: string;
  modalidade_nome?: string;
  status: string;
  vulneravel: boolean;
  data_matricula: string;
}

export interface BeneficiarioListItem {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  genero: string;
  telefone: string | null;
  nome_responsavel: string | null;
  telefone_responsavel: string | null;
  idade: number;
  total_matriculas: number;
  matriculas_ativas: number;
  matriculas: MatriculaResumo[];
  criado_em: string | null;
  atualizado_em: string | null;
}

export interface BeneficiarioDetalhes extends BeneficiarioListItem {
  frequencia_stats?: {
    total_registros: number;
    presentes: number;
    faltas: number;
    justificadas: number;
    percentual_presenca: number;
  };
}

export interface GetBeneficiariosFilter {
  search?: string;
  objetoId?: string;
  grupoId?: string;
  statusMatricula?: string;
  vulneravel?: boolean;
}

interface RawMatriculaJoin {
  id: string;
  objeto_id: string;
  grupo_id: string;
  status: string;
  vulneravel: boolean | null;
  data_matricula: string;
  objeto?: { id: string; nome: string } | null;
  grupo?: {
    id: string;
    nome: string;
    local?: { id: string; nome: string } | null;
    modalidade?: { id: string; nome: string } | null;
  } | null;
}

interface BeneficiarioRawRow {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  genero: string;
  telefone: string | null;
  nome_responsavel: string | null;
  telefone_responsavel: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  matriculas?: RawMatriculaJoin[] | null;
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

function formatarCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export async function getBeneficiarios(
  filters?: GetBeneficiariosFilter
): Promise<BeneficiarioListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("beneficiarios")
    .select(`
      id,
      nome_completo,
      cpf,
      data_nascimento,
      genero,
      telefone,
      nome_responsavel,
      telefone_responsavel,
      criado_em,
      atualizado_em,
      matriculas:matriculas(
        id,
        objeto_id,
        grupo_id,
        status,
        vulneravel,
        data_matricula,
        objeto:objetos(id, nome),
        grupo:grupos(id, nome, local:locais(id, nome), modalidade:modalidades(id, nome))
      )
    `)
    .order("nome_completo", { ascending: true });

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim();
    const cleanDigits = term.replace(/\D/g, "");
    if (cleanDigits.length >= 3) {
      query = query.or(`nome_completo.ilike.%${term}%,cpf.ilike.%${cleanDigits}%`);
    } else {
      query = query.ilike("nome_completo", `%${term}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar beneficiários: ${error.message}`);
  }

  const rows = (data || []) as unknown as BeneficiarioRawRow[];

  // Filtragem pós-query para relacionamentos de matrículas
  let result: BeneficiarioListItem[] = rows.map((b) => {
    const rawMatriculas = Array.isArray(b.matriculas) ? b.matriculas : [];
    
    const matriculas: MatriculaResumo[] = rawMatriculas.map((m) => ({
      id: m.id,
      objeto_id: m.objeto_id,
      objeto_nome: m.objeto?.nome || "Projeto Desconhecido",
      grupo_id: m.grupo_id,
      grupo_nome: m.grupo?.nome || "Turma Desconhecida",
      local_nome: m.grupo?.local?.nome,
      modalidade_nome: m.grupo?.modalidade?.nome,
      status: m.status,
      vulneravel: Boolean(m.vulneravel),
      data_matricula: m.data_matricula,
    }));

    const ativas = matriculas.filter((m) => m.status === "ativo").length;

    return {
      id: b.id,
      nome_completo: b.nome_completo,
      cpf: b.cpf,
      data_nascimento: b.data_nascimento,
      genero: b.genero,
      telefone: b.telefone,
      nome_responsavel: b.nome_responsavel,
      telefone_responsavel: b.telefone_responsavel,
      idade: calcularIdade(b.data_nascimento),
      total_matriculas: matriculas.length,
      matriculas_ativas: ativas,
      matriculas,
      criado_em: b.criado_em,
      atualizado_em: b.atualizado_em,
    };
  });

  if (filters?.objetoId && filters.objetoId !== "todos") {
    result = result.filter((b) =>
      b.matriculas.some((m) => m.objeto_id === filters.objetoId)
    );
  }

  if (filters?.grupoId && filters.grupoId !== "todos") {
    result = result.filter((b) =>
      b.matriculas.some((m) => m.grupo_id === filters.grupoId)
    );
  }

  if (filters?.statusMatricula && filters.statusMatricula !== "todos") {
    result = result.filter((b) =>
      b.matriculas.some((m) => m.status === filters.statusMatricula)
    );
  }

  if (filters?.vulneravel !== undefined) {
    result = result.filter((b) =>
      b.matriculas.some((m) => m.vulneravel === filters.vulneravel)
    );
  }

  return result;
}

export async function getBeneficiarioById(
  id: string
): Promise<BeneficiarioDetalhes | null> {
  const supabase = await createClient();

  const { data: b, error } = await supabase
    .from("beneficiarios")
    .select(`
      id,
      nome_completo,
      cpf,
      data_nascimento,
      genero,
      telefone,
      nome_responsavel,
      telefone_responsavel,
      criado_em,
      atualizado_em,
      matriculas:matriculas(
        id,
        objeto_id,
        grupo_id,
        status,
        vulneravel,
        data_matricula,
        motivo_cancelamento,
        data_cancelamento,
        dados_adicionais,
        objeto:objetos(id, nome, tipo, concedente:concedentes(nome)),
        grupo:grupos(id, nome, local:locais(id, nome), modalidade:modalidades(id, nome))
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Erro ao buscar beneficiário: ${error.message}`);
  }

  const rawMatriculas = (Array.isArray(b.matriculas) ? b.matriculas : []) as RawMatriculaJoin[];
  const matriculas: MatriculaResumo[] = rawMatriculas.map((m: RawMatriculaJoin) => ({
    id: m.id,
    objeto_id: m.objeto_id,
    objeto_nome: m.objeto?.nome || "Projeto Desconhecido",
    grupo_id: m.grupo_id,
    grupo_nome: m.grupo?.nome || "Turma Desconhecida",
    local_nome: m.grupo?.local?.nome,
    modalidade_nome: m.grupo?.modalidade?.nome,
    status: m.status,
    vulneravel: Boolean(m.vulneravel),
    data_matricula: m.data_matricula,
  }));

  // Buscar frequências desnormalizadas
  const { data: presencas } = await supabase
    .from("beneficiarios_presencas")
    .select("status")
    .eq("beneficiario_id", id);

  const freq = {
    total_registros: presencas?.length || 0,
    presentes: presencas?.filter((p) => p.status === "presente").length || 0,
    faltas: presencas?.filter((p) => p.status === "falta").length || 0,
    justificadas: presencas?.filter((p) => p.status === "justificada").length || 0,
    percentual_presenca: 0,
  };

  if (freq.total_registros > 0) {
    freq.percentual_presenca = Math.round(
      ((freq.presentes + freq.justificadas) / freq.total_registros) * 100
    );
  }

  return {
    id: b.id,
    nome_completo: b.nome_completo,
    cpf: b.cpf,
    data_nascimento: b.data_nascimento,
    genero: b.genero,
    telefone: b.telefone,
    nome_responsavel: b.nome_responsavel,
    telefone_responsavel: b.telefone_responsavel,
    idade: calcularIdade(b.data_nascimento),
    total_matriculas: matriculas.length,
    matriculas_ativas: matriculas.filter((m) => m.status === "ativo").length,
    matriculas,
    frequencia_stats: freq,
    criado_em: b.criado_em,
    atualizado_em: b.atualizado_em,
  };
}

export async function getBeneficiarioByCpf(cpf: string) {
  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11) {
    return { found: false, error: "CPF deve ter 11 dígitos" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beneficiarios")
    .select(`
      id,
      nome_completo,
      cpf,
      data_nascimento,
      genero,
      telefone,
      nome_responsavel,
      telefone_responsavel,
      matriculas:matriculas(
        id,
        objeto_id,
        grupo_id,
        status,
        vulneravel,
        data_matricula,
        objeto:objetos(id, nome),
        grupo:grupos(id, nome)
      )
    `)
    .eq("cpf", cleanCpf)
    .maybeSingle();

  if (error) {
    return { found: false, error: error.message };
  }

  if (!data) {
    return { found: false };
  }

  const rawMatriculas = (Array.isArray(data.matriculas) ? data.matriculas : []) as RawMatriculaJoin[];
  const matriculas: MatriculaResumo[] = rawMatriculas.map((m: RawMatriculaJoin) => ({
    id: m.id,
    objeto_id: m.objeto_id,
    objeto_nome: m.objeto?.nome || "Projeto Desconhecido",
    grupo_id: m.grupo_id,
    grupo_nome: m.grupo?.nome || "Turma Desconhecida",
    status: m.status,
    vulneravel: Boolean(m.vulneravel),
    data_matricula: m.data_matricula,
  }));

  return {
    found: true,
    beneficiario: {
      id: data.id,
      nome_completo: data.nome_completo,
      cpf: data.cpf,
      data_nascimento: data.data_nascimento,
      genero: data.genero,
      telefone: data.telefone,
      nome_responsavel: data.nome_responsavel,
      telefone_responsavel: data.telefone_responsavel,
      idade: calcularIdade(data.data_nascimento),
      total_matriculas: matriculas.length,
      matriculas_ativas: matriculas.filter((m) => m.status === "ativo").length,
      matriculas,
    },
  };
}

export async function createBeneficiario(input: BeneficiarioInput) {
  const validated = beneficiarioSchema.safeParse(input);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const cleanCpf = validated.data.cpf.replace(/\D/g, "");
  const supabase = await createClient();

  // Verificar unicidade universal do CPF
  const { data: existing, error: checkError } = await supabase
    .from("beneficiarios")
    .select("id, nome_completo")
    .eq("cpf", cleanCpf)
    .maybeSingle();

  if (checkError) {
    return { success: false, error: `Erro ao verificar CPF: ${checkError.message}` };
  }

  if (existing) {
    return {
      success: false,
      error: `Já existe um beneficiário cadastrado com o CPF ${formatarCpf(cleanCpf)}: ${existing.nome_completo}. Utilize o cadastro existente.`,
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("beneficiarios")
    .insert({
      nome_completo: validated.data.nome_completo.trim(),
      cpf: cleanCpf,
      data_nascimento: validated.data.data_nascimento,
      genero: validated.data.genero,
      telefone: validated.data.telefone?.trim() || null,
      nome_responsavel: validated.data.nome_responsavel?.trim() || null,
      telefone_responsavel: validated.data.telefone_responsavel?.trim() || null,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: `Erro ao criar beneficiário: ${insertError.message}` };
  }

  revalidatePath("/beneficiarios");
  revalidatePath("/matriculas");
  revalidatePath("/grupos");

  return { success: true, data: inserted };
}

export async function updateBeneficiario(id: string, input: BeneficiarioInput) {
  const validated = beneficiarioSchema.safeParse(input);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const cleanCpf = validated.data.cpf.replace(/\D/g, "");
  const supabase = await createClient();

  // Verificar se outro beneficiário possui este CPF
  const { data: existing, error: checkError } = await supabase
    .from("beneficiarios")
    .select("id, nome_completo")
    .eq("cpf", cleanCpf)
    .neq("id", id)
    .maybeSingle();

  if (checkError) {
    return { success: false, error: `Erro ao validar CPF: ${checkError.message}` };
  }

  if (existing) {
    return {
      success: false,
      error: `O CPF ${formatarCpf(cleanCpf)} já está em uso por outro beneficiário (${existing.nome_completo}).`,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("beneficiarios")
    .update({
      nome_completo: validated.data.nome_completo.trim(),
      cpf: cleanCpf,
      data_nascimento: validated.data.data_nascimento,
      genero: validated.data.genero,
      telefone: validated.data.telefone?.trim() || null,
      nome_responsavel: validated.data.nome_responsavel?.trim() || null,
      telefone_responsavel: validated.data.telefone_responsavel?.trim() || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: `Erro ao atualizar beneficiário: ${updateError.message}` };
  }

  revalidatePath("/beneficiarios");
  revalidatePath(`/beneficiarios/${id}`);
  revalidatePath("/matriculas");

  return { success: true, data: updated };
}

export async function deleteBeneficiario(id: string) {
  const supabase = await createClient();

  // Verificar se há matrículas vinculadas
  const { count: matriculasCount, error: countError } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("beneficiario_id", id);

  if (countError) {
    return { success: false, error: `Erro ao verificar dependências: ${countError.message}` };
  }

  if (matriculasCount && matriculasCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir este beneficiário pois ele possui ${matriculasCount} matrícula(s) registradas no sistema. Cancele as matrículas antes ou mantenha o histórico civil.`,
    };
  }

  const { error: deleteError } = await supabase
    .from("beneficiarios")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { success: false, error: `Erro ao excluir beneficiário: ${deleteError.message}` };
  }

  revalidatePath("/beneficiarios");
  revalidatePath("/matriculas");

  return { success: true };
}
