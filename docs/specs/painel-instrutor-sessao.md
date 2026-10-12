### 3.5. ExecuÃ§Ã£o em Campo: Painel do Instrutor e SessÃ£o

O **Painel do Instrutor** Ã© a interface operacional mobile-first utilizada em campo para conduÃ§Ã£o e comprovaÃ§Ã£o das atividades:

1. **Mini-Dashboard de EstatÃ­sticas**:
   * Indicadores de topo: total de sessÃµes concluÃ­das no ciclo/mÃªs, carga horÃ¡ria acumulada (ponto eletrÃ´nico), taxa mÃ©dia de presenÃ§a e total de atendimentos realizados.

2. **VisualizaÃ§Ã£o das SessÃµes (Lista / Cards)**:
   * Interface estritamente em **formato de lista vertical** (sem calendÃ¡rio de grade pesada).
   * Aba **"Hoje"**: fila cronolÃ³gica dos blocos/sessÃµes do dia atual (*A Iniciar*, *Em Andamento*, *ConcluÃ­da*).
   * Aba **"Esta Semana"**: visÃ£o resumida da programaÃ§Ã£o semanal por dias Ãºteis.

3. **InÃ­cio da SessÃ£o & Ponto EletrÃ´nico Integrado**:
   * O clique no botÃ£o **"Iniciar SessÃ£o"** cumpre duplo papel:
     * *Operacional*: abre a sessÃ£o para controle de presenÃ§as e fotos;
     * *Ponto EletrÃ´nico (Clock-in)*: registra o carimbo exato de data e hora do inÃ­cio do trabalho do instrutor para prestaÃ§Ã£o de contas trabalhista.

4. **Controle de PresenÃ§a (Chamada Nominal)**:
   * O sistema puxa automaticamente os beneficiÃ¡rios matriculados no(s) grupo(s) daquele bloco.
   * Checklist simples de presenÃ§a para marcaÃ§Ã£o Ã¡gil.

5. **EvidÃªncia FotogrÃ¡fica ObrigatÃ³ria**:
   * ExigÃªncia de **no mÃ­nimo 2 fotos** da atividade por sessÃ£o para habilitar a finalizaÃ§Ã£o.
   * Captura direta da cÃ¢mera do dispositivo mÃ³vel.

6. **Encerramento e Salvaguarda Operacional**:
   * **FinalizaÃ§Ã£o Manual**: encerra a sessÃ£o, registra a `hora_fim` (saÃ­da do ponto/clock-out) e gera o snapshot imutÃ¡vel.
   * **Fechamento AutomÃ¡tico (Salvaguarda)**: mecanismo programado para encerrar sessÃµes esquecidas abertas apÃ³s tolerÃ¢ncia do horÃ¡rio do bloco, evitando distorÃ§Ãµes no ponto e no histÃ³rico.

7. **SessÃ£o (Snapshot PedagÃ³gico ImutÃ¡vel de ExecuÃ§Ã£o)**:
   * **Papel PedagÃ³gico Puro**: A sessÃ£o registra o fato real da aula prÃ¡tica e o atendimento aos alunos em quadra. Por ter fins probatÃ³rios com fotos, permanece **estritamente imutÃ¡vel** apÃ³s o fechamento, enquanto eventuais retificaÃ§Ãµes trabalhistas de jornada de trabalho ocorrem de forma auditada na tabela de Recursos Humanos (`registros_ponto`).
   * DesnormalizaÃ§Ã£o total por IDs diretos sem inferÃªncias:
     * `objeto_id`
     * `organizacao_id`
     * `local_id`
     * `funcionario_id` (instrutor)
     * `modalidade_id`
     * `grupos_ids` (lista de turmas participantes)
     * `beneficiarios_presentes` (lista explÃ­cita de presenÃ§as nominais via tabela `beneficiarios_presencas`)
     * `fotos_urls` (mÃ­nimo de 2 URLs no Supabase Storage)
     * Data real, horÃ¡rios de inÃ­cio e fim, observaÃ§Ãµes de campo.
