### 3.10. GestÃ£o LogÃ­stica de Materiais e Uniformes (Coletivo e Individual)

Para atender Ã  prestaÃ§Ã£o de contas patrimonial e ao Anexo VII, o sistema gerencia a cadeia de suprimentos em dois eixos universais:

#### A. Materiais de Uso Coletivo (Equipamentos do Polo / PatrimÃ´nio MÃ³vel)
* **Itens**: Bolas, cones, redes, traves mÃ³veis, cronÃ´metros, tatames, coletes de treino, bombas de encher bola, etc.
* **DestinaÃ§Ã£o**: Ficam alocados no polo (`local_id`) sob a guarda fÃ­sica do instrutor.
* **Remessa Completa e Detalhada**:
  * Cadastro de especificaÃ§Ãµes: Marca/modelo, quantidade e especificaÃ§Ãµes tÃ©cnicas;
  * IdentificaÃ§Ã£o de patrimÃ´nio: NÃºmero de tombamento/etiqueta (quando exigido no convÃªnio);
  * Upload de fotos comprobatÃ³rias dos materiais entregues e desembalados no polo;
  * Documentos opcionais: Guia de remessa, canhoto assinado ou nota fiscal de transporte.
* **InspeÃ§Ã£o ContÃ­nua**: Integrado diretamente ao **Painel do Supervisor**, onde cada vistoria presencial audita as condiÃ§Ãµes de conservaÃ§Ã£o dos materiais coletivos (notas de 1 a 5, fotos e parecer).

#### B. Materiais de Uso Individual (Kits do Aluno / Uniformes / VestuÃ¡rio)
* **Itens**: Camisetas, shorts/calÃ§Ãµes, meiÃµes, mochilas, squeezes, medalhas, kits de corrida.
* **DestinaÃ§Ã£o**: Entregues diretamente ao cidadÃ£o atendido (`beneficiario_id`).
* **Levantamento de Demanda**: A grade de tamanhos Ã© capturada no ato da matrÃ­cula ou autoinscriÃ§Ã£o pÃºblica (`dados_adicionais->>'tamanho_uniforme'`).
* **Entrega e Responsabilidade Direta do Professor**:
  * **Zero dependÃªncia externa**: O processo **nÃ£o depende de confirmaÃ§Ã£o, login ou SMS da famÃ­lia ou da crianÃ§a**.
  * **FÃ© PÃºblica do Instrutor**: No Painel do Instrutor, hÃ¡ uma aba simplificada da turma onde o professor confirma com 1 toque os kits entregues aos seus alunos.
  * O sistema carimba: `funcionario_id` (professor que realizou a entrega), data/hora exata e status `entregue`.
  * **ComprovaÃ§Ã£o em Papel Opcional**: Se o instrutor utilizar uma lista fÃ­sica para assinatura dos responsÃ¡veis, o upload da foto dessa folha no sistema Ã© **100% facultativo (opcional)**; a baixa eletrÃ´nica feita pelo professor Ã© soberana para fins de sistema e prestaÃ§Ã£o de contas.
