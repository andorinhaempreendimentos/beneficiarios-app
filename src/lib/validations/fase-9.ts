import { z } from "zod";

/**
 * Schemas de validação para a Fase 9:
 * Pesquisas de Satisfação, WhatsApp e Anti-Fraude (§3.13 e §3.14).
 */

// 1. Configurações Globais do Sistema (Mantenedora - §3.13)
export const configuracaoSistemaSchema = z.object({
  id: z.string().uuid().optional(),
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

export type ConfiguracaoSistemaInput = z.infer<typeof configuracaoSistemaSchema>;

// 2. Campanhas de Pesquisa de Satisfação (§3.14)
export const pesquisaSchema = z.object({
  id: z.string().uuid().optional(),
  objeto_id: z.string().uuid("Projeto social é obrigatório"),
  local_id: z.string().uuid().optional().nullable().or(z.literal("")),
  grupo_id: z.string().uuid().optional().nullable().or(z.literal("")),
  titulo: z.string().min(3, "Título da pesquisa deve ter ao menos 3 caracteres"),
  descricao: z.string().optional().nullable(),
  publicada: z.boolean().default(false),
  exigir_cpf: z.boolean().default(false),
});

export type PesquisaInput = z.infer<typeof pesquisaSchema>;

// 3. Categorias de Campo (Eixos Analíticos)
export const categoriaCampoSchema = z.object({
  id: z.string().uuid().optional(),
  pesquisa_id: z.string().uuid("ID da pesquisa é obrigatório"),
  nome: z.string().min(2, "Nome da categoria analítica é obrigatório"),
  ordem: z.coerce.number().int().default(0),
});

export type CategoriaCampoInput = z.infer<typeof categoriaCampoSchema>;

// 4. Perguntas da Pesquisa
export const tipoPerguntaPesquisaEnum = z.enum([
  "escala", // 1 a 5 estrelas / notas
  "multipla_escolha",
  "texto_curto",
  "texto_longo",
  "numerico",
  "contato",
]);

export type TipoPerguntaPesquisa = z.infer<typeof tipoPerguntaPesquisaEnum>;

export const perguntaPesquisaSchema = z.object({
  id: z.string().uuid().optional(),
  pesquisa_id: z.string().uuid("ID da pesquisa é obrigatório"),
  categoria_id: z.string().uuid().optional().nullable().or(z.literal("")),
  texto: z.string().min(2, "O enunciado da pergunta é obrigatório"),
  tipo: tipoPerguntaPesquisaEnum.default("escala"),
  opcoes: z.array(z.string()).default([]),
  min_selecoes: z.coerce.number().int().min(0).optional().nullable(),
  max_selecoes: z.coerce.number().int().min(1).optional().nullable(),
  obrigatoria: z.boolean().default(true),
  ordem: z.coerce.number().int().default(0),
  condicao_pergunta_id: z.string().uuid().optional().nullable().or(z.literal("")),
  condicao_valor: z.any().optional().nullable(),
});

export type PerguntaPesquisaInput = z.infer<typeof perguntaPesquisaSchema>;

// 5. Submissão Pública Anti-Fraude (§3.14 item 2)
export const submissaoRespostaItemSchema = z.object({
  pergunta_id: z.string().uuid("ID da pergunta inválido"),
  valor: z.any(),
});

export const submissaoPesquisaSchema = z.object({
  pesquisa_id: z.string().uuid("ID da pesquisa é obrigatório"),
  token: z.string().min(1, "Token de pesquisa é obrigatório"),
  beneficiario_id: z.string().uuid().optional().nullable().or(z.literal("")),
  matricula_id: z.string().uuid().optional().nullable().or(z.literal("")),
  cpf: z.string().optional().nullable(),
  device_fingerprint: z.string().min(3, "Identificador de dispositivo é obrigatório"),
  respostas: z
    .array(submissaoRespostaItemSchema)
    .min(1, "Responda ao menos uma pergunta para submeter"),
});

export type SubmissaoPesquisaInput = z.infer<typeof submissaoPesquisaSchema>;

// 6. WhatsApp: Instâncias / Gateway (§3.14 item 3.1)
export const whatsappInstanciaSchema = z.object({
  id: z.string().uuid().optional(),
  objeto_id: z.string().uuid("Projeto social é obrigatório"),
  provedor: z.enum(["z-api", "evolution"], {
    message: "Selecione o provedor (Z-API ou Evolution API)",
  }),
  endpoint_url: z.string().url("URL do endpoint da API é obrigatória"),
  instance_id: z.string().min(1, "ID da Instância é obrigatório"),
  token_api: z.string().min(1, "Token / API Key é obrigatório"),
  status: z
    .enum(["conectado", "desconectado", "aguardando_leitura"])
    .default("desconectado"),
  numero_pareado: z.string().optional().nullable(),
});

export type WhatsappInstanciaInput = z.infer<typeof whatsappInstanciaSchema>;

// 7. WhatsApp: Gestão de Números Emissores / Anti-Ban (§3.14 item 3.2)
export const whatsappNumeroSchema = z.object({
  id: z.string().uuid().optional(),
  instancia_id: z.string().uuid("Instância do WhatsApp é obrigatória"),
  numero: z.string().min(8, "Número de telefone válido é obrigatório"),
  ativo: z.boolean().default(true),
  teto_diario: z.coerce
    .number()
    .int()
    .min(1, "Teto diário deve ser no mínimo 1 disparo")
    .default(300),
  delay_min_segundos: z.coerce
    .number()
    .int()
    .min(5, "Delay mínimo deve ser ao menos 5 segundos")
    .default(20),
  delay_max_segundos: z.coerce
    .number()
    .int()
    .min(10, "Delay máximo deve ser ao menos 10 segundos")
    .default(45),
});

export type WhatsappNumeroInput = z.infer<typeof whatsappNumeroSchema>;

// 8. WhatsApp: Templates de Mensagens com Tags Dinâmicas (§3.14 item 3.3)
export const whatsappTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  objeto_id: z.string().uuid("Projeto social é obrigatório"),
  nome: z.string().min(2, "Nome identificador do template é obrigatório"),
  corpo: z.string().min(5, "Texto da mensagem deve ter ao menos 5 caracteres"),
});

export type WhatsappTemplateInput = z.infer<typeof whatsappTemplateSchema>;

// 9. WhatsApp: Campanha de Disparo em Massa (§3.14 item 3.4)
export const whatsappCampanhaSchema = z.object({
  id: z.string().uuid().optional(),
  objeto_id: z.string().uuid("Projeto social é obrigatório"),
  pesquisa_id: z.string().uuid().optional().nullable().or(z.literal("")),
  template_id: z.string().uuid().optional().nullable().or(z.literal("")),
  mensagem_avulsa: z.string().optional().nullable(),
  filtro_local_id: z.string().uuid().optional().nullable().or(z.literal("")),
  filtro_grupo_id: z.string().uuid().optional().nullable().or(z.literal("")),
  filtro_genero: z.string().optional().nullable(),
  filtro_nao_respondeu: z.boolean().default(false),
  filtro_abaixo_meta: z.boolean().default(false),
  destinatario: z.enum(["beneficiario", "responsavel"]).default("beneficiario"),
});

export type WhatsappCampanhaInput = z.infer<typeof whatsappCampanhaSchema>;
