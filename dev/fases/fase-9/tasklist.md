# Tasklist — Fase 9: Pesquisas de Satisfação, WhatsApp e Anti-Fraude (§3.13 e §3.14)

## Tarefas Atômicas

- [x] **T01** — Configurações Globais & Schemas Zod: Implementar `src/lib/validations/fase-9.ts` e `src/lib/actions/configuracoes.ts` para dados institucionais da mantenedora e schemas de validação
- [x] **T02** — Engine de Pesquisas & Submissão Pública Anti-Fraude: Implementar `src/lib/actions/pesquisas.ts` e a rota pública mobile-first `/r/[token]` com device fingerprint, KYC e suporte a condicionais
- [x] **T03** — Painel Central de Gestão de Pesquisas & Inteligência Analítica (`/pesquisas`): Implementar painel com KPIs, criação/edição de pesquisas, construtor de perguntas, cruzamento de dados, exportação CSV e QR Code para polos
- [x] **T04** — Módulo Operacional de WhatsApp: Implementar `src/lib/actions/whatsapp.ts` e os 4 formulários operacionais (Gateway/Instância com QR Code, Gestão Anti-Ban de Números, Templates com tags dinâmicas e Assistente de Disparo em 3 Etapas com busca ativa)
- [x] **T05** — Configurações Globais da Mantenedora (`/configuracoes/sistema`), Validação, Compilação e Deploy: Implementar tela de branding/dados da mantenedora, validar com `npx tsc --noEmit`, `npm run build`, push autenticado para a Vercel e Tríplice Validação de conformidade
