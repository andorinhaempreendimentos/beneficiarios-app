# Plano — Fase 0: Fundação e Infraestrutura

## Objetivo
Montar a base completa sobre a qual todo o restante do sistema será construído:
scaffolding Next.js, banco de dados com schema completo, autenticação, camada de
vocabulário dinâmico e layout base funcional.

## Estratégia Técnica

### 1. Scaffolding Next.js 15
- `create-next-app` com App Router, TypeScript strict, Tailwind CSS, src/ dir, alias `@/`
- Node.js 22+

### 2. Dependências principais
- `@supabase/supabase-js` + `@supabase/ssr` (server-side auth com cookies)
- `shadcn/ui` com tema Vercel (https://www.shadcn.io/theme/vercel)
- `zod` (validação de schemas nos Server Actions)
- `lucide-react` (ícones — já incluso pelo shadcn)

### 3. DDL no Supabase
Executar as migrations SQL na ordem exata definida no plano-projeto.md (Grupos 1–22),
respeitando dependências de FK. Cada grupo de tabelas é uma migration separada e nomeada.

### 4. Autenticação
- Padrão oficial Supabase SSR: `createServerClient` / `createBrowserClient`
- Middleware Next.js para refresh de sessão e proteção de rotas autenticadas
- Página `/login` com email + senha
- Redirecionamento pós-login baseado no `papel` do usuário (`usuarios.papel`)

### 5. Camada de Vocabulário Dinâmico
- `ObjetoContext` (React Context) — armazena o objeto ativo e seus termos
- Hook `useVocabulario()` — expõe os termos resolvidos (`termo_local`, `termo_instrutor`, etc.)
- Server Component helper `getVocabulario(objeto_id)` para uso em RSC e relatórios
- Regra: nunca usar fallback hardcoded (`termo || 'Polo'` é vedado)

### 6. Layout Base
- `app/(dashboard)/layout.tsx` — sidebar + header
- Sidebar: navegação por módulo, restrita ao papel do usuário
- Header: nome do usuário logado + seletor de projeto (escopo RBAC):
  - Admin único → entra diretamente no objeto, seletor oculto
  - Admin multi → dropdown com objetos autorizados
  - Super Admin → todos os objetos + opção "Visão Global"
- Estado do objeto ativo persistido via URL param (`?objeto_id=...`) ou cookie de sessão

## Decisões Técnicas
- Pasta de rotas: `app/(dashboard)/` para tudo autenticado; `app/(public)/` para autoinscrição e pesquisas
- Supabase clients: `lib/supabase/server.ts` e `lib/supabase/client.ts`
- Types gerados: `lib/database.types.ts` (via `supabase gen types`)
- Sem ORM: queries diretas via Supabase client (`.from().select()`)
