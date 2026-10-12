### 3.3. GestÃ£o de Turmas, BeneficiÃ¡rios e MatrÃ­culas

* **Grupos / Turmas**  
  Estruturas de reserva e controle de vagas para organizar o atendimento.  
  * **Regra de RestriÃ§Ã£o de Acesso**: a modalidade e a faixa etÃ¡ria nÃ£o sÃ£o tratadas como atributos intrÃ­nsecos do grupo, mas sim como **regras de restriÃ§Ã£o de acesso**. O grupo estabelece uma idade mÃ­nima e uma idade mÃ¡xima que funcionam como critÃ©rios de validaÃ§Ã£o para barrar ou liberar a matrÃ­cula do beneficiÃ¡rio.

* **BeneficiÃ¡rio (A Identidade do CidadÃ£o / Pessoa FÃ­sica)**  
  Representa a pessoa atendida pelo projeto. O cadastro do cidadÃ£o Ã© **Ãºnico no sistema por CPF** (`cpf UNIQUE`), contendo exclusivamente o nÃºcleo universal de dados civis: `nome_completo`, `cpf`, `data_nascimento`, `telefone` e `genero`.  
  * **Desacoplamento de Objeto**: O CPF **nÃ£o fica preso a um Ãºnico projeto**. A mesma pessoa pode participar de mÃºltiplos projetos simultÃ¢neos ou ao longo dos anos sem duplicar seu cadastro civil.

* **MatrÃ­cula / InscriÃ§Ã£o (`matriculas`)**  
  Entidade associativa que materializa o vÃ­nculo de um BeneficiÃ¡rio com um **Objeto** e uma **Turma (Grupo)** especÃ­fica:
  * **ValidaÃ§Ã£o de Acesso**: O sistema calcula a idade a partir da `data_nascimento` do beneficiÃ¡rio e valida contra a idade mÃ­nima e mÃ¡xima da turma antes de confirmar a matrÃ­cula.
  * **Status da MatrÃ­cula**: Controla a situaÃ§Ã£o do participante (`ativo`, `pre_inscrito`, `lista_espera`, `concluido`, `cancelado`).
  * **Indicador de Vulnerabilidade Social (`vulneravel BOOLEAN DEFAULT FALSE`)**: Flag estruturada que identifica se o atendido provÃ©m de famÃ­lias em vulnerabilidade social ou encaminhadas pelo CRAS/escolas pÃºblicas, permitindo apurar a meta contratual de inclusÃ£o social (ex.: cota de 70% de vulnerÃ¡veis) exigida pelo Plano de Trabalho e pelo Anexo II.
  * **Respostas do FormulÃ¡rio EspecÃ­fico (`dados_adicionais JSONB`)**: Ã‰ na tabela de matrÃ­culas que residem as respostas das perguntas personalizadas daquele Objeto (ex.: tamanho de camiseta, atestados, contatos de emergÃªncia), garantindo que cada projeto tenha seus prÃ³prios dados sem poluir o cadastro universal do cidadÃ£o.

#### 3.3.1. Canais de Cadastro e AutoinscriÃ§Ã£o PÃºblica

O ingresso de beneficiÃ¡rios no sistema ocorre por trÃªs canais complementares:

1. **Administrador / Operador de Cadastro**:  
   Realizado pelo painel administrativo por quem possui permissÃ£o de gestÃ£o de matrÃ­culas.
2. **Instrutor (em Campo)**:  
   Realizado diretamente pelo Painel do Instrutor no celular para matricular participantes que chegam presencialmente no polo.
3. **AutoinscriÃ§Ã£o PÃºblica (Comunidade)**:  
   Links pÃºblicos e QR Codes acessÃ­veis sem necessidade de login prÃ©vio pelo cidadÃ£o:
   * **Link do Polo / NÃºcleo (Geral)**: Disponibilizado na pÃ¡gina de gestÃ£o do Local. Permite Ã  famÃ­lia visualizar a grade completa de horÃ¡rios, blocos e modalidades daquele polo e escolher a turma com vagas abertas.
   * **Link da Turma (Direto)**: Disponibilizado na pÃ¡gina de gestÃ£o da Turma. Abre o formulÃ¡rio pÃºblico com aquela turma prÃ©-selecionada (ideal para divulgaÃ§Ã£o direcionada). Se a vaga estiver esgotada ou a idade for incompatÃ­vel, o sistema sugere as outras turmas do mesmo polo.

