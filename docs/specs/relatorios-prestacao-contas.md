### 3.8. Diretriz TÃ©cnica Transversal: OtimizaÃ§Ã£o de Imagens no Cliente (Client-Side)

* **CompressÃ£o no Navegador Mobile**: Tanto para o Painel do Instrutor quanto para o do Supervisor, toda foto capturada Ã© redimensionada e comprimida no frontend (cliente) antes do envio ao Supabase Storage.
* **PadrÃ£o**: ConversÃ£o para formato leve (WebP/JPEG) com largura mÃ¡xima de 1600px e taxa de compressÃ£o entre 75% e 80%.
* **Objetivo**: Reduzir imagens pesadas de 5â€“15 MB para aproximadamente 250â€“400 KB, garantindo uploads rÃ¡pidos em redes mÃ³veis (3G/4G) de campo e economia de armazenamento.

---

### 3.9. RelatÃ³rios Oficiais e PrestaÃ§Ã£o de Contas Governamental

MÃ³dulo de consolidaÃ§Ã£o, compilaÃ§Ã£o e exportaÃ§Ã£o documental dos dados brutos das SessÃµes e das Visitas de SupervisÃ£o. Serve para auditar a conformidade da execuÃ§Ã£o perante o Concedente, comprovando metas pactuadas, presenÃ§as computadas, comprovaÃ§Ãµes visuais e jornada de trabalho prestada.

#### 3.9.1. Os 4 Pilares da Agnosticidade Documental

Para que o sistema gere relatÃ³rios oficiais tanto para escolinhas esportivas contÃ­nuas (rotinas semanais de meses ou anos) quanto para projetos pontuais (corridas de rua, torneios, festivais de 1 a 3 dias), o motor de relatÃ³rios rege-se por 4 pilares:

1. **Agnosticidade TerminolÃ³gica (VocabulÃ¡rio DinÃ¢mico)**:
   * Nenhum rÃ³tulo no relatÃ³rio Ã© chumbado no cÃ³digo. Todos os tÃ­tulos de seÃ§Ãµes, colunas e cabeÃ§alhos sÃ£o resolvidos dinamicamente a partir dos termos configurados no Objeto ativo:
     * `{termo_local}`: *Polo*, *NÃºcleo*, *Unidade*, *Arena*, *Ponto de Apoio*;
     * `{termo_instrutor}`: *Professor(a)*, *Instrutor(a)*, *TÃ©cnico(a)*, *Oficineiro(a)*, *Monitor(a)*;
     * `{termo_grupo}`: *Turma*, *Bateria*, *PelotÃ£o*, *Oficina*, *Categoria*;
     * `{termo_beneficiario}`: *Aluno(a)*, *BeneficiÃ¡rio(a)*, *Atleta*, *Participante*, *Corredor(a)*;
     * `{termo_materiais_coletivos}`: *Materiais Esportivos*, *Equipamentos Coletivos*, *Estrutura de Apoio*;
     * `{termo_materiais_concedidos}`: *Uniformes*, *Kits Individuais*, *Kits de Corrida*, *VestuÃ¡rio*.

2. **Agnosticidade Temporal e de Ciclo de ExecuÃ§Ã£o**:
   * **Projetos ContÃ­nuos**: Fechamento por perÃ­odo prÃ©-definido (MÃªs de referÃªncia, Bimestre ou Trimestre). TÃ­tulo oficial: `RELATÃ“RIO MENSAL DE SUPERVISÃƒO DOS {TERMO_LOCAIS_PLURAL}`. Foco no cumprimento da grade e frequÃªncia regular.
   * **Projetos Pontuais (Eventos / AÃ§Ãµes Curtas)**: Fechamento por etapa ou evento (Fase de Montagem, PrÃ©-Evento, Dia da ExecuÃ§Ã£o, Desmontagem). TÃ­tulo oficial: `RELATÃ“RIO DE SUPERVISÃƒO DE EXECUÃ‡ÃƒO: {NOME_DO_EVENTO}`. Foco na vistoria prÃ©via de estruturas temporÃ¡rias, entrega de kits e cronograma das largadas/baterias.

3. **Agnosticidade de Vistoria de Campo (Categorias Universais)**:
   * A vistoria nÃ£o presume materiais de uma Ãºnica modalidade. Ela analisa sempre trÃªs eixos universais da administraÃ§Ã£o pÃºblica:
     * *Estrutura FÃ­sica do Local*: CondiÃ§Ãµes de seguranÃ§a, higiene e conservaÃ§Ã£o do espaÃ§o de atendimento;
     * *Materiais de Uso Coletivo*: Equipamentos fornecidos pelo projeto para uso compartilhado;
     * *Materiais Concedidos*: Itens de repasse individual fornecidos aos participantes.

