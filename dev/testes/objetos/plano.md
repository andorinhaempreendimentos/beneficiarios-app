# Plano Técnico — Testes Manuais: Entidade Objetos — Rodada 3 (Refatoração de `/admin/objetos/[id]`)

## 1. Contexto e Requisitos
A tela de gestão de projeto individual (`/admin/objetos/[id]`) foi desenhada antes de o `ObjetoForm` ser modularizado em abas e de o vínculo de OSC e Concedente ser desacoplado da criação.
Como resultado:
1. Os cards do topo renderizam valores nulos com tags quebradas (`CNPJ: `, `Esfera undefined`);
2. As abas externas da página de detalhes (`objeto-detalhes-client.tsx`) duplicam exatamente o que o `ObjetoForm` já contém dentro de si (Vocabulário, Atividades, Metas).

---

## 2. Estratégia Técnica de Refatoração

### 2.1. Cards de Resumo do Topo (Métricas Reais e Consistentes)
Substituir os 4 cards superiores por indicadores operacionais dinâmicos:
1. **Formato & Modalidades**: Formato (Contínuo / Pontual), quantidade de modalidades ativas vinculadas;
2. **Vigência do Projeto**: Início e término formatados, badge de status de vigência (Vigente / Encerrado / A Iniciar);
3. **Rede de Polos & Regiões**: Quantidade de polos vinculados e regiões cadastradas;
4. **Governança & Parceria**: Exibir dados da OSC/Concedente se existirem, ou caso contrário, o Nº do Termo de Parceria e Representante Legal (preenchidos nos Dados Jurídicos).

### 2.2. Reorganização das Abas Principais de `/admin/objetos/[id]`
Em vez de aninhar tabs dentro de tabs:
- **Aba 1 — Configuração do Projeto (`ObjetoForm`)**: Formulário completo com as 5 abas integradas (Identificação, Vocabulário, Atividades, Metas e Jurídico), com botão de salvar alterações.
- **Aba 2 — Polos de Atendimento (`locais`)**: Tabela com os polos cadastrados, região e botão para cadastrar novo polo no projeto.
- **Aba 3 — Formulário de Inscrição**: Construtor de perguntas específicas e simulador público do formulário híbrido (§3.3.2).
- **Aba 4 — Resumo Executivo / Auditoria**: Visão consolidada em modo leitura de todos os dados do projeto para conferência rápida sem entrar no modo de edição.

---

## 3. Arquivos Impactados
- `src/components/admin/objeto-detalhes-client.tsx`: Refatoração dos cards do topo e reorganização das abas.
- `src/app/(dashboard)/admin/objetos/[id]/page.tsx`: Garantir injeção correta dos dados necessários.

---

## 4. Tasklist Atômica
- [x] **T01** — **Saneamento dos Cards de Resumo do Topo**: Ajustar os 4 cards superiores para exibir métricas operacionais reais do projeto (Formato, Vigência com badge de status, Rede de Polos/Regiões, e Parceria/Representante Legal sem textos quebrados).
- [x] **T02** — **Reorganização das Abas da Tela de Detalhes**: Eliminar a duplicidade de abas aninhadas, organizando as seções em: Edição Completa (`ObjetoForm`), Polos de Atendimento, Formulário de Inscrição e Resumo Executivo para Auditoria.
- [x] **T03** — **Validação de Tipagem, Build, Deploy e Homologação**: Validar compilação (`tsc`), build de produção Turbopack, deploy na Vercel e homologação com o usuário.