* **Diretriz de SeguranÃ§a e RLS para InscriÃ§Ãµes PÃºblicas**:
  * **Zero Vazamento de Dados**: UsuÃ¡rios anÃ´nimos tÃªm acesso estrito de leitura apenas a uma view pÃºblica de turmas abertas (nome, dias, horÃ¡rios dos blocos, faixa etÃ¡ria e indicador de vagas disponÃ­veis). A lista nominal e dados pessoais de outros beneficiÃ¡rios jÃ¡ matriculados sÃ£o inacessÃ­veis para o pÃºblico externo.
  * **Processamento Seguro via Server Actions**: InserÃ§Ãµes pÃºblicas sÃ£o validadas no backend (validaÃ§Ã£o de esquema Zod, checagem da cota de vagas e validaÃ§Ã£o de faixa etÃ¡ria), gerando a matrÃ­cula com status inicial (`pre_inscrito` ou `lista_espera`, caso a turma esteja sem vagas imediatas).
  * **Reaproveitamento Inteligente por CPF**: Ao informar o CPF na autoinscriÃ§Ã£o, se o cidadÃ£o jÃ¡ existir na base, seus dados civis sÃ£o vinculados, solicitando apenas as respostas do formulÃ¡rio especÃ­fico daquele novo projeto.

#### 3.3.2. Arquitetura de FormulÃ¡rios e o Modelo HÃ­brido por Objeto

Para que modalidades, convÃªnios e formatos distintos (ex.: corrida de rua vs. nataÃ§Ã£o vs. escolinhas de futebol) nÃ£o engessem o banco de dados nem quebrem a padronizaÃ§Ã£o das prestaÃ§Ãµes de contas, o sistema adota **trÃªs modelos de formulÃ¡rios**:

##### 1. Os TrÃªs Modelos de FormulÃ¡rios no Sistema
1. **Modelos 100% Fixos (Padronizados no CÃ³digo)**:
   * Possuem campos rÃ­gidos por exigÃªncia de leis federais (CLT, Lei 13.019/2014) ou regras matemÃ¡ticas de auditoria. Os campos nÃ£o mudam; apenas os rÃ³tulos de tela adaptam-se ao VocabulÃ¡rio DinÃ¢mico (`{termo_local}`, `{termo_instrutor}`, etc.).
   * Exemplos: *Ponto EletrÃ´nico de RH*, *SessÃ£o DiÃ¡ria de Atividade*, *Fechamento Regional do Coordenador*, *PrestaÃ§Ã£o de Contas NÃ­vel 3*, *LogÃ­stica de Remessa de Materiais* e *ConfiguraÃ§Ã£o de Templates/Disparos de WhatsApp*.
2. **Modelos HÃ­bridos (NÃºcleo Fixo + Campos AdaptÃ¡veis via Construtor)**:
   * Combinam uma base de dados obrigatÃ³ria protegida por lei com perguntas personalizadas criadas pelo Administrador no Objeto.
   * **Os Dois HÃ­bridos Centrais**:
     * **Ficha de MatrÃ­cula / InscriÃ§Ã£o do BeneficiÃ¡rio** *(O Principal)*: NÃºcleo civil fixo (para validaÃ§Ã£o de idade e controle de CPF) + Perguntas customizadas do projeto e indicador de vulnerabilidade do convÃªnio.
     * **Vistoria da SupervisÃ£o de Campo**: NÃºcleo fixo de auditoria pÃºblica (3 eixos universais com notas 1 a 5 e fotos) + Checklist especÃ­fico da modalidade esportiva/cultural (`checklist_modalidade_respostas JSONB`).
3. **Modelos 100% DinÃ¢micos (Criados Livremente do Zero)**:
   * Criados inteiramente pelo gestor sem campos prÃ©-determinados.
   * Exemplo: *Pesquisas de SatisfaÃ§Ã£o da Comunidade e AvaliaÃ§Ã£o de Impacto* (questionÃ¡rios construÃ­dos livremente com perguntas, notas de 1 a 5 estrelas, mÃºltipla escolha, texto livre e lÃ³gica de ramificaÃ§Ã£o condicional).

---

