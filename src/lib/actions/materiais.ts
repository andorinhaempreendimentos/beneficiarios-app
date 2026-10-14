"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  objetoMaterialSchema,
  remessaPoloSchema,
  entregaAlunoSchema,
  entregaLoteTurmaSchema,
  type ObjetoMaterialInput,
  type RemessaPoloInput,
  type EntregaAlunoInput,
  type EntregaLoteTurmaInput,
} from "@/lib/validations/fase-7";

export interface ObjetoMaterialItem {
  id: string;
  nome_item: string;
  tipo: "coletivo" | "individual";
  quantidade_prevista: number;
  quantidade_adquirida: number;
  especificacoes: string | null;
  destinacao: string;
  total_remetido: number;
  total_entregue: number;
}

export interface RemessaPoloItem {
  id: string;
  objeto_material_id: string;
  material_nome: string;
  tipo: string;
  local_id: string;
  local_nome: string;
  quantidade_enviada: number;
  data_remessa: string;
  codigo_patrimonio: string | null;
  responsavel_nome: string;
  fotos_urls: string[];
  documento_url: string | null;
  observacoes: string | null;
}

export interface EntregaAlunoItem {
  id: string;
  objeto_material_id: string;
  material_nome: string;
  matricula_id: string;
  aluno_nome: string;
  aluno_cpf: string;
  turma_nome: string;
  local_nome: string;
  instrutor_nome: string;
  data_entrega: string;
  tamanho_entregue: string | null;
  foto_comprovante_url: string | null;
  status: string;
}

export interface DemandaTamanhoItem {
  polo_id: string;
  polo_nome: string;
  tamanho: string;
  quantidade: number;
}

export interface LogisticaMateriaisData {
  objeto: {
    id: string;
    nome: string;
    termo_local: string;
    termo_instrutor: string;
    termo_grupo: string;
    termo_beneficiario: string;
    termo_materiais_coletivos: string;
    termo_materiais_concedidos: string;
  } | null;
  indicadores: {
    totalItensCatalogo: number;
    totalUnidadesAdquiridas: number;
    totalRemessasPolos: number;
    totalKitsEntregues: number;
  };
  materiais: ObjetoMaterialItem[];
  remessas: RemessaPoloItem[];
  entregas: EntregaAlunoItem[];
  demandasTamanhos: DemandaTamanhoItem[];
  locais: { id: string; nome: string }[];
  instrutores: { id: string; nome: string; local_id: string | null }[];
}

/**
 * 1. Obter todos os dados de logística de materiais e estoque (§3.10)
 */
