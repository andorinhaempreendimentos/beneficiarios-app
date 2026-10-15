# Tasklist — Módulo Universal de Endereços, Autocomplete de CEP e Máscaras de Entrada

- [x] **T01** — **Criação dos Utilitários Canônicos de Máscaras e Estados**: Implementar `src/lib/constants/estados.ts` (27 UFs) e `src/lib/utils/masks.ts` (CPF, CNPJ, Telefone fixo/celular, CEP e unmask).
- [x] **T02** — **Serviço de Busca de CEP e Componente Seletor de UF**: Implementar `src/lib/services/cep.ts` (consulta ViaCEP) e componente reutilizável `SelectUf` em `src/components/ui/select-uf.tsx`.
- [x] **T03** — **Integração de CEP e Máscaras em Locais / Polos**: Atualizar `src/components/admin/local-form.tsx` com máscara de CEP, busca automática de endereço e seletor de UF.
- [x] **T04** — **Integração de Máscaras e Endereço em Organizações Sociais (OSC)**: Atualizar `src/components/admin/organizacoes-client.tsx` com máscaras de CNPJ, telefone, CEP com autocomplete e seletor de UF.
- [x] **T05** — **Integração em Configurações do Sistema e Concedentes**: Atualizar `src/components/admin/configuracoes-form.tsx` e `src/components/admin/concedentes-client.tsx` com máscaras de CNPJ, telefone, CEP autocomplete e seletor de UF.
- [x] **T06** — **Integração de Máscaras em Funcionários, Beneficiários e Autoinscrição**: Atualizar `funcionarios-client.tsx`, `beneficiarios-client.tsx` e `formulario-inscricao-publica.tsx` com máscaras padronizadas de CPF e telefone.
- [x] **T07** — **Validação Global, Build, Deploy e Homologação**: Rodar `tsc`, `npm run build`, push para o GitHub e deploy na Vercel com verificação em produção.
