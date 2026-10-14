# Tasklist — Fase 7: Logística de Materiais, Remessas e Entregas Individuais

## Tarefas Atômicas

- [x] **T01** — Storage & Schemas Zod: Validar bucket `materiais-fotos` e implementar `src/lib/validations/fase-7.ts` com validação de catálogo de materiais, remessas aos polos e entregas nominais de kits
- [x] **T02** — Server Actions de Logística: Implementar `src/lib/actions/materiais.ts` (`getLogisticaMateriaisData`, `criarObjetoMaterial`, `registrarRemessaPolo`, `registrarEntregaAluno`, `registrarEntregasTurmaLote` e `getDemandasUniformesPorPolo`)
- [x] **T03** — Painel Central de Logística & Estoque (`/materiais`): Implementar visão unificada com 4 KPIs, abas de catálogo, remessas com fotos de tombamento, matriz de demanda de uniformes e extrato de entregas
- [x] **T04** — Módulo de Entrega Rápida do Professor: Integrar confirmação de entrega nominal de kits com fé pública soberana do instrutor na interface de atendimento
- [ ] **T05** — Validação Completa, Compilação e Deploy: Executar `npx tsc --noEmit`, `npm run build`, push para produção na Vercel e Tríplice Validação de conformidade
