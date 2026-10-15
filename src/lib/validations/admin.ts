import { z } from "zod";
import { tipoApuracaoMetaEnum } from "@/lib/validations/fase-8";

/**
 * Validações para as entidades do Núcleo Institucional (Fase 1).
 * Totalmente alinhadas às regras de negócio e restrições canônicas de AGENTS.md.
 */

// 1. Configurações do Sistema (Entidade Gestora Global)
export const configuracoesSistemaSchema = z.object({
  razao_social: z.string().min(2, "Razão social é obrigatória"),
  cnpj: z
    .string()
    .min(14, "CNPJ deve ter ao menos 14 caracteres")
    .max(18, "CNPJ inválido"),
  email_suporte: z
    .string()
    .email("E-mail de suporte inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  telefone_suporte: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z
    .string()
    .length(2, "UF deve ter exatamente 2 letras")
    .optional()
    .nullable()
    .or(z.literal("")),
  cep: z.string().optional().nullable(),
  logotipo_url: z
    .string()
    .url("URL de logotipo inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type ConfiguracoesSistemaInput = z.infer<typeof configuracoesSistemaSchema>;

// 2. Organizações Sociais (OSC executora da atividade-fim)
export const organizacaoSchema = z.object({
  razao_social: z.string().min(2, "Razão social é obrigatória"),
  nome_fantasia: z.string().optional().nullable(),
  cnpj: z
    .string()
    .min(14, "CNPJ deve ter ao menos 14 caracteres")
    .max(18, "CNPJ inválido"),
  email: z
    .string()
    .email("E-mail institucional inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  telefone: z.string().optional().nullable(),
  endereco_logradouro: z.string().optional().nullable(),
  endereco_numero: z.string().optional().nullable(),
  endereco_bairro: z.string().optional().nullable(),
  endereco_cidade: z.string().optional().nullable(),
  endereco_uf: z
    .string()
    .length(2, "UF deve ter 2 caracteres")
    .optional()
    .nullable()
    .or(z.literal("")),
  endereco_cep: z.string().optional().nullable(),
  logotipo_url: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
  ativo: z.boolean().default(true),
});

export type OrganizacaoInput = z.infer<typeof organizacaoSchema>;

// 3. Concedentes (Órgão público financiador / fiscalizador)
export const concedenteSchema = z.object({
  nome: z.string().min(2, "Nome do concedente é obrigatório"),
  sigla: z.string().optional().nullable(),
  esfera: z.enum(["municipal", "estadual", "federal"], {
    message: "Selecione a esfera administrativa",
  }),
  cnpj: z.string().optional().nullable(),
  municipio: z.string().optional().nullable(),
  uf: z
    .string()
    .length(2, "UF deve ter 2 letras")
    .optional()
    .nullable()
    .or(z.literal("")),
  ativo: z.boolean().default(true),
});

export type ConcedenteInput = z.infer<typeof concedenteSchema>;

// 4. Modalidades Esportivas (Catálogo Global reutilizável)
export const modalidadeSchema = z.object({
  nome: z.string().min(2, "Nome da modalidade é obrigatório"),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

export type ModalidadeInput = z.infer<typeof modalidadeSchema>;

export const modalidadeChecklistItemSchema = z.object({
  modalidade_id: z.string().uuid("Modalidade inválida"),
  descricao: z.string().min(2, "Descrição do item de vistoria é obrigatória"),
  ordem: z.coerce.number().int().default(0),
});

export type ModalidadeChecklistItemInput = z.infer<
  typeof modalidadeChecklistItemSchema
>;

// Item de Meta vinculado ao Objeto no Formulário
export const metaItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  numero_meta: z.coerce.number().int().min(1, "O número da meta deve ser pelo menos 1"),
  descricao: z.string().min(1, "Descrição da meta é obrigatória"),
  unidade_medida: z.string().min(1, "Unidade de medida é obrigatória"),
  quantidade_prevista: z.coerce.number().positive("A quantidade prevista deve ser maior que zero"),
  fonte_verificacao: z.string().min(1, "Fonte de verificação é obrigatória"),
  tipo_apuracao: tipoApuracaoMetaEnum.default("manual"),
});

export type MetaItemInput = z.infer<typeof metaItemInputSchema>;

// 5. Objetos / Projetos Sociais (Vínculo formal agnóstico)
export const objetoSchema = z
  .object({
    nome: z.string().min(2, "Nome do projeto é obrigatório"),
    tipo: z.enum(["continuo", "pontual"], {
      message: "Selecione o formato do projeto (contínuo ou pontual)",
    }),
    organizacao_id: z
      .string()
      .uuid("Organização inválida")
      .optional()
      .nullable()
      .or(z.literal("")),
    concedente_id: z
      .string()
      .uuid("Concedente inválido")
      .optional()
      .nullable()
      .or(z.literal("")),
    modalidade_principal_id: z
      .string()
      .uuid("Modalidade inválida")
      .optional()
      .nullable()
      .or(z.literal("")),
    data_inicio: z
      .string()
      .min(10, "Data de início obrigatória no formato AAAA-MM-DD"),
    data_fim: z
      .string()
      .min(10, "Data de fim obrigatória no formato AAAA-MM-DD"),
    processo_administrativo: z.string().optional().nullable(),
    edital_chamamento: z.string().optional().nullable(),
    termo_parceria_numero: z.string().optional().nullable(),
    representante_legal_nome: z.string().optional().nullable(),
    representante_legal_cargo: z.string().optional().nullable(),
    meta_frequencia_percentual: z.coerce
      .number()
      .min(0, "Meta mínima é 0%")
      .max(100, "Meta máxima é 100%")
      .optional()
      .nullable(),
    habilitar_vulnerabilidade: z.boolean().default(true),
    descricao: z.string().optional().nullable(),
    municipio: z.string().optional().nullable(),
    uf: z
      .string()
      .length(2, "UF deve ter 2 caracteres")
      .optional()
      .nullable()
      .or(z.literal("")),
    // Vocabulário dinâmico obrigatório por projeto (§4.3)
    termo_beneficiario: z
      .string()
      .min(1, "Defina o termo para os atendidos (ex: Aluno, Atleta, Corredor)"),
    termo_instrutor: z
      .string()
      .min(1, "Defina o termo para o instrutor (ex: Professor, Monitor, Treinador)"),
    termo_grupo: z
      .string()
      .min(1, "Defina o termo para turma/grupo (ex: Turma, Chave, Pelotão)"),
    termo_sessao: z
      .string()
      .min(1, "Defina o termo para a sessão (ex: Aula, Treino, Largada)"),
    termo_bloco: z
      .string()
      .min(1, "Defina o termo para o bloco de horário (ex: Horário, Bateria)"),
    termo_local: z
      .string()
      .min(1, "Defina o termo para o polo/local (ex: Polo, Núcleo, Arena)"),
    termo_materiais_coletivos: z
      .string()
      .min(1, "Defina o termo para materiais coletivos (ex: Materiais Esportivos)"),
    termo_materiais_concedidos: z
      .string()
      .min(1, "Defina o termo para materiais individuais (ex: Uniformes, Kits)"),
    ativo: z.boolean().default(true),
    // Modalidades e Metas vinculadas no formulário em abas
    modalidades_ids: z.array(z.string().uuid()).optional().default([]),
    metas: z.array(metaItemInputSchema).optional().default([]),
  })
  .refine(
    (data) => new Date(data.data_fim) >= new Date(data.data_inicio),
    {
      message: "Data de término não pode ser anterior à data de início",
      path: ["data_fim"],
    }
  );

export type ObjetoInput = z.infer<typeof objetoSchema>;

// 6. Regiões Territoriais (§3.2)
export const regiaoSchema = z.object({
  nome: z.string().min(2, "Nome da região é obrigatório"),
  objeto_id: z.string().uuid("Selecione o projeto"),
  coordenador_id: z
    .string()
    .uuid("Coordenador inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  locais_ids: z.array(z.string().uuid()).default([]),
});

export type RegiaoInput = z.input<typeof regiaoSchema>;
export type RegiaoOutput = z.infer<typeof regiaoSchema>;

// 7. Locais / Polos de Atendimento (§3.2)
export const localSchema = z.object({
  nome: z.string().min(2, "Nome do polo/local é obrigatório"),
  objeto_id: z.string().uuid("Projeto obrigatório"),
  regiao_id: z
    .string()
    .uuid("Região inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
  descricao: z.string().optional().nullable(),
  endereco_logradouro: z.string().optional().nullable(),
  endereco_numero: z.string().optional().nullable(),
  endereco_bairro: z.string().optional().nullable(),
  endereco_cidade: z.string().optional().nullable(),
  endereco_uf: z
    .string()
    .length(2, "UF deve ter 2 letras")
    .optional()
    .nullable()
    .or(z.literal("")),
  endereco_cep: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

export type LocalInput = z.input<typeof localSchema>;
export type LocalOutput = z.infer<typeof localSchema>;

// 8. Funcionários (RH de Campo para prestação de contas governamental)
export const funcionarioSchema = z.object({
  nome_completo: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z
    .string()
    .min(11, "CPF deve ter no mínimo 11 dígitos")
    .max(14, "CPF inválido"),
  cargo: z.string().min(2, "Cargo contratual é obrigatório"),
  objeto_id: z.string().uuid("Projeto de alocação obrigatório"),
  organizacao_id: z.string().uuid("Organização empregadora obrigatória"),
  local_id: z
    .string()
    .uuid("Local inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  telefone: z.string().optional().nullable(),
  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  data_admissao: z.string().optional().nullable(),
  data_desligamento: z.string().optional().nullable(),
  carga_horaria_semanal: z.coerce.number().min(0).optional().nullable(),
  situacao: z.enum(["ativo", "afastado", "desligado"]).default("ativo"),
  usuario_id: z
    .string()
    .uuid("Usuário do sistema inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type FuncionarioInput = z.infer<typeof funcionarioSchema>;

// 9. Gestão de Usuários & RBAC Escopado (§4.1 e §4.2)
export const usuarioPapelEnum = z.enum(
  [
    "super_admin",
    "admin_geral",
    "coordenador",
    "supervisor",
    "instrutor",
    "leitor",
  ],
  { message: "Selecione o papel de acesso" }
);

export const novoFuncionarioParaUsuarioSchema = z.object({
  cpf: z
    .string()
    .min(11, "CPF deve ter no mínimo 11 dígitos")
    .max(14, "CPF inválido"),
  cargo: z.string().min(2, "Cargo contratual é obrigatório"),
  organizacao_id: z.string().uuid("Organização empregadora obrigatória"),
  objeto_id: z.string().uuid("Projeto de alocação obrigatório"),
  local_id: z
    .string()
    .uuid("Polo inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  telefone: z.string().optional().nullable(),
  carga_horaria_semanal: z.coerce.number().min(0).optional().nullable().default(40),
});

export type NovoFuncionarioParaUsuarioInput = z.infer<typeof novoFuncionarioParaUsuarioSchema>;

export const usuarioSchema = z.object({
  nome_completo: z.string().min(2, "Nome completo é obrigatório"),
  email: z.string().email("E-mail de acesso inválido"),
  senha: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
  papel: usuarioPapelEnum,
  ativo: z.boolean().default(true),
  funcionario_id: z
    .string()
    .uuid("Funcionário inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  novo_funcionario: novoFuncionarioParaUsuarioSchema.optional().nullable(),
  objetos_ids: z.array(z.string().uuid()).default([]),
});

export type UsuarioInput = z.infer<typeof usuarioSchema>;
