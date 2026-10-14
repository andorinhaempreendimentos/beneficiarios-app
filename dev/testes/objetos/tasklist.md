# Tasklist — Testes Manuais: Entidade Objetos (Projetos Sociais)

- [x] **T01** — Migração no Supabase & Ajuste do Schema Zod: Executar `DROP NOT NULL` em `concedente_id` e `organizacao_id` na tabela `objetos` e atualizar `objetoSchema` em `src/lib/validations/admin.ts`
- [ ] **T02** — Remoção de OSC e Concedente do Formulário de Objeto: Retirar os campos `organizacao_id` e `concedente_id` de `src/components/admin/objeto-form.tsx` e de `src/lib/actions/objetos.ts`
- [ ] **T03** — Remoção do Card de Metas da Criação de Objeto: Excluir o bloco com o campo estático `meta_frequencia_percentual` do formulário base de criação
- [ ] **T04** — Criação Inline de Modalidade em Sheet Lateral: Adicionar o botão `+ Nova Modalidade` no dropdown de modalidade com abertura de Sheet lateral para cadastro e seleção em tempo real sem perder dados
- [ ] **T05** — Aba Dedicada de Metas com Vocabulário Dinâmico: Criar aba de Metas na página de detalhes do Objeto (`/admin/objetos/[id]`) exibindo os termos dinâmicos já definidos e permitindo cadastrar metas atreladas às entidades
- [ ] **T06** — Validação Final de Tipagem, Build e Deploy: Rodar `npx tsc --noEmit`, `npm run build`, push autenticado para a Vercel e solicitar revalidação do usuário