4. **Motor de Templates Baseado em Esquema (DOCX e PDF)**:
   * Os documentos sÃ£o gerados por um motor de renderizaÃ§Ã£o dinÃ¢mico que substitui placeholders institucionais, organiza tabelas com largura fixa DXA, insere fotos do Supabase Storage com legendas e gera a saÃ­da pronta para assinatura fÃ­sica ou digital (Gov.br / ICP-Brasil).

---

#### 3.9.2. NÃ­vel 1: RelatÃ³rio de SupervisÃ£o UnitÃ¡ria (Visita Individual)

* **PropÃ³sito**: Comprovar oficialmente que uma vistoria pontual especÃ­fica aconteceu em determinado local, dia e horÃ¡rio.
* **Autonomia**: **Totalmente independente do fechamento do mÃªs**. Pode ser visualizado em tela e exportado a qualquer momento, segundos apÃ³s a finalizaÃ§Ã£o da visita em campo pelo supervisor.
* **Disponibilidade na Interface (UI)**:
  * Na pÃ¡gina de detalhes da visita (`/supervisoes/[id]`), com espelho visual completo e fotos em alta resoluÃ§Ã£o;
  * BotÃµes de exportaÃ§Ã£o direta: **`[ Baixar em Word (.docx) ]`** e **`[ Baixar em PDF ]`**;
  * No menu de contexto (`...`) de cada linha na listagem geral de supervisÃµes.
* **Estrutura Oficial do Documento (1 a 2 pÃ¡ginas)**:
  1. **CabeÃ§alho Institucional**: RazÃ£o social e logo da OrganizaÃ§Ã£o Social, Concedente, Objeto e identificaÃ§Ã£o do `{termo_local}`;
  2. **Metadados da Vistoria**: Data, HorÃ¡rio de Entrada (check-in) e HorÃ¡rio de SaÃ­da (check-out), Nome do Supervisor;
  3. **Auditoria da Atividade**: Nome do `{termo_instrutor}` auditado, PresenÃ§a (`Presente`/`Ausente`), `{termo_grupo}` e faixa etÃ¡ria, Quantidade de `{termo_beneficiarios}` presentes, Checklist de Grade (`Conforme`/`NÃ£o conforme`) e Chamada (`Conferida`/`Pendente`), DescriÃ§Ã£o da atividade acompanhada;
  4. **Vistoria Setorizada**: Status, notas (1 a 5) e relatos da Estrutura FÃ­sica, Materiais Coletivos e Materiais Concedidos;
  5. **Apontamentos e ProvidÃªncias**: Parecer Global da SituaÃ§Ã£o (`Regular`/`Requer AtenÃ§Ã£o`/`CrÃ­tica`), ObservaÃ§Ãµes gerais, OcorrÃªncias, OrientaÃ§Ãµes repassadas, ProvidÃªncias adotadas e Prazo estipulado para regularizaÃ§Ã£o;
  6. **Mural de EvidÃªncias FotogrÃ¡ficas**: Fotos anexadas com legenda, carimbo de data e polo;
  7. **Campos Formais de Assinatura**: Assinatura do Supervisor e visto do `{termo_instrutor}` do polo.

---

#### 3.9.3. NÃ­vel 2: RelatÃ³rio PeriÃ³dico Consolidado da CoordenaÃ§Ã£o (Caderno Oficial)

