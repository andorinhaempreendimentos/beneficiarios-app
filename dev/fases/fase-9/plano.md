# Plano Técnico — Fase 9: Pesquisas de Satisfação, WhatsApp e Anti-Fraude (§3.13 e §3.14)

## 1. Visão Geral e Contexto Canônico

Em conformidade com as diretrizes de governança do MROSC (Lei 13.019/2014) e as seções §3.13 e §3.14 do `AGENTS.md`:
1. **Configurações Globais da Empresa Gestora (§3.13)**:
   - Gerencia a identidade institucional da mantenedora da plataforma (`configuracoes_sistema`), definindo razão social, CNPJ, logotipo oficial, endereço corporativo e canais de suporte técnico para branding e carimbos de fé pública nos relatórios.
2. **Módulo de Pesquisas de Satisfação e Avaliação de Impacto (§3.14)**:
   - Aferição qualitativa da comunidade, beneficiários e familiares;
   - Suporte a múltiplos tipos de perguntas (escala 1 a 5 estrelas, múltipla escolha, texto descritivo, contatos);
   - Categorias de campo analíticas (*Infraestrutura*, *Qualidade Pedagógica*, *Atendimento*, *Impacto Familiar*);
   - Ramificações condicionais e saltos de lógica no questionário;
   - Mecanismos rigorosos de proteção e anti-fraude (device fingerprint, unicidade de voto por CPF/matrícula e KYC opcional);
   - Página pública e mobile-first de preenchimento (`/r/[token]`);
3. **Distribuição Multicanal & Operação de WhatsApp (§3.14 item 3)**:
   - **Formulário 1 — Conexão Gateway/Instância**: Conexão com Z-API ou Evolution API com QR Code dinâmico e telemetria de status;
   - **Formulário 2 — Gestão de Números Emissores**: Políticas anti-ban com delay randômico humanizado (20 a 45s), teto diário (padrão 300) e rotatividade round-robin;
   - **Formulário 3 — Templates de Mensagens**: Modelos reutilizáveis com inserção dinâmica de tags contextuais (`{{nome_beneficiario}}`, `{{nome_responsavel}}`, `{{nome_projeto}}`, `{{nome_polo}}`, `{{turma}}`, `{{link_pesquisa}}`) e simulador mobile;
   - **Formulário 4 — Assistente de Disparo em Massa**: Campanha em 3 etapas com segmentação cirúrgica (polo, turma, gênero, aluno vs responsável, busca ativa de assiduidade < 75% ou pendência de pesquisa) e fila assíncrona de envios;
   - Geração de QR Code impresso para download e afixação nos polos.

---

## 2. Arquitetura de Dados & Supabase Relacional

O banco já conta com a modelagem completa e políticas RLS ativas:
- `configuracoes_sistema`: Identidade institucional da empresa mantenedora.
- `pesquisas`: Campanhas de pesquisa por objeto, local e grupo com token público e flag de exigência de CPF.
- `categorias_campo`: Eixos analíticos transversais.
- `perguntas_pesquisa`: Questões com tipo, opções JSONB, regras de seleção e condicionais.
- `respostas`: Cabeçalho de submissão com carimbo temporal, device fingerprint e vínculo cadastral.
- `resposta_itens`: Respostas individuais estruturadas em JSONB.
- `whatsapp_instancias`: Instâncias Z-API / Evolution vinculadas ao objeto.
- `whatsapp_numeros`: Chips emissores com regras anti-ban.
- `whatsapp_templates`: Modelos de mensagens com tags parametrizáveis.
- `whatsapp_campanhas`: Campanhas de disparo com filtros de segmentação.
- `whatsapp_disparo_logs`: Logs individuais de entrega e erro.

---

## 3. Decomposição Tática das Tarefas

### T01: Configurações Globais & Schemas Zod (`src/lib/validations/fase-9.ts` e `src/lib/actions/configuracoes.ts`)
- Schemas Zod:
  - `configuracaoSistemaSchema`: validação dos dados cadastrais da empresa gestora;
  - `pesquisaSchema` e `perguntaPesquisaSchema`: criação de pesquisas e perguntas parametrizadas;
  - `submissaoPesquisaSchema`: validação dos dados de resposta pública com device fingerprint e KYC;
  - `whatsappInstanciaSchema`, `whatsappNumeroSchema`, `whatsappTemplateSchema`, `whatsappCampanhaSchema`.
