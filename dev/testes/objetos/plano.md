# Plano Técnico — Testes Manuais: Entidade Objetos (Projetos Sociais)

## 1. Contexto e Requisitos Alinhados
Com base no feedback e correções estritas do usuário:
1. **Desacoplamento de OSC e Concedente na Criação**:
   - O Objeto é a especificação do projeto em si. O formulário de criação não deve conter campos de OSC nem de Concedente.
   - O banco de dados PostgreSQL (`public.objetos`) deve permitir `concedente_id` e `organizacao_id` como `NULL`.
2. **Criação Inline de Modalidade em Painel Lateral (Sheet)**:
   - No formulário de Objeto, o select de Modalidade Principal deve ter um botão de ação rápida (`+ Nova Modalidade`) que abre um painel lateral deslizante (*Sheet*).
   - O formulário completo de Modalidade é preenchido e salvo inline; ao salvar com sucesso, a nova modalidade é injetada na lista e pré-selecionada no dropdown do projeto sem recarregar a tela nem perder dados.
3. **Quadro de Metas como Aba Separada Pós-Criação com Vocabulário Dinâmico**:
   - Remover a seção/campo de meta contratual do formulário de criação de Objeto (`objeto-form.tsx`).
   - Na página de detalhes do Objeto ([`/admin/objetos/[id]`](file:///c:/projetos/andorinha/beneficiarios3/src/app/(dashboard)/admin/objetos/[id]/page.tsx)), implementar uma aba dedicada **"Metas do Projeto"** que consome o vocabulário dinâmico já resolvido (`{termo_beneficiario}`, `{termo_grupo}`, `{termo_sessao}`, etc.) e permite cadastrar as metas contratuais atreladas às entidades do projeto.

---

## 2. Arquivos Impactados
- **Banco de Dados**: Migração DDL via Supabase MCP (`ALTER TABLE public.objetos ALTER COLUMN concedente_id DROP NOT NULL; ALTER TABLE public.objetos ALTER COLUMN organizacao_id DROP NOT NULL;`).
- **Validações**: `src/lib/validations/admin.ts` (ajustar `objetoSchema` para não exigir `organizacao_id`, `concedente_id` nem `meta_frequencia_percentual`).
- **Actions de Objeto**: `src/lib/actions/objetos.ts` (remover campos desnecessários do create/update).
- **Formulário de Objeto**: `src/components/admin/objeto-form.tsx` (remover selects de OSC e Concedente, remover card de metas e integrar botão + Sheet de criação inline de Modalidade).
- **Criação Inline de Modalidade**: `src/components/admin/modalidade-inline-sheet.tsx` (componente reutilizável para criar modalidade inline).
- **Detalhes do Objeto & Aba de Metas**: `src/components/admin/objeto-detalhes-client.tsx` (adicionar aba dedicada de Metas com vocabulário dinâmico).

---

## 3. Estratégia de Execução Recursiva (Tasklist)
- **T01**: Migração de Banco no Supabase (DROP NOT NULL em `concedente_id` e `organizacao_id`) e ajuste dos schemas Zod em `src/lib/validations/admin.ts`.
- **T02**: Remoção completa de OSC e Concedente do `ObjetoForm` e da Action `createObjeto`.
- **T03**: Remoção do card de metas isolado do `ObjetoForm` de criação.
- **T04**: Implementação da criação inline de Modalidade via Sheet lateral deslizante no `ObjetoForm`.
- **T05**: Implementação da aba dedicada de Metas Dinâmicas com vocabulário dinâmico na tela de detalhes do Objeto (`/admin/objetos/[id]`).
- **T06**: Compilação (`npx tsc --noEmit`), build, deploy na Vercel e solicitação de revalidação pelo usuário.
