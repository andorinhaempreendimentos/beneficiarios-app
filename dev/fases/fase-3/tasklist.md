# Tasklist — Fase 3: Painel do Instrutor e Execução de Sessões

## Tarefas Atômicas

- [x] **T01** — Storage & Bucket: Criar bucket `sessoes-fotos` no Supabase Storage e configurar políticas RLS para upload autenticado e leitura probatória
- [x] **T02** — Schemas Zod: Criar `src/lib/validations/fase-3.ts` com validação de início, conclusão com $\ge 2$ fotos obrigatórias e status tripartite de presença
- [x] **T03** — Server Actions de Sessão & Ponto: Implementar `src/lib/actions/sessoes.ts` (`iniciarSessao` com clock-in, `concluirSessao` com clock-out e snapshot imutável, `getPainelInstrutorData`, `getSessaoDetalhes` e `uploadFotoSessao`)
- [x] **T04** — Painel do Instrutor Mobile-First (`/sessoes`): Implementar mini-dashboard com indicadores do mês (aulas, horas, frequência média, alunos) e abas "Hoje", "Esta Semana" e "Histórico"
- [x] **T05** — Cockpit de Execução da Aula (`/sessoes/[id]`): Implementar visualização do bloco, cronômetro de aula em tempo real e chamada nominal ágil (Presente, Falta, Justificada com marcação em lote)
- [x] **T06** — Evidências Fotográficas & Encerramento Probatório: Implementar upload/captura de câmera com pré-visualização, trava de finalização se houver menos de 2 fotos, gravação de ponto e travamento como snapshot imutável
- [x] **T07** — Validação Completa, Compilação e Deploy: Executar `npx tsc --noEmit`, `npm run build`, push para produção na Vercel e Tríplice Validação de conformidade
