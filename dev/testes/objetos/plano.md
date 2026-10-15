# Plano Técnico — Testes Manuais: Entidade Objetos — Rodada 4 (Migração de Tabs para Accordions)

## 1. Contexto e Objetivos
A experiência de navegação por `Tabs` (abas) em telas ricas de projeto social pode ocultar seções cruciais e criar conflitos visuais quando aninhadas.
A transição para `Accordion` proporciona:
- Visão vertical contínua e natural de fluxo;
- Capacidade de manter seções abertas simultaneamente (`type="multiple"`);
- Triggers expansíveis com cabeçalhos ricos (título, descrição curta, ícones e badges).

---

## 2. Estratégia Técnica

### 2.1. Instalação do Componente Accordion
- Adicionar `src/components/ui/accordion.tsx` utilizando a CLI do shadcn (`shadcn add accordion -y`).

### 2.2. Refatoração do `ObjetoForm`
- Substituir `<Tabs>` por `<Accordion type="multiple" defaultValue={["identificacao", "vocabulario", "atividades", "metas", "juridico"]}>`;
- Cada uma das 5 seções passa a ser um `<AccordionItem>` estilizado com `<AccordionTrigger>` contendo ícone temático, título em destaque e descrição;
- Manter botões de submissão claros e acessíveis na barra inferior ("Salvar Rascunho", "Salvar e Continuar" / "Salvar Alterações").

### 2.3. Refatoração da Tela de Detalhes (`objeto-detalhes-client.tsx`)
- Substituir `<Tabs>` externos por `<Accordion type="multiple" defaultValue={["configuracao", "metas"]}>`;
- 4 Seções em Accordion:
  1. **Configurações & Edição do Projeto** (`ObjetoForm`);
  2. **Execução de Metas MROSC** (`ObjetoMetasTab`);
  3. **Polos & Regiões Territoriais** (tabelas integradas);
  4. **Formulário Híbrido de Inscrição** (card e link do construtor).

---

## 3. Tasklist Atômica
- [ ] **T01** — **Instalação do Componente Accordion**: Adicionar o componente `accordion` do shadcn/ui em `src/components/ui/accordion.tsx` e validar compatibilidade.
- [ ] **T02** — **Refatoração do `ObjetoForm` para Accordion**: Migrar as 5 seções do formulário (`/admin/objetos/novo` e edição) de `Tabs` para `Accordion`, mantendo validação, criação inline e persistência.
- [ ] **T03** — **Refatoração da Tela de Detalhes (`/admin/objetos/[id]`) para Accordion**: Migrar as seções de gestão de `Tabs` para `Accordion` unificado.
- [ ] **T04** — **Validação de Tipagem, Build, Deploy e Homologação**: Rodar `tsc`, `next build`, deploy na Vercel e homologação com o usuário nas duas URLs.