* **PropÃ³sito**: Caderno executivo oficial protocolado periodicamente junto ao Concedente para demonstrar o monitoramento global de todos os polos e turmas atendidos no ciclo contratual.
* **Estrutura do Caderno Oficial (MultipÃ¡ginas - DOCX e PDF)**:
  1. **Capa e CabeÃ§alho Geral**:
     * RazÃ£o Social da OrganizaÃ§Ã£o Social, Concedente e Nome do Objeto;
     * TÃ­tulo dinÃ¢mico: `RELATÃ“RIO [MENSAL/PERIÃ“DICO] DE SUPERVISÃƒO DOS {TERMO_LOCAIS_PLURAL}`;
     * PerÃ­odo de apuraÃ§Ã£o (MÃªs/Ano e datas de inÃ­cio e tÃ©rmino);
     * **IdentificaÃ§Ã£o do Coordenador e RegiÃ£o**: `Coordenador(a): [Nome] ([RegiÃ£o])` ou com o campo especÃ­fico `RegiÃ£o / CoordenaÃ§Ã£o: [Nome da RegiÃ£o]`;
     * **Indicadores Executivos em Destaque**:
       * `NÂº de {termo_locais} acompanhados`: Total de polos distintos fiscalizados no ciclo (`COUNT DISTINCT local_id`);
       * `NÂº de supervisÃµes realizadas`: Quantidade total de vistorias concluÃ­das no ciclo (`COUNT total de visitas`);
     * Metadados protocolares: Data oficial de entrega e Nome do responsÃ¡vel pelo recebimento no Ã³rgÃ£o pÃºblico.
  2. **SeÃ§Ã£o 1 â€“ Resumo Geral das SupervisÃµes Realizadas no PerÃ­odo (Tabela Consolidada)**:
     * Grade cronolÃ³gica preenchida automaticamente pelo sistema:
       | Data | {termo_local} | {termo_instrutor} | HorÃ¡rio | {termo_beneficiarios} | SituaÃ§Ã£o | PendÃªncias | ProvidÃªncias |
       | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  3. **SeÃ§Ã£o 2 â€“ SÃ­ntese Qualitativa da CoordenaÃ§Ã£o (VisÃ£o Executiva)**:
     * Quatro blocos dissertativos preenchidos/revisados pelo Coordenador antes do fechamento definitivo:
       * *Principais pontos positivos observados*;
       * *Principais dificuldades / ocorrÃªncias*;
       * *PendÃªncias que permanecem para o ciclo seguinte*;
       * *ProvidÃªncias e encaminhamentos necessÃ¡rios*.
  4. **SeÃ§Ã£o 3 â€“ Caderno de Registros Detalhados (As Fichas Sequenciais)**:
     * CompilaÃ§Ã£o das fichas completas de cada visita do perÃ­odo, numeradas sequencialmente:
       * *SUPERVISÃƒO NÂº 1* (espelho idÃªntico ao relatÃ³rio unitÃ¡rio)
       * *SUPERVISÃƒO NÂº 2*
       * *(... atÃ© a supervisÃ£o NÂº N)*.
  5. **SeÃ§Ã£o 4 â€“ Caderno Consolidado de EvidÃªncias FotogrÃ¡ficas**:
     * Galeria fotogrÃ¡fica catalogada com data, `{termo_local}`, atividade e legenda explicativa.
  6. **SeÃ§Ã£o 5 â€“ DeclaraÃ§Ã£o de FÃ© PÃºblica do Coordenador**:
     * Termo formal de fÃ© pÃºblica e responsabilidade jurÃ­dica:
       > *"Declaro que as informaÃ§Ãµes constantes neste RelatÃ³rio correspondem Ã s visitas e aos acompanhamentos realizados durante o perÃ­odo informado, estando os respectivos registros fotogrÃ¡ficos e demais evidÃªncias disponÃ­veis para fins de monitoramento, avaliaÃ§Ã£o e prestaÃ§Ã£o de contas do projeto."*
     * Local, data e campo formal para assinatura do Coordenador.

---

#### 3.9.4. NÃ­vel 3: RelatÃ³rio de ExecuÃ§Ã£o e PrestaÃ§Ã£o de Contas do Objeto (RelatÃ³rio Master Governamental)

* **PropÃ³sito**: Caderno institucional e executivo mÃ¡ximo de prestaÃ§Ã£o de contas protocolado periodicamente (mensal, bimestral, trimestral ou anual) ou ao tÃ©rmino do convÃªnio perante o Concedente, em estrita observÃ¢ncia ao Marco RegulatÃ³rio das OrganizaÃ§Ãµes da Sociedade Civil (Lei Federal nÂº 13.019/2014 - MROSC e decretos municipais/estaduais).
* **EmissÃ£o**: Consolidado e emitido pelo **Administrador do Projeto** ou **Super Administrador**.
* **Disponibilidade e Formatos**:
  * **Painel Interativo no Sistema**: Todas as 16 seÃ§Ãµes e os 8 anexos sÃ£o visualizÃ¡veis em tempo real em abas e tabelas com busca, filtros por polo/regiÃ£o e paginaÃ§Ã£o Ã¡gil;
  * **ExportaÃ§Ã£o Oficial Compilada**: BotÃµes diretos para download em Word (**`.docx`**) e **`PDF`**, formatados com tipografia institucional, largura fixa DXA e sumÃ¡rio de anexos;
  * **ExportaÃ§Ã£o AnalÃ­tica em Planilha**: BotÃ£o **`[ Baixar em Excel (.xlsx) ]`** disponÃ­vel em cada anexo analÃ­tico (especialmente a relaÃ§Ã£o nominal de alunos e o espelho de frequÃªncias) para permitir auditoria externa direta por auditores do Concedente ou Tribunais de Contas.

