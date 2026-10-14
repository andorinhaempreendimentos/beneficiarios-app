# Plano Técnico — Fase 3: Painel do Instrutor e Execução de Sessões em Campo

## 1. Visão Geral e Contexto Canônico (§3.5 de AGENTS.md)

O **Painel do Instrutor** é a interface operacional mobile-first utilizada em campo para condução das atividades pedagógicas e geração dos registros probatórios para auditoria pública e prestação de contas governamental (MROSC).

A sessão cumpre dois papéis integrados e indissociáveis:
1. **Pedagógico & Probatório**: Registra o fato real do atendimento aos alunos em quadra, com chamada nominal (Presente / Falta / Justificada) e **mínimo de 2 fotografias obrigatórias** da atividade. Ao ser finalizada, torna-se um **snapshot estritamente imutável**.
2. **Ponto Eletrônico Trabalhista (RH)**: O ato de *Iniciar Sessão* registra o carimbo de entrada (*clock-in*) e *Finalizar Sessão* registra a saída (*clock-out*) na tabela `registros_ponto` vinculada ao funcionário em carteira para comprovação de folha perante o Concedente.

---

## 2. Arquitetura Técnica & Entidades Envolvidas

### 2.1. Tabelas no Banco de Dados (Supabase PostgreSQL)
- **`sessoes`**:
  - `id`: UUID (PK)
  - `objeto_id`: UUID (FK `objetos`)
  - `organizacao_id`: UUID (FK `organizacoes`)
  - `local_id`: UUID (FK `locais`)
  - `bloco_id`: UUID NULLABLE (FK `blocos`)
  - `funcionario_id`: UUID (FK `funcionarios` — instrutor responsável)
  - `modalidade_id`: UUID NULLABLE (FK `modalidades`)
  - `grupos_ids`: JSONB (array de UUIDs das turmas participantes)
  - `data`: DATE
  - `hora_inicio`: TIME
  - `hora_fim`: TIME NULLABLE (preenchido no encerramento)
  - `status`: VARCHAR ('em_andamento', 'concluida')
  - `fotos_urls`: JSONB (mínimo de 2 URLs no Supabase Storage)
  - `observacoes`: TEXT
  - `criado_em`, `atualizado_em`: TIMESTAMPTZ
- **`beneficiarios_presencas`**:
  - `id`: UUID (PK)
  - `sessao_id`: UUID (FK `sessoes` ON DELETE CASCADE)
  - `matricula_id`: UUID (FK `matriculas`)
  - `beneficiario_id`: UUID (FK `beneficiarios`)
  - `status`: VARCHAR ('presente', 'falta', 'justificada')
  - `justificativa`: TEXT NULLABLE
  - `comprovante_url`: TEXT NULLABLE
- **`registros_ponto`**:
  - Integração com RH: inserção na abertura da sessão (`app_sessao`) e cálculo automático de `total_minutos` no fechamento.
- **Supabase Storage**:
  - Criação do bucket público `sessoes-fotos` para persistência segura das evidências fotográficas.

---

## 3. Estratégia de Implementação (Passo a Passo)

### 3.1. Validações Zod (`src/lib/validations/fase-3.ts`)
- Schemas rigorosos de entrada e saída:
  - `iniciarSessaoSchema`: validação de local, objeto, turmas e instrutor.
  - `concluirSessaoSchema`: validação de horário final, presença nominal de alunos e **exigência mínima de 2 fotos** (`.min(2, "São necessárias no mínimo 2 fotos da atividade")`).
  - `presencaItemSchema`: validação do status tripartite (*presente*, *falta*, *justificada*).

### 3.2. Server Actions de Sessões (`src/lib/actions/sessoes.ts`)
- `getPainelInstrutorData(instrutorFuncionarioId?, objetoId?)`: busca dados agregados de sessões do dia, semana e estatísticas do mês.
- `iniciarSessao(input)`: cria a sessão em andamento e registra o ponto de entrada em `registros_ponto`.
- `getSessaoDetalhes(sessaoId)`: recupera os dados da sessão, turmas, alunos matriculados e presenças preenchidas.
- `concluirSessao(input)`: valida imutabilidade, salva presenças, vincula fotos, fecha ponto e trava a sessão.
- `fecharSessoesExpiradas()`: salvaguarda para evitar sessões esquecidas em aberto.
- `uploadFotoSessao(formData)`: upload direto de imagens para o bucket `sessoes-fotos` no Supabase Storage.

### 3.3. Interfaces do Usuário (Next.js App Router + Tailwind + shadcn/ui)
1. **Painel do Instrutor (`/sessoes/page.tsx` + `sessoes-client.tsx`)**:
   - Visão mobile-first ultra-rápida.
   - **Mini-Dashboard de Topo**: Sessões do Mês, Carga Horária, Taxa Média de Frequência e Alunos Atendidos.
   - **Aba "Hoje"**: Cards verticais dos blocos/sessões do dia com status (*A Iniciar*, *Em Andamento*, *Concluída*).
   - **Aba "Esta Semana"**: Programação dos próximos dias úteis.
   - **Aba "Histórico"**: Sessões passadas já concluídas.
2. **Cockpit da Sessão Ativa (`/sessoes/[id]/page.tsx` + `sessao-ativa-client.tsx`)**:
   - Cronômetro de aula ativa e dados do polo/turma.
   - **Chamada Nominal**: Lista de alunos com foto, idade e botões P / F / J com clique rápido ("Marcar Todos Presentes").
   - **Mural de Evidências Fotográficas**: Upload de fotos da câmera/galeria com preview, contagem e aviso de trava se houver menos de 2 fotos.
   - **Anotações Pedagógicas**: Observações de campo.
   - **Finalização Probatória**: Trava a sessão e exibe resumo imutável.

---

## 4. Diretrizes Rígidas Aplicadas
- **Zero Hardcoded**: Vocabulário dinâmico `{termo_sessao}`, `{termo_instrutor}`, `{termo_local}` consumido do objeto ativo.
- **Zero Fallback Silencioso**: Erros de câmera, falta de fotos ou falha de rede sinalizados explicitamente.
- **Imutabilidade Garantida**: Sessão concluída não permite edição de presenças nem substituição de fotos probatórias.
