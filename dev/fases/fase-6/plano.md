# Plano Técnico — Fase 6: Relatórios Oficiais, Motor de Templates e Prestação de Contas Governamental

## 1. Visão Geral e Contexto Canônico (§3.8 e §3.9 de AGENTS.md)

O módulo de **Relatórios Oficiais e Prestação de Contas Governamental** é o núcleo probatório e documental do sistema. Ele consolida os fatos pedagógicos de campo (sessões, presenças nominais e registros fotográficos) e as vistorias in loco de supervisão para prestar contas aos Concedentes públicos em estrita observância ao Marco Regulatório das Organizações da Sociedade Civil (Lei Federal nº 13.019/2014 - MROSC).

A Fase 6 materializa a hierarquia probatória tripartite:
1. **Nível 1 (Supervisão Unitária)**: Visita pontual com comprovação imediata (já ativa na Fase 4).
2. **Nível 2 (Caderno Consolidado da Coordenação Regional)**: Fechamento regional com os 4 blocos dissertativos canônicos (já ativa na Fase 5).
3. **Nível 3 (Relatório Master de Execução do Objeto)**: Caderno executivo máximo protocolado perante o Concedente com as **16 seções executivas oficiais** e os **8 Cadernos de Anexos Analíticos**, chancelado pela **Tríplice Assinatura** (Elaborador, Coordenador Geral e Representante Legal da OSC).
4. **Relatórios Analíticos Contínuos**:
   - **Espelho Nominal de Assiduidade e Frequência**: Cálculo atômico da fórmula tripartite de assiduidade:
     $$\% \text{ Frequência} = \frac{\text{Presenças} + \text{Faltas Justificadas}}{\text{Aulas Realizadas}} \times 100$$
     com classificação imediata (`Dentro da Meta` / `Abaixo da Meta`) e motor de **Busca Ativa** para combate preventivo à evasão;
   - **Espelho de Recursos Humanos e Ponto Eletrônico**: Desacoplamento entre o fato pedagógico e a entidade trabalhista (`registros_ponto`), permitindo retificação e abono com justificativa auditada (`motivo_ajuste`) pelo Administrador.
5. **Diretriz Arquitetural de Snapshot Imutável (Point-in-Time)**:
   - Relatórios concluídos são congelados em JSONB e possuem fé pública, nunca recalculados por queries vivas;
   - Versionamento auditado para correções (`v1 -> v2`) com registro de `motivo_retificacao`.

---

## 2. Arquitetura Técnica & Entidades Envolvidas

### 2.1. Tabelas no Supabase PostgreSQL
- **`relatorios_prestacao_contas`**: Armazena os cadernos oficiais (Nível 2 e Nível 3), contendo período, pareceres e o snapshot `anexos_dados JSONB`, além do controle de versão (`versao`) e status (`em_elaboracao`, `fechado`, `retificado`).
- **`beneficiarios_presencas`**: Registros atômicos de presença (`presente`, `falta`, `justificada`, `justificativa`, `comprovante_url`).
- **`sessoes`**: Aulas e atendimentos executados em campo com fotos probatórias.
- **`registros_ponto`**: Ponto eletrônico de RH com rastreabilidade de edições manuais (`editado_manualmente`, `motivo_ajuste`, `editado_por_usuario_id`).
- **`matriculas`**: Vínculo do aluno com turma e objeto.
- **`objeto_metas`**: Metas contratuais pactuadas no Plano de Trabalho do Objeto.

---

## 3. Estratégia de Implementação (Passo a Passo)

### 3.1. Schemas Zod (`src/lib/validations/fase-6.ts`)
- `filtroAssiduidadeSchema`: parâmetros de filtragem de alunos (objeto, polo, turma, status de meta `dentro_da_meta` / `abaixo_da_meta`);
- `retificacaoPontoSchema`: dados para ajuste manual do espelho de ponto (`registro_id`, `hora_entrada`, `hora_saida`, `motivo_ajuste` com mínimo 15 caracteres);
- `gerarRelatorioMasterSchema`: parâmetros para fechamento e compilação das 16 seções e 8 anexos do Relatório Master Nível 3;
- `retificarRelatorioSchema`: emissão de versão retificadora (`v2`) com justificativa formal.

### 3.2. Server Actions Analíticas & Prestação de Contas (`src/lib/actions/relatorios.ts`)
- `getRelatorioAssiduidadeNominal(filtros)`: calcula assiduidade atômica individual por aluno, identifica alunos em risco de evasão e resume os KPIs gerais do projeto;
- `getRelatorioRecursosHumanos(filtros)`: compila atuação da equipe, horas de ponto e sessões ministradas;
- `retificarRegistroPonto(input)`: edita horários de ponto com trilha de auditoria e justificativa obrigatória;
- `getRelatorioMasterData(objetoId, periodoId)`: compila as 16 seções executivas e os 8 anexos analíticos para conferência;
- `fecharRelatorioMaster(input)`: grava o snapshot imutável oficial Nível 3 em `relatorios_prestacao_contas`;
- `retificarRelatorioMaster(input)`: gera nova versão (`v2`) arquivando a anterior.

### 3.3. Interfaces do Usuário (Next.js App Router + Tailwind + shadcn/ui)
1. **Hub Central de Relatórios (`/relatorios`)**:
   - Cartões de navegação para:
     - Relatório Master de Prestação de Contas (Nível 3);
     - Painel Analítico de Assiduidade e Busca Ativa (Evasão);
     - Espelho de RH e Ponto Eletrônico da Equipe;
     - Acesso rápido aos Cadernos Regionais Nível 2 e Unitários Nível 1.
2. **Painel Analítico de Assiduidade & Busca Ativa (`/relatorios/assiduidade`)**:
   - Tabela nominal atômica com status de meta contratual, cálculo tripartite e filtro de combate à evasão;
   - Exportação em CSV/Excel.
3. **Painel de Recursos Humanos e Ponto Eletrônico (`/relatorios/ponto`)**:
   - Folha de ponto dos instrutores e staff, com modal para retificação administrativa auditada.
4. **Cockpit Executivo do Relatório Master Nível 3 (`/relatorios/master`)**:
   - Visão em abas das 16 seções executivas e dos 8 cadernos de anexos;
   - Espelho oficial formatado para impressão (`window.print()`) e exportação com Tríplice Assinatura;
   - Suporte a retificação auditada (`v1 -> v2`).

---

## 4. Diretrizes Rígidas Aplicadas
- **Zero Hardcoded para Domínio**: Rótulos dinâmicos `{termo_local}`, `{termo_instrutor}`, `{termo_grupo}`, `{termo_beneficiario}`, `{termo_materiais_coletivos}` e `{termo_materiais_concedidos}` aplicados rigorosamente.
- **Zero Fallback Silencioso**: Ausência de dados e erros de agregação sinalizados com clareza.
- **Snapshot Imutável**: Relatório Nível 3 gravado com congelamento point-in-time e versionamento.
