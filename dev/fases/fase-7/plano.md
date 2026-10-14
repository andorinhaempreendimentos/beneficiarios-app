# Plano Técnico — Fase 7: Logística de Materiais, Remessas e Entregas Individuais

## 1. Visão Geral e Contexto Canônico (§3.10 de AGENTS.md)

O módulo de **Logística de Materiais e Uniformes** gerencia a cadeia de suprimentos do projeto social perante o Concedente e atende diretamente ao **Anexo VII do MROSC** (*Demonstrativo de Materiais e Uniformes Distribuídos*).

O sistema opera sob dois eixos universais e agnósticos:
1. **Eixo A — Materiais de Uso Coletivo (Equipamentos do Polo / Patrimônio Móvel)**:
   - Itens esportivos e de apoio (bolas, cones, redes, tatames, coletes, cronômetros);
   - Alocados no polo (`local_id`) sob a responsabilidade e guarda do instrutor;
   - Rastreabilidade por código de tombamento/patrimônio, especificações técnicas e fotos do material desembalado;
   - Monitoramento contínuo integrado ao **Painel do Supervisor** (vistorias setorizadas com notas de 1 a 5).
2. **Eixo B — Materiais de Uso Individual (Kits do Aluno / Uniformes / Vestuário)**:
   - Itens repassados diretamente ao participante (camisetas, shorts, meiões, mochilas, medalhas, kits de corrida);
   - Levantamento automatizado da grade de tamanhos a partir dos cadastros de matrícula (`tamanho_uniforme`);
   - **Fé Pública Soberana do Professor**: O instrutor confirma a entrega nominal dos kits na turma com 1 toque no sistema móvel, carimbando seu `funcionario_id`, data/hora e status `entregue` — **sem qualquer dependência de confirmação ou SMS por parte da família da criança**;
   - **Comprovação em Papel 100% Facultativa**: Upload de foto da lista física de assinaturas é opcional; a confirmação eletrônica do docente tem fé pública para a prestação de contas.

---

## 2. Arquitetura Técnica & Entidades Envolvidas

### 2.1. Tabelas no Supabase PostgreSQL
- **`objeto_materiais`**:
  - `id`: UUID (PK)
  - `objeto_id`: UUID (FK `objetos`)
  - `nome_item`: VARCHAR
  - `tipo`: VARCHAR ('coletivo' | 'individual')
  - `quantidade_prevista`: INTEGER
  - `quantidade_adquirida`: INTEGER
  - `especificacoes`: TEXT
  - `destinacao`: VARCHAR
- **`materiais_remessas_polo`**:
  - `id`: UUID (PK)
  - `objeto_material_id`: UUID (FK `objeto_materiais`)
  - `local_id`: UUID (FK `locais`)
  - `quantidade_enviada`: INTEGER
  - `data_remessa`: DATE
  - `codigo_patrimonio`: VARCHAR
  - `responsavel_recebimento_id`: UUID (FK `funcionarios`)
  - `fotos_urls`: JSONB
  - `documento_comprovante_url`: TEXT
  - `observacoes`: TEXT
- **`materiais_entregas_aluno`**:
  - `id`: UUID (PK)
  - `objeto_material_id`: UUID (FK `objeto_materiais`)
  - `matricula_id`: UUID (FK `matriculas`)
  - `instrutor_id`: UUID (FK `funcionarios`)
  - `data_entrega`: DATE
  - `status`: VARCHAR ('entregue')
  - `tamanho_entregue`: VARCHAR
  - `foto_comprovante_url`: TEXT (opcional)
- **Bucket no Supabase Storage**:
  - `materiais-fotos`: bucket público configurado para fotos de materiais desembalados nos polos e folhas de recibo de uniformes.

---

## 3. Estratégia de Implementação (Passo a Passo)

### 3.1. Schemas Zod (`src/lib/validations/fase-7.ts`)
- `objetoMaterialSchema`: Validação de itens cadastrados no objeto (tipo coletivo ou individual, quantidades e especificações);
- `remessaPoloSchema`: Registro de envio de lote para o polo (local, quantidade, código de tombamento, fotos e responsável);
- `entregaAlunoSchema`: Confirmação nominal individual de entrega do kit com tamanho e data;
- `entregaLoteTurmaSchema`: Baixa coletiva rápida da turma pelo professor na aula.

### 3.2. Server Actions de Logística (`src/lib/actions/materiais.ts`)
- `getLogisticaMateriaisData(objetoId, localId?)`: Compila itens em estoque, saldo por polo, extrato de remessas e resumo de entregas aos alunos;
- `criarObjetoMaterial(input)`: Adiciona novo item ao plano de trabalho do objeto;
- `registrarRemessaPolo(input)`: Envia materiais coletivos com fotos e comprovante de entrega;
- `registrarEntregaAluno(input)`: Grava a entrega nominal individual com bloqueio contra duplicidade;
- `registrarEntregasTurmaLote(input)`: Confirmação em lote de múltiplos alunos com fé pública do instrutor;
- `getDemandasUniformesPorPolo(objetoId)`: Agrega a contagem de tamanhos informados nas matrículas para planejar a aquisição.

### 3.3. Interfaces do Usuário (Next.js App Router + Tailwind + shadcn/ui)
1. **Painel Central de Logística & Patrimônio (`/materiais/page.tsx` + `materiais-client.tsx`)**:
   - 4 Cartões KPI no topo: *Itens Cadastrados*, *Unidades Adquiridas*, *Remessas aos Polos* e *Kits Entregues a Alunos*;
   - Abas funcionais:
     - **Aba "Catálogo do Objeto"**: Tabela de itens coletivos e individuais com botão de adicionar item;
     - **Aba "Remessas aos Polos"**: Gestão dos envios com modal de nova remessa e visualização de fotos de patrimônio;
     - **Aba "Demanda de Uniformes"**: Matriz de tamanhos demandados na matrícula para aquisição/separação;
     - **Aba "Entregas aos Alunos"**: Relação nominal de kits entregues que alimenta o Anexo VII do MROSC.
2. **Módulo de Entrega Rápida do Professor (`/sessoes/[id]` ou aba no Painel)**:
   - Na lista de alunos da turma, botão rápido para marcar entrega de kits e salvar com 1 toque.

---

## 4. Diretrizes Rígidas Aplicadas
- **Zero Hardcoded para Domínio**: Rótulos dinâmicos `{termo_local}`, `{termo_instrutor}`, `{termo_grupo}`, `{termo_beneficiario}`, `{termo_materiais_coletivos}` e `{termo_materiais_concedidos}`.
- **Zero Fallback Silencioso**: Ausência de dados e erros de estoque sinalizados de forma explícita.
- **Fé Pública do Instrutor**: A baixa efetuada pelo professor é soberana; fotos de listas físicas são estritamente facultativas.
