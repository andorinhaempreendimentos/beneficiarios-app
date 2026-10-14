# Plano Técnico — Fase 5: Painel do Coordenador, Gestão Regional e Fechamento Periódico

## 1. Visão Geral e Contexto Canônico (§3.7 e §3.9.3 de AGENTS.md)

O **Painel do Coordenador** é a interface operacional e analítica onde o Coordenador Regional gerencia sua área territorial (`regioes`), monitora os polos (`locais`), acompanha o feed de vistorias dos supervisores, controla as pendências e executa o **Fechamento Periódico Oficial (Caderno Nível 2)** com a redação da **Síntese Qualitativa da Coordenação**.

A atuação do Coordenador cumpre três responsabilidades centrais na governança:
1. **Gestão Regional Descentralizada**: Acompanhamento dos polos vinculados à sua região geográfica (`regioes.coordenador_id`), com indicadores de cobertura e regularidade.
2. **Central de Ocorrências & Prazos**: Gestão unificada das inconformidades reportadas nas vistorias presenciais, com alertas visuais de vencimento de prazos de regularização.
3. **Fechamento do Ciclo Periódico (Caderno Nível 2)**: Redação dos 4 blocos dissertativos oficiais (*Pontos Positivos*, *Dificuldades*, *Pendências* e *Providências*), compilação das métricas e congelamento imutável em `relatorios_prestacao_contas` com fé pública para o Concedente.

---

## 2. Arquitetura Técnica & Entidades Envolvidas

### 2.1. Tabelas no Supabase PostgreSQL
- **`regioes`**:
  - `id`: UUID (PK)
  - `nome`: VARCHAR (ex.: "Região Norte", "Região Única")
  - `objeto_id`: UUID (FK `objetos`)
  - `coordenador_id`: UUID NULLABLE (FK `funcionarios` ou `usuarios` titular da região)
- **`locais`**:
  - `regiao_id`: UUID NOT NULL (FK `regioes` — todo local pertence a uma região)
- **`visitas_supervisao`**:
  - Alimentam o feed de campo regional, filtradas por `local.regiao_id`.
- **`relatorios_prestacao_contas`**:
  - `id`: UUID (PK)
  - `objeto_id`: UUID (FK `objetos`)
  - `rotulo_periodo`: VARCHAR (ex.: "Outubro / 2026")
  - `data_inicio`: DATE
  - `data_fim`: DATE
  - `status`: VARCHAR ('em_elaboracao', 'fechado', 'retificado')
  - `versao`: INTEGER (inicia em 1)
  - `coordenador_geral_id`: UUID NULLABLE
  - `elaborador_id`: UUID (usuário coordenador autenticado)
  - `resumo_execucao`: TEXT (Pontos Positivos observados)
  - `resultados_alcancados`: TEXT (Dificuldades e Ocorrências)
  - `analise_cumprimento_metas`: TEXT (Pendências a solucionar)
  - `conclusao`: TEXT (Providências adotadas e Recomendações)
  - `anexos_dados`: JSONB (snapshot completo com tabela consolidada de visitas, presenças e notas)
  - `fechado_em`: TIMESTAMPTZ (carimbo do congelamento imutável)

---

## 3. Estratégia de Implementação (Passo a Passo)

### 3.1. Schemas Zod (`src/lib/validations/fase-5.ts`)
- `sinteseQualitativaSchema`: validação dos 4 blocos dissertativos canônicos (pontos positivos, dificuldades, pendências, providências).
- `fecharCicloPeriodicoSchema`: período de apuração (`data_inicio`, `data_fim`, `rotulo_periodo`), região e síntese qualitativa.
- `filtroCoordenacaoSchema`: região, polo, período e status de pendências.

### 3.2. Server Actions da Coordenação (`src/lib/actions/coordenacao.ts`)
- `getPainelCoordenadorData(regiaoId?, objetoId?)`: busca polos da região, métricas do ciclo (polos ativos, vistorias concluídas, pendências abertas), feed de visitas e lista de ocorrências com prazos.
- `salvarRascunhoSintese(input)`: permite redigir e salvar rascunho dos 4 blocos dissertativos sem fechar o ciclo.
- `fecharCicloPeriodico(input)`: compila todos os atendimentos, calcula métricas, gera o snapshot em `anexos_dados`, insere/atualiza `relatorios_prestacao_contas` com `status = 'fechado'` e congela os dados.
- `getRelatorioPeriodicoDetalhes(id)`: recupera o caderno oficial com espelho de visualização Nível 2 para conferência e exportação.

### 3.3. Interfaces do Usuário (Next.js App Router + Tailwind + shadcn/ui)
1. **Painel Regional do Coordenador (`/coordenacao/page.tsx` + `coordenacao-client.tsx`)**:
   - Seletor de Região (caso o coordenador tenha mais de uma ou seja Super Admin);
   - Mini-Dashboard de Topo: Polos Ativos na Região, Supervisões Concluídas no Ciclo, Inconformidades em Aberto e Taxa de Regularidade Territorial;
   - Abas funcionais:
     - **Aba "Visão Geral & Polos"**: Grid de polos com quantidade de turmas, alunos e última vistoria;
     - **Aba "Feed de Vistorias"**: Linha do tempo das fiscalizações de campo dos supervisores com acesso rápido aos espelhos;
     - **Aba "Central de Pendências & Prazos"**: Tabela de inconformidades abertas com contagem regressiva de dias para regularização;
     - **Aba "Fechamento do Ciclo (Caderno Nível 2)"**: Interface para redação da síntese qualitativa e homologação do relatório oficial periódico.
2. **Espelho do Relatório Periódico Consolidado (`/coordenacao/relatorio/[id]/page.tsx`)**:
   - Espelho visual executivo pronto para prestação de contas com capa, tabela consolidada de vistorias, síntese da coordenação e declaração formal com identificação do Coordenador e Região.

---

## 4. Diretrizes Rígidas Aplicadas
- **Zero Hardcoded para Domínio**: Rótulos dinâmicos `{termo_local}`, `{termo_instrutor}`, `{termo_grupo}` e `{termo_sessao}` aplicados na interface e no caderno oficial.
- **Zero Fallback Silencioso**: Ausência de dados de região ou pendências são sinalizados explicitamente.
- **Snapshot Imutável**: Ciclo periódico fechado não permite edição retroativa das vistorias nem dos pareceres.
