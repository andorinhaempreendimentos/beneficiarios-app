# Feedback de Testes Manuais — Entidade: Objetos (Projetos Sociais)

**Data**: 14/10/2026  
**Tela Auditada**: `https://beneficiarios-app.vercel.app/admin/objetos/novo` (e gestão em `/admin/objetos/[id]`)

---

## 1. Remoção de OSC e Concedente da Criação do Objeto
- **Classificação**: 🟡 **Alteração de Domínio & Simplificação de Formulário**
- **Diagnóstico Correto**: Nem a Organização Social (OSC) nem o Concedente devem fazer parte do formulário de criação do Objeto. O Objeto é a especificação do projeto em si. O vínculo de quem executa é definido dentro da OSC, e o vínculo de quem financia é definido dentro do Concedente.
- **Ação Técnica**:
  - Remover os campos `organizacao_id` e `concedente_id` do `ObjetoForm`, da validação do schema e da interface de criação do projeto;
  - Garantir que a tabela `objetos` aceite `organizacao_id` e `concedente_id` como `NULL`.

---

## 2. Modalidades / Atividades Gerenciadas em Aba Dedicada com Criação Inline
- **Classificação**: 🟡 **Alteração Estrutural de Domínio** + 🟢 **Evolução de UX**
- **Diagnóstico Correto**: As modalidades são as atividades do projeto. O Objeto não deve ter um campo isolado de "modalidade principal" na sua criação. Na verdade, um projeto oferece múltiplas modalidades/atividades a partir do catálogo já cadastrado na área global de modalidades.
- **Comportamento Esperado**:
  - Remover o campo `modalidade_principal_id` do formulário inicial de Objeto (`/admin/objetos/novo`);
  - Criar tabela associativa `objeto_modalidades` no Supabase para suportar N modalidades por projeto;
  - Adicionar uma aba dedicada de **Atividades / Modalidades** na página de detalhes do Objeto (`/admin/objetos/[id]`);
  - Na aba, o gestor visualiza e seleciona/vincula quais modalidades do catálogo estão autorizadas para o projeto;
  - Disponibilizar na mesma aba o botão de **criação inline** em painel lateral deslizante (*Sheet / Sidebar*) com o formulário completo de modalidade, vinculando-a automaticamente ao projeto após salvar.

---

## 3. Quadro de Metas como Aba Dedicada com Vocabulário Dinâmico
- **Classificação**: 🟡 **Alteração Estrutural de Fluxo** + 🟢 **Evolução de Domínio**
- **Diagnóstico Correto**: O formulário de criação de Objeto NÃO deve conter campos de metas (o campo solto `meta_frequencia_percentual` foi removido). As metas do projeto devem ser gerenciadas em uma **aba separada** dentro da página de detalhes do Objeto (`/admin/objetos/[id]`).
- **Comportamento Esperado**:
  - Essa aba só fica disponível após a criação do objeto (quando o vocabulário dinâmico e a vigência já foram gravados);
  - Dentro da aba, os rótulos refletem o vocabulário definido para o projeto (ex: `{termo_beneficiario}s Atendidos`, `{termo_sessao}s Realizadas`, `{termo_grupo}s Ativas`, etc.);
  - O gestor define e acompanha as metas contratuais a serem atingidas ao longo da vigência (tabela `objeto_metas`).
