### 3.12. Modelo Relacional no Banco de Dados (Supabase PostgreSQL)

```sql
-- 1. RegiÃµes do Objeto (PadrÃ£o: 'RegiÃ£o Ãšnica')
CREATE TABLE regioes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES objetos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL DEFAULT 'RegiÃ£o Ãšnica',
    coordenador_id UUID NULL REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regioes_objeto ON regioes (objeto_id);


-- 2. AtualizaÃ§Ã£o na Tabela 'objetos' (Metadados JurÃ­dicos, Financeiros e RepresentaÃ§Ã£o Legal)
-- Colunas a incluir em 'objetos':
-- processo_administrativo VARCHAR(100),
-- edital_chamamento VARCHAR(100),
-- dados_bancarios JSONB DEFAULT '{"banco":"","agencia":"","conta_corrente":""}'::jsonb,
-- representante_legal_nome VARCHAR(150),
-- representante_legal_cargo VARCHAR(100),
-- termo_materiais_coletivos VARCHAR(50) DEFAULT 'Materiais Coletivos',
-- termo_materiais_concedidos VARCHAR(50) DEFAULT 'Uniformes'


-- 3. CatÃ¡logo AgnÃ³stico de Metas do Objeto (Plano de Trabalho MROSC)
CREATE TABLE objeto_metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES objetos(id) ON DELETE CASCADE,
    numero_meta INTEGER NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    unidade_medida VARCHAR(50) NOT NULL,
    quantidade_prevista NUMERIC(10,2) NOT NULL,
    fonte_verificacao TEXT NOT NULL,
    tipo_apuracao VARCHAR(30) NOT NULL DEFAULT 'manual' 
        CHECK (tipo_apuracao IN ('manual', 'total_locais', 'total_beneficiarios', 'frequencia_media', 'sessoes_realizadas', 'supervisoes_realizadas', 'vulnerabilidade_social')),
    
    -- Valores apurados em metas declaratÃ³rias
    quantidade_declarada NUMERIC(10,2) NULL DEFAULT 0,
    justificativa_declarada TEXT NULL,
    anexos_urls JSONB DEFAULT '[]'::jsonb, -- AnexaÃ§Ã£o de atas 100% facultativa

    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metas_objeto ON objeto_metas (objeto_id);


-- 4. CatÃ¡logo de Materiais e Equipamentos do Objeto
CREATE TABLE objeto_materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES objetos(id) ON DELETE CASCADE,
    nome_item VARCHAR(150) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('coletivo', 'individual')),
    especificacoes TEXT,
    quantidade_prevista INTEGER NOT NULL DEFAULT 0,
    quantidade_adquirida INTEGER NOT NULL DEFAULT 0,
    destinacao VARCHAR(100) NOT NULL DEFAULT 'Polos de Atendimento',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materiais_objeto ON objeto_materiais (objeto_id);


-- 5. Remessas de Materiais Coletivos aos Polos (Equipamentos)
CREATE TABLE materiais_remessas_polo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_material_id UUID NOT NULL REFERENCES objeto_materiais(id) ON DELETE CASCADE,
    local_id UUID NOT NULL REFERENCES locais(id),
    quantidade_enviada INTEGER NOT NULL,
    codigo_patrimonio VARCHAR(100) NULL,
    data_remessa DATE NOT NULL DEFAULT CURRENT_DATE,
    responsavel_recebimento_id UUID NULL REFERENCES funcionarios(id),
    fotos_urls JSONB DEFAULT '[]'::jsonb,
    documento_comprovante_url TEXT NULL,
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remessas_local ON materiais_remessas_polo (local_id);


-- 6. Entregas de Materiais Individuais aos BeneficiÃ¡rios (Uniformes / Kits)
CREATE TABLE materiais_entregas_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_material_id UUID NOT NULL REFERENCES objeto_materiais(id) ON DELETE CASCADE,
    matricula_id UUID NOT NULL REFERENCES matriculas(id),
    instrutor_id UUID NOT NULL REFERENCES funcionarios(id), -- FÃ© pÃºblica do professor
    data_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
    tamanho_entregue VARCHAR(20) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'entregue' CHECK (status IN ('entregue', 'pendente')),
    foto_comprovante_url TEXT NULL, -- Upload de folha fÃ­sica opcional
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (objeto_material_id, matricula_id)
);

CREATE INDEX idx_entregas_matricula ON materiais_entregas_aluno (matricula_id);
CREATE INDEX idx_entregas_instrutor ON materiais_entregas_aluno (instrutor_id);


-- 7. Visitas UnitÃ¡rias de SupervisÃ£o em Campo (NÃ­vel 1)
CREATE TABLE visitas_supervisao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES objetos(id) ON DELETE CASCADE,
    local_id UUID NOT NULL REFERENCES locais(id),
    bloco_id UUID NULL REFERENCES blocos(id),
    supervisor_id UUID NOT NULL REFERENCES auth.users(id),
    instrutor_funcionario_id UUID NOT NULL REFERENCES funcionarios(id),
    
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida')),

    professor_presente BOOLEAN NOT NULL DEFAULT TRUE,
    turmas_auditadas JSONB DEFAULT '[]'::jsonb,
    qtd_beneficiarios_presentes INTEGER NOT NULL DEFAULT 0,
    grade_conforme BOOLEAN NOT NULL DEFAULT TRUE,
    chamada_conferida BOOLEAN NOT NULL DEFAULT TRUE,
    atividade_acompanhada TEXT,

    espaco_fisico_status VARCHAR(30) DEFAULT 'adequado',
    nota_estrutura INTEGER CHECK (nota_estrutura BETWEEN 1 AND 5),
    obs_estrutura TEXT,

    materiais_coletivos_status VARCHAR(30) DEFAULT 'adequados',
    nota_materiais_coletivos INTEGER CHECK (nota_materiais_coletivos BETWEEN 1 AND 5),
    obs_materiais_coletivos TEXT,

    materiais_concedidos_status VARCHAR(30) DEFAULT 'adequados',
    nota_materiais_concedidos INTEGER CHECK (nota_materiais_concedidos BETWEEN 1 AND 5),
    obs_materiais_concedidos TEXT,

    situacao VARCHAR(30) NOT NULL DEFAULT 'regular' CHECK (situacao IN ('regular', 'requer_atencao', 'critica')),
    observacoes TEXT,
    ocorrencias TEXT,
    orientacoes_professor TEXT,
    providencias TEXT,
    prazo_regularizacao DATE NULL,

    fotos JSONB DEFAULT '[]'::jsonb,
    checklist_modalidade_respostas JSONB DEFAULT '{}'::jsonb, -- Respostas dos itens extras da modalidade
    snapshot_dados JSONB NULL, -- Espelho imutÃ¡vel gerado na finalizaÃ§Ã£o da visita

    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visitas_objeto_data ON visitas_supervisao (objeto_id, data);
CREATE INDEX idx_visitas_local ON visitas_supervisao (local_id);
CREATE INDEX idx_visitas_supervisor ON visitas_supervisao (supervisor_id);


-- 8. Fechamentos PeriÃ³dicos da CoordenaÃ§Ã£o Regional (NÃ­vel 2)
CREATE TABLE relatorios_supervisao_consolidado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES objetos(id) ON DELETE CASCADE,
    regiao_id UUID NOT NULL REFERENCES regioes(id),
    coordenador_id UUID NOT NULL REFERENCES auth.users(id),
    
    tipo_periodo VARCHAR(20) NOT NULL DEFAULT 'mensal' CHECK (tipo_periodo IN ('mensal', 'bimestral', 'evento', 'etapa')),
    rotulo_ciclo VARCHAR(50) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,

    sintese_pontos_positivos TEXT,
    sintese_dificuldades TEXT,
    sintese_pendencias TEXT,
    sintese_providencias TEXT,

    total_locais_acompanhados INTEGER NOT NULL DEFAULT 0,
    total_supervisoes_realizadas INTEGER NOT NULL DEFAULT 0,

    data_entrega DATE NULL,
    responsavel_recebimento TEXT NULL,

    -- Snapshot imutÃ¡vel das visitas do perÃ­odo para auditoria histÃ³rica
    snapshot_dados JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'fechado_imutavel')),
    fechado_em TIMESTAMPTZ NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relatorios_objeto ON relatorios_supervisao_consolidado (objeto_id, data_inicio, data_fim);
CREATE INDEX idx_relatorios_regiao ON relatorios_supervisao_consolidado (regiao_id);


-- 9. RelatÃ³rio Master de PrestaÃ§Ã£o de Contas do Objeto (NÃ­vel 3)
CREATE TABLE relatorios_prestacao_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES objetos(id) ON DELETE CASCADE,
    elaborador_id UUID NOT NULL REFERENCES auth.users(id),
    coordenador_geral_id UUID NULL REFERENCES auth.users(id),
    
    -- TrÃ­plice Assinatura: Representante Legal da OSC
    representante_legal_id UUID NULL REFERENCES auth.users(id),
    representante_legal_nome VARCHAR(150) NULL,
    representante_legal_cargo VARCHAR(100) NULL,
    assinado_representante_em TIMESTAMPTZ NULL,
    
    rotulo_periodo VARCHAR(100) NOT NULL, -- Ex: "PrestaÃ§Ã£o de Contas Trimestral - 31/12/2025 a 30/03/2026"
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,

    -- Blocos Dissertativos Oficiais
    resumo_execucao TEXT,
    analise_cumprimento_metas TEXT,
    resultados_alcancados TEXT,
    conclusao TEXT,

    -- Snapshots consolidados dos 8 anexos em JSONB (imutabilidade de auditoria)
    anexos_dados JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Versionamento e retificaÃ§Ã£o auditada
    versao INTEGER NOT NULL DEFAULT 1,
    motivo_retificacao TEXT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'fechado_imutavel')),
    fechado_em TIMESTAMPTZ NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prestacao_contas_objeto ON relatorios_prestacao_contas (objeto_id, data_inicio, data_fim);


-- 10. Chamada Nominal e Registro de FrequÃªncia dos BeneficiÃ¡rios (Status Tripartite)
CREATE TABLE beneficiarios_presencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id UUID NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
    matricula_id UUID NOT NULL REFERENCES matriculas(id),
    beneficiario_id UUID NOT NULL REFERENCES beneficiarios(id), -- DesnormalizaÃ§Ã£o para queries analÃ­ticas e relatÃ³rios nominais de alta performance
    status VARCHAR(20) NOT NULL DEFAULT 'presente' CHECK (status IN ('presente', 'falta', 'justificada')),
    justificativa TEXT NULL,
    comprovante_url TEXT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (sessao_id, matricula_id)
);

CREATE INDEX idx_presencas_sessao ON beneficiarios_presencas (sessao_id);
CREATE INDEX idx_presencas_matricula ON beneficiarios_presencas (matricula_id);
CREATE INDEX idx_presencas_beneficiario ON beneficiarios_presencas (beneficiario_id);


-- 11. Ponto EletrÃ´nico de Recursos Humanos e Flexibilidade Administrativa
CREATE TABLE registros_ponto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES objetos(id) ON DELETE CASCADE,
    local_id UUID NOT NULL REFERENCES locais(id),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    sessao_id UUID NULL REFERENCES sessoes(id), -- Vinculado se gerado por aula prÃ¡tica do instrutor
    
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada TIME NOT NULL,
    hora_saida TIME NULL,
    total_minutos INTEGER GENERATED ALWAYS AS (
        CASE WHEN hora_saida IS NOT NULL THEN
            EXTRACT(EPOCH FROM (hora_saida - hora_entrada)) / 60
        ELSE 0 END
    ) STORED,

    tipo_registro VARCHAR(30) NOT NULL DEFAULT 'app_sessao' 
        CHECK (tipo_registro IN ('app_sessao', 'app_direto', 'manual_admin', 'falta_justificada', 'recesso')),
    
    -- Mecanismo de flexibilidade, abono e auditoria do Administrador
    editado_manualmente BOOLEAN NOT NULL DEFAULT FALSE,
    editado_por_usuario_id UUID NULL REFERENCES auth.users(id),
    motivo_ajuste TEXT NULL,
    hora_entrada_original TIME NULL,
    hora_saida_original TIME NULL,
    atestado_documento_url TEXT NULL, -- Opcional

    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ponto_funcionario_data ON registros_ponto (funcionario_id, data);
CREATE INDEX idx_ponto_objeto_data ON registros_ponto (objeto_id, data);
CREATE INDEX idx_ponto_local ON registros_ponto (local_id);
```

