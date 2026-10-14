# Plano Técnico — Fase 10: Hardening de Segurança (RLS), Salvaguardas por Timeout e Homologação Final

## 1. Visão Geral e Contexto Canônico

A Fase 10 consolida o ciclo de desenvolvimento do sistema de Gestão de Beneficiários e Projetos Sociais Esportivos (Lei 13.019/2014 - MROSC). Seu objetivo é assegurar estabilidade operacional, blindagem de dados multi-tenant, tratamento de contingências operacionais em campo e homologação formal de ponta a ponta.

Os pilares essenciais desta fase são:
1. **Salvaguarda Automática de Sessões por Timeout (§3.5)**:
   - Se um instrutor em campo iniciar uma aula/sessão e esquecer de finalizá-la no mesmo dia, uma rotina automática encerra a sessão com fé pública, registra o clock-out no ponto eletrônico (`registros_ponto`), consolida as presenças registradas e anota a justificativa de salvaguarda.
2. **Hardening de Row Level Security (RLS)**:
   - Auditoria rigorosa de todas as políticas de segurança no Supabase PostgreSQL, assegurando que nenhum dado de um projeto ou organização social possa ser acessado ou modificado por usuários de outro escopo.
3. **Otimizações de Índices e Performance**:
   - Garantia de índices cobrindo chaves estrangeiras e filtros temporais de alta frequência nas tabelas transacionais (`sessoes`, `beneficiarios_presencas`, `registros_ponto`, `visitas_supervisao`, `respostas`).
4. **Auditoria Transversal de Tolerância Zero a Fallbacks e Dados Mocados**:
   - Varredura de conformidade em todo o repositório para assegurar que todas as entidades e terminologias consumam estritamente o vocabulário dinâmico do banco de dados.
5. **Homologação Final e Produção**:
   - Validação da compilação estática (`npx tsc --noEmit`), build otimizado (`npm run build`), deploy definitivo na Vercel com status `READY` e emissão do documento de homologação técnica.

---

## 2. Decomposição Tática das Tarefas

### T01: Salvaguarda Automática de Sessões por Timeout
- Implementar `src/lib/actions/salvaguardas.ts`:
  - `executarSalvaguardaSessoes()`: identifica sessões com `status = 'em_andamento'` e data anterior a hoje ou duração excedida; finaliza com `status = 'concluida'`, calcula `hora_fim` e fecha o registro de ponto correspondente em `registros_ponto`.
- Implementar Route Handler `src/app/api/cron/salvaguarda-sessoes/route.ts` protegido por secret token (`CRON_SECRET`) para acionamento automatizado por cron jobs da Vercel ou Supabase.

### T02: Hardening e Auditoria de Políticas RLS
- Verificar via Supabase MCP todas as 36 tabelas do banco de dados;
- Garantir que todas as tabelas transacionais e cadastrais possuam RLS ativo (`rls_enabled = true`);
- Validar que operações anônimas sejam estritamente limitadas a leitura de projetos/turmas abertas e submissão de respostas de pesquisas públicas com token.

### T03: Otimizações de Performance & Índices de Banco
- Verificar índices existentes no Supabase;
- Assegurar índices compostos essenciais para prestação de contas governamental (`sessoes(objeto_id, data)`, `beneficiarios_presencas(sessao_id, matricula_id)`, `registros_ponto(funcionario_id, data)`).

### T04: Auditoria Transversal de Tolerância Zero a Fallbacks
- Varredura nos componentes e Server Actions para certificar que nenhum rótulo de domínio esteja fixado como hardcoded;
- Garantir que falhas de carregamento e permissões sejam sinalizadas de forma explícita na UI.

### T05: Build Final, Deploy e Homologação de Ponta a Ponta
- Executar `npx tsc --noEmit` e `npm run build`;
- Commit descritivo de encerramento do ciclo e push autenticado para produção;
- Monitoramento até status `READY` na Vercel;
- Realização formal da Tríplice Validação de Conformidade Final do Sistema.
