import { z } from "zod";

export const sinteseQualitativaSchema = z.object({
  pontos_positivos: z
    .string()
    .min(10, "Descreva os principais pontos positivos observados (mínimo de 10 caracteres)"),
  dificuldades: z
    .string()
    .min(10, "Descreva as principais dificuldades ou ocorrências (mínimo de 10 caracteres)"),
  pendencias: z
    .string()
    .min(5, "Descreva as pendências a solucionar ou declare 'Nenhuma pendência crítica'"),
  providencias: z
    .string()
    .min(10, "Descreva as providências adotadas ou recomendações da coordenação"),
});
export type SinteseQualitativaInput = z.infer<typeof sinteseQualitativaSchema>;

export const fecharCicloPeriodicoSchema = z.object({
  objeto_id: z.string().uuid("Objeto inválido"),
  regiao_id: z.string().uuid("Região inválida").optional().nullable(),
  rotulo_periodo: z
    .string()
    .min(3, "Informe o rótulo do período (ex: Outubro / 2026 ou 1ª Etapa)"),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida (AAAA-MM-DD)"),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de término inválida (AAAA-MM-DD)"),
  sintese: sinteseQualitativaSchema,
  coordenador_nome: z.string().optional(),
  regiao_nome: z.string().optional(),
});
export type FecharCicloPeriodicoInput = z.infer<typeof fecharCicloPeriodicoSchema>;

export const salvarRascunhoSinteseSchema = z.object({
  objeto_id: z.string().uuid("Objeto inválido"),
  regiao_id: z.string().uuid("Região inválida").optional().nullable(),
  rotulo_periodo: z.string().default("Mês Corrente"),
  data_inicio: z.string(),
  data_fim: z.string(),
  pontos_positivos: z.string().optional().default(""),
  dificuldades: z.string().optional().default(""),
  pendencias: z.string().optional().default(""),
  providencias: z.string().optional().default(""),
});
export type SalvarRascunhoSinteseInput = z.infer<typeof salvarRascunhoSinteseSchema>;

export const filtroCoordenadorSchema = z.object({
  objeto_id: z.string().uuid().optional(),
  regiao_id: z.string().uuid().optional(),
  local_id: z.string().uuid().optional(),
  status_pendencia: z.enum(["todas", "abertas", "vencidas"]).default("todas"),
});
export type FiltroCoordenadorInput = z.infer<typeof filtroCoordenadorSchema>;
