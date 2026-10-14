# Tasklist — Fase 8: Catálogo e Apuração de Metas MROSC

## Tarefas Atômicas

- [x] **T01** — Schemas Zod & Storage: Implementar `src/lib/validations/fase-8.ts` com validação de catálogo de metas e apuração declaratória; validar bucket `metas-anexos`
- [x] **T02** — Engine de Apuração Automatizada & Server Actions: Implementar `src/lib/actions/metas.ts` (`getMetasMroscData`, `salvarObjetoMeta`, `excluirObjetoMeta`, `registrarApuracaoDeclaratoria` e `uploadAnexoMeta`)
- [x] **T03** — Painel Central de Metas MROSC (`/metas`): Implementar página e componente de acompanhamento com 4 KPIs, barras de progresso previstas vs realizadas, modais de lançamento e exportação
- [x] **T04** — Integração Transversal nos Relatórios Oficiais: Conectar extrato de metas ao Hub de Relatórios MROSC (`/relatorios` e `/relatorios/master`)
- [ ] **T05** — Validação Completa, Compilação e Deploy: Executar `npx tsc --noEmit`, `npm run build`, push autenticado para produção na Vercel e Tríplice Validação de conformidade
