# Plano Técnico — Testes Manuais: Entidade Objetos (Projetos Sociais)

## 1. Contexto e Requisitos Alinhados
O formulário de criação e edição de Objeto (`src/components/admin/objeto-form.tsx`) passa a ser estruturado internamente em abas (`Tabs`):
1. **Aba 1 — Identificação & Formato**: Dados essenciais de vigência e formato do projeto.
2. **Aba 2 — Vocabulário Dinâmico**: Customização terminológica completa (§4.3).
3. **Aba 3 — Atividades / Modalidades**: Vínculo das modalidades autorizadas com suporte a cadastro inline via Sheet lateral.
4. **Aba 4 — Quadro de Metas**: Definição de metas com consumo reativo do vocabulário da Aba 2.
5. **Aba 5 — Dados Jurídicos**: Informações de auditoria e representação legal.

---

## 2. Arquivos Impactados
- `src/components/admin/objeto-form.tsx`: Reestruturação completa com `Tabs`, `TabsList`, `TabsTrigger` e `TabsContent`, suportando navegação e validação entre abas.
- `src/app/(dashboard)/admin/objetos/novo/page.tsx`: Passar catálogo de modalidades para permitir seleção e criação inline na Aba 3.
- `src/lib/actions/objetos.ts`: Atualizar `createObjeto` para receber e persistir `modalidades_ids` e `metas` atreladas na mesma transação.
- `src/lib/validations/admin.ts`: Ajustar schema para aceitar arrays opcionais de `modalidades_ids` e `metas`.

---

## 3. Tasklist Atômica de Execução
- [x] **T01** — Reestruturar `ObjetoForm` com componente de Abas (`Tabs`) para Identificação, Vocabulário Dinâmico, Atividades, Metas e Dados Jurídicos, com navegação fluida entre elas
- [x] **T02** — Integrar a seleção de Atividades/Modalidades com Sheet lateral inline dentro da Aba 3 do `ObjetoForm`
- [x] **T03** — Integrar a criação do Quadro de Metas dentro da Aba 4 do `ObjetoForm`, consumindo reativamente o vocabulário preenchido na Aba 2
- [x] **T04** — Atualizar Server Action `createObjeto` para persistir o Objeto, as modalidades vinculadas e as metas em lote no Supabase
- [x] **T05** — Validação Final de Tipagem (`tsc`), Build, Deploy na Vercel e Homologação com o usuário
