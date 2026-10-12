# Tasklist — Fase 0: Fundação e Infraestrutura

## Tarefas

- [x] **T01** — Scaffolding Next.js 15 com App Router, TypeScript, Tailwind, src/, alias `@/`
- [x] **T02** — Instalar dependências: `@supabase/supabase-js`, `@supabase/ssr`, `zod`
- [x] **T03** — Instalar e configurar `shadcn/ui` com tema Vercel
- [x] **T04** — Criar clientes Supabase: `lib/supabase/server.ts` e `lib/supabase/client.ts`
- [x] **T05** — Configurar middleware Next.js para refresh de sessão e proteção de rotas
- [x] **T06** — Executar DDL Grupo 1: `configuracoes_sistema`
- [x] **T07** — Executar DDL Grupo 2: `organizacoes`, `concedentes`
- [x] **T08** — Executar DDL Grupo 3: `objetos`
- [x] **T09** — Executar DDL Grupo 4: `modalidades`, `modalidade_checklist_itens`
- [x] **T10** — Executar DDL Grupo 5: `locais`
- [x] **T11** — Executar DDL Grupo 6: `funcionarios`, `usuarios`, `usuario_acessos`
- [x] **T12** — Executar DDL Grupo 7: `grupos`, `beneficiarios`, `matriculas`, `objeto_perguntas_inscricao`
- [x] **T13** — Executar DDL Grupo 8: `blocos`, `bloco_grupos`
- [x] **T14** — Executar DDL Grupo 9: `sessoes`
- [x] **T15** — Executar DDL Grupo 10: `regioes` + FK `locais.regiao_id`
- [x] **T16** — Executar DDL Grupos 11–14: `objeto_metas`, `objeto_materiais`, `materiais_remessas_polo`, `materiais_entregas_aluno`
- [x] **T17** — Executar DDL Grupos 15–17: `visitas_supervisao`, `relatorios_supervisao_consolidado`, `relatorios_prestacao_contas`
- [x] **T18** — Executar DDL Grupos 18–19: `beneficiarios_presencas`, `registros_ponto`
- [x] **T19** — Executar DDL Grupo 21: `pesquisas`, `categorias_campo`, `perguntas_pesquisa`, `respostas`, `resposta_itens`
- [x] **T20** — Executar DDL Grupo 22: `whatsapp_instancias`, `whatsapp_numeros`, `whatsapp_templates`, `whatsapp_campanhas`, `whatsapp_disparo_logs`
- [x] **T21** — Configurar RLS: habilitar em todas as tabelas + políticas base por papel
- [x] **T22** — Gerar types TypeScript via `supabase gen types` → `lib/database.types.ts`
- [x] **T23** — Criar página `/login` com form email + senha (Server Action)
- [x] **T24** — Criar `ObjetoContext` + hook `useVocabulario()` com regra anti-fallback
- [x] **T25** — Criar layout base `app/(dashboard)/layout.tsx`: sidebar + header + seletor de projeto (RBAC)
