# Plano Técnico — Fase 8: Catálogo e Apuração de Metas MROSC (§3.11)

## 1. Visão Geral e Contexto Canônico (§3.11 de AGENTS.md)

Em estrita consonância com o **Art. 22, IV da Lei 13.019/2014 (MROSC)**, cada projeto social esportivo estrutura seu catálogo de metas contratuais pactuadas no Plano de Trabalho (`objeto_metas`), permitindo acompanhar com rigor e transparência o cumprimento das metas perante o Concedente.

O sistema opera de forma agnóstica para projetos contínuos (escolinhas) ou pontuais (festivais/torneios), integrando dois mecanismos universais de apuração:
1. **Apuração Automatizada pelo Sistema**:
   Calcula em tempo real a realização cruzando os dados operacionais das fases anteriores:
   - `total_locais`: Contagem de polos ativos vinculados ao objeto;
   - `total_beneficiarios`: Contagem de matrículas ativas no período;
   - `frequencia_media`: Média percentual das chamadas nominais registradas nas sessões;
   - `sessoes_realizadas`: Contagem de sessões concluídas com evidências probatórias fotográficas;
   - `supervisoes_realizadas`: Contagem de visitas de supervisão em campo homologadas;
   - `vulnerabilidade_social`: Percentual de alunos matriculados com cota social / vulnerabilidade ativa.
2. **Apuração Declaratória / Manual (Ações Externas)**:
   Para eventos que ocorrem fora da rotina diária de aulas (ex.: reuniões pedagógicas com responsáveis, festivais, torneios comunitários, capacitação contínua da equipe):
   - Inserção do valor realizado e justificativa descritiva da ação realizada;
   - **Comprovação Facultativa**: O upload de atas, documentos ou fotos é 100% facultativo e **nunca bloqueia a gravação nem a emissão do relatório oficial**.

### Classificação Automática de Situação:
- $\ge 100\% \rightarrow$ **Cumprida** (Verde)
- Entre $1\%$ e $99\% \rightarrow$ **Parcial** (Âmbar)
- $0\% \rightarrow$ **Pendente** (Vermelho/Cinza)

---

## 2. Arquitetura Técnica & Entidades Envolvidas

### 2.1. Tabela no Supabase PostgreSQL (`objeto_metas`)
- `id`: UUID (PK)
- `objeto_id`: UUID (FK `objetos`)
- `numero_meta`: INTEGER
- `descricao`: VARCHAR(255)
- `unidade_medida`: VARCHAR(50)
- `quantidade_prevista`: NUMERIC(10,2)
- `fonte_verificacao`: TEXT
- `tipo_apuracao`: VARCHAR(30) (`manual`, `total_locais`, `total_beneficiarios`, `frequencia_media`, `sessoes_realizadas`, `supervisoes_realizadas`, `vulnerabilidade_social`)
- `quantidade_declarada`: NUMERIC(10,2)
- `justificativa_declarada`: TEXT
- `anexos_urls`: JSONB (lista de URLs de atas/fotos opcionais)
- `criado_em`: TIMESTAMPTZ
- `atualizado_em`: TIMESTAMPTZ

### 2.2. Bucket de Storage
- `metas-anexos`: bucket público criado no Supabase Storage para armazenamento de atas, fotos e documentos probatórios suplementares de metas declaratórias.

---

## 3. Estratégia de Implementação (Passo a Passo)

### 3.1. Schemas Zod (`src/lib/validations/fase-8.ts`)
- `objetoMetaSchema`: Validação de cadastro e edição de metas (número, descrição, unidade, quantidade prevista, fonte de verificação e tipo de apuração);
- `apuracaoDeclaratoriaSchema`: Validação de lançamento declaratório (metaId, quantidade realizada, síntese descritiva e lista de anexos);
- `filtroMetasSchema`: Filtros por período e objeto ativo.

### 3.2. Engine de Cálculo & Server Actions (`src/lib/actions/metas.ts`)
- `getMetasMroscData(objetoId?, dataInicio?, dataFim?)`:
  - Carrega metas do objeto ativo;
  - Dispara queries agregadas de auditoria (polos ativos, matrículas, presenças em sessões, visitas de supervisão, vulnerabilidade);
  - Computa valor realizado, percentual de conclusão e situação para cada indicador;
  - Totaliza métricas gerais do Plano de Trabalho (Índice Geral de Execução Contratual, % Metas Cumpridas);
- `salvarObjetoMeta(input)`: Inserção/atualização de meta cadastrada;
- `excluirObjetoMeta(id)`: Exclusão com verificação de integridade;
- `registrarApuracaoDeclaratoria(input)`: Atualiza a meta com fé pública e justificativa institucional;
- `uploadAnexoMeta(formData)`: Upload facultativo para o bucket `metas-anexos`.

### 3.3. Interface do Usuário (`/metas`)
- Mini-dashboard de topo com 4 KPIs:
  - *Índice Geral de Execução Contratual (%)*;
  - *Metas 100% Cumpridas*;
  - *Metas em Andamento (Parciais)*;
  - *Metas Pendentes*.
- Lista / Tabela interativa com barras de progresso (previsto vs realizado), percentual dinâmico e status visual;
- Modal de lançamento de apuração declaratória para ações externas;
- Modal de cadastro de nova meta para gestores;
- Exportação para impressão/PDF do Demonstrativo de Cumprimento de Metas MROSC.

---

## 4. Diretrizes Rígidas Aplicadas
- **Zero Hardcoded para Domínio**: Rótulos e unidades neutros e configuráveis perante o Plano de Trabalho pactuado.
- **Zero Fallback Silencioso**: Ausência de dados e falhas de cálculo são sinalizadas explicitamente.
- **Não-bloqueio por Anexo**: O upload de documentos em metas declaratórias é facultativo e não impede a homologação.
