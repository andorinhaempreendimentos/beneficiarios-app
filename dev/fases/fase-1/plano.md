# Plano Técnico — Fase 1: Núcleo Institucional (Admin Panel)

## 1. Visão Geral e Objetivo
Implementar o painel administrativo completo para gestão das entidades mestras que alimentam todo o sistema:
Organizações Sociais, Concedentes, Modalidades Esportivas, Objetos (Projetos) com Vocabulário Dinâmico, Regiões Territoriais, Locais (Polos/Núcleos), Funcionários (RH de campo) e Gestão de Usuários com RBAC escopado.

## 2. Regras Canônicas Estritas (AGENTS.md)
1. **Regra de Obrigatoriedade de Região (§3.2)**:
   - Todo Objeto possui obrigatoriamente pelo menos uma região.
   - Ao criar um Objeto sem subdivisões específicas, o sistema gera automaticamente a **"Região Única"** vinculada a ele.
   - Todo Local pertence obrigatoriamente a uma região (`regiao_id NOT NULL`).
2. **Desacoplamento Usuário vs. Funcionário (§4.1)**:
   - `funcionarios`: registro trabalhista para prestação de contas (CPF, cargo, polo).
   - `usuarios`: conta de acesso e segurança (`auth.users`).
   - Vínculo opcional `funcionarios.usuario_id`. Desligamento bloqueia o usuário, mantendo o histórico do funcionário.
3. **Vocabulário Dinâmico (§4.3)**:
   - Armazenado diretamente nas colunas da tabela `objetos` (`termo_polo`, `termo_nucleo`, `termo_turma`, `termo_aluno`, `termo_instrutor`, `termo_supervisor`, `termo_coordenador`, `termo_modalidade`).
   - Zero hardcoded e zero fallback silencioso.
4. **Matriz RBAC com Escopo (§4.2)**:
   - `super_admin`: visão global irrestrita.
   - Outros papéis: escopados pelos registros em `usuario_acessos`.

## 3. Estrutura de Arquivos e Telas
```
src/
├── lib/
│   ├── validations/
│   │   ├── configuracoes.ts
│   │   ├── organizacoes.ts
│   │   ├── concedentes.ts
│   │   ├── modalidades.ts
│   │   ├── objetos.ts
│   │   ├── regioes.ts
│   │   ├── locais.ts
│   │   ├── funcionarios.ts
│   │   └── usuarios.ts
│   └── actions/
│       ├── configuracoes.ts
│       ├── organizacoes.ts
│       ├── concedentes.ts
│       ├── modalidades.ts
│       ├── objetos.ts
│       ├── regioes.ts
│       ├── locais.ts
│       ├── funcionarios.ts
│       └── usuarios.ts
├── components/
│   └── admin/
│       ├── data-table.tsx
│       ├── confirm-dialog.tsx
│       └── forms/
└── app/
    └── (dashboard)/
        └── admin/
            ├── page.tsx (Visão geral do painel admin)
            ├── configuracoes/page.tsx
            ├── organizacoes/page.tsx
            ├── concedentes/page.tsx
            ├── modalidades/page.tsx
            ├── objetos/
            │   ├── page.tsx
            │   ├── novo/page.tsx
            │   └── [id]/page.tsx (Abas: Dados Gerais, Vocabulário, Regiões, Locais)
            ├── locais/page.tsx
            ├── funcionarios/page.tsx
            └── usuarios/page.tsx
```

## 4. Estratégia de Execução Passo a Passo
1. **Infra de Validação e Componentes Base**: Schemas Zod e componente genérico de tabela/diálogo para CRUDs.
2. **Configurações do Sistema**: Gestão dos dados da entidade administradora.
3. **Organizações Sociais & Concedentes**: Cadastros institucionais primários.
4. **Modalidades & Checklist**: Catálogo esportivo global.
5. **Objetos (Projetos) & Criação da Região Única**: Criação com vocabulário dinâmico obrigatório e automação da Região Única.
6. **Regiões & Locais (Polos)**: Gestão territorial e polos físicos vinculados à região.
7. **Funcionários (RH)**: Gestão de colaboradores com cargo, CPF e polo.
8. **Gestão de Usuários & RBAC Escopado**: Criação de login, papéis e permissões por objeto.