* **Estrutura Oficial do Documento (Corpo Executivo - 16 SeÃ§Ãµes)**:
  1. **IdentificaÃ§Ã£o do Projeto e Parceria**:
     * Objeto, Ã“rgÃ£o Concedente, OSC Executora, CNPJ da OSC;
     * Termo de Parceria nÂº, Processo Administrativo nÂº, Edital de Chamamento nÂº;
     * PerÃ­odo de vigÃªncia, MunicÃ­pio/UF;
     * Dados BancÃ¡rios da conta corrente exclusiva do convÃªnio (Banco, AgÃªncia, Conta Corrente).
  2. **Objeto e Finalidade do Projeto**:
     * SÃ­ntese formal das metas acordadas, pÃºblico-alvo prioritÃ¡rio e metodologia pedagÃ³gica pactuada.
  3. **Resumo da ExecuÃ§Ã£o (Quadro Executivo de Indicadores)**:
     * Comparativo consolidado de KPIs: `[ Indicador | Previsto | Realizado ]`:
       * NÃºcleos / Polos em funcionamento;
       * BeneficiÃ¡rios atendidos;
       * Turmas ativas;
       * Professores / Instrutores alocados;
       * Aulas / SessÃµes realizadas com fotos;
       * SupervisÃµes de campo concluÃ­das.
  4. **ExecuÃ§Ã£o por NÃºcleo / Polo**:
     * Grade comparativa polo a polo: `NÃºcleo | RegiÃ£o/Bairro | Modalidade | Professor Titular | NÂº Turmas | BeneficiÃ¡rios Ativos | SessÃµes Realizadas`.
  5. **BeneficiÃ¡rios Atendidos**:
     * **5.1 Demonstrativo Geral de BeneficiÃ¡rios**:
       * Cadastrados, Ativos, Novos no perÃ­odo, Desligados/Desistentes;
       * DistribuiÃ§Ã£o por gÃªnero: Feminino e Masculino (calculado dinamicamente de `beneficiarios.genero`).
      * **5.2 DistribuiÃ§Ã£o por Faixa EtÃ¡ria**:
        * Demonstrativo apurado dinamicamente a partir da `data_nascimento` dos alunos matriculados, estruturado conforme os intervalos de idade mÃ­nima e idade mÃ¡xima definidos nas turmas do Objeto (ou consolidaÃ§Ã£o por idades atendidas no Plano de Trabalho) e Total Geral Atendido.
  6. **FrequÃªncia dos BeneficiÃ¡rios**:
     * Demonstrativo agregado por polo extraÃ­do das chamadas nominais (`beneficiarios_presencas`):
       * `NÃºcleo | BeneficiÃ¡rios Ativos | PresenÃ§as Registradas | Faltas | FrequÃªncia MÃ©dia (%)`;
       * ApuraÃ§Ã£o da **FrequÃªncia MÃ©dia Geral do Projeto (%)**.
  7. **Atividades Realizadas**:
     * Resumo cronolÃ³gico das sessÃµes executadas no perÃ­odo: `Data | NÃºcleo | Modalidade | Atividade / ConteÃºdo Trabalhado | Professor | Participantes Presentes`.
  8. **Acompanhamento e SupervisÃ£o dos NÃºcleos**:
     * Demonstrativo das vistorias de conformidade pedagÃ³gica e predial: `Data | NÃºcleo | Coordenador/Supervisor | Professor Auditado | Presentes em Quadra | SituaÃ§Ã£o Global (Regular / Requer AtenÃ§Ã£o / CrÃ­tica)`.
  9. **Recursos Humanos**:
     * RelaÃ§Ã£o formal dos profissionais da OrganizaÃ§Ã£o alocados no objeto: `Profissional | FunÃ§Ã£o / Cargo | NÃºcleo/Ãrea | PerÃ­odo de AtuaÃ§Ã£o | SituaÃ§Ã£o`.
  10. **Materiais e Uniformes**:
      * Demonstrativo de insumos: `Item | Qtd. Prevista | Qtd. Adquirida | Qtd. DistribuÃ­da | DestinaÃ§Ã£o`.
  11. **Cumprimento das Metas (Quadro Oficial do Plano de Trabalho)**:
      * Tabela comparativa oficial: `Meta / Indicador | Previsto | Realizado | % ExecuÃ§Ã£o | SituaÃ§Ã£o (Cumprida | Parcial | Pendente)`;
      * AnÃ¡lise dissertativa do cumprimento das metas e justificativas tÃ©cnicas.
  12. **Registro FotogrÃ¡fico**:
      * Mural catalogado de fotos das atividades em campo, demonstrando turmas uniformizadas, infraestrutura e material em uso.
  13. **Principais OcorrÃªncias e ProvidÃªncias**:
      * Registro de intercorrÃªncias de gestÃ£o: `OcorrÃªncia / Desafio Registrado | Gravidade | ProvidÃªncia Adotada | Status`.
  14. **Resultados AlcanÃ§ados**:
      * Parecer dissertativo sobre impacto comunitÃ¡rio, fortalecimento de vÃ­nculos familiares, cidadania e rendimento escolar dos participantes.
  15. **ConclusÃ£o**:
      * Atesto formal de cumprimento rigoroso do Plano de Trabalho e demonstraÃ§Ã£o da boa e regular aplicaÃ§Ã£o dos recursos pÃºblicos.
  16. **Documentos ComprobatÃ³rios e TrÃ­plice Assinatura**:
      * RelaÃ§Ã£o dos 8 Anexos AnalÃ­ticos detalhados;
      * **TrÃ­plice Assinatura Formal**:
        1. *ResponsÃ¡vel TÃ©cnico pela ElaboraÃ§Ã£o*: UsuÃ¡rio operador do sistema logado;
        2. *CoordenaÃ§Ã£o Geral do Projeto*: Coordenador tÃ©cnico que atesta a realizaÃ§Ã£o fÃ­sica das atividades;
        3. *Representante Legal da OSC*: Presidente ou Diretor estatutÃ¡rio da OrganizaÃ§Ã£o Social, titular jurÃ­dico do convÃªnio com fÃ© pÃºblica perante o Concedente.

