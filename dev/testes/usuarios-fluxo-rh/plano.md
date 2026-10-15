# Plano Técnico — Fluxo Unificado de Usuários com Vínculo Dinâmico de RH

## 1. Visão Geral e Objetivo
Eliminar a fragmentação e fricção operacional no cadastro de colaboradores e operadores do sistema.
Quando um usuário com papel de atuação de campo (`instrutor`, `supervisor`, `coordenador`) for cadastrado no formulário de **Gestão de Usuários** (`/admin/usuarios`), o sistema deve permitir:
1. Vincular a um colaborador de RH já existente no catálogo; OU
2. Cadastrar diretamente os dados de RH daquele profissional (CPF, Cargo, OSC, Projeto e Polo), criando o login e o registro de funcionário em uma única operação transacional.

---

## 2. Diagnóstico Atual
- Atualmente, o modal de criação de usuário apenas exibe um `<select>` com funcionários pré-existentes. Se o instrutor for novo, o administrador é obrigado a abandonar a tela, ir em `/admin/funcionarios`, preencher o RH e retornar para criar o usuário.
- Para papéis puramente administrativos (`super_admin`, `admin_projeto`, `operador`, `auditor`), dados de RH de campo não são necessários.

---

## 3. Especificação do Novo Fluxo Unificado

### 3.1. Formulário Inteligente de Usuário (`usuarios-client.tsx`)
- **Seção 1: Credenciais e Identidade**:
  - Nome Completo
  - E-mail (login)
  - Senha de Acesso (com toggle de visibilidade)
  - Papel Institucional (`super_admin`, `admin_projeto`, `coordenador`, `supervisor`, `instrutor`, `operador`, `auditor`)
  - Status (Ativo / Inativo)
- **Seção 2: Escopo de Projetos (se não for `super_admin`)**:
  - Seleção dos projetos que o usuário pode gerenciar/visualizar.
- **Seção 3: Vínculo de RH (Acionado dinamicamente para papéis de campo)**:
  - Para `instrutor`, `supervisor` e `coordenador`:
    - Alternador: **[Criar novo registro de RH]** vs **[Vincular a funcionário existente]** vs **[Sem vínculo no momento]**.
    - Ao escolher **Criar novo registro de RH**:
      - CPF (com máscara universal `maskCpf` e validação)
      - Cargo Contratual (pré-preenchido com sugestão contextual ao papel, ex: "Instrutor", "Supervisor de Campo", "Coordenador Regional")
      - OSC / Entidade Empregadora (select)
      - Projeto de Alocação (select)
      - Polo de Atuação (select filtrado pelo projeto)
      - Carga Horária Semanal (padrão: 40h)

### 3.2. Server Action Transacional (`createUsuario` em `usuarios.ts`)
- Quando a opção de novo RH for enviada no payload:
  1. Cria o usuário em `auth.users` via Supabase Auth.
  2. Garante o registro do perfil em `public.usuarios`.
  3. Insere os acessos de projeto em `public.usuario_acessos`.
  4. Insere o registro em `public.funcionarios` já com `usuario_id` preenchido.
  5. Revalida `/admin/usuarios` e `/admin/funcionarios`.

---

## 4. Coerência com Diretrizes
- **Zero Mock**: Nenhum valor fixo ou hardcoded.
- **Zero Fallback Silencioso**: Exibição explícita de erros e validações.
- **Máscaras Canônicas**: Uso estrito de `maskCpf` e `maskPhone` de `@/lib/utils/masks`.
- **Desacoplamento Preservado**: No banco de dados, `usuarios` e `funcionarios` continuam estritamente independentes para salvaguardar a prestação de contas do MROSC.
