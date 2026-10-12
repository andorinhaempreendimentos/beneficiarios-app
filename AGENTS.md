# Contexto e Especificação do Sistema: Gestão de Beneficiários e Projetos Sociais

## 1. Visão Geral e Objetivo
Sistema para gerenciar a execução de projetos sociais esportivos financiados com repasses de recursos públicos.
O objetivo central é coletar dados operacionais de ponta a ponta com alto rigor, rastreabilidade e comprovação visual para geração de relatórios de auditoria e prestação de contas governamental.
O sistema é **estritamente agnóstico** quanto à modalidade ou formato do projeto, atendendo com a mesma estrutura conceitual atividades contínuas (escolinhas, rotinas recorrentes) ou pontuais (corridas de rua, torneios, festivais).

## 2. Stack Tecnológica
- **Framework Web**: Next.js (App Router, Server Components e Server Actions)
- **Banco de Dados & Autenticação**: Supabase (PostgreSQL, RLS)
- **Design & UI**: Tailwind CSS + shadcn/ui
  - **Tema Visual**: Vercel (https://www.shadcn.io/theme/vercel)
- **Deploy**: Vercel

---

> [!CAUTION]
> ## 2.1. Diretrizes Rígidas de Engenharia e Código
> 1. **Zero Hardcoded para Dados de Domínio**: É expressamente proibido usar dados, rótulos, categorias, opções ou vocabulário fixos (*hardcoded*) no código quando a informação puder ou dever ser oriunda do banco de dados (Supabase). Toda informação contextual (vocabulário dinâmico, modalidades, polos, turmas, regras) deve ser consumida do banco.
> 2. **Zero Fallback Silencioso**: É proibido utilizar valores de contingência (*fallbacks*) caso o usuário não tenha pedido expressamente de forma literal. Falhas de carregamento, dados ausentes ou erros de query/RLS devem ser tratados e sinalizados explicitamente na interface, sem mascarar problemas com valores padrão arbitrários (ex.: terminantemente vedado `termo || 'Polo'`, `status ?? 'ativo'` ou arrays que escondem erros de rede/permissão).

> [!IMPORTANT]
> ## 2.2. Metodologia de Fases: O Tripé de Rastreabilidade e a Tríplice Validação
> 1. **O Tripé de Governança (`dev/fases/`)**:
>    * **`AGENTS.md`**: É a especificação canônica suprema (regras de negócio, domínio, requisitos legais e diretrizes).
>    * **`plano.md`**: É sempre a **estratégia técnica** elaborada para se obter o resultado esperado no `AGENTS.md` naquela fase.
>    * **`tasklist.md`**: É a **lista de tarefas atômicas** para alcançar o resultado esperado daquela fase.
> 2. **Protocolo de Execução Passo a Passo**:
>    * Executa-se **uma única tarefa** listada por vez;
>    * Logo após, o agente solicita a verificação do usuário;
>    * Após a verificação e aprovação do usuário, edita-se a `tasklist.md` marcando a tarefa como concluída `[x]`, partindo então para a próxima.
> 3. **A Tríplice Validação ao Final de Cada Fase**:
>    Ao concluir a execução de uma fase, realiza-se formalmente a validação de:
>    * **Coerência Operacional**: A `tasklist.md` foi 100% cumprida e verificada;
>    * **Coerência Tática**: A `tasklist.md` foi estritamente coerente com o `plano.md`;
>    * **Coerência Canônica**: O `plano.md` e a entrega foram rigorosamente coerentes com o `AGENTS.md`.

---

## 3. Modelo Conceitual e Regras de Negócio

### 3.1. Núcleo Institucional e Financiamento

* **Concedente**  
  Órgão da administração pública (municipal, estadual ou federal) responsável por financiar e conceder recursos orçamentários para a realização das atividades sociais. É o destinatário final das prestações de contas e o responsável por fiscalizar se as metas pactuadas foram atingidas.

* **Organização Social**  
  Entidade do terceiro setor (ONG, instituto, fundação) que formaliza o termo de parceria e executa a atividade-fim na ponta. É responsável por administrar os recursos, gerir os polos de atendimento, contratar equipes e assegurar o cumprimento das ações.

* **Objeto (Projeto)**  
  Vínculo formal e contratual firmado entre o Concedente e a Organização Social. Delimita a origem das verbas, metas contratuais e formato de execução:
  * **Contínuo**: execução continuada com duração de meses ou anos, estruturada em rotinas periódicas (ex.: escolinhas esportivas anuais).
  * **Pontual**: eventos com início, meio e fim claramente delimitados em datas específicas (ex.: corridas de rua, festivais esportivos, torneios).

---

### 3.2. Infraestrutura e Equipe de Campo

* **Região (`regioes`)**  
  Agrupador territorial e operacional utilizado para organizar polos/locais e descentralizar responsabilidades no projeto.  
  * **Regra de Obrigatoriedade**: Todo Objeto possui obrigatoriamente pelo menos uma região. Ao criar um projeto sem subdivisões territoriais específicas, o sistema gera por padrão a **"Região Única"**. Todo Local pertence obrigatoriamente a uma região (`regiao_id NOT NULL`).  
  * **Responsabilidade & Vínculo**: Cada região vincula um **Coordenador** titular (`coordenador_id`), responsável pela gestão dos polos, validação das vistorias e fechamento dos relatórios daquela área.

* **Local (Polo ou Núcleo)**  
  Espaço físico onde ocorrem as atividades práticas do projeto. Um mesmo Objeto pode conter um ou múltiplos locais, todos vinculados obrigatoriamente a uma **Região**. Cada local possui características estruturais próprias que determinam sua capacidade de abrigar projetos pontuais, contínuos ou modalidades específicas.

* **Funcionários (Equipe de Campo / RH)**  
  Profissionais contratados pela Organização Social e alocados nos locais. Representam os vínculos trabalhistas reais exigidos na prestação de contas de recursos humanos perante o Concedente (nome, CPF, cargo, polo de atuação).  
  * *Distinção fundamental*: nem todo funcionário tem acesso ao sistema (ex.: apoio operacional, vigias, auxiliares). Aqueles que operam o sistema recebem um vínculo com uma conta de **Usuário**.
  * **Instrutores**: conduzem as atividades práticas e registram as sessões em campo.
  * **Supervisores**: auditam a conformidade das ações presencialmente nos polos.
  * **Coordenadores**: acompanham as regiões, gerenciam polos e fecham os relatórios consolidados.

* **Modalidade**  
  Catálogo de práticas esportivas e atividades físicas oferecidas pelo projeto (ex.: Futebol, Futsal, Natação, Iniciação Esportiva, Atletismo, Ginástica).

---

### Vocabulário Dinâmico (Regra Transversal)

O banco de dados relacional utiliza **nomes de entidades canônicos e neutros** (ex.: `beneficiarios`, `sessoes`, `grupos`, `locais`). A interface adapta os rótulos de tela de acordo com o contexto ativo do usuário, resolvendo termos como `{termo_local}`, `{termo_instrutor}`, `{termo_grupo}`, `{termo_beneficiario}` a partir da configuração do Objeto ativo.

> Especificação completa do vocabulário e RBAC: [`docs/specs/rbac-usuarios.md`](docs/specs/rbac-usuarios.md)

---

## 4. Índice de Especificações Detalhadas (`docs/specs/`)

> [!IMPORTANT]
> As seções abaixo contêm a especificação canônica completa de cada domínio. **Devem ser lidas sob demanda** pelo agente ao trabalhar na funcionalidade correspondente. Todo conteúdo é idêntico ao original — apenas redistribuído para caber no prompt.

| # | Módulo | Arquivo | Domínio |
|---|--------|---------|---------|
| 1 | Turmas, Beneficiários e Matrículas | [`beneficiarios-matriculas.md`](docs/specs/beneficiarios-matriculas.md) | §3.3 — Grupos, Matrículas, Autoinscrição Pública, Formulários Híbridos, Construtor de Perguntas |
| 2 | Planejamento Temporal | [`planejamento-temporal.md`](docs/specs/planejamento-temporal.md) | §3.4 — Agenda, Blocos de Horário |
| 3 | Painel do Instrutor e Sessão | [`painel-instrutor-sessao.md`](docs/specs/painel-instrutor-sessao.md) | §3.5 — Mini-Dashboard, Sessão Imutável, Chamada Nominal, Fotos, Ponto Eletrônico |
| 4 | Painel do Supervisor | [`painel-supervisor.md`](docs/specs/painel-supervisor.md) | §3.6 — Visita de Supervisão, Vistoria Setorizada, Checklist, Parecer Global |
| 5 | Painel do Coordenador | [`painel-coordenador.md`](docs/specs/painel-coordenador.md) | §3.7 — Gestão Regional, Fechamento Periódico, Síntese Qualitativa |
| 6 | Relatórios e Prestação de Contas | [`relatorios-prestacao-contas.md`](docs/specs/relatorios-prestacao-contas.md) | §3.8–3.9 — Otimização de Imagens, Relatórios Níveis 1/2/3, Analíticos, Ponto Eletrônico, Snapshot Imutável |
| 7 | Logística de Materiais | [`logistica-materiais.md`](docs/specs/logistica-materiais.md) | §3.10 — Materiais Coletivos/Individuais, Remessas, Entregas |
| 8 | Metas MROSC | [`metas-mrosc.md`](docs/specs/metas-mrosc.md) | §3.11 — Catálogo de Metas, Apuração Automática/Declaratória |
| 9 | Modelo Relacional (DDL) | [`modelo-relacional.md`](docs/specs/modelo-relacional.md) | §3.12 — SQL completo (Supabase PostgreSQL), Matriz RBAC |
| 10 | Pesquisas de Satisfação | [`pesquisas-satisfacao.md`](docs/specs/pesquisas-satisfacao.md) | §3.13–3.14 — Config Global, Pesquisas, WhatsApp, Anti-Fraude |
| 11 | RBAC e Vocabulário | [`rbac-usuarios.md`](docs/specs/rbac-usuarios.md) | §4 — Usuário vs. Funcionário, Papéis, Escopo de Projeto, Vocabulário por Objeto |
