# Tasklist — Fase 5: Painel do Coordenador, Gestão Regional e Fechamento Periódico

## Tarefas Atômicas

- [x] **T01** — Estrutura de Dados & Regiões: Mapear e validar relacionamentos entre `regioes`, `locais.regiao_id`, `coordenador_id` e a tabela `relatorios_prestacao_contas` no Supabase
- [x] **T02** — Schemas Zod: Criar `src/lib/validations/fase-5.ts` com validação de fechamento periódico, 4 blocos dissertativos da síntese qualitativa e filtros regionais
- [x] **T03** — Server Actions da Coordenação: Implementar `src/lib/actions/coordenacao.ts` (`getPainelCoordenadorData`, `salvarRascunhoSintese`, `fecharCicloPeriodico` com snapshot imutável em `relatorios_prestacao_contas` e `getRelatorioPeriodicoDetalhes`)
- [x] **T04** — Painel Regional do Coordenador (`/coordenacao`): Implementar visão integrada da região, indicadores de topo (polos ativos, vistorias e pendências) e feed cronológico de supervisões
- [x] **T05** — Painel de Ocorrências e Monitoramento de Prazos: Implementar central de inconformidades com prazos de regularização e cobrança ativa dos polos
- [x] **T06** — Síntese da Coordenação & Fechamento Periódico (Caderno Nível 2): Implementar editor dos 4 blocos dissertativos, visualização do espelho consolidado e homologação oficial
- [x] **T07** — Validação Completa, Compilação e Deploy: Executar `npx tsc --noEmit`, `npm run build`, push para produção na Vercel e Tríplice Validação de conformidade
