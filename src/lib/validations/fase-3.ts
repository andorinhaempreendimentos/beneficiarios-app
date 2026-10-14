import { z } from "zod";

/**
 * Schemas Zod para a Fase 3: Painel do Instrutor, Sessões de Aula e Presença.
 * Regra Canônica §3.5 de AGENTS.md:
 * - Evidência fotográfica probatória obrigatória com no mínimo 2 fotos.
 * - Registro tripartite de presença: 'presente', 'falta', 'justificada'.
 * - Ponto eletrônico integrado no início e encerramento.
 */

// 1. Status Tripartite de Presença do Beneficiário
export const presencaStatusEnum = z.enum(["presente", "falta", "justificada"], {
  message: "O status deve ser presente, falta ou justificada",
});

export type PresencaStatus = z.infer<typeof presencaStatusEnum>;

export const presencaItemSchema = z.object({
  matricula_id: z.string().uuid("ID de matrícula inválido"),
  beneficiario_id: z.string().uuid("ID de beneficiário inválido"),
  status: presencaStatusEnum.default("presente"),
  justificativa: z.string().optional().nullable(),
  comprovante_url: z.string().url("URL de comprovante inválida").optional().nullable().or(z.literal("")),
});

export type PresencaItemInput = z.infer<typeof presencaItemSchema>;

// 2. Início de Sessão (Execução e Clock-in)
export const iniciarSessaoSchema = z.object({
  objeto_id: z.string().uuid("Projeto obrigatório"),
  local_id: z.string().uuid("Polo de atendimento obrigatório"),
  bloco_id: z.string().uuid("Bloco de horário inválido").optional().nullable(),
  funcionario_id: z.string().uuid("Instrutor/Professor obrigatório"),
  modalidade_id: z.string().uuid("Modalidade inválida").optional().nullable(),
  grupos_ids: z.array(z.string().uuid("ID de turma inválido")).min(1, "Selecione ao menos uma turma para a sessão"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
  hora_inicio: z.string().min(4, "Horário de início obrigatório"),
});

export type IniciarSessaoInput = z.infer<typeof iniciarSessaoSchema>;

// 3. Conclusão de Sessão (Encerramento, Ponto e Snapshot Imutável)
export const concluirSessaoSchema = z.object({
  sessao_id: z.string().uuid("ID de sessão inválido"),
  hora_fim: z.string().min(4, "Horário de término obrigatório"),
  fotos_urls: z
    .array(z.string().url("URL de foto probatória inválida"))
    .min(2, "Regra Canônica §3.5: É obrigatório anexar no mínimo 2 fotos comprobatórias da aula para finalizar a sessão"),
  observacoes: z.string().optional().nullable(),
  presencas: z.array(presencaItemSchema).default([]),
});

export type ConcluirSessaoInput = z.infer<typeof concluirSessaoSchema>;

// 4. Filtro de Sessões do Instrutor
export const filtroSessoesInstrutorSchema = z.object({
  funcionario_id: z.string().uuid("ID do instrutor inválido").optional(),
  objeto_id: z.string().uuid("ID do projeto inválido").optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type FiltroSessoesInstrutorInput = z.infer<typeof filtroSessoesInstrutorSchema>;