* **Os 8 Cadernos de Anexos Oficiais (Listagens AnalÃ­ticas ComprobatÃ³rias)**:
  * **Anexo I â€“ RelaÃ§Ã£o dos NÃºcleos Esportivos em Funcionamento**: Listagem completa dos polos com endereÃ§o, modalidades, professores e turmas;
  * **Anexo II â€“ RelaÃ§Ã£o Nominal AnalÃ­tica de BeneficiÃ¡rios Atendidos**: Tabela nominal completa: `Nome do BeneficiÃ¡rio | NÃºcleo | Idade | Sexo | VulnerÃ¡vel (Sim/NÃ£o) | SituaÃ§Ã£o da MatrÃ­cula`;
  * **Anexo III â€“ RelatÃ³rios Consolidados de FrequÃªncia por NÃºcleo**: Espelho analÃ­tico de presenÃ§as e faltas polo a polo;
  * **Anexo IV â€“ RelatÃ³rio de Atividades e Aulas Realizadas**: Extrato completo de todas as sessÃµes registradas no perÃ­odo;
  * **Anexo V â€“ RelatÃ³rios Individuais de SupervisÃ£o PedagÃ³gica**: Caderno sequencial com todas as fichas de vistorias in loco e fotos;
  * **Anexo VI â€“ RelaÃ§Ã£o dos Profissionais e Equipe TÃ©cnica**: Folha com CPF, funÃ§Ã£o e lotaÃ§Ã£o de cada membro da equipe;
  * **Anexo VII â€“ Demonstrativo de Materiais e Uniformes DistribuÃ­dos**: RelaÃ§Ã£o detalhada de materiais coletivos e kits individuais entregues;
  * **Anexo VIII â€“ Demonstrativo AnalÃ­tico de Cumprimento de Metas**: Quadro completo com memÃ³ria de cÃ¡lculo de cada indicador pactuado.

---

#### 3.9.5. RelatÃ³rios Operacionais e AnalÃ­ticos ContÃ­nuos (Por NÃºcleo, Por Objeto ou Global Multi-Objeto)

AlÃ©m dos relatÃ³rios formais consolidados de ciclo (NÃ­veis 1, 2 e 3), o sistema disponibiliza consultas analÃ­ticas em tempo real para tomada de decisÃ£o contÃ­nua, auditoria diÃ¡ria e combate Ã  evasÃ£o:

