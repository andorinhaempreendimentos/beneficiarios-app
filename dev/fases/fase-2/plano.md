# Plano Técnico — Fase 2: Turmas, Beneficiários & Matrículas

## 1. Visão Geral e Objetivo
Implementar a camada operacional de atendimento aos participantes do projeto social:
1. **Turmas / Grupos (`grupos`)**: Estrutura de reserva de vagas com regras de restrição de idade e modalidade.
2. **Planejamento Temporal & Blocos de Horário (`blocos` e `bloco_grupos`)**: Grade de horários com instrutores para projetos contínuos (grade semanal) e pontuais (datas específicas).
3. **Beneficiários (`beneficiarios`)**: Cadastro civil universal e perene por CPF único (`cpf UNIQUE`), desacoplado de projetos.
4. **Matrículas & Vulnerabilidade Social (`matriculas`)**: Vínculo do cidadão ao Objeto e Turma com cálculo de idade, controle de cota de vagas, status de fila e flag `vulneravel` para auditoria MROSC.
5. **Construtor de Formulários Híbridos (`objeto_perguntas_inscricao`)**: Configuração visual de perguntas customizadas por projeto com respostas em `dados_adicionais JSONB`.
6. **Autoinscrição Pública & QR Code**: Rotas públicas sem autenticação (`/inscricao/[slug]` e `/inscricao/turma/[grupoId]`) com reaproveitamento por CPF e segurança de dados (zero vazamento de outros participantes).

---

## 2. Regras Canônicas Estritas (AGENTS.md §3.3 e §3.4)

1. **Agnosticidade Operacional**:
   - Para projetos **contínuos** (`tipo = 'continuo'`), blocos de horário operam em grade semanal recorrente (`dia_semana` de 0 a 6).
   - Para projetos **pontuais** (`tipo = 'pontual'`), blocos operam em datas e horários específicos de evento (`data_especifica`).
2. **Restrição de Acesso na Turma (Grupo)**:
   - A modalidade e a faixa etária (`idade_minima` e `idade_maxima`) funcionam como **critérios restritivos de validação** para autorizar ou barrar a matrícula do beneficiário.
3. **Desacoplamento do Cadastro Civil do Cidadão**:
   - `beneficiarios.cpf` é universal e único (`UNIQUE`) no sistema inteiro. O cidadão nunca é duplicado.
   - Dados civis essenciais residem em `beneficiarios` (`nome_completo`, `cpf`, `data_nascimento`, `genero`, `telefone`, `nome_responsavel`, `telefone_responsavel`).
4. **Matrícula Isolada por Projeto & Indicador MROSC**:
   - Cada matrícula vincula `beneficiario_id + objeto_id + grupo_id`.
   - Flag estruturada `vulneravel BOOLEAN`: atesta a condição socioeconômica especificamente para aquele convênio/projeto (para metas de 70% de vulneráveis), preservando o cadastro civil de estigmas perpétuos.
   - Respostas do formulário customizado ficam em `matriculas.dados_adicionais JSONB`.
5. **Autoinscrição Pública Segura**:
   - Acesso público sem login: visualiza apenas dados abertos da turma/polo (nome, horários, vagas restantes).
   - Zero vazamento de dados de outros alunos já matriculados via RLS.
   - Validação backend estrita via Server Actions com schema Zod.
   - Reaproveitamento inteligente por CPF: se o cidadão já existe na base, associa o registro existente e coleta apenas as perguntas do novo convênio.
6. **Zero Hardcoded para Domínio & Zero Fallback Silencioso**:
   - Todos os rótulos de tela utilizam os termos configurados no Objeto ativo (`{termo_beneficiario}`, `{termo_grupo}`, `{termo_bloco}`, `{termo_local}`).

---

## 3. Estrutura de Arquivos e Módulos

