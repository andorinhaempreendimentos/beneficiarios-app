# Feedback de Testes Manuais — Entidade: Objetos (Projetos Sociais) — Rodada 3

**Data**: 14/10/2026  
**Tela Auditada**: `https://beneficiarios-app.vercel.app/admin/objetos/[id]`

---

## 1. Relato Bruto do Usuário
- "vc removeu o cnpj desse formulário?"
- "Então tem que refatorar essa rota aqui. https://beneficiarios-app.vercel.app/admin/objetos/a96e9c93-9733-49aa-9a08-a438565fbbc9"

---

## 2. Triagem e Classificação dos Apontamentos

### 🔴 Bugs / Erros
1. **Cards de Resumo do Topo Quebrados**:
   - Card "Organização Social": exibe texto literal `CNPJ: ` vazio/undefined quando o projeto não possui OSC vinculada (`objeto.organizacao` é `null`);
   - Card "Concedente Público": exibe `Esfera undefined` quando o projeto não possui órgão concedente vinculado (`objeto.concedente` é `null`);
   - Card "Vigência": exibe `Meta: % freq.` quando `meta_frequencia_percentual` não está preenchida.

### 🟡 Alterações / Ajustes Estruturais (UX & Arquitetura)
2. **Abas Duplicadas e Aninhadas (Tabs dentro de Tabs)**:
   - A página de detalhes externa (`objeto-detalhes-client.tsx`) possui abas externas para *Dados Gerais*, *Vocabulário Dinâmico*, *Atividades*, *Quadro de Metas*, *Polos* e *Formulário de Inscrição*;
   - Porém, a primeira aba (*Dados Gerais*) renderiza o `ObjetoForm`, que agora **já possui internamente suas 5 abas** (*Identificação*, *Vocabulário*, *Atividades*, *Metas* e *Jurídico*);
   - Isso cria uma experiência de abas aninhadas confusa e dados duplicados (Vocabulário, Atividades e Metas aparecem duas vezes em níveis diferentes).

3. **Reestruturação da Gestão do Projeto em `/admin/objetos/[id]`**:
   - Manter cards de topo limpos, informativos e sem campos nulos;
   - Unificar a navegação para que o usuário possa editar os dados do projeto via `ObjetoForm` ou navegar diretamente pelas áreas operacionais do projeto (`Polos / Locais`, `Formulário Híbrido de Inscrição`, `Visão Consolidada`).
