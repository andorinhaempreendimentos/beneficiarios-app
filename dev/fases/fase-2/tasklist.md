# Tasklist — Fase 2: Grupos, Beneficiários & Matrículas

## Tarefas Atômicas

- [x] **T01** — Criar schemas Zod de validação para a Fase 2 (`src/lib/validations/fase-2.ts`)
- [x] **T02** — Implementar Server Actions de Grupos (`src/lib/actions/grupos.ts`)
- [x] **T03** — Implementar Interface de Gestão de Grupos (`/grupos`): Listagem, filtros e modal de criação/edição
- [x] **T04** — Implementar Página de Detalhes do Grupo (`/grupos/[id]`): Beneficiários matriculados, lista de espera, blocos e links
- [x] **T05** — Implementar Server Actions de Planejamento Temporal & Blocos (`src/lib/actions/blocos.ts`)
- [x] **T06** — Implementar Interface de Planejamento Temporal (`/planejamento`): Grade Semanal e agenda de blocos por instrutor
- [x] **T07** — Implementar Server Actions de Beneficiários (`src/lib/actions/beneficiarios.ts`): Cadastro civil único por CPF
- [x] **T08** — Implementar Interface de Beneficiários (`/beneficiarios` e `/beneficiarios/[id]`): Cidadãos e histórico de projetos
- [x] **T09** — Implementar Server Actions de Matrículas (`src/lib/actions/matriculas.ts`): Associação, cálculo de idade, cotas e vulnerabilidade
- [x] **T10** — Implementar Interface de Gestão de Matrículas (`/matriculas`): Filtros por status, cota de vulnerabilidade e cancelamento
- [x] **T11** — Implementar Construtor de Formulários Híbridos no Objeto (`/admin/objetos/[id]/perguntas`): Campos customizados e preview mobile
- [x] **T12** — Implementar Server Actions de Autoinscrição Pública (`src/lib/actions/autoinscricao.ts`): Inscrição anônima e RLS seguro
- [x] **T13** — Implementar Páginas Públicas de Autoinscrição (`/inscricao/[slug]` e `/inscricao/grupo/[grupoId]`): Interface mobile com QR Code
- [x] **T14** — Validação completa de compilação, lint e tipos (`npx tsc --noEmit` + `npm run lint` + `npm run build`), Tríplice Validação e push