```
src/
├── lib/
│   ├── validations/
│   │   └── fase-2.ts (Zod schemas: turmas, blocos, beneficiarios, matriculas, perguntas)
│   └── actions/
│       ├── grupos.ts (CRUD turmas, controle de vagas)
│       ├── blocos.ts (Grade semanal e cronograma de blocos)
│       ├── beneficiarios.ts (Cadastro civil único por CPF)
│       ├── matriculas.ts (Matrícula, cálculo de idade, vulnerabilidade)
│       ├── perguntas-inscricao.ts (Construtor de formulários customizados)
│       └── autoinscricao.ts (Inscrição pública externa e validação anônima)
├── components/
│   ├── turmas/
│   │   ├── turmas-client.tsx
│   │   └── turma-detalhes-client.tsx
│   ├── planejamento/
│   │   ├── blocos-client.tsx
│   │   └── grade-semanal.tsx
│   ├── beneficiarios/
│   │   ├── beneficiarios-client.tsx
│   │   └── beneficiario-detalhes-client.tsx
│   ├── matriculas/
│   │   └── matriculas-client.tsx
│   ├── perguntas-inscricao/
│   │   └── construtor-perguntas.tsx
│   └── autoinscricao/
│       └── autoinscricao-form.tsx
└── app/
    ├── (dashboard)/
    │   ├── turmas/
    │   │   ├── page.tsx
    │   │   └── [id]/page.tsx
    │   ├── planejamento/
    │   │   └── page.tsx
    │   ├── beneficiarios/
    │   │   ├── page.tsx
    │   │   └── [id]/page.tsx
    │   ├── matriculas/
    │   │   └── page.tsx
    │   └── admin/objetos/[id]/perguntas/
    │       └── page.tsx
    └── (public)/
        └── inscricao/
            ├── [slug]/page.tsx (Inscrição por Polo)
            └── turma/[grupoId]/page.tsx (Inscrição Direta na Turma)
```

---

## 4. Estratégia de Execução Passo a Passo (14 Tarefas Atômicas)

1. **T01 — Schemas Zod de Validação (`src/lib/validations/fase-2.ts`)**:
   - `grupoSchema`, `blocoSchema`, `beneficiarioSchema`, `matriculaSchema`, `perguntaInscricaoSchema`, `autoinscricaoPublicaSchema`.
2. **T02 — Server Actions de Turmas / Grupos (`src/lib/actions/grupos.ts`)**:
   - CRUD com restrição de idade mínima/máxima, capacidade de vagas, filtro por polo e modalidade.
3. **T03 — Interface de Gestão de Turmas (`/turmas`)**:
   - Listagem com filtro por projeto/polo, badges de vagas ocupadas vs capacidade, modais de criação/edição.
4. **T04 — Página de Detalhes da Turma (`/turmas/[id]`)**:
   - Visão completa da turma: alunos matriculados, lista de espera, blocos vinculados e link de autoinscrição.
5. **T05 — Server Actions de Planejamento Temporal & Blocos (`src/lib/actions/blocos.ts`)**:
   - CRUD de blocos com suporte agnóstico a grade semanal (`dia_semana`) ou datas pontuais (`data_especifica`), vinculando instrutores e turmas associadas (`bloco_grupos`).
6. **T06 — Interface de Planejamento Temporal (`/planejamento`)**:
   - Visualização em Grade Semanal (Segunda a Domingo) para contínuos e lista de eventos para pontuais, com alocação de instrutores.
7. **T07 — Server Actions de Beneficiários (`src/lib/actions/beneficiarios.ts`)**:
   - Gestão do cadastro civil universal único por CPF (`beneficiarios.cpf UNIQUE`), busca instantânea por CPF e reaproveitamento inteligente.
8. **T08 — Interface de Beneficiários (`/beneficiarios`)**:
   - Tabela unificada de cidadãos com máscara de CPF, cálculo de idade, histórico de projetos/matrículas e modal de cadastro.
9. **T09 — Server Actions de Matrículas (`src/lib/actions/matriculas.ts`)**:
   - Associação de beneficiário a turma/objeto, cálculo de idade em relação à regra da turma, gestão de cota de vagas (`ativo`, `lista_espera`), flag `vulneravel` e `dados_adicionais JSONB`.
10. **T10 — Interface de Matrículas (`/matriculas`)**:
    - Gestão de matrículas com filtros por status, polo, turma e indicador de vulnerabilidade social (cota MROSC).
11. **T11 — Construtor de Formulários Híbridos (`/admin/objetos/[id]/perguntas`)**:
    - Aba/página no projeto para gerenciar perguntas personalizadas do convênio (6 tipos de campos, obrigatoriedade, exibição pública e prévia mobile).
12. **T12 — Server Actions de Autoinscrição Pública (`src/lib/actions/autoinscricao.ts`)**:
    - Ações anônimas seguras: busca de vagas de turmas sem expor lista de alunos, validação de CPF e gravação atômica em `beneficiarios` + `matriculas`.
13. **T13 — Páginas Públicas de Autoinscrição (`/inscricao/[slug]` e `/inscricao/turma/[grupoId]`)**:
    - Layout público e responsivo (otimizado para celular da comunidade), gerador de QR Code e mensagem amigável de confirmação ou lista de espera.
14. **T14 — Validação Geral da Fase 2 & Deploy**:
    - Compilação TypeScript (`npx tsc --noEmit`), ESLint (`npm run lint`), build de produção (`npm run build`), Tríplice Validação e push para o repositório.
