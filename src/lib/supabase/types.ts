/**
 * Re-exporta os types gerados pelo Supabase.
 *
 * O arquivo database.types.ts é excluído do tsc (tsconfig.json) por incompatibilidade
 * com `isolatedModules: true` + `jsx: preserve` do Next.js. O Next.js SWC
 * compila corretamente sem tsc. Este proxy garante que os imports funcionem
 * no editor (LSP) e no build.
 *
 * Para regenerar: npx supabase gen types typescript --project-id hsbrdyhxbbcjqiryimxo --schema public | Out-File -FilePath src/lib/database.types.ts -Encoding utf8
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — arquivo gerado, excluído do tsc intencionalmente
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./database.types";
