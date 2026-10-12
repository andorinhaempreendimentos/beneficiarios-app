> [!IMPORTANT]
> ## 4. DESTAQUE ARQUITETURAL: GESTÃƒO DE USUÃRIOS, RBAC ESCOPADO & VOCABULÃRIO DINÃ‚MICO
> Esta seÃ§Ã£o define como a seguranÃ§a, a hierarquia de permissÃµes e a linguagem dinÃ¢mica se integram no sistema.

### 4.1. Desacoplamento Rigoroso: UsuÃ¡rio vs. FuncionÃ¡rio

O sistema estabelece uma separaÃ§Ã£o explÃ­cita entre a identidade de seguranÃ§a do software e a relaÃ§Ã£o trabalhista com o projeto:

* **UsuÃ¡rio (`auth.users` / `usuarios`)**:
  * **FunÃ§Ã£o**: AutenticaÃ§Ã£o, seguranÃ§a e credencial de login.
  * **Atributos**: E-mail, senha criptografada, status de acesso (ativo/bloqueado) e perfil de sistema.
  * **Conceito**: Ã‰ quem aperta botÃµes e acessa interfaces no software.

* **FuncionÃ¡rio (`funcionarios`)**:
  * **FunÃ§Ã£o**: Registro de Recursos Humanos exigido na prestaÃ§Ã£o de contas governamental do Objeto.
  * **Atributos**: Nome completo, CPF, cargo contratual, telefone, polo/local alocado e carga horÃ¡ria.
  * **Conceito**: Ã‰ o profissional que trabalha no mundo real. Pode existir no cadastro sem jamais ter login no sistema (ex.: auxiliares de apoio, vigias).

* **A ConexÃ£o entre eles**:
  * A tabela `funcionarios` possui um vÃ­nculo opcional: `usuario_id UUID REFERENCES auth.users(id) NULL`.
  * Quando um funcionÃ¡rio (Instrutor ou Supervisor) precisa usar o app mÃ³vel, a GestÃ£o de UsuÃ¡rios associa sua conta de login ao seu registro de funcionÃ¡rio.
  * Se o profissional for desligado, seu **UsuÃ¡rio** Ã© bloqueado (cortando o acesso ao app), mas seu registro de **FuncionÃ¡rio** permanece inalterado para preservar a auditoria histÃ³rica das sessÃµes passadas.

---

### 4.2. Matriz de Acesso RBAC com Escopo de Projeto

A GestÃ£o de UsuÃ¡rios opera sob duas dimensÃµes fundamentais: **O que o usuÃ¡rio pode fazer (Papel)** e **Onde ele pode atuar (Escopo)**.

#### A. PapÃ©is de Acesso (O que pode fazer):
1. **Super Administrador**: Controle irrestrito sobre a entidade, todos os objetos, configuraÃ§Ãµes globais e gestÃ£o de usuÃ¡rios.
2. **Administrador de Projeto (Gestor Setorial)**: GestÃ£o operacional completa dentro dos seus projetos autorizados (turmas, blocos, agendas, locais, matrÃ­culas e relatÃ³rios gerais).
3. **Coordenador**: GestÃ£o de acompanhamento presencial e supervisÃ£o, validaÃ§Ã£o das vistorias de campo, redaÃ§Ã£o da sÃ­ntese mensal e assinatura/emissÃ£o dos relatÃ³rios oficiais consolidados.
4. **Operador / Cadastro**: PermissÃ£o estrita para cadastrar beneficiÃ¡rios e gerenciar matrÃ­culas dentro dos seus projetos autorizados (sem alterar agendas ou contratos).
5. **Auditor / Fiscal do Concedente**: Acesso exclusivo de leitura e consulta de relatÃ³rios de conformidade e presenÃ§as de convÃªnios especÃ­ficos.
6. **Supervisor**: Acesso restrito ao **Painel do Supervisor** para conduzir e assinar vistorias presenciais em campo.
7. **Instrutor**: Acesso restrito ao **Painel do Instrutor** para registrar presenÃ§as e fotos nas suas prÃ³prias sessÃµes.

#### B. Escopo de Projetos (Onde pode atuar) & Comportamento na UI:
* A tabela associativa `usuario_acessos (usuario_id, objeto_id, perfil)` determina quais projetos cada administrador pode visualizar:
  * **Admin de Objeto Ãšnico**: Seletor de projetos oculto. O sistema entra diretamente no seu objeto atribuÃ­do.
  * **Admin Multi-Objeto**: O seletor de projetos exibe apenas os objetos expressamente concedidos a ele, alternando dinamicamente os dados a cada seleÃ§Ã£o.
  * **Super Admin**: O seletor exibe todos os projetos cadastrados e disponibiliza no topo a opÃ§Ã£o **"VisÃ£o Global (Todos os Projetos)"**.

---

### 4.3. Camada de VocabulÃ¡rio DinÃ¢mico: Global vs. Objeto Ativo

O banco de dados relacional utiliza **nomes de entidades canÃ´nicos e neutros** (ex.: `beneficiarios`, `sessoes`, `grupos`, `locais`). A interface adapta os rÃ³tulos de tela de acordo com o contexto ativo do usuÃ¡rio:

#### A. GlossÃ¡rio Global (CanÃ´nico Institucional)
Utilizado na visÃ£o macro do Super Admin, em dashboards consolidados e relatÃ³rios agregados:
* `BeneficiÃ¡rios`
* `Instrutores`
* `Grupos / Turmas`
* `SessÃµes`
* `Blocos de HorÃ¡rio`
* `Locais / Polos`

#### B. VocabulÃ¡rio Customizado por Objeto (Direto na tabela `objetos`)
Armazenado diretamente como colunas da prÃ³pria tabela `objetos` (zero tabelas extras, zero JOINs desnecessÃ¡rios):
* `termo_beneficiario`: ex.: *"Aluno"*, *"Atleta"*, *"Corredor"*, *"Participante"*
* `termo_instrutor`: ex.: *"Professor"*, *"Educador"*, *"Monitor"*, *"Staff"*
* `termo_grupo`: ex.: *"Turma"*, *"PelotÃ£o"*, *"Categoria"*, *"Chave"*
* `termo_sessao`: ex.: *"Aula"*, *"Treino"*, *"Largada"*, *"Partida"*, *"Encontro"*
* `termo_bloco`: ex.: *"HorÃ¡rio de Aula"*, *"Bateria"*, *"Etapa"*
* `termo_local`: ex.: *"Polo"*, *"NÃºcleo"*, *"Arena"*, *"Circuito"*
* `termo_materiais_coletivos`: ex.: *"Materiais Esportivos"*, *"Equipamentos Coletivos"*, *"Estrutura de Apoio"*
* `termo_materiais_concedidos`: ex.: *"Uniformes"*, *"Kits Individuais"*, *"Kits de Corrida"*, *"VestuÃ¡rio"*

#### C. DinÃ¢mica de AlternÃ¢ncia na Tela:
* Ao selecionar um projeto especÃ­fico: toda a interface recarrega e fala a linguagem personalizada daquele projeto.
* Ao selecionar "VisÃ£o Global" (Super Admin): o sistema reverte para o **GlossÃ¡rio Global**, garantindo que somas e mÃ©tricas agregadas nÃ£o misturem termos conflitantes.