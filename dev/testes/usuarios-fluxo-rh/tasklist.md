# Tasklist — Fluxo Unificado de Usuários com Vínculo Dinâmico de RH

- [x] **T01** — **Aprimoramento da Server Action `createUsuario`**: Estender o payload e schema para aceitar criação transacional simultânea de funcionário (`novo_funcionario: { cpf, cargo, organizacao_id, objeto_id, local_id, carga_horaria_semanal }`).
- [x] **T02** — **Suporte a OSCs e Polos na Tela de Usuários**: Atualizar `page.tsx` de `/admin/usuarios` para carregar a lista de organizações e polos e passar para `UsuariosClient`.
- [x] **T03** — **Interface Dinâmica no Modal de Usuários (`usuarios-client.tsx`)**: Implementar a seção de RH ativada pelos papéis de campo com alternador (novo funcionário vs existente), máscaras e selects encadeados.
- [ ] **T04** — **Validação Global, Build, Deploy e Verificação**: Executar `npx tsc --noEmit`, `npm run build`, push autenticado para GitHub e deploy na Vercel com testes de homologação.
