import type { Database } from "@/lib/database.types";

export type Objeto = Database["public"]["Tables"]["objetos"]["Row"];

/**
 * Chaves dos termos dinâmicos disponíveis em um Objeto.
 * Jamais usar fallback hardcoded — se o campo for null/undefined, é um erro de dados.
 */
export type VocabularioKeys =
  | "termo_beneficiario"
  | "termo_instrutor"
  | "termo_grupo"
  | "termo_sessao"
  | "termo_bloco"
  | "termo_local"
  | "termo_materiais_coletivos"
  | "termo_materiais_concedidos";

export type Vocabulario = Pick<Objeto, VocabularioKeys>;
