# Tasklist — Testes Manuais: Entidade Objetos (Projetos Sociais)

- [x] **T01** — Migração no Supabase & Ajuste do Schema Zod: Executar `DROP NOT NULL` em `concedente_id` e `organizacao_id` na tabela `objetos` e atualizar `objetoSchema` em `src/lib/validations/admin.ts`
- [x] **T02** — Remoção de OSC e Concedente do Formulário de Objeto: Retirar os campos `organizacao_id` e `concedente_id` de `src/components/admin/objeto-form.tsx` e de `src/lib/actions/objetos.ts`
- [x] **T03** — Remoção do Card de Metas da Criação de Objeto: Excluir o bloco com o campo estático `meta_frequencia_percentual` do formulário base de criação
- [x] **T04** — Remoção do campo `modalidade_principal_id` do formulário de criação de Objeto: Limpar a seleção isolada de modalidade do `objeto-form.tsx`, deixando a gestão de modalidades para sua aba dedicada
- [x] **T05** — Criação da tabela `objeto_modalidades` no Supabase com RLS e Server Actions de relacionamento
- [x] **T06** — Implementação da aba dedicada de "Atividades / Modalidades" em `/admin/objetos/[id]` com seleção do catálogo e Sheet lateral deslizante para criação inline
- [x] **T07** — Implementação da aba dedicada de "Metas do Projeto" em `/admin/objetos/[id]` com vocabulário dinâmico
- [x] **T08** — Validação Final de Tipagem (`tsc`), Build, Deploy na Vercel e Homologação com o usuário
