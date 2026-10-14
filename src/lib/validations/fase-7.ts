import { z } from "zod";

/**
 * Schemas de validação para a Fase 7:
 * Gestão Logística de Materiais e Uniformes (Coletivo e Individual) (§3.10 de AGENTS.md)
 */

// 1. Cadastro de Item no Catálogo do Objeto
export const objetoMaterialSchema = z.object({
  objeto_id: z.string().uuid("ID de objeto inválido"),
  nome_item: z.string().min(2, "Nome do material deve ter no mínimo 2 caracteres"),
  tipo: z.enum(["coletivo", "individual"]),
  quantidade_prevista: z.coerce.number().int().min(1, "Quantidade prevista deve ser maior que zero"),
  quantidade_adquirida: z.coerce.number().int().min(0, "Quantidade adquirida não pode ser negativa").default(0),
  especificacoes: z.string().optional().nullable(),
  destinacao: z.string().min(2, "Destinação é obrigatória (ex: Em quadra, Kits dos alunos)"),
});

export type ObjetoMaterialInput = z.infer<typeof objetoMaterialSchema>;

// 2. Registro de Remessa de Material para o Polo
export const remessaPoloSchema = z.object({
  objeto_material_id: z.string().uuid("ID de material inválido"),
  local_id: z.string().uuid("ID de polo/local inválido"),
  quantidade_enviada: z.coerce.number().int().min(1, "Quantidade enviada deve ser maior que zero"),
  data_remessa: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD"),
  codigo_patrimonio: z.string().optional().nullable(),
  responsavel_recebimento_id: z.string().uuid("ID de funcionário responsável inválido").optional().nullable(),
  fotos_urls: z.array(z.string()).optional().default([]),
  documento_comprovante_url: z.string().url("URL de comprovante inválida").optional().or(z.literal("")).nullable(),
  observacoes: z.string().optional().nullable(),
});

export type RemessaPoloInput = z.infer<typeof remessaPoloSchema>;

// 3. Registro Nominal Individual de Entrega de Kit ao Aluno (§3.10.B)
export const entregaAlunoSchema = z.object({
  objeto_material_id: z.string().uuid("ID de material inválido"),
  matricula_id: z.string().uuid("ID de matrícula inválido"),
  instrutor_id: z.string().uuid("ID de instrutor inválido"),
  data_entrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD"),
  tamanho_entregue: z.string().optional().nullable(),
  foto_comprovante_url: z.string().url("URL de comprovante inválida").optional().or(z.literal("")).nullable(),
});

export type EntregaAlunoInput = z.infer<typeof entregaAlunoSchema>;

// 4. Baixa em Lote da Turma com Fé Pública do Professor (§3.10.B)
export const entregaLoteTurmaSchema = z.object({
  objeto_material_id: z.string().uuid("ID de material inválido"),
  grupo_id: z.string().uuid("ID de turma inválido"),
  instrutor_id: z.string().uuid("ID de instrutor inválido"),
  data_entrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD"),
  matriculas_ids: z.array(z.string().uuid()).min(1, "Selecione ao menos um aluno para a entrega"),
  tamanho_padrao: z.string().optional().nullable(),
  foto_comprovante_url: z.string().url("URL de comprovante inválida").optional().or(z.literal("")).nullable(),
});

export type EntregaLoteTurmaInput = z.infer<typeof entregaLoteTurmaSchema>;