---

#### 3.12.1. Matriz de Acesso RBAC para SupervisÃ£o, RelatÃ³rios e Ponto

| Papel | NÃ­vel 1: Visita Isolada | NÃ­vel 2: Caderno Regional | NÃ­vel 3: PrestaÃ§Ã£o de Contas Master | RelatÃ³rios AnalÃ­ticos (Alunos / RH) | GestÃ£o e EdiÃ§Ã£o de Ponto | Exportar DOCX/PDF | Exportar Excel (.xlsx) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Supervisor** | Criar / Assinar (as suas) | Ver (da sua Ã¡rea) | NÃ£o | Ver (da sua Ã¡rea) | NÃ£o | Sim (suas visitas) | NÃ£o |
| **Coordenador** | Ver / Auditar (da regiÃ£o) | Criar / Fechar (da regiÃ£o)| Ver / Assinar (sua via) | Ver (da sua regiÃ£o) | Ver (da sua regiÃ£o) | Sim (visita e regional) | Sim |
| **Administrador de Projeto** | Ver todas do objeto | Ver todas as regiÃµes | Criar / Fechar / Assinar | Ver / Filtrar (do objeto) | GestÃ£o Total / EdiÃ§Ã£o (do objeto) | Sim (todos os nÃ­veis) | Sim (todos os anexos) |
| **Super Administrador** | Controle irrestrito | Controle irrestrito | Criar / Fechar / Assinar | Ver / Filtrar (Global) | GestÃ£o Total / EdiÃ§Ã£o (Global) | Sim (todos os nÃ­veis) | Sim (todos os anexos) |
| **Auditor do Concedente** | Apenas Leitura | Apenas Leitura | Apenas Leitura | Apenas Leitura | Apenas Leitura | Sim (todos os nÃ­veis) | Sim (todos os anexos) |
| **Instrutor (`{termo_instrutor}`)**| Apenas a sua ficha | NÃ£o | NÃ£o | Apenas suas turmas | Bater Ponto (suas sessÃµes) | Sim (sua ficha) | NÃ£o |