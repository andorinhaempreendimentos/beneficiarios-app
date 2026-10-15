# Feedback de Testes Manuais — Entidade: Objetos (Projetos Sociais) — Rodada 4

**Data**: 14/10/2026  
**Telas Auditadas**:  
- `https://beneficiarios-app.vercel.app/admin/objetos/novo`
- `https://beneficiarios-app.vercel.app/admin/objetos/[id]`

---

## 1. Relato Bruto do Usuário
- "nessa área, e na área de novo objeto, vamos trocar as tabs por acoordions"
- "Sim. Faz a tasklist inteira e no fim revise tudo."

---

## 2. Triagem e Classificação dos Apontamentos

### 🟡 Alterações Estruturais de UX / Layout
1. **Substituição de Tabs por Accordions no `ObjetoForm` (`/admin/objetos/novo` e `/admin/objetos/[id]`)**:
   - As 5 seções do formulário (Identificação, Vocabulário Dinâmico, Atividades & Modalidades, Quadro de Metas, Dados Jurídicos) devem ser renderizadas como itens colapsáveis/expansíveis de Accordion (`AccordionItem`).
   - Usuário pode visualizar e expandir as seções desejadas com facilidade, sem perder visão do conjunto e sem navegação horizontal de abas.

2. **Substituição de Tabs por Accordions na Tela de Detalhes (`/admin/objetos/[id]`)**:
   - As 4 grandes seções da página de gestão (Configurações & Edição, Execução de Metas MROSC, Polos & Regiões, Formulário de Inscrição) devem utilizar Accordions elegantes, eliminando qualquer aninhamento de abas.
