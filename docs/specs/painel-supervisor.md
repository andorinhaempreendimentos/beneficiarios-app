### 3.6. Auditoria Presencial: Painel do Supervisor e Visita de SupervisÃ£o

O **Painel do Supervisor** Ã© a interface operacional mobile-first utilizada em campo para vistorias presenciais de conformidade e auditoria nos polos:

* **Visita de SupervisÃ£o (`visitas_supervisao`)**:
  1. **AutomaÃ§Ãµes de Contexto (Check-in AutomÃ¡tico)**:
     * `supervisor_id`: obtido automaticamente pela sessÃ£o logada do usuÃ¡rio (`auth.uid()`).
     * `{termo_local}`: selecionado pelo supervisor na chegada ao polo.
     * `data`: preenchida automaticamente pelo sistema com a data corrente.
     * `hora_inicio`: carimbada automaticamente no banco no instante em que o supervisor clica no botÃ£o **"Iniciar SupervisÃ£o"**.

  2. **Auditoria da Atividade em Andamento (Cruzamento com a Agenda)**:
     * IdentificaÃ§Ã£o dinÃ¢mica do bloco/turma(s) previstos naquele instante e quantitativo esperado de participantes.
     * **Profissional Auditado (`{termo_instrutor}`)**: SeleÃ§Ã£o/confirmaÃ§Ã£o do instrutor atuante no polo (`instrutor_funcionario_id`).
     * **PresenÃ§a do Profissional**: Registro formal (`Presente` | `Ausente`).
     * **{termo_grupo}(s) e Faixa EtÃ¡ria**: IdentificaÃ§Ã£o das turmas em atividade.
     * **Quantitativo de PresenÃ§as**: Contagem de beneficiÃ¡rios presentes em quadra/espaÃ§o e conferÃªncia da chamada nominal.
     * **Checklist de Conformidade Operacional**:
       * Grade de horÃ¡rios: `Conforme` | `NÃ£o conforme`
       * FrequÃªncia / Chamada: `Conferida` | `Pendente`
     * **DescriÃ§Ã£o da Atividade**: Relato qualitativo do conteÃºdo ministrado pelo instrutor.
     * **EvidÃªncia FotogrÃ¡fica da Atividade**: Registro fotogrÃ¡fico direto da cÃ¢mera do celular comprovando a turma em atendimento.

  3. **Vistoria Setorizada de Infraestrutura e Recursos Materiais**:
     * Escala padronizada de 5 nÃ­veis: **`CrÃ­tica` | `Ruim` | `Regular` | `Boa` | `Ã“tima`**, com status rÃ¡pido, parecer descritivo e fotos individuais setor a setor:
       * **Estrutura FÃ­sica do Local** (Status `Adequado`/`Requer atenÃ§Ã£o` + nota 1 a 5 + texto descritivo + fotos do espaÃ§o, piso, redes, iluminaÃ§Ã£o, banheiros, acessibilidade);
       * **Materiais de Uso Coletivo** (Status `Adequados`/`Pendentes` + nota 1 a 5 + texto descritivo + fotos de bolas, cones, cronÃ´metros, pÃ³rticos, tatames, equipamentos compartilhados);
       * **Materiais Concedidos** (Status `Adequados`/`Pendentes` + nota 1 a 5 + texto descritivo + fotos de uniformes e itens individuais em posse dos alunos).

  4. **Apontamentos PedagÃ³gicos, OrientaÃ§Ãµes e ProvidÃªncias**:
     * **ObservaÃ§Ãµes da SupervisÃ£o**: ImpressÃµes gerais sobre o ambiente e conduÃ§Ã£o pedagÃ³gica;
     * **OcorrÃªncias / Dificuldades Identificadas**: Problemas pontuais ou operacionais observados;
     * **OrientaÃ§Ãµes Repassadas ao Professor**: Feedbacks tÃ©cnicos transmitidos presencialmente ao profissional;
     * **PendÃªncias e ProvidÃªncias Adotadas**: AÃ§Ãµes corretivas exigidas da OrganizaÃ§Ã£o Social;
     * **Prazo para RegularizaÃ§Ã£o / Acompanhamento**: Data limite acordada para sanar inconformidades;
     * **Parecer Global da Visita (`situacao`)**: Seletor explÃ­cito da situaÃ§Ã£o global da visita (`Regular`, `Requer AtenÃ§Ã£o`, `CrÃ­tica`), alimentando diretamente a tabela resumo do relatÃ³rio oficial.

  5. **Tela de RevisÃ£o, EdiÃ§Ã£o e ConfirmaÃ§Ã£o Final**:
     * Espelho visual consolidado de todos os apontamentos, notas e miniaturas das fotos.
     * **AÃ§Ã£o "Alterar"**: permite voltar a qualquer etapa anterior para retificar dados sem perda de informaÃ§Ãµes.
     * **AÃ§Ã£o "Confirmar / Finalizar SupervisÃ£o"**: registra o carimbo definitivo de **`hora_fim`** (saÃ­da/check-out), altera o status para `concluida` e **congela o registro como snapshot imutÃ¡vel** para fins de auditoria e prestaÃ§Ã£o de contas.
