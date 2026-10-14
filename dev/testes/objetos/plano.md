# Plano Técnico — Testes Manuais: Entidade Objetos (Projetos Sociais)

## 1. Contexto e Requisitos Alinhados
Com base no feedback e correções estritas do usuário:
1. **Desacoplamento de OSC e Concedente na Criação**:
   - O Objeto é a especificação do projeto em si. O formulário de criação não deve conter campos de OSC nem de Concedente.
   - O banco de dados PostgreSQL (`public.objetos`) permite `concedente_id` e `organizacao_id` como `NULL`.
2. **Desacoplamento de Modalidade da Criação Inicial**:
   - O projeto não fica limitado a uma única "modalidade principal" solta na criação.
   - O campo `modalidade_principal_id` é removido do formulário de criação (`objeto-form.tsx`).
3. **Gestão de Atividades / Modalidades em Aba Própria com Criação Inline**:
   - Criar tabela associativa `public.objeto_modalidades` (`id`, `objeto_id`, `modalidade_id`, `ativo`, `criado_em`).
   - Implementar aba dedicada **"Atividades / Modalidades"** em `/admin/objetos/[id]`, permitindo selecionar e vincular modalidades do catálogo geral ao projeto.
   - Disponibilizar botão `+ Nova Modalidade` com painel lateral deslizante (*Sheet*) para criação inline completa, vinculando-a automaticamente ao projeto.
4. **Quadro de Metas como Aba Separada Pós-Criação com Vocabulário Dinâmico**:
   - Remover a seção/campo de meta contratual do formulário de criação de Objeto (`objeto-form.tsx`).
   - Na página de detalhes do Objeto (`/admin/objetos/[id]`), implementar uma aba dedicada **"Metas do Projeto"** consumindo o vocabulário dinâmico já resolvido (`{termo_beneficiario}`, `{termo_grupo}`, `{termo_sessao}`, etc.) e permitindo cadastrar as metas contratuais atreladas às entidades do projeto na tabela `objeto_metas`.

---

## 2. Arquivos Impactados
- **Banco de Dados (Supabase)**: Criar tabela `public.objeto_modalidades` com índices e políticas RLS.
- **Validações**: `src/lib/validations/admin.ts` (remover obrigatoriedade de modalidade/metas da criação).
- **Actions**:
  - `src/lib/actions/objetos.ts` (remover campos do form inicial).
  - `src/lib/actions/objeto-modalidades.ts` (ações para listar, vincular, desvincular e alternar status).
  - `src/lib/actions/objeto-metas.ts` (ações para criar/listar metas do projeto).
- **Formulário de Objeto**: `src/components/admin/objeto-form.tsx` (remover modalidade principal do form inicial).
- **Aba de Modalidades do Objeto**: `src/components/admin/objeto-modalidades-tab.tsx` (listagem, seleção e Sheet lateral de criação inline).
- **Aba de Metas do Objeto**: `src/components/admin/objeto-metas-tab.tsx` (criação e acompanhamento de metas com vocabulário dinâmico).
- **Página de Detalhes do Objeto**: `src/components/admin/objeto-detalhes-client.tsx` (incorporar as novas abas).

---

## 3. Estratégia de Execução Recursiva (Tasklist)
- **T01** [x]: Migração de Banco no Supabase (DROP NOT NULL em `concedente_id` e `organizacao_id`) e ajuste dos schemas Zod.
- **T02** [x]: Remoção completa de OSC e Concedente do `ObjetoForm` e da Action `createObjeto`.
- **T03** [x]: Remoção do card de metas isolado do `ObjetoForm` de criação.
- **T04**: Remoção do campo `modalidade_principal_id` do formulário de criação de Objeto (`objeto-form.tsx`) e do select inicial.
- **T05**: Criação da tabela `objeto_modalidades` no Supabase com RLS e Server Actions de relacionamento.
- **T06**: Implementação da aba dedicada de **Atividades / Modalidades** em `/admin/objetos/[id]` com seleção do catálogo e Sheet lateral deslizante para criação inline.
- **T07**: Implementação da aba dedicada de **Metas do Projeto** em `/admin/objetos/[id]` com vocabulário dinâmico.
- **T08**: Validação Final de Tipagem (`tsc`), Build, Deploy na Vercel e Homologação com o usuário.
