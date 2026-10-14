# Tasklist — Fase 6: Relatórios Oficiais, Motor de Templates e Prestação de Contas Governamental

## Tarefas Atômicas

- [x] **T01** — Schemas Zod: Criar `src/lib/validations/fase-6.ts` com validação de filtros analíticos, retificação de ponto eletrônico, fechamento do Relatório Master Nível 3 e versionamento retificador (`v1 -> v2`)
- [x] **T02** — Server Actions Analíticas (`src/lib/actions/relatorios.ts`): Implementar `getRelatorioAssiduidadeNominal` (cálculo tripartite oficial de assiduidade e busca ativa de evasão) e `getRelatorioRecursosHumanos` com `retificarRegistroPonto` auditado
- [x] **T03** — Server Actions do Relatório Master Nível 3: Implementar compilação das 16 seções executivas e 8 cadernos de anexos oficiais com geração do snapshot imutável em `relatorios_prestacao_contas` e suporte a retificação
- [x] **T04** — Hub Central de Relatórios (`/relatorios`): Implementar página principal de acesso à governança documental e prestação de contas governamental
- [x] **T05** — Painel Analítico de Assiduidade e Busca Ativa (`/relatorios/assiduidade`): Implementar interface com tabela nominal atômica, filtros de meta contratual, busca ativa de combate à evasão e exportação CSV
- [x] **T06** — Espelho de Recursos Humanos e Ponto Eletrônico (`/relatorios/ponto`): Implementar folha de ponto e modal de retificação administrativa auditada com justificativa obrigatória
- [x] **T07** — Cockpit do Relatório Master Nível 3 & Espelho Governamental (`/relatorios/master`): Implementar visualização interativa das 16 seções e 8 anexos com Tríplice Assinatura e espelho impresso com fé pública
- [x] **T08** — Validação Completa, Compilação e Deploy: Executar `npx tsc --noEmit`, `npm run build`, push para produção na Vercel e Tríplice Validação de conformidade
