### 3.11. CatÃ¡logo AgnÃ³stico de Metas do Objeto (Plano de Trabalho / MROSC)

Em estrita consonÃ¢ncia com o Art. 22, IV da Lei 13.019/2014, cada projeto configura seu prÃ³prio catÃ¡logo de metas contratuais (`objeto_metas`), permitindo que escolinhas, eventos pontuais ou oficinas estruturem seus indicadores com total flexibilidade.

* **Atributos de Cada Meta**:
  * `numero_meta`: Identificador sequencial (01, 02, 03...);
  * `descricao`: RÃ³tulo do indicador (ex.: *"NÃºcleos esportivos em funcionamento"*, *"BeneficiÃ¡rios atendidos"*, *"FrequÃªncia mÃ©dia"*);
  * `unidade_medida`: `NÃºcleos`, `BeneficiÃ¡rios`, `Percentual (%)`, `Atividades / Aulas`, `Eventos`, `ReuniÃµes`, etc.;
  * `quantidade_prevista`: Valor-meta pactuado no Plano de Trabalho;
  * `fonte_verificacao`: Instrumento oficial de prova (ex.: *"Software de gestÃ£o e listas de presenÃ§a"*, *"RelatÃ³rios tÃ©cnicos com fotos"*).

* **Dois Mecanismos de ApuraÃ§Ã£o**:
  1. **ApuraÃ§Ã£o AutomÃ¡tica pelo Sistema**:  
     O software calcula a realizaÃ§Ã£o em tempo real cruzando os dados brutos do perÃ­odo:
     * `total_locais`: Contagem de polos ativos no perÃ­odo;
     * `total_beneficiarios`: Contagem de matrÃ­culas ativas;
     * `frequencia_media`: MÃ©dia percentual das chamadas nominais registradas;
     * `sessoes_realizadas`: Contagem de sessÃµes concluÃ­das com evidÃªncia fotogrÃ¡fica;
     * `supervisoes_realizadas`: Contagem de visitas de supervisÃ£o concluÃ­das;
     * `vulnerabilidade_social`: Percentual de matriculados com indicador de vulnerabilidade ativo.
  2. **ApuraÃ§Ã£o DeclaratÃ³ria / Manual (AÃ§Ãµes Externas)**:  
     Para eventos que acontecem fora da grade semanal de aulas (ex.: *"ReuniÃµes com FamÃ­lias"*, *"Eventos Esportivos e Festivais"*, *"CapacitaÃ§Ãµes da Equipe"*):
     * O Administrador insere o nÃºmero realizado (ex.: `4`) e uma sÃ­ntese descritiva da aÃ§Ã£o;
     * **AnexaÃ§Ã£o de Atas / Listas 100% Opcional**: O upload de atas, documentos ou fotos Ã© facultativo e **nunca bloqueia a gravaÃ§Ã£o nem a emissÃ£o do relatÃ³rio oficial**.

* **ClassificaÃ§Ã£o AutomÃ¡tica de SituaÃ§Ã£o**:
  * $\ge 100\% \rightarrow$ **`Cumprida`**
  * Entre $1\%$ e $99\% \rightarrow$ **`Parcial`**
  * $0\% \rightarrow$ **`Pendente`**
