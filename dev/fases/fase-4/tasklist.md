# Tasklist — Fase 4: Painel do Supervisor, Vistorias e Checklists em Campo

## Tarefas Atômicas

- [x] **T01** — Storage & Bucket: Criar bucket `supervisoes-fotos` no Supabase Storage e configurar políticas RLS para upload autenticado e leitura probatória
- [x] **T02** — Schemas Zod: Criar `src/lib/validations/fase-4.ts` com validação de início de supervisão, notas de 1 a 5 por setor, fotos probatórias e parecer global
- [x] **T03** — Server Actions de Supervisão: Implementar `src/lib/actions/supervisoes.ts` (`getPainelSupervisorData`, `iniciarSupervisao`, `getSupervisaoDetalhes`, `salvarRascunhoSupervisao`, `concluirSupervisao` com snapshot imutável e `uploadFotoSupervisao`)
- [x] **T04** — Painel do Supervisor Mobile-First (`/supervisoes`): Implementar mini-dashboard de cobertura/conformidade, lista de vistorias com filtros de polo e situação
- [x] **T05** — Check-in e Cruzamento com a Agenda: Implementar fluxo de abertura com seleção do polo, detecção automática do bloco/turma do horário e confirmação do instrutor
- [x] **T06** — Cockpit de Vistoria, Avaliação Setorizada e Homologação (`/supervisoes/[id]`): Implementar etapas de atividade em campo, vistoria em 5 níveis (Espaço Físico, Materiais Coletivos e Concedidos), parecer global e espelho de revisão com congelamento imutável
- [x] **T07** — Validação Completa, Compilação e Deploy: Executar `npx tsc --noEmit`, `npm run build`, push para produção na Vercel e Tríplice Validação de conformidade