- Server Actions de Configurações do Sistema:
  - `getConfiguracoesSistema()`, `salvarConfiguracoesSistema(input)`.

### T02: Engine de Pesquisas & Submissão Pública Anti-Fraude
- Server Actions em `src/lib/actions/pesquisas.ts`:
  - `getPesquisas(objetoId?)`: listagem com métricas resumidas;
  - `getPesquisaPorToken(token)`: carregamento público de pesquisa com suas categorias e perguntas ativas;
  - `submeterRespostaPesquisa(input)`: gravação de respostas com validação anti-duplicidade (fingerprint + CPF/matrícula);
  - `salvarPesquisa(input)` e `excluirPesquisa(id)`;
  - `salvarPergunta(input)` e `excluirPergunta(id)`.
- Rota Pública `/r/[token]/page.tsx` & Formulário Mobile-First:
  - Geração de fingerprint de dispositivo client-side (armazenado em `localStorage` e hash de navegador);
  - Suporte aos tipos de input: escala 1 a 5 estrelas, múltipla escolha, texto livre;
  - Resolução dinâmica de condicionais (exibir pergunta B apenas se pergunta A teve resposta X);
  - Desafio KYC opcional (validação cadastral).

### T03: Painel Central de Gestão de Pesquisas & Inteligência Analítica (`/pesquisas`)
- Mini-dashboard no topo com 4 KPIs:
  - *Total de Pesquisas Ativas*;
  - *Total de Respostas Computadas*;
  - *Índice Médio de Satisfação / NPS*;
  - *Taxa de Adesão Média (%)*.
- Lista de pesquisas com status (Publicada / Rascunho), atalhos de compartilhamento e cópia de link;
- Modal de criação de pesquisas e editor dinâmico de perguntas/categorias;
- Painel analítico de resultados por pesquisa:
  - Gráficos de distribuição de notas (1 a 5 estrelas);
  - Média por categoria de campo (*Infraestrutura*, *Pedagógico*, *Atendimento*, etc.);
  - Cruzamento de dados por Polo / Turma;
  - Exportação dos dados analíticos (CSV) e botão de gerar QR Code para impressão física no polo.

### T04: Módulo Operacional do WhatsApp (Instâncias, Números, Templates & Disparo em Massa)
- Server Actions em `src/lib/actions/whatsapp.ts`:
  - Gestão de instâncias (Z-API / Evolution API), simulação/geração de QR Code e verificação de status;
  - Gestão de múltiplos números emissores com regras anti-ban (teto diário, delay 20-45s, round-robin);
  - Criação de templates de mensagens com variáveis dinâmicas;
  - Criação de campanhas de disparo em massa com segmentação cirúrgica (polo, turma, gênero, busca ativa < 75% assiduidade);
  - Processamento da fila de disparos e registro de logs em `whatsapp_disparo_logs`.
- Interfaces dos 4 formulários operacionais na aba de WhatsApp ou comunicação:
  - Conexão de Instância / Gateway com badge em tempo real;
  - Gestão de Números Emissores;
  - Editor de Templates com botões de inserção de tags e prévia de celular;
  - Assistente de Disparo em 3 Etapas (Mensagem, Audiência, Envio com estimativa de tempo anti-ban).

### T05: Configurações da Empresa Gestora (`/configuracoes/sistema`), Validação Completa, Compilação e Deploy
- Página de Configurações da Empresa Gestora para administradores (`/configuracoes/sistema`);
- Execução de testes de integridade estática (`npx tsc --noEmit`) e build de produção (`npm run build`);
- Commit descritivo, push autenticado para o GitHub e deploy em produção na Vercel;
- Apresentação da Tríplice Validação de Conformidade da Fase 9.

---

## 4. Diretrizes Rígidas Aplicadas
- **Zero Hardcoded para Domínio**: Perguntas, categorias, opções e variáveis contextuais são 100% dinâmicas.
- **Zero Fallback Silencioso**: Falhas de autenticação, erros de conexão com gateway de WhatsApp ou inconsistências cadastrais são tratadas e exibidas explicitamente.
- **Rastreabilidade e Fé Pública**: Submissões registram fingerprint e carimbo de data/hora para auditoria e prestação de contas governamental.
