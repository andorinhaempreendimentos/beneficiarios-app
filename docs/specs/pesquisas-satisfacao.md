### 3.13. ConfiguraÃ§Ãµes Globais do Sistema (Empresa Gestora da Plataforma)

* **ConfiguraÃ§Ãµes da Empresa Gestora (`configuracoes_sistema`)**:
  * ConfiguraÃ§Ã£o independente de objetos, concedentes ou organizaÃ§Ãµes executoras, representando a empresa mantenedora do software.
  * **Atributos**: Logotipo da empresa gestora, Nome/RazÃ£o Social, CNPJ, EndereÃ§o completo (logradouro, nÃºmero, bairro, cidade, UF, CEP) e contatos de suporte institucional.
  * **AplicaÃ§Ã£o**: Utilizada para branding da plataforma (tela de login, rodapÃ©s institucionais) e nos cabeÃ§alhos/rodapÃ©s tÃ©cnicos de auditoria dos relatÃ³rios oficiais emitidos pelo sistema.
  * **PermissÃ£o de Acesso**: Leitura permitida aos usuÃ¡rios autenticados; ediÃ§Ã£o restrita exclusivamente ao **Super Administrador**.

---

### 3.14. MÃ³dulo de Pesquisas de SatisfaÃ§Ã£o e AvaliaÃ§Ã£o de Impacto

MÃ³dulo voltado Ã  aferiÃ§Ã£o qualitativa e percepÃ§Ã£o da comunidade, beneficiÃ¡rios e familiares sobre a execuÃ§Ã£o dos projetos. Serve como elemento probatÃ³rio de cumprimento de metas sociais perante o Concedente.

#### 1. Entidades Centrais e Estrutura Relacional
* **Pesquisa (`pesquisas`)**:
  * Representa uma campanha de avaliaÃ§Ã£o ativa ou rascunho;
  * **VÃ­nculos**: Associada obrigatoriamente a um `objeto_id` (e opcionalmente a um `local_id` ou `grupo_id`);
  * **Acesso PÃºblico**: Gera um `token` exclusivo para responder via web mÃ³vel (`/r/[token]`);
  * **Flags Operacionais**: `publicada` (libera ou pausa submissÃµes) e `exigir_cpf` (ativa barreira cadastral).
* **Fluxo do QuestionÃ¡rio (`fluxos`)**:
  * Define a lÃ³gica do questionÃ¡rio;
  * **Grafos Condicionais (LÃ³gica de RamificaÃ§Ã£o)**: Suporte a saltos e caminhos alternativos com base na resposta fornecida (ex.: desvios condicionais para notas baixas ou justificativas);
  * **Modularidade (`blocos`)**: Permite agrupar perguntas para exibiÃ§Ã£o simultÃ¢nea em tela Ãºnica ou formato passo a passo sequencial.
* **Perguntas (`perguntas`)**:
  * ExtraÃ§Ã£o relacional a partir dos nÃ³s do fluxo para garantir alta performance analÃ­tica em queries SQL;
  * **Tipos Suportados**: Escala/AvaliaÃ§Ã£o (1 a 5 estrelas), MÃºltipla Escolha (com limites mÃ­nimo e mÃ¡ximo), Textos (curto e Ã¡rea de texto), NumÃ©rico, Contatos e Dados Validados;
  * **Categorias de Campo (`categorias_campo`)**: Eixos analÃ­ticos transversais (ex.: *Infraestrutura*, *Qualidade PedagÃ³gica*, *Atendimento*, *Impacto Familiar*).
* **Respostas e SubmissÃµes (`respostas` e `resposta_itens`)**:
  * **CabeÃ§alho (`respostas`)**: Carimbo de data/hora, identificador de dispositivo (*device fingerprint*), `beneficiario_id` e `matricula` (quando identificados);
  * **Itens (`resposta_itens`)**: Registro dos valores estruturados por pergunta em formato JSONB.

#### 2. Mecanismos de ProteÃ§Ã£o e Anti-Fraude
Para assegurar a idoneidade dos Ã­ndices de satisfaÃ§Ã£o perante auditorias governamentais:
* **Fingerprint de Dispositivo**: Bloqueio de mÃºltiplas respostas no mesmo navegador/celular (`localStorage` + hash de hardware);
* **Unicidade de Voto**: Controle para impedir que o mesmo CPF ou matrÃ­cula responda repetidamente Ã  mesma pesquisa;
* **Desafio Cadastral (KYC Opcional)**: ValidaÃ§Ã£o rÃ¡pida de dados civis do beneficiÃ¡rio (ex.: primeiro nome, dia ou mÃªs de nascimento) antes de liberar o questionÃ¡rio em links nominais.

#### 3. DistribuiÃ§Ã£o Multicanal & FormulÃ¡rios Operacionais do WhatsApp (Z-API / Evolution API)
A distribuiÃ§Ã£o atua em mÃºltiplos canais integrados para alcanÃ§ar as famÃ­lias e participantes, operando atravÃ©s de **4 interfaces/formulÃ¡rios operacionais** bem definidos:

