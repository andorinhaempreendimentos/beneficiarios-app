import { z } from "zod";

function validarCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

// 1. Grupos / Turmas (§3.3)
export const grupoSchema = z
  .object({
    nome: z.string().min(2, "Nome da turma é obrigatório"),
    objeto_id: z.string().uuid("Projeto obrigatório"),
    local_id: z.string().uuid("Polo/Local obrigatório"),
    modalidade_id: z
      .string()
      .uuid("Modalidade inválida")
      .optional()
      .nullable()
      .or(z.literal("")),
    capacidade_maxima: z.coerce
      .number()
      .int("A capacidade deve ser um número inteiro")
      .min(1, "A capacidade deve ser de no mínimo 1 vaga"),
    idade_minima: z.coerce
      .number()
      .int()
      .min(0, "Idade mínima inválida")
      .optional()
      .nullable()
      .or(z.literal("")),
    idade_maxima: z.coerce
      .number()
      .int()
      .min(0, "Idade máxima inválida")
      .optional()
      .nullable()
      .or(z.literal("")),
    ativo: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const min = typeof data.idade_minima === "number" ? data.idade_minima : null;
      const max = typeof data.idade_maxima === "number" ? data.idade_maxima : null;
      if (min !== null && max !== null) {
        return max >= min;
      }
      return true;
    },
    {
      message: "A idade máxima não pode ser menor que a idade mínima",
      path: ["idade_maxima"],
    }
  );

export type GrupoInput = z.infer<typeof grupoSchema>;

// 2. Blocos de Horário / Planejamento Temporal (§3.4)
export const blocoSchema = z
  .object({
    nome: z.string().optional().nullable(),
    objeto_id: z.string().uuid("Projeto obrigatório"),
    local_id: z.string().uuid("Polo/Local obrigatório"),
    dia_semana: z.coerce
      .number()
      .int()
      .min(0)
      .max(6)
      .optional()
      .nullable()
      .or(z.literal("")),
    data_especifica: z
      .string()
      .min(10, "Data específica deve ter o formato AAAA-MM-DD")
      .optional()
      .nullable()
      .or(z.literal("")),
    hora_inicio: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Horário de início deve estar no formato HH:MM"),
    hora_fim: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Horário de término deve estar no formato HH:MM"),
    instrutor_id: z
      .string()
      .uuid("Instrutor inválido")
      .optional()
      .nullable()
      .or(z.literal("")),
    grupos_ids: z.array(z.string().uuid()).default([]),
    ativo: z.boolean().default(true),
  })
  .refine((data) => data.hora_fim > data.hora_inicio, {
    message: "O horário de término deve ser posterior ao horário de início",
    path: ["hora_fim"],
  })
  .refine((data) => data.dia_semana !== null || Boolean(data.data_especifica), {
    message: "Informe o dia da semana (projeto contínuo) ou a data específica (projeto pontual)",
    path: ["dia_semana"],
  });

export type BlocoInput = z.infer<typeof blocoSchema>;

// 3. Beneficiário - Cadastro Civil Universal (§3.3)
export const beneficiarioSchema = z
  .object({
    nome_completo: z.string().min(2, "Nome completo é obrigatório"),
    cpf: z
      .string()
      .min(11, "CPF deve ter 11 dígitos")
      .refine((val) => validarCPF(val), { message: "CPF inválido" }),
    data_nascimento: z
      .string()
      .min(10, "Data de nascimento obrigatória no formato AAAA-MM-DD"),
    genero: z.enum(["M", "F", "Outro", "Nao_informado"], {
      message: "Selecione o gênero",
    }),
    telefone: z.string().optional().nullable(),
    nome_responsavel: z.string().optional().nullable(),
    telefone_responsavel: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // Se for menor de 18 anos, exigir dados do responsável legal
      const [ano, mes, dia] = data.data_nascimento.split("-").map(Number);
      if (!ano || !mes || !dia) return true;
      const nasc = new Date(ano, mes - 1, dia);
      const hoje = new Date();
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
      }
      if (idade < 18) {
        return Boolean(data.nome_responsavel && data.nome_responsavel.trim().length >= 2);
      }
      return true;
    },
    {
      message: "Para participantes menores de 18 anos, o nome do responsável legal é obrigatório",
      path: ["nome_responsavel"],
    }
  );

export type BeneficiarioInput = z.infer<typeof beneficiarioSchema>;

// 4. Matrícula Associativa no Objeto / Turma (§3.3)
export const matriculaStatusEnum = z.enum([
  "ativo",
  "pre_inscrito",
  "lista_espera",
  "concluido",
  "cancelado",
]);

export const matriculaSchema = z.object({
  objeto_id: z.string().uuid("Projeto obrigatório"),
  grupo_id: z.string().uuid("Turma obrigatória"),
  beneficiario_id: z.string().uuid("Beneficiário obrigatório"),
  data_matricula: z
    .string()
    .min(10, "Data de matrícula obrigatória no formato AAAA-MM-DD"),
  status: matriculaStatusEnum.default("ativo"),
  vulneravel: z.boolean().default(false),
  dados_adicionais: z.record(z.string(), z.unknown()).default({}),
  motivo_cancelamento: z.string().optional().nullable(),
  data_cancelamento: z.string().optional().nullable(),
});

export type MatriculaInput = z.infer<typeof matriculaSchema>;

// 5. Perguntas da Inscrição - Modelo Híbrido (§3.3.2)
export const tipoPerguntaEnum = z.enum([
  "texto_curto",
  "opcoes",
  "sim_nao",
  "numero",
  "data",
  "arquivo",
]);

export const perguntaInscricaoSchema = z.object({
  objeto_id: z.string().uuid("Projeto obrigatório"),
  titulo: z.string().min(2, "Título da pergunta é obrigatório"),
  tipo: tipoPerguntaEnum,
  opcoes: z.array(z.string()).optional().nullable(),
  obrigatorio: z.boolean().default(false),
  exibir_autoinscricao: z.boolean().default(true),
  ordem: z.coerce.number().int().default(0),
});

export type PerguntaInscricaoInput = z.infer<typeof perguntaInscricaoSchema>;

// 6. Autoinscrição Pública (§3.3.1)
export const autoinscricaoPublicaSchema = z.object({
  objeto_id: z.string().uuid("Projeto obrigatório"),
  grupo_id: z.string().uuid("Grupo obrigatório"),
  // Dados civis
  nome_completo: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .refine((val) => validarCPF(val), { message: "CPF inválido" }),
  data_nascimento: z
    .string()
    .min(10, "Data de nascimento obrigatória no formato AAAA-MM-DD"),
  genero: z.enum(["M", "F", "Outro", "Nao_informado"], {
    message: "Selecione o gênero",
  }),
  telefone: z.string().optional().nullable(),
  nome_responsavel: z.string().optional().nullable(),
  telefone_responsavel: z.string().optional().nullable(),
  // Respostas do formulário customizado
  vulneravel: z.boolean().default(false),
  dados_adicionais: z.record(z.string(), z.unknown()).default({}),
});

export type AutoinscricaoPublicaInput = z.infer<typeof autoinscricaoPublicaSchema>;
