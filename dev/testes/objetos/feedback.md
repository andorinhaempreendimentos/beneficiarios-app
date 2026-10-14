# Feedback Corrigido de Testes Manuais — Entidade: Objetos (Projetos Sociais)

**Data**: 14/10/2026  
**Tela Auditada**: `https://beneficiarios-app.vercel.app/admin/objetos/novo` (e gestão em `/admin/objetos/[id]`)

---

## 1. Remoção de OSC e Concedente da Criação do Objeto
- **Classificação**: 🟡 **Alteração de Domínio & Simplificação de Formulário**
- **Diagnóstico Correto**: Nem a Organização Social (OSC) nem o Concedente devem fazer parte do formulário de criação do Objeto. O Objeto é a especificação do projeto em si. O vínculo de quem executa é definido dentro da OSC, e o vínculo de quem financia é definido dentro do Concedente.
- **Ação Técnica**:
  - Remover os campos `organizacao_id` e `concedente_id` do `ObjetoForm`, da validação do schema e da interface de criação do projeto;
  - Garantir que a tabela `objetos` aceite `organizacao_id` e `concedente_id` como `NULL` (ou associados via tabelas de relacionamento / gestão em OSCs e Concedentes).

---

## 2. Criação Inline em Sheet Lateral para Selects Relacionais (ex: Modalidade)
- **Classificação**: 🔴 **Bug de Especificação / Requisito de UX Pendente**
- **Diagnóstico Correto**: Nos selects relacionais (como o select de *Modalidade Principal*), deve existir um botão de adicionar nova entidade (ex: `+ Nova Modalidade`) que abre um formulário completo em um painel lateral deslizante (*Sheet / Sidebar*). Ao salvar a nova entidade ali dentro, ela é criada em tempo real e selecionada automaticamente no select do formulário principal, sem perder os dados preenchidos.
- **Ação Técnica**:
  - Criar o componente de criação rápida em Sheet lateral para Modalidades;
  - Adicionar o botão de ação rápida junto ao `<select>` de Modalidade no `ObjetoForm`;
  - Ao salvar no Sheet, atualizar a lista de opções e pré-selecionar a recém-criada.

---

## 3. Quadro de Metas como Aba Dedicada com Vocabulário Dinâmico
- **Classificação**: 🟡 **Alteração Estrutural de Fluxo** + 🟢 **Evolução de Domínio**
- **Diagnóstico Correto**: O formulário de criação de Objeto NÃO deve conter campos de metas. As metas do projeto devem ser gerenciadas em uma **aba separada** dentro da página de detalhes do Objeto (`/admin/objetos/[id]`).
- **Comportamento Esperado**:
  - Essa aba só fica disponível após a criação do objeto (quando o vocabulário dinâmico e a vigência já foram gravados);
  - Dentro da aba, os rótulos refletem o vocabulário definido para o projeto (ex: `{termo_beneficiario}s Atendidos`, `{termo_sessao}s Realizadas`, `{termo_grupo}s Ativas`, etc.);
  - O gestor define e acompanha as metas contratuais a serem atingidas ao longo da vigência.
- **Ação Técnica**:
  - Remover completamente a seção/campos de metas do `ObjetoForm` inicial;
  - Criar/integrar a aba de Metas na página [`/admin/objetos/[id]`](file:///c:/projetos/andorinha/beneficiarios3/src/app/(dashboard)/admin/objetos/[id]/page.tsx) com consumo do vocabulário dinâmico do projeto.
