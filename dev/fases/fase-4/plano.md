# Plano Técnico — Fase 4: Painel do Supervisor, Vistorias e Checklists em Campo

## 1. Visão Geral e Contexto Canônico (§3.6 de AGENTS.md)

O **Painel do Supervisor** é a interface operacional mobile-first utilizada em campo pela equipe de supervisão para auditoria presencial de conformidade, fiscalização estrutural e pedagógica nos polos de atendimento.

A visita de supervisão cumpre três finalidades indispensáveis perante o Concedente (MROSC):
1. **Auditoria da Atividade em Campo**: Cruzamento em tempo real com a grade horária e turmas do polo, aferição da presença do professor e contagem física de beneficiários em quadra.
2. **Vistoria Setorizada de Infraestrutura e Recursos Materiais**: Avaliação em 5 níveis (`Crítica`, `Ruim`, `Regular`, `Boa`, `Ótima`) com status rápido, notas 1-5, parecer descritivo e fotos setorizadas (Estrutura Física, Materiais Coletivos e Materiais Concedidos).
3. **Parecer Global & Snapshot Probatório Imutável**: Apontamentos pedagógicos, pendências com prazo de regularização, classificação global (`Regular`, `Requer Atenção`, `Crítica`), carimbos automáticos de `hora_inicio` e `hora_fim` e congelamento imutável da visita finalizada.

---

## 2. Arquitetura Técnica & Entidades do Supabase

### 2.1. Tabela Principal: `visitas_supervisao`
- `id`: UUID (PK)
- `objeto_id`: UUID (FK `objetos`)
- `local_id`: UUID (FK `locais` — polo auditado)
- `supervisor_id`: UUID (FK `usuarios` — usuário autenticado)
- `data`: DATE (data corrente)
- `hora_inicio`: TIME (carimbo automático no check-in)
- `hora_fim`: TIME NULLABLE (carimbo no encerramento)
- `bloco_id`: UUID NULLABLE (bloco auditado)
- `instrutor_funcionario_id`: UUID (FK `funcionarios` — instrutor presente/auditado)
- `professor_presente`: BOOLEAN
- `turmas_auditadas`: JSONB (nomes/IDs das turmas auditadas)
- `qtd_beneficiarios_presentes`: INTEGER
- `grade_conforme`: BOOLEAN (grade de horários respeitada)
- `chamada_conferida`: BOOLEAN (diário de classe/chamada validada em campo)
- `atividade_acompanhada`: TEXT (relato do conteúdo ministrado)
- `espaco_fisico_status`: VARCHAR ('Adequado' | 'Requer atenção')
- `nota_estrutura`: INTEGER (1 a 5)
- `obs_estrutura`: TEXT
- `materiais_coletivos_status`: VARCHAR ('Adequados' | 'Pendentes')
- `nota_materiais_coletivos`: INTEGER (1 a 5)
- `obs_materiais_coletivos`: TEXT
- `materiais_concedidos_status`: VARCHAR ('Adequados' | 'Pendentes')
- `nota_materiais_concedidos`: INTEGER (1 a 5)
- `obs_materiais_concedidos`: TEXT
- `fotos`: JSONB (registro estruturado de fotos da atividade e dos setores)
- `observacoes`: TEXT (visão geral da supervisão)
- `ocorrencias`: TEXT (dificuldades e falhas identificadas)
- `orientacoes_professor`: TEXT (feedback técnico ao instrutor)
- `providencias`: TEXT (medidas corretivas exigidas)
- `prazo_regularizacao`: DATE NULLABLE (prazo para sanar inconformidades)
- `situacao`: VARCHAR ('Regular' | 'Requer Atenção' | 'Crítica')
- `status`: VARCHAR ('em_andamento' | 'concluida')
- `snapshot_dados`: JSONB NULLABLE (congelamento integral após homologação)

### 2.2. Supabase Storage
- Bucket `supervisoes-fotos` (público, upload autenticado e leitura probatória) para fotos da atividade e evidências dos 3 setores de infraestrutura.

---

## 3. Estratégia de Implementação (Passo a Passo)

