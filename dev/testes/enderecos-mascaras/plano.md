# Plano Técnico — Módulo Universal de Endereços, Autocomplete de CEP e Máscaras de Entrada

## 1. Visão Geral e Requisitos
Atender integralmente aos requisitos de preenchimento inteligente e integridade de dados:
1. **Autocomplete de Endereço via CEP e Catálogo de Estados**:
   - Consulta resiliente em tempo real via API ViaCEP (`https://viacep.com.br/ws/${cep}/json/`);
   - Preenchimento instantâneo e automático dos campos: `logradouro`, `bairro`, `cidade`/`municipio` e `uf`;
   - Tratamento de estados de busca (`loading`, `cep inválido`, `cep não encontrado`) e auto-foco no campo `número`;
   - Catálogo canônico com as 27 Unidades Federativas do Brasil (`sigla` e `nome completo`), padronizando seletores de UF em todos os formulários.
2. **Máscaras de Entrada Universais (Pure JS / TS de Alto Desempenho)**:
   - **CPF**: `000.000.000-00` (11 dígitos);
   - **CNPJ**: `00.000.000/0000-00` (14 dígitos);
   - **Telefone**: adaptativo dinâmico `(00) 0000-0000` (fixo - 10 dígitos) ou `(00) 00000-0000` (celular/whatsapp - 11 dígitos);
   - **CEP**: `00000-000` (8 dígitos);
   - Sanitização transparente (`unmask`) antes do envio para o banco Supabase ou validações Zod.

---

## 2. Arquitetura e Componentes Reutilizáveis

### 2.1. Utilitários Canônicos
- `src/lib/constants/estados.ts`: Lista imutável das 27 UFs com siglas e nomes por extenso;
- `src/lib/utils/masks.ts`: Funções puras de formatação/mascaramento e sanitização (`maskCpf`, `maskCnpj`, `maskPhone`, `maskCep`, `unmaskDigits`);
- `src/lib/services/cep.ts`: Cliente HTTP para busca no ViaCEP com tratamento de erro e tipagem estrita;
- `src/hooks/use-cep.ts`: Hook React para conectar input de CEP e disparar preenchimento dos demais campos com feedback visual.

### 2.2. Componentes UI Específicos
- `src/components/ui/select-uf.tsx`: Componente seletor de Estado brasileiro (`<Select>` ou `<select>` estilizado com todas as 27 UFs);
- `src/components/ui/endereco-campos.tsx`: Bloco padronizado de endereço reutilizável para formulários que possuem logradouro, número, bairro, cidade, UF e CEP.

---

## 3. Escopo de Formulários a Atualizar
1. **Locais / Polos** (`src/components/admin/local-form.tsx`):
   - CEP com máscara e busca automática ViaCEP;
   - Seletor de UF brasileiro;
2. **Organizações Sociais (OSCs)** (`src/components/admin/organizacoes-client.tsx`):
   - Máscaras de CNPJ e Telefone;
   - Bloco de Endereço com CEP autocomplete e Seletor de UF;
3. **Configurações do Sistema** (`src/components/admin/configuracoes-form.tsx`):
   - Máscaras de CNPJ e Telefone Suporte;
   - Bloco de Endereço com CEP autocomplete e Seletor de UF;
4. **Concedentes** (`src/components/admin/concedentes-client.tsx`):
   - Máscara de CNPJ;
   - Seletor de UF e campo de Município;
5. **Funcionários / RH** (`src/components/admin/funcionarios-client.tsx`):
   - Máscaras de CPF e Telefone;
6. **Beneficiários** (`src/components/beneficiarios/beneficiarios-client.tsx`):
   - Máscaras universais de CPF, Telefone e Telefone Responsável;
7. **Formulário de Inscrição Pública** (`src/components/inscricao/formulario-inscricao-publica.tsx`):
   - Unificação de máscaras de CPF e telefones com o novo módulo canônico.