##### A. RelatÃ³rio AnalÃ­tico de FrequÃªncia e Assiduidade por BeneficiÃ¡rio (Espelho Nominal de Alunos)
* **PropÃ³sito**: Extrato individual de cumprimento da assiduidade de cada aluno matriculado perante a meta contratual pactuada do Objeto (ex.: meta de 75% de frequÃªncia mÃ­nima exigida no Plano de Trabalho).
* **NÃ­vel de Granularidade**: AtÃ´mico (cidadÃ£o a cidadÃ£o, nominal).
* **Colunas Estruturadas**:
  | Coluna | Significado TÃ©cnico | Regra de NegÃ³cio |
  | :--- | :--- | :--- |
  | **BeneficiÃ¡rio** | Nome civil completo do participante | `beneficiarios.nome_completo` |
  | **CPF** | Identificador fiscal do aluno | `beneficiarios.cpf` |
  | **Turma** | Grupo de alocaÃ§Ã£o da matrÃ­cula | `grupos.nome` |
  | **NÃºcleo** | Polo fÃ­sico onde ocorrem as aulas | `locais.nome` |
  | **Professor** | Instrutor titular da turma | `funcionarios.nome_completo` |
  | **Aulas Realizadas** | Total de sessÃµes concluÃ­das daquela turma no perÃ­odo | Contagem de `sessoes` com chamada realizada |
  | **PresenÃ§as** | Comparecimentos confirmados do aluno | Chamadas com status `presente` |
  | **Faltas** | AusÃªncias nÃ£o justificadas | Chamadas com status `falta` |
  | **Faltas Justificadas** | AusÃªncias abonadas por atestado mÃ©dico ou justificativa familiar | Chamadas com status `justificada` |
  | **% FrequÃªncia** | Taxa real de assiduidade individual (OpÃ§Ã£o B: EquivalÃªncia a PresenÃ§a) | `((PresenÃ§as + Faltas Justificadas) / Aulas Realizadas) * 100` |
  | **Meta Objeto** | Indicador pactuado no Plano de Trabalho do Objeto | ParÃ¢metro contratual (ex.: `75%`) |
  | **SituaÃ§Ã£o (Assiduidade)** | Classificador imediato de conformidade da meta (`status_assiduidade`) | `Abaixo da Meta` (se < Meta) ou `Dentro da Meta` (se $\ge$ Meta) |

* **DistinÃ§Ã£o SemÃ¢ntica Fundamental no Modelo**:
  * `matriculas.status`: Representa a **SituaÃ§Ã£o Cadastral** do vÃ­nculo do aluno (`ativo`, `pre_inscrito`, `lista_espera`, `concluido`, `cancelado`), exibida no Anexo II do RelatÃ³rio Governamental;
  * `status_assiduidade`: Representa a **SituaÃ§Ã£o de Conformidade da Meta** no relatÃ³rio analÃ­tico (`dentro_da_meta` ou `abaixo_da_meta`), apurada dinamicamente pelo cÃ¡lculo de presenÃ§as.

* **Status Tripartite de PresenÃ§a & Regra de CÃ¡lculo Oficial (OpÃ§Ã£o B - EquivalÃªncia a PresenÃ§a)**:
  * O registro de chamada nominal do instrutor opera nos trÃªs estados:
    * `presente`: Aluno em atividade prÃ¡tica na quadra/espaÃ§o;
    * `falta`: AusÃªncia nÃ£o informada;
    * `justificada`: AusÃªncia abonada com atestado mÃ©dico, comprovante escolar ou termo da famÃ­lia (com upload opcional de comprovante no sistema).
  * **FÃ³rmula Oficial de Assiduidade**:
    $$\% \text{ FrequÃªncia} = \frac{\text{PresenÃ§as} + \text{Faltas Justificadas}}{\text{Aulas Realizadas}} \times 100$$
    A falta justificada devidamente comprovada soma com as presenÃ§as para fins de cÃ¡lculo de permanÃªncia, assegurando que o aluno amparado por atestado mÃ©dico nÃ£o seja penalizado na meta contratual de 75%.
* **Motor Ativo de Combate Ã  EvasÃ£o (Busca Ativa)**:
  * A coluna `SituaÃ§Ã£o: Abaixo da Meta` funciona como filtro de alerta prioritÃ¡rio na interface;
  * O Coordenador ou Assistente Social filtra com 1 clique todos os alunos em situaÃ§Ã£o de risco de desligamento para acionamento comunitÃ¡rio (parceria CRAS/escolas), cumprindo as metas de retenÃ§Ã£o do MROSC.
* **Escopos e ExportaÃ§Ã£o**:
  * **Filtros**: Por Objeto, RegiÃ£o, NÃºcleo/Polo, Turma, Professor, PerÃ­odo e SituaÃ§Ã£o (`Abaixo da Meta` / `Dentro da Meta`);
  * **ExportaÃ§Ã£o Aberta**: BotÃ£o direto para exportaÃ§Ã£o em CSV/Excel (**`.xlsx`**) no padrÃ£o com delimitador ponto e vÃ­rgula, e geraÃ§Ã£o de espelho diagramado em **`PDF`**.

---