##### 2. Funcionamento do FormulÃ¡rio HÃ­brido de MatrÃ­cula
Na tela de inscriÃ§Ã£o (AutoinscriÃ§Ã£o PÃºblica no celular, Painel do Instrutor ou Painel Admin), a experiÃªncia humana Ã© a de um **formulÃ¡rio Ãºnico e contÃ­nuo**, processado automaticamente em dois destinos no banco de dados com 1 Ãºnico clique:

* **SeÃ§Ã£o 1: NÃºcleo Civil Universal Fixo (Tabela `beneficiarios`)**:
  * Campos obrigatÃ³rios: `nome_completo`, `cpf` (Ãºnico no sistema inteiro), `data_nascimento` (valida faixa etÃ¡ria da turma), `telefone` e `genero`.
  * O cidadÃ£o mantÃ©m um cadastro Ãºnico na plataforma e **nunca Ã© duplicado**, mesmo participando de mÃºltiplos projetos simultÃ¢neos ou consecutivos.
* **SeÃ§Ã£o 2: Dados do Projeto e MatrÃ­cula (Tabela `matriculas`)**:
  * **Indicador de Vulnerabilidade Social (`matriculas.vulneravel BOOLEAN`)**: Campo estruturado que atesta se o atendido provÃ©m de famÃ­lia de baixa renda / rede pÃºblica / CRAS especificamente para as metas deste Objeto ativo (preservando o cadastro civil de estigmas perpÃ©tuos).
  * **Perguntas Customizadas do Objeto (`matriculas.dados_adicionais JSONB`)**: Respostas das perguntas especÃ­ficas daquele convÃªnio (tamanho de uniforme, escola/turno, atestados mÃ©dicos, contatos de emergÃªncia).
  * Cada convÃªnio mantÃ©m seu histÃ³rico estritamente isolado e pesquisÃ¡vel via PostgreSQL JSONB.

---

##### 3. A ExperiÃªncia do Criador (UX do Administrador no Construtor de FormulÃ¡rios)
Na aba **"Perguntas da InscriÃ§Ã£o"** das configuraÃ§Ãµes do Objeto, o Administrador constrÃ³i o formulÃ¡rio de forma visual e intuitiva:

1. **Campos PadrÃ£o Protegidos**:
   * O Administrador nÃ£o precisa recriar campos civis bÃ¡sicos (Nome, CPF, Data de Nascimento, Telefone, GÃªnero). Eles jÃ¡ aparecem listados e protegidos com um Ã­cone de cadeado (ðŸ”’), garantindo conformidade jurÃ­dica automÃ¡tica.
   * O campo **Vulnerabilidade Social** Ã© apresentado como um switch padrÃ£o do convÃªnio (`[x] Habilitar coleta de Vulnerabilidade Social`), gerando a cota contratual.
2. **AdiÃ§Ã£o Visual de Perguntas (`[ + Adicionar Nova Pergunta ]`)**:
   * **TÃ­tulo da Pergunta**: Texto livre (ex.: *"Qual o tamanho do uniforme do aluno?"*);
   * **Tipo de Resposta**:
     * `Texto Curto` (ex.: Nome da escola);
     * `OpÃ§Ãµes / Dropdown` (digita as alternativas separadas por vÃ­rgula: *P, M, G, GG*);
     * `Sim / NÃ£o` (botÃµes alternÃ¡veis simples);
     * `NÃºmero` (ex.: peso, calÃ§ado);
     * `Data` (ex.: data do exame mÃ©dico);
     * `Upload de Arquivo / Foto` (ex.: foto da certidÃ£o ou atestado).
   * **Regras de ExibiÃ§Ã£o e ValidaÃ§Ã£o**:
     * `[x] Resposta ObrigatÃ³ria`: Impede o envio com campo em branco;
     * `[x] Exibir na AutoinscriÃ§Ã£o PÃºblica`: Permite ocultar perguntas de triagem interna que sÃ³ o instrutor ou a recepÃ§Ã£o do polo devem preencher.
3. **Usabilidade Operacional**:
   * **Arrastar e Soltar (Drag & Drop)**: Permite reordenar a sequÃªncia das perguntas na tela facilmente;
   * **PrÃ©via em Tempo Real (`[ Visualizar no Celular ]`)**: Renderiza um simulador mobile para testar a experiÃªncia visual da famÃ­lia antes de publicar os links e QR Codes.
