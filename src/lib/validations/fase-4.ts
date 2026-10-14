import { z } from "zod";

export const situacaoSupervisaoEnum = z.enum(["Regular", "Requer Atenção", "Crítica"]);
export type SituacaoSupervisao = z.infer<typeof situacaoSupervisaoEnum>;

export const statusSupervisaoEnum = z.enum(["em_andamento", "concluida"]);
export type StatusSupervisao = z.infer<typeof statusSupervisaoEnum>;

export const escalaNotaEnum = z.number().int().min(1, "A nota mínima é 1 (Crítica)").max(5, "A nota máxima é 5 (Ótima)");

export const statusEspacoFisicoEnum = z.enum(["Adequado", "Requer atenção"]);
export const statusMateriaisEnum = z.enum(["Adequados", "Pendentes"]);

export const fotosSupervisaoSchema = z.object({
  atividade: z.array(z.string().url("URL de imagem inválida")).default([]),
  estrutura: z.array(z.string().url("URL de imagem inválida")).default([]),
  materiais_coletivos: z.array(z.string().url("URL de imagem inválida")).default([]),
  materiais_concedidos: z.array(z.string().url("URL de imagem inválida")).default([]),
});
export type FotosSupervisao = z.infer<typeof fotosSupervisaoSchema>;

export const iniciarSupervisaoSchema = z.object({
  objeto_id: z.string().uuid("Objeto inválido"),
  local_id: z.string().uuid("Local/Polo obrigatório"),
  bloco_id: z.string().uuid("Bloco inválido").optional().nullable(),
  instrutor_funcionario_id: z.string().uuid("Instrutor/Professor obrigatório"),
});
export type IniciarSupervisaoInput = z.infer<typeof iniciarSupervisaoSchema>;

export const atualizarSupervisaoSchema = z.object({
  id: z.string().uuid("ID da supervisão inválido"),
  bloco_id: z.string().uuid().optional().nullable(),
  instrutor_funcionario_id: z.string().uuid().optional(),
  professor_presente: z.boolean().default(true),
  grade_conforme: z.boolean().default(true),
  chamada_conferida: z.boolean().default(true),
  turmas_auditadas: z.array(z.string()).optional().default([]),
  qtd_beneficiarios_presentes: z.number().int().min(0, "A contagem não pode ser negativa").default(0),
  atividade_acompanhada: z.string().optional().nullable(),
  
  // Setor 1: Espaço Físico
  espaco_fisico_status: statusEspacoFisicoEnum.optional().nullable(),
  nota_estrutura: escalaNotaEnum.optional().nullable(),
  obs_estrutura: z.string().optional().nullable(),
  
  // Setor 2: Materiais Coletivos
  materiais_coletivos_status: statusMateriaisEnum.optional().nullable(),
  nota_materiais_coletivos: escalaNotaEnum.optional().nullable(),
  obs_materiais_coletivos: z.string().optional().nullable(),
  
  // Setor 3: Materiais Concedidos (Uniformes / Individuais)
  materiais_concedidos_status: statusMateriaisEnum.optional().nullable(),
  nota_materiais_concedidos: escalaNotaEnum.optional().nullable(),
  obs_materiais_concedidos: z.string().optional().nullable(),
  
  // Fotos Estruturadas
  fotos: fotosSupervisaoSchema.optional(),
  
  // Pareceres e Orientações
  observacoes: z.string().optional().nullable(),
  ocorrencias: z.string().optional().nullable(),
  orientacoes_professor: z.string().optional().nullable(),
  providencias: z.string().optional().nullable(),
  prazo_regularizacao: z.string().optional().nullable(),
  situacao: situacaoSupervisaoEnum.default("Regular"),
});
export type AtualizarSupervisaoInput = z.infer<typeof atualizarSupervisaoSchema>;

export const concluirSupervisaoSchema = z.object({
  id: z.string().uuid("ID da supervisão inválido"),
  hora_fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Horário de encerramento inválido"),
  professor_presente: z.boolean(),
  grade_conforme: z.boolean(),
  chamada_conferida: z.boolean(),
  turmas_auditadas: z.array(z.string()).optional().default([]),
  qtd_beneficiarios_presentes: z.number().int().min(0),
  atividade_acompanhada: z.string().min(5, "A descrição da atividade acompanhada deve ter no mínimo 5 caracteres"),
  
  // Setor 1
  espaco_fisico_status: statusEspacoFisicoEnum,
  nota_estrutura: escalaNotaEnum,
  obs_estrutura: z.string().optional().nullable(),
  
  // Setor 2
  materiais_coletivos_status: statusMateriaisEnum,
  nota_materiais_coletivos: escalaNotaEnum,
  obs_materiais_coletivos: z.string().optional().nullable(),
  
  // Setor 3
  materiais_concedidos_status: statusMateriaisEnum,
  nota_materiais_concedidos: escalaNotaEnum,
  obs_materiais_concedidos: z.string().optional().nullable(),
  
  fotos: fotosSupervisaoSchema,
  
  observacoes: z.string().optional().nullable(),
  ocorrencias: z.string().optional().nullable(),
  orientacoes_professor: z.string().optional().nullable(),
  providencias: z.string().optional().nullable(),
  prazo_regularizacao: z.string().optional().nullable(),
  situacao: situacaoSupervisaoEnum,
});
export type ConcluirSupervisaoInput = z.infer<typeof concluirSupervisaoSchema>;

export const filtroSupervisoesSchema = z.object({
  objeto_id: z.string().uuid().optional(),
  local_id: z.string().uuid().optional(),
  situacao: situacaoSupervisaoEnum.optional(),
  status: statusSupervisaoEnum.optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
});
export type FiltroSupervisoesInput = z.infer<typeof filtroSupervisoesSchema>;