##### B. RelatÃ³rio AnalÃ­tico de Recursos Humanos e AtuaÃ§Ã£o da Equipe (Espelho de FuncionÃ¡rios / Ponto)
* **PropÃ³sito**: ComprovaÃ§Ã£o de alocaÃ§Ã£o, cumprimento de escala de trabalho e carga horÃ¡ria de todos os colaboradores do projeto perante o fiscal do Concedente (alimentando diretamente a folha do **Anexo VI**).
* **NÃ­vel de Granularidade**: Profissional a profissional (por nÃºcleo ou consolidado global).
* **Colunas Estruturadas**:
  | Coluna | Significado TÃ©cnico | Regra de NegÃ³cio |
  | :--- | :--- | :--- |
  | **Profissional** | Nome completo do colaborador | `funcionarios.nome_completo` |
  | **CPF** | Registro de RH perante o Concedente | `funcionarios.cpf` |
  | **FunÃ§Ã£o / Cargo** | Ex.: *Professor/Instrutor*, *Coordenador de NÃºcleo*, *Staff/Apoio* | `funcionarios.cargo` |
  | **NÃºcleo / Polo** | Local fÃ­sico onde atua | `locais.nome` |
  | **RegiÃ£o** | RegiÃ£o territorial do nÃºcleo | `regioes.nome` |
  | **Turmas Vinculadas** | Turmas sob responsabilidade do profissional | RelaÃ§Ã£o de `blocos` e `grupos` |
  | **Aulas Previstas** | Quantidade de aulas planejadas na grade no perÃ­odo | Agenda programada |
  | **Aulas Realizadas** | SessÃµes efetivamente ministradas e concluÃ­das | SessÃµes com clock-in/out e fotos |
  | **Horas Realizadas** | Carga horÃ¡ria efetiva apurada via ponto eletrÃ´nico | Soma de horas em `registros_ponto` |
  | **SupervisÃµes** | Quantidade de auditorias in loco no seu nÃºcleo/horÃ¡rio | Vistorias de supervisÃ£o realizadas |
  | **PresenÃ§a em Vistoria**| Taxa de presenÃ§a do profissional durante as vistorias surpresa | `professor_presente` nas vistorias |
  | **SituaÃ§Ã£o Funcional** | VÃ­nculo ativo ou ocorrÃªncia trabalhista | `Ativo`, `Afastado`, `SubstituÃ­do`, `Desligado` |
  | **Conformidade** | Cumprimento da carga horÃ¡ria contratada | `Cumprida` ou `Abaixo da Carga` |

* **Dois Eixos de AbrangÃªncia**:
  * **Eixo de Campo (Professores e Instrutores)**: Vinculados a turmas e avaliados por aulas dadas, chamada de alunos e fotos em quadra;
  * **Eixo de Apoio e GestÃ£o (Staff Operacional, Coordenadores de NÃºcleo, Vigias)**: Profissionais sem turma de alunos, avaliados pela jornada presencial de guarda, manutenÃ§Ã£o e articulaÃ§Ã£o do espaÃ§o.

---

#### 3.9.6. GestÃ£o de Ponto EletrÃ´nico, Espelho de Ponto e Flexibilidade Administrativa (`registros_ponto`)

Para que o controle de frequÃªncia de Recursos Humanos funcione na prÃ¡tica de campo â€” considerando imprevistos reais como falta de sinal 4G, celulares sem bateria ou esquecimento de fechar a sessÃ£o ao final do dia â€”, o sistema opera sob o **desacoplamento rigoroso entre o fato pedagÃ³gico e a entidade trabalhista**:
* **Fato PedagÃ³gico ImutÃ¡vel (`sessoes`)**: Registra a execuÃ§Ã£o real da aula com os alunos e as fotos em quadra, permanecendo congelada como prova inalterÃ¡vel para auditoria do Concedente;
* **Entidade Trabalhista FlexÃ­vel (`registros_ponto`)**: Representa o espelho de horas de Recursos Humanos daquele profissional, nascendo espelhada no horÃ¡rio da sessÃ£o, mas onde reside a **ampla flexibilidade de retificaÃ§Ã£o, inclusÃ£o e abono auditados pelo Administrador do Projeto**.

1. **Duplo Canal de Registro de Ponto**:
   * **AutomÃ¡tico via SessÃ£o (Instrutores)**: Os cliques de *"Iniciar SessÃ£o"* e *"Finalizar SessÃ£o"* no celular geram o ponto eletrÃ´nico daquele dia e polo automaticamente;
   * **Direto no App (Staff, Coordenadores e Apoio)**: FuncionÃ¡rios sem turma registram **`[ Entrada ]`** e **`[ SaÃ­da ]`** no aplicativo com geolocalizaÃ§Ã£o e carimbo de horÃ¡rio.

2. **Painel de GestÃ£o e RetificaÃ§Ã£o do Administrador (Flexibilidade Total)**:
   * **RetificaÃ§Ã£o de HorÃ¡rios**: O Administrador do Projeto pode editar horÃ¡rios de entrada e saÃ­da jÃ¡ registrados para corrigir distorÃ§Ãµes (ex.: professor esqueceu o app aberto e a saÃ­da ficou gravada horas apÃ³s o tÃ©rmino da aula);
   * **InclusÃ£o Manual Retroativa**: Possibilidade de lanÃ§ar dias trabalhados quando o funcionÃ¡rio esteve presente no polo mas enfrentou impedimento tÃ©cnico (sem bateria ou sem internet);
   * **Abono de Faltas e Justificativas**: LanÃ§amento de dias como `falta_justificada` com registro do motivo e anexo opcional de atestado mÃ©dico;
   * **LanÃ§amentos em Lote**: Abono coletivo de recessos, feriados municipais ou dias sem atividade para toda a equipe do nÃºcleo.

