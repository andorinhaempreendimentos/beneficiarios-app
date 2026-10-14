import { z } from "zod";

/**
 * Schemas de validação para a Fase 6:
 * Relatórios Oficiais, Motor de Templates e Prestação de Contas Governamental (§3.8 e §3.9 de AGENTS.md)
 */

// 1. Filtros de Assiduidade e Evasão
export const filtroAssiduidadeSchema = z.object({
  objeto_id: z.string().uuid("ID de objeto inválido").optional(),
  regiao_id: z.string().uuid("ID de região inválido").optional(),
  local_id: z.string().uuid("ID de local inválido").optional(),
  grupo_id: z.string().uuid("ID de turma inválido").optional(),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inicial no formato AAAA-MM-DD")
    .optional(),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data final no formato AAAA-MM-DD")
    .optional(),
  status_meta: z.enum(["todos", "dentro_da_meta", "abaixo_da_meta"]).default("todos"),
  busca: z.string().optional(),
});

export type FiltroAssiduidadeInput = z.infer<typeof filtroAssiduidadeSchema>;

// 2. Retificação Administrativa de Ponto Eletrônico (§3.9.6)
export const retificacaoPontoSchema = z.object({
  registro_id: z.string().uuid("ID de registro de ponto inválido"),
  hora_entrada: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário de entrada deve estar no formato HH:MM"),
  hora_saida: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário de saída deve estar no formato HH:MM"),
  motivo_ajuste: z
    .string()
    .min(10, "O motivo do ajuste é obrigatório e deve ter no mínimo 10 caracteres para auditoria pública"),
});

export type RetificacaoPontoInput = z.infer<typeof retificacaoPontoSchema>;

// 3. Abono de Falta ou Inclusão Manual no Ponto (§3.9.6)
export const abonoFaltaPontoSchema = z.object({
  funcionario_id: z.string().uuid("ID de funcionário inválido"),
  objeto_id: z.string().uuid("ID de objeto inválido"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD"),
  hora_entrada: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário de entrada deve estar no formato HH:MM")
    .optional(),
  hora_saida: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário de saída deve estar no formato HH:MM")
    .optional(),
  tipo_registro: z.enum(["trabalhado", "falta_justificada", "recesso_feriado"]).default("trabalhado"),
  motivo_ajuste: z
    .string()
    .min(10, "Justificativa obrigatória com no mínimo 10 caracteres para registro probatório"),
  comprovante_url: z.string().url("URL de comprovante inválida").optional().or(z.literal("")),
});

export type AbonoFaltaPontoInput = z.infer<typeof abonoFaltaPontoSchema>;

// 4. Fechamento do Relatório Master Nível 3 (§3.9.4)
export const fecharRelatorioMasterSchema = z.object({
  objeto_id: z.string().uuid("ID de objeto inválido"),
  rotulo_periodo: z.string().min(3, "Rótulo do período é obrigatório (ex: Outubro / 2026)"),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início no formato AAAA-MM-DD"),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de fim no formato AAAA-MM-DD"),
  resumo_execucao: z
    .string()
    .min(15, "Resumo da execução deve conter no mínimo 15 caracteres"),
  analise_metas: z
    .string()
    .min(15, "Análise do cumprimento de metas deve conter no mínimo 15 caracteres"),
  resultados_alcancados: z
    .string()
    .min(15, "Resultados alcançados deve conter no mínimo 15 caracteres"),
  conclusao: z
    .string()
    .min(15, "Conclusão formal deve conter no mínimo 15 caracteres"),
  coordenador_geral_nome: z.string().optional(),
  representante_legal_nome: z.string().optional(),
});

export type FecharRelatorioMasterInput = z.infer<typeof fecharRelatorioMasterSchema>;

// 5. Retificação Auditada de Relatório Master (v1 -> v2) (§3.9.7)
export const retificarRelatorioMasterSchema = z.object({
  relatorio_id: z.string().uuid("ID de relatório inválido"),
  motivo_retificacao: z
    .string()
    .min(15, "Motivo formal da retificação é obrigatório (mínimo 15 caracteres) para auditoria"),
  resumo_execucao: z.string().min(15),
  analise_metas: z.string().min(15),
  resultados_alcancados: z.string().min(15),
  conclusao: z.string().min(15),
});

export type RetificarRelatorioMasterInput = z.infer<typeof retificarRelatorioMasterSchema>;
