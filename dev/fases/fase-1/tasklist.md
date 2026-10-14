# Tasklist — Fase 1: Núcleo Institucional (Admin Panel)

## Tarefas Atômicas

- [x] **T01** — Criar schemas Zod de validação para as entidades institucionais (`src/lib/validations/admin.ts`)
- [x] **T02** — Instalar componentes shadcn adicionais (`table`, `dialog`, `select`, `tabs`, `textarea`) e criar componentes auxiliares (`admin-page-header.tsx`, `confirm-dialog.tsx`)
- [x] **T03** — Implementar Módulo de Configurações do Sistema (`/admin/configuracoes`): Server Action + Formulário com dados institucionais
- [x] **T04** — Implementar Módulo de Organizações Sociais (`/admin/organizacoes`): Server Actions (CRUD) + Listagem + Modal de Criação/Edição
- [x] **T05** — Implementar Módulo de Concedentes (`/admin/concedentes`): Server Actions (CRUD) + Listagem + Modal de Criação/Edição
- [x] **T06** — Implementar Módulo de Modalidades Esportivas (`/admin/modalidades`): Server Actions + Catálogo global + Checklist de vistoria padrão
- [x] **T07** — Implementar Módulo de Criação de Objetos (`/admin/objetos/novo` e listagem `/admin/objetos`): Server Actions com geração automática da "Região Única" e validação estrita de vocabulário dinâmico
- [x] **T08** — Implementar Página de Detalhes do Objeto (`/admin/objetos/[id]`): visualização e edição em abas (Dados Gerais, Vocabulário Dinâmico, Regiões, Polos)
- [x] **T09** — Implementar Módulo de Regiões Territoriais (`/admin/regioes`): Server Actions (CRUD) + Vinculação com Coordenador titular
- [x] **T10** — Implementar Módulo de Locais/Polos (`/admin/locais`): Server Actions (CRUD) com `regiao_id NOT NULL` obrigatório + coordenadas e dados de atendimento
- [x] **T11** — Implementar Módulo de Funcionários/RH (`/admin/funcionarios`): Server Actions (CRUD) com CPF, cargo contratual e polo alocado
- [x] **T12** — Implementar Módulo de Gestão de Usuários & RBAC (`/admin/usuarios`): Server Actions para criação de login, atribuição de papel e escopo por objeto (`usuario_acessos`)
- [x] **T13** — Implementar Dashboard Hub Administrativo (`/admin`): Página principal com cards de resumo e atalhos rápidos
- [x] **T14** — Validação completa de compilação, lint e tipos (`npx tsc --noEmit` + `npm run lint` + `npm run build`)