### 3.1. Bucket de Storage & Políticas RLS
- Criar bucket `supervisoes-fotos` no Supabase Storage.
- Configurar políticas RLS para upload e leitura probatória.

### 3.2. Schemas de Validação Zod (`src/lib/validations/fase-4.ts`)
- `iniciarSupervisaoSchema`: `objeto_id`, `local_id`, `bloco_id` (opcional), `instrutor_funcionario_id`.
- `atualizarSupervisaoSchema`: dados da atividade em campo, vistorias setorizadas, notas 1-5, fotos e apontamentos pedagógicos.
- `concluirSupervisaoSchema`: validação dos campos obrigatórios, notas dos 3 setores, parecer global (`situacao`) e fotos probatórias.

### 3.3. Server Actions (`src/lib/actions/supervisoes.ts`)
- `getPainelSupervisorData(objetoId?, supervisorId?)`: lista vistorias, total de polos cobertos, vistorias do mês, inconformidades pendentes e taxa de conformidade.
- `iniciarSupervisao(input)`: check-in automático (`supervisor_id = auth.uid()`, `data = hoje`, `hora_inicio = agora`, status `'em_andamento'`).
- `getSupervisaoDetalhes(id)`: dados completos da visita, dados do polo, blocos/turmas do dia para cruzamento e instrutores ativos.
- `salvarRascunhoSupervisao(input)`: persistência contínua dos passos da vistoria sem perder dados.
- `concluirSupervisao(input)`: carimbo de `hora_fim`, travamento de imutabilidade com geração do `snapshot_dados` e status `'concluida'`.
- `uploadFotoSupervisao(formData)`: upload direto para `supervisoes-fotos`.

### 3.4. Interfaces do Usuário (Next.js App Router + Tailwind + shadcn/ui)
1. **Painel do Supervisor (`/supervisoes/page.tsx` + `supervisoes-client.tsx`)**:
   - Mini-dashboard de auditoria: Vistorias Realizadas, Polos Fiscalizados, Inconformidades Pendentes e Taxa de Regularidade.
   - Botão de ação rápida: **"Iniciar Nova Visita de Supervisão"**.
   - Filtros por polo, situação (`Regular`, `Requer Atenção`, `Crítica`) e status (`em_andamento`, `concluida`).
   - Cards com visualização do status da visita e tempo de permanência no polo.
2. **Formulário de Início / Check-in (`/supervisoes/nova/page.tsx` ou modal integrado)**:
   - Seleção do Polo/Local auditado.
   - Cruzamento automático com blocos e turmas ativas no horário.
   - Seleção/confirmação do instrutor atuante.
3. **Cockpit da Visita de Supervisão (`/supervisoes/[id]/page.tsx` + `supervisao-cockpit-client.tsx`)**:
   - Layout mobile-first em abas ou etapas guiadas:
     - **Etapa 1: Atividade em Campo**: Presença do professor, chamada conferida, grade conforme, contagem de beneficiários, relato e foto da aula.
     - **Etapa 2: Infraestrutura & Materiais**: Vistoria dos 3 setores (Espaço Físico, Materiais Coletivos, Materiais Concedidos) com botões rápidos de status, notas 1 a 5 com estrelas/indicadores e upload de fotos setorizadas.
     - **Etapa 3: Apontamentos & Providências**: Observações gerais, ocorrências, orientações ao professor, providências exigidas, prazo e seletor da Situação Global (`Regular`, `Requer Atenção`, `Crítica`).
     - **Etapa 4: Espelho de Revisão & Conclusão**: Resumo completo com botão "Editar" e "Confirmar e Finalizar Supervisão" (congelamento em snapshot imutável).

---

## 4. Diretrizes Rígidas Aplicadas
- **Zero Hardcoded para Domínio**: Rótulos dinâmicos `{termo_local}`, `{termo_instrutor}`, `{termo_grupo}`, `{termo_sessao}` aplicados na interface.
- **Zero Fallback Silencioso**: Ausência de dados de polo, erro de validação ou upload exibidos com clareza.
- **Imutabilidade e Rastreabilidade**: Registro de auditoria travado após conclusão para garantir a fé pública do relatório MROSC.