1. **FormulÃ¡rio de ConexÃ£o de InstÃ¢ncia / Gateway (ConfiguraÃ§Ã£o de Provedor)**:
   * **Seletor de Provedor**: Escolha entre `Z-API` e `Evolution API`;
   * **Credenciais**: InserÃ§Ã£o do Endpoint (URL base), `Instance ID` e `Token / API Key`;
   * **BotÃ£o `[ Gerar QR Code ]`**: Exibe o QR Code dinÃ¢mico na tela para pareamento instantÃ¢neo via aplicativo do WhatsApp no celular da OrganizaÃ§Ã£o Social;
   * **Card de Status em Tempo Real**: Badge visual de conexÃ£o (`Conectado` / `Desconectado` / `Aguardando Leitura`) com telemetria do nÃ­vel de bateria e nÃºmero pareado.

2. **FormulÃ¡rio de GestÃ£o de NÃºmeros Emissores (PolÃ­ticas Anti-Ban)**:
   * Cadastro e gerenciamento de mÃºltiplos nÃºmeros para mitigar riscos de bloqueio;
   * **Delay RandÃ´mico Humanizado**: Intervalo configurÃ¡vel entre disparos sucessivos (padrÃ£o de 20 a 45 segundos por mensagem);
   * **Teto MÃ¡ximo DiÃ¡rio**: Limite diÃ¡rio de mensagens por chip (ex.: mÃ¡ximo de 300 disparos/dia por nÃºmero);
   * **Rotatividade AutomÃ¡tica (Round-Robin)**: DistribuiÃ§Ã£o equilibrada da fila de envio entre todos os nÃºmeros ativos cadastrados.

3. **FormulÃ¡rio de Templates de Mensagens (Modelos ReutilizÃ¡veis)**:
   * Cadastro de mensagens padronizadas para avisos, convites e cobranÃ§a de pesquisas de satisfaÃ§Ã£o;
   * **Editor com InserÃ§Ã£o de Tags DinÃ¢micas**: BotÃµes de 1 clique para inclusÃ£o de variÃ¡veis contextuais no texto:
     * `{{nome_beneficiario}}`, `{{nome_responsavel}}`, `{{nome_projeto}}`, `{{nome_polo}}`, `{{turma}}`, `{{horario_aula}}`, `{{link_pesquisa}}`;
   * **PrÃ©via Mobile**: VisualizaÃ§Ã£o em tempo real simulando o balÃ£o de mensagem no WhatsApp com as variÃ¡veis resolvidas.

4. **Assistente de Disparo em Massa (Campanha em 3 Etapas)**:
   * **Etapa 1 (ComposiÃ§Ã£o da Mensagem)**: SeleÃ§Ã£o de um template prÃ©-configurado ou redaÃ§Ã£o de texto livre com variÃ¡veis;
   * **Etapa 2 (SegmentaÃ§Ã£o CirÃºrgica da AudiÃªncia)**:
     * Filtro geogrÃ¡fico/estrutural: por *Objeto*, *Polo / NÃºcleo* ou *Turma*;
     * Filtro de pÃºblico: apenas gÃªnero feminino/masculino, ou por perfil etÃ¡rio;
     * Filtro de contato: destinatÃ¡rio configurÃ¡vel entre o prÃ³prio **BeneficiÃ¡rio** ou o **ResponsÃ¡vel Legal** (pai/mÃ£e);
     * Filtro inteligente de pendÃªncia: envio exclusivo para quem **ainda nÃ£o respondeu** Ã  pesquisa ou para alunos com assiduidade **abaixo da meta (< 75%)** para busca ativa;
   * **Etapa 3 (Fila e ExecuÃ§Ã£o AssÃ­ncrona)**:
     * Resumo da campanha com total de destinatÃ¡rios vÃ¡lidos e estimativa de tempo total de envio (considerando os delays anti-ban);
     * Disparo processado em segundo plano via fila assÃ­ncrona (com log individual de status: `pendente`, `enviado`, `entregue`, `erro`).

* **Canais Complementares sem WhatsApp**:
  * **QR Codes Impressos nos Polos**: GeraÃ§Ã£o de QR Code para download e afixaÃ§Ã£o fÃ­sica nos locais/nÃºcleos, permitindo resposta presencial por alunos e familiares;
  * **Links Diretos Web**: Compartilhamento simples de links pÃºblicos com token seguro (`/r/[token]`).

#### 4. InteligÃªncia AnalÃ­tica e RelatÃ³rios
* **MÃ©tricas de AdesÃ£o em Tempo Real**: Total de beneficiÃ¡rios elegÃ­veis versus total de respostas computadas (taxa de conversÃ£o/engajamento);
* **Cruzamento Multidimensional**: Filtros cruzados com lÃ³gica booleana (AND/OR) para comparar satisfaÃ§Ã£o por Polo, por Turma, por Instrutor ou por Modalidade;
* **ExportaÃ§Ã£o AnalÃ­tica**: GeraÃ§Ã£o de planilhas estruturadas (.xlsx) e grÃ¡ficos de distribuiÃ§Ã£o para anexaÃ§Ã£o direta nas prestaÃ§Ãµes de contas oficiais.