export async function getLogisticaMateriaisData(
  objetoIdFiltro?: string,
  localIdFiltro?: string
): Promise<LogisticaMateriaisData> {
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
        totalItensCatalogo: 0,
        totalUnidadesAdquiridas: 0,
        totalRemessasPolos: 0,
        totalKitsEntregues: 0,
      },
      materiais: [],
      remessas: [],
      entregas: [],
      demandasTamanhos: [],
      locais: [],
      instrutores: [],
    };
  }

  const { data: obj } = await supabase
    .from("objetos")
    .select(`
      id,
      nome,
      termo_local,
      termo_instrutor,
      termo_grupo,
      termo_beneficiario,
      termo_materiais_coletivos,
      termo_materiais_concedidos
    `)
    .eq("id", objetoId)
    .single();

  // 2. Buscar Polos e Instrutores do Objeto
  const { data: locaisRaw } = await supabase
    .from("locais")
    .select("id, nome")
    .eq("objeto_id", objetoId)
    .eq("ativo", true)
    .order("nome");

  const { data: instRaw } = await supabase
    .from("funcionarios")
    .select("id, nome_completo, local_id")
    .eq("objeto_id", objetoId)
    .eq("situacao", "ativo")
    .order("nome_completo");

  // 3. Buscar Catálogo de Materiais
  const { data: materiaisRaw } = await supabase
    .from("objeto_materiais")
    .select("*")
    .eq("objeto_id", objetoId)
    .order("nome_item");

  const materiaisLista = materiaisRaw ?? [];

  // 4. Buscar Remessas aos Polos
  let remessasQuery = supabase
    .from("materiais_remessas_polo")
    .select(`
      id,
      objeto_material_id,
      local_id,
      quantidade_enviada,
      data_remessa,
      codigo_patrimonio,
      responsavel_recebimento_id,
      fotos_urls,
      documento_comprovante_url,
      observacoes,
      material:objeto_materiais(nome_item, tipo),
      local:locais(nome),
      responsavel:funcionarios(nome_completo)
    `)
    .order("data_remessa", { ascending: false });

  if (localIdFiltro && localIdFiltro !== "todos") {
    remessasQuery = remessasQuery.eq("local_id", localIdFiltro);
  }

  const { data: remessasRaw } = await remessasQuery;
  const remessasBanco = remessasRaw ?? [];

  // 5. Buscar Entregas Individuais aos Alunos
  let entregasQuery = supabase
    .from("materiais_entregas_aluno")
    .select(`
      id,
      objeto_material_id,
      matricula_id,
      instrutor_id,
      data_entrega,
      status,
      tamanho_entregue,
      foto_comprovante_url,
      material:objeto_materiais(nome_item),
      matricula:matriculas(
        id,
        beneficiario:beneficiarios(nome_completo, cpf),
        grupo:grupos(nome, local:locais(nome))
      ),
      instrutor:funcionarios(nome_completo)
    `)
    .order("data_entrega", { ascending: false });

  const { data: entregasRaw } = await entregasQuery;
  const entregasBanco = entregasRaw ?? [];

  // 6. Totalizadores por Material
  const totalRemetidoPorMaterial = new Map<string, number>();
  remessasBanco.forEach((r) => {
    totalRemetidoPorMaterial.set(
      r.objeto_material_id,
      (totalRemetidoPorMaterial.get(r.objeto_material_id) || 0) + (r.quantidade_enviada || 0)
    );
  });

  const totalEntreguePorMaterial = new Map<string, number>();
  entregasBanco.forEach((e) => {
    totalEntreguePorMaterial.set(
      e.objeto_material_id,
      (totalEntreguePorMaterial.get(e.objeto_material_id) || 0) + 1
    );
  });

  let totalAdquiridoGeral = 0;
  const materiaisFormatados: ObjetoMaterialItem[] = materiaisLista.map((mat) => {
    totalAdquiridoGeral += mat.quantidade_adquirida;
    return {
      id: mat.id,
      nome_item: mat.nome_item,
      tipo: (mat.tipo as "coletivo" | "individual") || "coletivo",
      quantidade_prevista: mat.quantidade_prevista,
      quantidade_adquirida: mat.quantidade_adquirida,
      especificacoes: mat.especificacoes,
      destinacao: mat.destinacao,
      total_remetido: totalRemetidoPorMaterial.get(mat.id) || 0,
      total_entregue: totalEntreguePorMaterial.get(mat.id) || 0,
    };
  });

  // Formatar Remessas
  const remessasFormatadas: RemessaPoloItem[] = remessasBanco.map((r) => {
    const mat = r.material as { nome_item: string; tipo: string } | null;
    const loc = r.local as { nome: string } | null;
    const resp = r.responsavel as { nome_completo: string } | null;

    const fotos = Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : [];

    return {
      id: r.id,
      objeto_material_id: r.objeto_material_id,
      material_nome: mat?.nome_item ?? "Item",
      tipo: mat?.tipo ?? "coletivo",
      local_id: r.local_id,
      local_nome: loc?.nome ?? "Polo",
      quantidade_enviada: r.quantidade_enviada,
      data_remessa: r.data_remessa,
      codigo_patrimonio: r.codigo_patrimonio,
      responsavel_nome: resp?.nome_completo ?? "Responsável do Polo",
      fotos_urls: fotos,
      documento_url: r.documento_comprovante_url,
      observacoes: r.observacoes,
    };
  });

  // Formatar Entregas Nominais
  const entregasFormatadas: EntregaAlunoItem[] = entregasBanco.map((e) => {
    const mat = e.material as { nome_item: string } | null;
    const matInfo = e.matricula as unknown as {
      id: string;
      beneficiario: { nome_completo: string; cpf: string } | null;
      grupo: { nome: string; local: { nome: string } | null } | null;
    } | null;
    const inst = e.instrutor as { nome_completo: string } | null;

    return {
      id: e.id,
      objeto_material_id: e.objeto_material_id,
      material_nome: mat?.nome_item ?? "Uniforme",
      matricula_id: e.matricula_id,
      aluno_nome: matInfo?.beneficiario?.nome_completo ?? "Aluno",
      aluno_cpf: matInfo?.beneficiario?.cpf ?? "CPF",
      turma_nome: matInfo?.grupo?.nome ?? "Turma",
      local_nome: matInfo?.grupo?.local?.nome ?? "Polo",
      instrutor_nome: inst?.nome_completo ?? "Instrutor",
      data_entrega: e.data_entrega,
      tamanho_entregue: e.tamanho_entregue,
      foto_comprovante_url: e.foto_comprovante_url,
      status: e.status,
    };
  });

  // 7. Levantamento de Demanda de Tamanhos a partir das Matrículas (§3.10.B)
  const { data: matriculasDemandas } = await supabase
    .from("matriculas")
    .select(`
      id,
      dados_adicionais,
      grupo:grupos(local_id, local:locais(nome))
    `)
    .eq("objeto_id", objetoId)
    .in("status", ["ativa", "pre_inscrito"]);

  const mapaDemandas = new Map<string, { polo_id: string; polo_nome: string; tamanho: string; quantidade: number }>();

  (matriculasDemandas ?? []).forEach((m) => {
    const grp = m.grupo as unknown as { local_id: string; local: { nome: string } | null } | null;
    const poloId = grp?.local_id || "geral";
    const poloNome = grp?.local?.nome || "Polo Geral";

    const dados = (m.dados_adicionais as Record<string, any>) || {};
    const tamanho = dados.tamanho_uniforme || dados.tamanho || "Padrão (Médio)";

    const chave = `${poloId}_${tamanho}`;
    const atual = mapaDemandas.get(chave) || {
      polo_id: poloId,
      polo_nome: poloNome,
      tamanho,
      quantidade: 0,
    };
    atual.quantidade += 1;
    mapaDemandas.set(chave, atual);
  });

  const demandasTamanhos = Array.from(mapaDemandas.values()).sort((a, b) =>
    a.polo_nome.localeCompare(b.polo_nome)
  );

  return {
    objeto: obj
      ? {
          id: obj.id,
          nome: obj.nome,
          termo_local: obj.termo_local || "Polo",
          termo_instrutor: obj.termo_instrutor || "Professor",
          termo_grupo: obj.termo_grupo || "Turma",
          termo_beneficiario: obj.termo_beneficiario || "Aluno",
          termo_materiais_coletivos: obj.termo_materiais_coletivos || "Materiais Coletivos",
          termo_materiais_concedidos: obj.termo_materiais_concedidos || "Uniformes",
        }
      : null,
    indicadores: {
      totalItensCatalogo: materiaisLista.length,
      totalUnidadesAdquiridas: totalAdquiridoGeral,
      totalRemessasPolos: remessasBanco.length,
      totalKitsEntregues: entregasBanco.length,
    },
    materiais: materiaisFormatados,
    remessas: remessasFormatadas,
    entregas: entregasFormatadas,
    demandasTamanhos,
    locais: locaisRaw ?? [],
    instrutores: (instRaw ?? []).map((i) => ({
      id: i.id,
      nome: i.nome_completo,
      local_id: i.local_id,
    })),
  };
}