3. **Rastreabilidade e Blindagem JurÃ­dica da OrganizaÃ§Ã£o Social**:
   * Para evitar questionamentos de auditoria governamental ou de Ã³rgÃ£os trabalhistas, toda modificaÃ§Ã£o administrativa Ã© auditada com transparÃªncia:
     * Flag `editado_manualmente: TRUE`;
     * `editado_por_usuario_id`: IdentificaÃ§Ã£o do Administrador que fez a ediÃ§Ã£o;
     * `motivo_ajuste`: Campo textual obrigatÃ³rio com a justificativa (ex.: *"Instrutor sem sinal 4G no polo Taquari. PresenÃ§a atestada pelo Coordenador Regional"*);
     * PreservaÃ§Ã£o dos valores originais (`hora_entrada_original`, `hora_saida_original`).

4. **EmissÃ£o do "Espelho de Ponto Oficial"**:
   * O sistema gera a **Folha Individual de FrequÃªncia Mensal** de cada colaborador em PDF para arquivamento e prestaÃ§Ã£o de contas, contendo todos os dias trabalhados, carga horÃ¡ria acumulada, assinaturas do colaborador e do gestor do projeto.

---

#### 3.9.7. Diretriz Arquitetural: O PadrÃ£o Snapshot ImutÃ¡vel (Point-in-Time) para RelatÃ³rios e Auditoria

Em observÃ¢ncia Ã s normas de auditoria pÃºblica e Ã  Lei Federal nÂº 13.019/2014 (MROSC), qualquer relatÃ³rio concluÃ­do, fechado ou emitido no sistema possui **fÃ© pÃºblica e valor documental probatÃ³rio**. Uma vez finalizado, ele **nunca Ã© recalculado dinamicamente** via consultas Ã s tabelas vivas. 

Se no futuro um aluno alterar seu CPF, um professor for desligado, uma turma for cancelada ou um polo for desativado, o relatÃ³rio histÃ³rico protocolado permanece rigorosamente idÃªntico ao momento de sua emissÃ£o.

##### Os TrÃªs NÃ­veis de Congelamento:

1. **NÃ­vel 1 (Visita de SupervisÃ£o UnitÃ¡ria)**:
   * Ao clicar em *"Finalizar SupervisÃ£o"*, o status muda para `concluida` e o sistema congela o registro imutÃ¡vel da visita (nomes literais do professor e alunos auditados, checklist da modalidade, notas de 1 a 5 e URLs das fotos).
   * A visualizaÃ§Ã£o na tela ou exportaÃ§Ã£o (DOCX/PDF) lÃª exclusivamente desse registro congelado.

2. **NÃ­vel 2 (Caderno Consolidado da CoordenaÃ§Ã£o Regional)**:
   * Ao acionar o *"Fechamento do Ciclo"*, o sistema compila todos os indicadores do perÃ­odo, a grade das vistorias e os textos da sÃ­ntese em `snapshot_dados JSONB`, congelando com status `fechado_imutavel`.
   * RetificaÃ§Ãµes avulsas posteriores em visitas nÃ£o afetam o caderno oficial jÃ¡ fechado.

3. **NÃ­vel 3 (RelatÃ³rio Master de PrestaÃ§Ã£o de Contas Governamental)**:
   * O fechamento periÃ³dico do Objeto serializa o corpo executivo (16 seÃ§Ãµes) e os 8 Cadernos de Anexos Oficiais (com dados nominais da Ã©poca) na coluna `anexos_dados JSONB`.
   * A TrÃ­plice Assinatura (Elaborador, Coordenador e Representante Legal) vincula-se a esse snapshot estÃ¡tico.

4. **PrincÃ­pio de RetificaÃ§Ã£o Auditada (Versionamento v1 -> v2)**:
   * Caso o Ã³rgÃ£o fiscalizador aponte diligÃªncias e exija correÃ§Ãµes em um relatÃ³rio jÃ¡ fechado, o sistema **nÃ£o sobrescreve o relatÃ³rio original**.
   * O sistema gera uma **VersÃ£o Retificadora (v2)** com justificativa formal registrada (`motivo_retificacao`), mantendo a v1 arquivada para preservar a trilha de auditoria dos Ã³rgÃ£os de controle.
