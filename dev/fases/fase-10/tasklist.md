# Tasklist — Fase 10: Hardening de Segurança (RLS), Salvaguardas por Timeout e Homologação Final

## Tarefas Atômicas

- [x] **T01** — Salvaguarda Automática de Sessões por Timeout: Implementar `src/lib/actions/salvaguardas.ts` e o route handler `src/app/api/cron/salvaguarda-sessoes/route.ts` para encerramento automático de sessões e pontos esquecidos em campo (§3.5)
- [x] **T02** — Hardening e Auditoria de Políticas RLS: Auditar via Supabase MCP todas as tabelas do sistema, assegurando isolamento multi-tenant por objeto e papel de acesso
- [x] **T03** — Otimizações de Performance & Índices de Banco: Validar e aplicar índices em chaves estrangeiras e campos de filtro frequente para queries analíticas e prestação de contas
- [x] **T04** — Auditoria Final de Tolerância Zero a Alucinações & Zero Fallback: Varredura de código para garantir ausência de strings hardcoded de domínio e ausência de fallbacks silenciosos em todas as páginas
- [x] **T05** — Build Final, Deploy em Produção na Vercel e Homologação de Ponta a Ponta: Executar `npx tsc --noEmit`, `npm run build`, push autenticado para a Vercel e emissão do Termo de Homologação Final