/**
 * 2. Criar Novo Item no Catálogo do Objeto
 */
export async function criarObjetoMaterial(input: ObjetoMaterialInput) {
  const supabase = await createClient();

  const parsed = objetoMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { error } = await supabase.from("objeto_materiais").insert({
    objeto_id: parsed.data.objeto_id,
    nome_item: parsed.data.nome_item,
    tipo: parsed.data.tipo,
    quantidade_prevista: parsed.data.quantidade_prevista,
    quantidade_adquirida: parsed.data.quantidade_adquirida,
    especificacoes: parsed.data.especificacoes || null,
    destinacao: parsed.data.destinacao,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/materiais");
  return { success: true };
}

/**
 * 3. Registrar Remessa de Material ao Polo com Fotos de Tombamento
 */
export async function registrarRemessaPolo(input: RemessaPoloInput) {
  const supabase = await createClient();

  const parsed = remessaPoloSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { error } = await supabase.from("materiais_remessas_polo").insert({
    objeto_material_id: parsed.data.objeto_material_id,
    local_id: parsed.data.local_id,
    quantidade_enviada: parsed.data.quantidade_enviada,
    data_remessa: parsed.data.data_remessa,
    codigo_patrimonio: parsed.data.codigo_patrimonio || null,
    responsavel_recebimento_id: parsed.data.responsavel_recebimento_id || null,
    fotos_urls: parsed.data.fotos_urls || [],
    documento_comprovante_url: parsed.data.documento_comprovante_url || null,
    observacoes: parsed.data.observacoes || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/materiais");
  return { success: true };
}

/**
 * 4. Registrar Entrega Nominal Individual ao Aluno (§3.10.B)
 * Bloqueio contra duplicidade garantido.
 */
export async function registrarEntregaAluno(input: EntregaAlunoInput) {
  const supabase = await createClient();

  const parsed = entregaAlunoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  // Verificar se o aluno já recebeu este material
  const { data: existente } = await supabase
    .from("materiais_entregas_aluno")
    .select("id")
    .eq("objeto_material_id", parsed.data.objeto_material_id)
    .eq("matricula_id", parsed.data.matricula_id)
    .maybeSingle();

  if (existente) {
    return { success: false, error: "Este aluno já possui registro de entrega para este item." };
  }

  const { error } = await supabase.from("materiais_entregas_aluno").insert({
    objeto_material_id: parsed.data.objeto_material_id,
    matricula_id: parsed.data.matricula_id,
    instrutor_id: parsed.data.instrutor_id,
    data_entrega: parsed.data.data_entrega,
    tamanho_entregue: parsed.data.tamanho_entregue || null,
    foto_comprovante_url: parsed.data.foto_comprovante_url || null,
    status: "entregue",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/materiais");
  return { success: true };
}

/**
 * 5. Baixa em Lote da Turma com Fé Pública do Professor (§3.10.B)
 */
export async function registrarEntregasTurmaLote(input: EntregaLoteTurmaInput) {
  const supabase = await createClient();

  const parsed = entregaLoteTurmaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  // Buscar entregas já realizadas deste material para as matrículas selecionadas
  const { data: jaEntreguesRaw } = await supabase
    .from("materiais_entregas_aluno")
    .select("matricula_id")
    .eq("objeto_material_id", parsed.data.objeto_material_id)
    .in("matricula_id", parsed.data.matriculas_ids);

  const jaEntreguesSet = new Set((jaEntreguesRaw ?? []).map((e) => e.matricula_id));

  const registrosNovos = parsed.data.matriculas_ids
    .filter((id) => !jaEntreguesSet.has(id))
    .map((matriculaId) => ({
      objeto_material_id: parsed.data.objeto_material_id,
      matricula_id: matriculaId,
      instrutor_id: parsed.data.instrutor_id,
      data_entrega: parsed.data.data_entrega,
      tamanho_entregue: parsed.data.tamanho_padrao || null,
      foto_comprovante_url: parsed.data.foto_comprovante_url || null,
      status: "entregue",
    }));

  if (registrosNovos.length === 0) {
    return { success: true, count: 0, message: "Todos os alunos selecionados já haviam recebido este item." };
  }

  const { error } = await supabase.from("materiais_entregas_aluno").insert(registrosNovos);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/materiais");
  return { success: true, count: registrosNovos.length };
}

/**
 * 6. Upload de foto/comprovante facultativo no bucket 'materiais-fotos'
 */
export async function uploadFotoMaterial(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("foto") as File | null;
  if (!file) {
    return { success: false, error: "Nenhum arquivo enviado." };
  }

  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    return { success: false, error: "O arquivo deve ser uma imagem (JPEG, PNG, WebP) ou PDF." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "O arquivo não pode ultrapassar 10MB." };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `comprovantes/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("materiais-fotos")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("materiais-fotos").getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}

export interface GrupoComAlunosEntrega {
  grupo_id: string;
  grupo_nome: string;
  local_nome: string;
  alunos: {
    matricula_id: string;
    beneficiario_id: string;
    nome_completo: string;
    cpf: string | null;
    tamanho_uniforme: string | null;
    entregas: {
      objeto_material_id: string;
      material_nome: string;
      data_entrega: string;
      tamanho_entregue: string | null;
    }[];
  }[];
}

export interface DadosEntregaProfessor {
  materiaisIndividuais: {
    id: string;
    nome_item: string;
    quantidade_prevista: number;
    quantidade_adquirida: number;
  }[];
  turmas: GrupoComAlunosEntrega[];
}

/**
 * 7. Obter Turmas e Alunos do Professor para Entrega de Kits com Fé Pública (§3.10.B)
 */
export async function getDadosEntregaProfessor(
  instrutorId: string,
  objetoId: string
): Promise<DadosEntregaProfessor> {
  const supabase = await createClient();

  // 1. Materiais individuais cadastrados no projeto
  const { data: materiaisRaw } = await supabase
    .from("objeto_materiais")
    .select("id, nome_item, quantidade_prevista, quantidade_adquirida")
    .eq("objeto_id", objetoId)
    .eq("tipo", "individual")
    .order("nome_item");

  const materiaisIndividuais = materiaisRaw ?? [];

  // 2. Turmas vinculadas ao instrutor (via blocos semanais)
  const { data: blocosInstrutor } = await supabase
    .from("blocos")
    .select(`
      id,
      bloco_grupos(grupo_id)
    `)
    .eq("instrutor_id", instrutorId);

  let gruposIds: string[] = [];
  (blocosInstrutor ?? []).forEach((b) => {
    const bGroups = (b.bloco_grupos as unknown as { grupo_id: string }[]) || [];
    bGroups.forEach((bg) => {
      if (bg.grupo_id) gruposIds.push(bg.grupo_id);
    });
  });
  gruposIds = Array.from(new Set(gruposIds));

  // Se não houver blocos associados diretamente a este funcionário, busca as turmas ativas do projeto
  if (gruposIds.length === 0) {
    const { data: todosGrupos } = await supabase
      .from("grupos")
      .select("id")
      .eq("objeto_id", objetoId)
      .limit(10);
    gruposIds = (todosGrupos ?? []).map((g) => g.id);
  }

  if (gruposIds.length === 0) {
    return { materiaisIndividuais, turmas: [] };
  }

  // 3. Buscar dados cadastrais das turmas
  const { data: gruposData } = await supabase
    .from("grupos")
    .select("id, nome, local:locais(nome)")
    .in("id", gruposIds);

  // 4. Buscar matrículas ativas dessas turmas
  const { data: matriculasRaw } = await supabase
    .from("matriculas")
    .select(`
      id,
      grupo_id,
      dados_adicionais,
      beneficiario_id,
      beneficiario:beneficiarios(nome_completo, cpf)
    `)
    .in("grupo_id", gruposIds)
    .eq("status", "ativa")
    .order("criado_em", { ascending: true });

  const matriculasIds = (matriculasRaw ?? []).map((m) => m.id);

  // 5. Buscar histórico de entregas de kits para essas matrículas
  const entregasMap = new Map<
    string,
    {
      objeto_material_id: string;
      material_nome: string;
      data_entrega: string;
      tamanho_entregue: string | null;
    }[]
  >();

  if (matriculasIds.length > 0) {
    const { data: entregasRaw } = await supabase
      .from("materiais_entregas_aluno")
      .select(`
        matricula_id,
        objeto_material_id,
        data_entrega,
        tamanho_entregue,
        material:objeto_materiais(nome_item)
      `)
      .in("matricula_id", matriculasIds);

    (entregasRaw ?? []).forEach((e) => {
      const mat = e.material as unknown as { nome_item: string } | null;
      const list = entregasMap.get(e.matricula_id) || [];
      list.push({
        objeto_material_id: e.objeto_material_id,
        material_nome: mat?.nome_item || "Material Individual",
        data_entrega: e.data_entrega,
        tamanho_entregue: e.tamanho_entregue,
      });
      entregasMap.set(e.matricula_id, list);
    });
  }

  // 6. Formatar turmas estruturadas
  const turmas: GrupoComAlunosEntrega[] = (gruposData ?? []).map((grp) => {
    const loc = grp.local as unknown as { nome: string } | null;
    const matsDaTurma = (matriculasRaw ?? []).filter((m) => m.grupo_id === grp.id);

    return {
      grupo_id: grp.id,
      grupo_nome: grp.nome,
      local_nome: loc?.nome || "Polo",
      alunos: matsDaTurma.map((m) => {
        const b = m.beneficiario as unknown as { nome_completo: string; cpf: string | null } | null;
        const dados = (m.dados_adicionais as Record<string, any>) || {};
        const tamanho = dados.tamanho_uniforme || dados.tamanho || null;

        return {
          matricula_id: m.id,
          beneficiario_id: m.beneficiario_id,
          nome_completo: b?.nome_completo || "Aluno",
          cpf: b?.cpf || null,
          tamanho_uniforme: tamanho,
          entregas: entregasMap.get(m.id) || [],
        };
      }),
    };
  });

  return { materiaisIndividuais, turmas };
}

