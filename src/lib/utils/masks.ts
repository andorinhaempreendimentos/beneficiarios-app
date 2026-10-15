/**
 * Utilitários de Máscaras e Formatação de Dados Brasileiros
 * Implementação pura, de alta performance e compatível com React 19.
 */

/**
 * Remove todos os caracteres não numéricos.
 */
export function unmask(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/**
 * Aplica máscara de CPF: 000.000.000-00 (máximo 11 dígitos)
 */
export function maskCpf(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00 (máximo 14 dígitos)
 */
export function maskCnpj(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Aplica máscara inteligente de CPF ou CNPJ conforme o tamanho informado
 */
export function maskCpfCnpj(value: string | null | undefined): string {
  const digits = unmask(value);
  if (digits.length <= 11) {
    return maskCpf(value);
  }
  return maskCnpj(value);
}

/**
 * Aplica máscara dinâmica de Telefone brasileiro:
 * - Fixo (10 dígitos): (00) 0000-0000
 * - Celular/WhatsApp (11 dígitos): (00) 00000-0000
 */
export function maskPhone(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Aplica máscara de CEP: 00000-000 (máximo 8 dígitos)
 */
export function maskCep(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Validação básica estrutural de CPF (11 dígitos não repetidos)
 */
export function isValidCpfStructure(value: string | null | undefined): boolean {
  const digits = unmask(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  return true;
}

/**
 * Validação básica estrutural de CNPJ (14 dígitos não repetidos)
 */
export function isValidCnpjStructure(value: string | null | undefined): boolean {
  const digits = unmask(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  return true;
}
