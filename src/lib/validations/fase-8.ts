import { z } from "zod";

export const tipoApuracaoMetaEnum = z.enum([
  "manual",
  "total_locais",
  "total_beneficiarios",
  "frequencia_media",
  "sessoes_realizadas",
  "supervisoes_realizadas",
  "vulnerabilidade_social",
]);

export type TipoApuracaoMeta = z.infer<typeof tipoApuracaoMetaEnum>;

export const objetoMetaSchema = z.object({
  id: z.string().uuid().optional(),
  objeto_id: z.string().uuid("Projeto social é obrigatório"),
  numero_meta: z.coerce.number().int().min(1, "O número da meta deve ser pelo menos 1"),
  descricao: z.string().min(3, "Descrição da meta deve ter pelo menos 3 caracteres"),
  unidade_medida: z.string().min(1, "Unidade de medida é obrigatória (ex: Alunos, %, Polos, Aulas)"),
  quantidade_prevista: z.coerce.number().positive("A quantidade prevista deve ser maior que zero"),
  fonte_verificacao: z
    .string()
    .min(3, "Fonte de verificação oficial é obrigatória (ex: Software de Gestão e Listas de Presença)"),
  tipo_apuracao: tipoApuracaoMetaEnum.default("manual"),
});

export type ObjetoMetaInput = z.infer<typeof objetoMetaSchema>;

export const apuracaoDeclaratoriaSchema = z.object({
  meta_id: z.string().uuid("ID da meta é obrigatório"),
  quantidade_declarada: z.coerce.number().min(0, "A quantidade declarada não pode ser negativa"),
  justificativa_declarada: z
    .string()
    .min(5, "Informe uma síntese descritiva da ação realizada (mínimo 5 caracteres)"),
  anexos_urls: z.array(z.string().url()).optional().default([]),
});

export type ApuracaoDeclaratoriaInput = z.infer<typeof apuracaoDeclaratoriaSchema>;

export const filtroMetasSchema = z.object({
  objeto_id: z.string().uuid().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
});

export type FiltroMetasInput = z.infer<typeof filtroMetasSchema>;
