export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      beneficiarios: {
        Row: {
          atualizado_em: string | null
          cpf: string
          criado_em: string | null
          data_nascimento: string
          genero: string
          id: string
          nome_completo: string
          nome_responsavel: string | null
          telefone: string | null
          telefone_responsavel: string | null
        }
        Insert: {
          atualizado_em?: string | null
          cpf: string
          criado_em?: string | null
          data_nascimento: string
          genero: string
          id?: string
          nome_completo: string
          nome_responsavel?: string | null
          telefone?: string | null
          telefone_responsavel?: string | null
        }
        Update: {
          atualizado_em?: string | null
          cpf?: string
          criado_em?: string | null
          data_nascimento?: string
          genero?: string
          id?: string
          nome_completo?: string
          nome_responsavel?: string | null
          telefone?: string | null
          telefone_responsavel?: string | null
        }
        Relationships: []
      }
      beneficiarios_presencas: {
        Row: {
          beneficiario_id: string
          comprovante_url: string | null
          criado_em: string | null
          id: string
          justificativa: string | null
          matricula_id: string
          sessao_id: string
          status: string
        }
        Insert: {
          beneficiario_id: string
          comprovante_url?: string | null
          criado_em?: string | null
          id?: string
          justificativa?: string | null
          matricula_id: string
          sessao_id: string
          status?: string
        }
        Update: {
          beneficiario_id?: string
          comprovante_url?: string | null
          criado_em?: string | null
          id?: string
          justificativa?: string | null
          matricula_id?: string
          sessao_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiarios_presencas_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiarios_presencas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiarios_presencas_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      bloco_grupos: {
        Row: {
          bloco_id: string
          grupo_id: string
        }
        Insert: {
          bloco_id: string
          grupo_id: string
        }
        Update: {
          bloco_id?: string
          grupo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloco_grupos_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloco_grupos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      blocos: {
        Row: {
          ativo: boolean
          atualizado_em: string | null
          criado_em: string | null
          data_especifica: string | null
          dia_semana: number | null
          hora_fim: string
          hora_inicio: string
          id: string
          instrutor_id: string | null
          local_id: string
          nome: string | null
          objeto_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string | null
          criado_em?: string | null
          data_especifica?: string | null
          dia_semana?: number | null
          hora_fim: string
          hora_inicio: string
          id?: string
          instrutor_id?: string | null
          local_id: string
          nome?: string | null
          objeto_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string | null
          criado_em?: string | null
          data_especifica?: string | null
          dia_semana?: number | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          instrutor_id?: string | null
          local_id?: string
          nome?: string | null
          objeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocos_instrutor_id_fkey"
            columns: ["instrutor_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocos_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_campo: {
        Row: {
          id: string
          nome: string
          ordem: number
          pesquisa_id: string
        }
        Insert: {
          id?: string
          nome: string
          ordem?: number
          pesquisa_id: string
        }
        Update: {
          id?: string
          nome?: string
          ordem?: number
          pesquisa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_campo_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "pesquisas"
            referencedColumns: ["id"]
          },
        ]
      }
      concedentes: {
        Row: {
          ativo: boolean
          atualizado_em: string | null
          cnpj: string | null
          criado_em: string | null
          esfera: string
          id: string
          municipio: string | null
          nome: string
          sigla: string | null
          uf: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string | null
          cnpj?: string | null
          criado_em?: string | null
          esfera: string
          id?: string
          municipio?: string | null
          nome: string
          sigla?: string | null
          uf?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string | null
          cnpj?: string | null
          criado_em?: string | null
          esfera?: string
          id?: string
          municipio?: string | null
          nome?: string
          sigla?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          atualizado_em: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string
          criado_em: string | null
          email_suporte: string | null
          id: string
          logotipo_url: string | null
          logradouro: string | null
          numero: string | null
          razao_social: string
          telefone_suporte: string | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj: string
          criado_em?: string | null
          email_suporte?: string | null
          id?: string
          logotipo_url?: string | null
          logradouro?: string | null
          numero?: string | null
          razao_social: string
          telefone_suporte?: string | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          criado_em?: string | null
          email_suporte?: string | null
          id?: string
          logotipo_url?: string | null
          logradouro?: string | null
          numero?: string | null
          razao_social?: string
          telefone_suporte?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          atualizado_em: string | null
          carga_horaria_semanal: number | null
          cargo: string
          cpf: string
          criado_em: string | null
          data_admissao: string | null
          data_desligamento: string | null
          email: string | null
          id: string
          local_id: string | null
          nome_completo: string
          objeto_id: string
          organizacao_id: string
          situacao: string
          telefone: string | null
          usuario_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          carga_horaria_semanal?: number | null
          cargo: string
          cpf: string
          criado_em?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          email?: string | null
          id?: string
          local_id?: string | null
          nome_completo: string
          objeto_id: string
          organizacao_id: string
          situacao?: string
          telefone?: string | null
          usuario_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          carga_horaria_semanal?: number | null
          cargo?: string
          cpf?: string
          criado_em?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          email?: string | null
          id?: string
          local_id?: string | null
          nome_completo?: string
          objeto_id?: string
          organizacao_id?: string
          situacao?: string
          telefone?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          ativo: boolean
          atualizado_em: string | null
          capacidade_maxima: number
          criado_em: string | null
          id: string
          idade_maxima: number | null
          idade_minima: number | null
          local_id: string
          modalidade_id: string | null
          nome: string
          objeto_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string | null
          capacidade_maxima?: number
          criado_em?: string | null
          id?: string
          idade_maxima?: number | null
          idade_minima?: number | null
          local_id: string
          modalidade_id?: string | null
          nome: string
          objeto_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string | null
          capacidade_maxima?: number
          criado_em?: string | null
          id?: string
          idade_maxima?: number | null
          idade_minima?: number | null
          local_id?: string
          modalidade_id?: string | null
          nome?: string
          objeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      locais: {
        Row: {
          ativo: boolean
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string
          nome: string
          objeto_id: string
          regiao_id: string
          slug: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          nome: string
          objeto_id: string
          regiao_id: string
          slug?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          nome?: string
          objeto_id?: string
          regiao_id?: string
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_locais_regiao"
            columns: ["regiao_id"]
            isOneToOne: false
            referencedRelation: "regioes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locais_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_entregas_aluno: {
        Row: {
          criado_em: string | null
          data_entrega: string
          foto_comprovante_url: string | null
          id: string
          instrutor_id: string
          matricula_id: string
          objeto_material_id: string
          status: string
          tamanho_entregue: string | null
        }
        Insert: {
          criado_em?: string | null
          data_entrega?: string
          foto_comprovante_url?: string | null
          id?: string
          instrutor_id: string
          matricula_id: string
          objeto_material_id: string
          status?: string
          tamanho_entregue?: string | null
        }
        Update: {
          criado_em?: string | null
          data_entrega?: string
          foto_comprovante_url?: string | null
          id?: string
          instrutor_id?: string
          matricula_id?: string
          objeto_material_id?: string
          status?: string
          tamanho_entregue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiais_entregas_aluno_instrutor_id_fkey"
            columns: ["instrutor_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_entregas_aluno_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_entregas_aluno_objeto_material_id_fkey"
            columns: ["objeto_material_id"]
            isOneToOne: false
            referencedRelation: "objeto_materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_remessas_polo: {
        Row: {
          codigo_patrimonio: string | null
          criado_em: string | null
          data_remessa: string
          documento_comprovante_url: string | null
          fotos_urls: Json | null
          id: string
          local_id: string
          objeto_material_id: string
          observacoes: string | null
          quantidade_enviada: number
          responsavel_recebimento_id: string | null
        }
        Insert: {
          codigo_patrimonio?: string | null
          criado_em?: string | null
          data_remessa?: string
          documento_comprovante_url?: string | null
          fotos_urls?: Json | null
          id?: string
          local_id: string
          objeto_material_id: string
          observacoes?: string | null
          quantidade_enviada: number
          responsavel_recebimento_id?: string | null
        }
        Update: {
          codigo_patrimonio?: string | null
          criado_em?: string | null
          data_remessa?: string
          documento_comprovante_url?: string | null
          fotos_urls?: Json | null
          id?: string
          local_id?: string
          objeto_material_id?: string
          observacoes?: string | null
          quantidade_enviada?: number
          responsavel_recebimento_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiais_remessas_polo_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_remessas_polo_objeto_material_id_fkey"
            columns: ["objeto_material_id"]
            isOneToOne: false
            referencedRelation: "objeto_materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_remessas_polo_responsavel_recebimento_id_fkey"
            columns: ["responsavel_recebimento_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          atualizado_em: string | null
          beneficiario_id: string
          criado_em: string | null
          dados_adicionais: Json | null
          data_cancelamento: string | null
          data_matricula: string
          grupo_id: string
          id: string
          motivo_cancelamento: string | null
          objeto_id: string
          status: string
          vulneravel: boolean
        }
        Insert: {
          atualizado_em?: string | null
          beneficiario_id: string
          criado_em?: string | null
          dados_adicionais?: Json | null
          data_cancelamento?: string | null
          data_matricula?: string
          grupo_id: string
          id?: string
          motivo_cancelamento?: string | null
          objeto_id: string
          status?: string
          vulneravel?: boolean
        }
        Update: {
          atualizado_em?: string | null
          beneficiario_id?: string
          criado_em?: string | null
          dados_adicionais?: Json | null
          data_cancelamento?: string | null
          data_matricula?: string
          grupo_id?: string
          id?: string
          motivo_cancelamento?: string | null
          objeto_id?: string
          status?: string
          vulneravel?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidade_checklist_itens: {
        Row: {
          criado_em: string | null
          descricao: string
          id: string
          modalidade_id: string
          ordem: number
        }
        Insert: {
          criado_em?: string | null
          descricao: string
          id?: string
          modalidade_id: string
          ordem?: number
        }
        Update: {
          criado_em?: string | null
          descricao?: string
          id?: string
          modalidade_id?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "modalidade_checklist_itens_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades: {
        Row: {
          ativo: boolean
          criado_em: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      objeto_materiais: {
        Row: {
          criado_em: string | null
          destinacao: string
          especificacoes: string | null
          id: string
          nome_item: string
          objeto_id: string
          quantidade_adquirida: number
          quantidade_prevista: number
          tipo: string
        }
        Insert: {
          criado_em?: string | null
          destinacao?: string
          especificacoes?: string | null
          id?: string
          nome_item: string
          objeto_id: string
          quantidade_adquirida?: number
          quantidade_prevista?: number
          tipo: string
        }
        Update: {
          criado_em?: string | null
          destinacao?: string
          especificacoes?: string | null
          id?: string
          nome_item?: string
          objeto_id?: string
          quantidade_adquirida?: number
          quantidade_prevista?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "objeto_materiais_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      objeto_metas: {
        Row: {
          anexos_urls: Json | null
          atualizado_em: string | null
          criado_em: string | null
          descricao: string
          fonte_verificacao: string
          id: string
          justificativa_declarada: string | null
          numero_meta: number
          objeto_id: string
          quantidade_declarada: number | null
          quantidade_prevista: number
          tipo_apuracao: string
          unidade_medida: string
        }
        Insert: {
          anexos_urls?: Json | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao: string
          fonte_verificacao: string
          id?: string
          justificativa_declarada?: string | null
          numero_meta: number
          objeto_id: string
          quantidade_declarada?: number | null
          quantidade_prevista: number
          tipo_apuracao?: string
          unidade_medida: string
        }
        Update: {
          anexos_urls?: Json | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string
          fonte_verificacao?: string
          id?: string
          justificativa_declarada?: string | null
          numero_meta?: number
          objeto_id?: string
          quantidade_declarada?: number | null
          quantidade_prevista?: number
          tipo_apuracao?: string
          unidade_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "objeto_metas_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      objeto_perguntas_inscricao: {
        Row: {
          criado_em: string | null
          exibir_autoinscricao: boolean
          id: string
          objeto_id: string
          obrigatorio: boolean
          opcoes: Json | null
          ordem: number
          tipo: string
          titulo: string
        }
        Insert: {
          criado_em?: string | null
          exibir_autoinscricao?: boolean
          id?: string
          objeto_id: string
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          tipo: string
          titulo: string
        }
        Update: {
          criado_em?: string | null
          exibir_autoinscricao?: boolean
          id?: string
          objeto_id?: string
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "objeto_perguntas_inscricao_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      objetos: {
        Row: {
          ativo: boolean
          atualizado_em: string | null
          concedente_id: string
          criado_em: string | null
          dados_bancarios: Json | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          edital_chamamento: string | null
          habilitar_vulnerabilidade: boolean
          id: string
          meta_frequencia_percentual: number | null
          modalidade_principal_id: string | null
          municipio: string | null
          nome: string
          organizacao_id: string
          processo_administrativo: string | null
          representante_legal_cargo: string | null
          representante_legal_nome: string | null
          termo_beneficiario: string
          termo_bloco: string
          termo_grupo: string
          termo_instrutor: string
          termo_local: string
          termo_materiais_coletivos: string
          termo_materiais_concedidos: string
          termo_parceria_numero: string | null
          termo_sessao: string
          tipo: string
          uf: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string | null
          concedente_id: string
          criado_em?: string | null
          dados_bancarios?: Json | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          edital_chamamento?: string | null
          habilitar_vulnerabilidade?: boolean
          id?: string
          meta_frequencia_percentual?: number | null
          modalidade_principal_id?: string | null
          municipio?: string | null
          nome: string
          organizacao_id: string
          processo_administrativo?: string | null
          representante_legal_cargo?: string | null
          representante_legal_nome?: string | null
          termo_beneficiario?: string
          termo_bloco?: string
          termo_grupo?: string
          termo_instrutor?: string
          termo_local?: string
          termo_materiais_coletivos?: string
          termo_materiais_concedidos?: string
          termo_parceria_numero?: string | null
          termo_sessao?: string
          tipo: string
          uf?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string | null
          concedente_id?: string
          criado_em?: string | null
          dados_bancarios?: Json | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          edital_chamamento?: string | null
          habilitar_vulnerabilidade?: boolean
          id?: string
          meta_frequencia_percentual?: number | null
          modalidade_principal_id?: string | null
          municipio?: string | null
          nome?: string
          organizacao_id?: string
          processo_administrativo?: string | null
          representante_legal_cargo?: string | null
          representante_legal_nome?: string | null
          termo_beneficiario?: string
          termo_bloco?: string
          termo_grupo?: string
          termo_instrutor?: string
          termo_local?: string
          termo_materiais_coletivos?: string
          termo_materiais_concedidos?: string
          termo_parceria_numero?: string | null
          termo_sessao?: string
          tipo?: string
          uf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_objetos_modalidade"
            columns: ["modalidade_principal_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objetos_concedente_id_fkey"
            columns: ["concedente_id"]
            isOneToOne: false
            referencedRelation: "concedentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objetos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes: {
        Row: {
          ativo: boolean
          atualizado_em: string | null
          cnpj: string
          criado_em: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string
          logotipo_url: string | null
          nome_fantasia: string | null
          razao_social: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string | null
          cnpj: string
          criado_em?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          logotipo_url?: string | null
          nome_fantasia?: string | null
          razao_social: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string | null
          cnpj?: string
          criado_em?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          logotipo_url?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          telefone?: string | null
        }
        Relationships: []
      }
      perguntas_pesquisa: {
        Row: {
          categoria_id: string | null
          condicao_pergunta_id: string | null
          condicao_valor: Json | null
          criado_em: string | null
          id: string
          max_selecoes: number | null
          min_selecoes: number | null
          obrigatoria: boolean
          opcoes: Json | null
          ordem: number
          pesquisa_id: string
          texto: string
          tipo: string
        }
        Insert: {
          categoria_id?: string | null
          condicao_pergunta_id?: string | null
          condicao_valor?: Json | null
          criado_em?: string | null
          id?: string
          max_selecoes?: number | null
          min_selecoes?: number | null
          obrigatoria?: boolean
          opcoes?: Json | null
          ordem?: number
          pesquisa_id: string
          texto: string
          tipo: string
        }
        Update: {
          categoria_id?: string | null
          condicao_pergunta_id?: string | null
          condicao_valor?: Json | null
          criado_em?: string | null
          id?: string
          max_selecoes?: number | null
          min_selecoes?: number | null
          obrigatoria?: boolean
          opcoes?: Json | null
          ordem?: number
          pesquisa_id?: string
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "perguntas_pesquisa_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_campo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perguntas_pesquisa_condicao_pergunta_id_fkey"
            columns: ["condicao_pergunta_id"]
            isOneToOne: false
            referencedRelation: "perguntas_pesquisa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perguntas_pesquisa_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "pesquisas"
            referencedColumns: ["id"]
          },
        ]
      }
      pesquisas: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          exigir_cpf: boolean
          grupo_id: string | null
          id: string
          local_id: string | null
          objeto_id: string
          publicada: boolean
          titulo: string
          token: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          exigir_cpf?: boolean
          grupo_id?: string | null
          id?: string
          local_id?: string | null
          objeto_id: string
          publicada?: boolean
          titulo: string
          token?: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          exigir_cpf?: boolean
          grupo_id?: string | null
          id?: string
          local_id?: string | null
          objeto_id?: string
          publicada?: boolean
          titulo?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "pesquisas_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesquisas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesquisas_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      regioes: {
        Row: {
          coordenador_id: string | null
          criado_em: string | null
          id: string
          nome: string
          objeto_id: string
        }
        Insert: {
          coordenador_id?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
          objeto_id: string
        }
        Update: {
          coordenador_id?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
          objeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regioes_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_ponto: {
        Row: {
          atestado_documento_url: string | null
          atualizado_em: string | null
          criado_em: string | null
          data: string
          editado_manualmente: boolean
          editado_por_usuario_id: string | null
          funcionario_id: string
          hora_entrada: string
          hora_entrada_original: string | null
          hora_saida: string | null
          hora_saida_original: string | null
          id: string
          local_id: string
          motivo_ajuste: string | null
          objeto_id: string
          sessao_id: string | null
          tipo_registro: string
          total_minutos: number | null
        }
        Insert: {
          atestado_documento_url?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          data?: string
          editado_manualmente?: boolean
          editado_por_usuario_id?: string | null
          funcionario_id: string
          hora_entrada: string
          hora_entrada_original?: string | null
          hora_saida?: string | null
          hora_saida_original?: string | null
          id?: string
          local_id: string
          motivo_ajuste?: string | null
          objeto_id: string
          sessao_id?: string | null
          tipo_registro?: string
          total_minutos?: number | null
        }
        Update: {
          atestado_documento_url?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          data?: string
          editado_manualmente?: boolean
          editado_por_usuario_id?: string | null
          funcionario_id?: string
          hora_entrada?: string
          hora_entrada_original?: string | null
          hora_saida?: string | null
          hora_saida_original?: string | null
          id?: string
          local_id?: string
          motivo_ajuste?: string | null
          objeto_id?: string
          sessao_id?: string | null
          tipo_registro?: string
          total_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ponto_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ponto_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ponto_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_prestacao_contas: {
        Row: {
          analise_cumprimento_metas: string | null
          anexos_dados: Json
          assinado_representante_em: string | null
          conclusao: string | null
          coordenador_geral_id: string | null
          criado_em: string | null
          data_fim: string
          data_inicio: string
          elaborador_id: string
          fechado_em: string | null
          id: string
          motivo_retificacao: string | null
          objeto_id: string
          representante_legal_cargo: string | null
          representante_legal_id: string | null
          representante_legal_nome: string | null
          resultados_alcancados: string | null
          resumo_execucao: string | null
          rotulo_periodo: string
          status: string
          versao: number
        }
        Insert: {
          analise_cumprimento_metas?: string | null
          anexos_dados?: Json
          assinado_representante_em?: string | null
          conclusao?: string | null
          coordenador_geral_id?: string | null
          criado_em?: string | null
          data_fim: string
          data_inicio: string
          elaborador_id: string
          fechado_em?: string | null
          id?: string
          motivo_retificacao?: string | null
          objeto_id: string
          representante_legal_cargo?: string | null
          representante_legal_id?: string | null
          representante_legal_nome?: string | null
          resultados_alcancados?: string | null
          resumo_execucao?: string | null
          rotulo_periodo: string
          status?: string
          versao?: number
        }
        Update: {
          analise_cumprimento_metas?: string | null
          anexos_dados?: Json
          assinado_representante_em?: string | null
          conclusao?: string | null
          coordenador_geral_id?: string | null
          criado_em?: string | null
          data_fim?: string
          data_inicio?: string
          elaborador_id?: string
          fechado_em?: string | null
          id?: string
          motivo_retificacao?: string | null
          objeto_id?: string
          representante_legal_cargo?: string | null
          representante_legal_id?: string | null
          representante_legal_nome?: string | null
          resultados_alcancados?: string | null
          resumo_execucao?: string | null
          rotulo_periodo?: string
          status?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_prestacao_contas_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_supervisao_consolidado: {
        Row: {
          coordenador_id: string
          criado_em: string | null
          data_entrega: string | null
          data_fim: string
          data_inicio: string
          fechado_em: string | null
          id: string
          objeto_id: string
          regiao_id: string
          responsavel_recebimento: string | null
          rotulo_ciclo: string
          sintese_dificuldades: string | null
          sintese_pendencias: string | null
          sintese_pontos_positivos: string | null
          sintese_providencias: string | null
          snapshot_dados: Json
          status: string
          tipo_periodo: string
          total_locais_acompanhados: number
          total_supervisoes_realizadas: number
        }
        Insert: {
          coordenador_id: string
          criado_em?: string | null
          data_entrega?: string | null
          data_fim: string
          data_inicio: string
          fechado_em?: string | null
          id?: string
          objeto_id: string
          regiao_id: string
          responsavel_recebimento?: string | null
          rotulo_ciclo: string
          sintese_dificuldades?: string | null
          sintese_pendencias?: string | null
          sintese_pontos_positivos?: string | null
          sintese_providencias?: string | null
          snapshot_dados?: Json
          status?: string
          tipo_periodo?: string
          total_locais_acompanhados?: number
          total_supervisoes_realizadas?: number
        }
        Update: {
          coordenador_id?: string
          criado_em?: string | null
          data_entrega?: string | null
          data_fim?: string
          data_inicio?: string
          fechado_em?: string | null
          id?: string
          objeto_id?: string
          regiao_id?: string
          responsavel_recebimento?: string | null
          rotulo_ciclo?: string
          sintese_dificuldades?: string | null
          sintese_pendencias?: string | null
          sintese_pontos_positivos?: string | null
          sintese_providencias?: string | null
          snapshot_dados?: Json
          status?: string
          tipo_periodo?: string
          total_locais_acompanhados?: number
          total_supervisoes_realizadas?: number
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_supervisao_consolidado_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorios_supervisao_consolidado_regiao_id_fkey"
            columns: ["regiao_id"]
            isOneToOne: false
            referencedRelation: "regioes"
            referencedColumns: ["id"]
          },
        ]
      }
      resposta_itens: {
        Row: {
          criado_em: string | null
          id: string
          pergunta_id: string
          resposta_id: string
          valor: Json
        }
        Insert: {
          criado_em?: string | null
          id?: string
          pergunta_id: string
          resposta_id: string
          valor: Json
        }
        Update: {
          criado_em?: string | null
          id?: string
          pergunta_id?: string
          resposta_id?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "resposta_itens_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "perguntas_pesquisa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resposta_itens_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "respostas"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas: {
        Row: {
          beneficiario_id: string | null
          criado_em: string | null
          device_fingerprint: string | null
          id: string
          matricula_id: string | null
          pesquisa_id: string
        }
        Insert: {
          beneficiario_id?: string | null
          criado_em?: string | null
          device_fingerprint?: string | null
          id?: string
          matricula_id?: string | null
          pesquisa_id: string
        }
        Update: {
          beneficiario_id?: string | null
          criado_em?: string | null
          device_fingerprint?: string | null
          id?: string
          matricula_id?: string | null
          pesquisa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "pesquisas"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes: {
        Row: {
          atualizado_em: string | null
          bloco_id: string | null
          criado_em: string | null
          data: string
          fotos_urls: Json
          funcionario_id: string
          grupos_ids: Json
          hora_fim: string | null
          hora_inicio: string
          id: string
          local_id: string
          modalidade_id: string | null
          objeto_id: string
          observacoes: string | null
          organizacao_id: string
          status: string
        }
        Insert: {
          atualizado_em?: string | null
          bloco_id?: string | null
          criado_em?: string | null
          data?: string
          fotos_urls?: Json
          funcionario_id: string
          grupos_ids?: Json
          hora_fim?: string | null
          hora_inicio: string
          id?: string
          local_id: string
          modalidade_id?: string | null
          objeto_id: string
          observacoes?: string | null
          organizacao_id: string
          status?: string
        }
        Update: {
          atualizado_em?: string | null
          bloco_id?: string | null
          criado_em?: string | null
          data?: string
          fotos_urls?: Json
          funcionario_id?: string
          grupos_ids?: Json
          hora_fim?: string | null
          hora_inicio?: string
          id?: string
          local_id?: string
          modalidade_id?: string | null
          objeto_id?: string
          observacoes?: string | null
          organizacao_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_acessos: {
        Row: {
          criado_em: string | null
          id: string
          objeto_id: string
          perfil: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          objeto_id: string
          perfil: string
          usuario_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          objeto_id?: string
          perfil?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_acessos_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          atualizado_em: string | null
          avatar_url: string | null
          criado_em: string | null
          id: string
          nome_completo: string | null
          papel: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string | null
          avatar_url?: string | null
          criado_em?: string | null
          id: string
          nome_completo?: string | null
          papel: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string | null
          avatar_url?: string | null
          criado_em?: string | null
          id?: string
          nome_completo?: string | null
          papel?: string
        }
        Relationships: []
      }
      visitas_supervisao: {
        Row: {
          atividade_acompanhada: string | null
          atualizado_em: string | null
          bloco_id: string | null
          chamada_conferida: boolean
          checklist_modalidade_respostas: Json | null
          criado_em: string | null
          data: string
          espaco_fisico_status: string | null
          fotos: Json | null
          grade_conforme: boolean
          hora_fim: string | null
          hora_inicio: string
          id: string
          instrutor_funcionario_id: string
          local_id: string
          materiais_coletivos_status: string | null
          materiais_concedidos_status: string | null
          nota_estrutura: number | null
          nota_materiais_coletivos: number | null
          nota_materiais_concedidos: number | null
          objeto_id: string
          obs_estrutura: string | null
          obs_materiais_coletivos: string | null
          obs_materiais_concedidos: string | null
          observacoes: string | null
          ocorrencias: string | null
          orientacoes_professor: string | null
          prazo_regularizacao: string | null
          professor_presente: boolean
          providencias: string | null
          qtd_beneficiarios_presentes: number
          situacao: string
          snapshot_dados: Json | null
          status: string
          supervisor_id: string
          turmas_auditadas: Json | null
        }
        Insert: {
          atividade_acompanhada?: string | null
          atualizado_em?: string | null
          bloco_id?: string | null
          chamada_conferida?: boolean
          checklist_modalidade_respostas?: Json | null
          criado_em?: string | null
          data?: string
          espaco_fisico_status?: string | null
          fotos?: Json | null
          grade_conforme?: boolean
          hora_fim?: string | null
          hora_inicio: string
          id?: string
          instrutor_funcionario_id: string
          local_id: string
          materiais_coletivos_status?: string | null
          materiais_concedidos_status?: string | null
          nota_estrutura?: number | null
          nota_materiais_coletivos?: number | null
          nota_materiais_concedidos?: number | null
          objeto_id: string
          obs_estrutura?: string | null
          obs_materiais_coletivos?: string | null
          obs_materiais_concedidos?: string | null
          observacoes?: string | null
          ocorrencias?: string | null
          orientacoes_professor?: string | null
          prazo_regularizacao?: string | null
          professor_presente?: boolean
          providencias?: string | null
          qtd_beneficiarios_presentes?: number
          situacao?: string
          snapshot_dados?: Json | null
          status?: string
          supervisor_id: string
          turmas_auditadas?: Json | null
        }
        Update: {
          atividade_acompanhada?: string | null
          atualizado_em?: string | null
          bloco_id?: string | null
          chamada_conferida?: boolean
          checklist_modalidade_respostas?: Json | null
          criado_em?: string | null
          data?: string
          espaco_fisico_status?: string | null
          fotos?: Json | null
          grade_conforme?: boolean
          hora_fim?: string | null
          hora_inicio?: string
          id?: string
          instrutor_funcionario_id?: string
          local_id?: string
          materiais_coletivos_status?: string | null
          materiais_concedidos_status?: string | null
          nota_estrutura?: number | null
          nota_materiais_coletivos?: number | null
          nota_materiais_concedidos?: number | null
          objeto_id?: string
          obs_estrutura?: string | null
          obs_materiais_coletivos?: string | null
          obs_materiais_concedidos?: string | null
          observacoes?: string | null
          ocorrencias?: string | null
          orientacoes_professor?: string | null
          prazo_regularizacao?: string | null
          professor_presente?: boolean
          providencias?: string | null
          qtd_beneficiarios_presentes?: number
          situacao?: string
          snapshot_dados?: Json | null
          status?: string
          supervisor_id?: string
          turmas_auditadas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "visitas_supervisao_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_supervisao_instrutor_funcionario_id_fkey"
            columns: ["instrutor_funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_supervisao_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_supervisao_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campanhas: {
        Row: {
          concluida_em: string | null
          criado_em: string | null
          destinatario: string
          filtro_abaixo_meta: boolean
          filtro_genero: string | null
          filtro_grupo_id: string | null
          filtro_local_id: string | null
          filtro_nao_respondeu: boolean
          id: string
          iniciada_em: string | null
          mensagem_avulsa: string | null
          objeto_id: string
          pesquisa_id: string | null
          status: string
          template_id: string | null
          total_destinatarios: number | null
        }
        Insert: {
          concluida_em?: string | null
          criado_em?: string | null
          destinatario?: string
          filtro_abaixo_meta?: boolean
          filtro_genero?: string | null
          filtro_grupo_id?: string | null
          filtro_local_id?: string | null
          filtro_nao_respondeu?: boolean
          id?: string
          iniciada_em?: string | null
          mensagem_avulsa?: string | null
          objeto_id: string
          pesquisa_id?: string | null
          status?: string
          template_id?: string | null
          total_destinatarios?: number | null
        }
        Update: {
          concluida_em?: string | null
          criado_em?: string | null
          destinatario?: string
          filtro_abaixo_meta?: boolean
          filtro_genero?: string | null
          filtro_grupo_id?: string | null
          filtro_local_id?: string | null
          filtro_nao_respondeu?: boolean
          id?: string
          iniciada_em?: string | null
          mensagem_avulsa?: string | null
          objeto_id?: string
          pesquisa_id?: string | null
          status?: string
          template_id?: string | null
          total_destinatarios?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campanhas_filtro_grupo_id_fkey"
            columns: ["filtro_grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campanhas_filtro_local_id_fkey"
            columns: ["filtro_local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campanhas_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campanhas_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "pesquisas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campanhas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_disparo_logs: {
        Row: {
          beneficiario_id: string | null
          campanha_id: string
          criado_em: string | null
          enviado_em: string | null
          erro_descricao: string | null
          id: string
          numero_destino: string
          status: string
        }
        Insert: {
          beneficiario_id?: string | null
          campanha_id: string
          criado_em?: string | null
          enviado_em?: string | null
          erro_descricao?: string | null
          id?: string
          numero_destino: string
          status?: string
        }
        Update: {
          beneficiario_id?: string | null
          campanha_id?: string
          criado_em?: string | null
          enviado_em?: string | null
          erro_descricao?: string | null
          id?: string
          numero_destino?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_disparo_logs_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_disparo_logs_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instancias: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          endpoint_url: string
          id: string
          instance_id: string
          numero_pareado: string | null
          objeto_id: string
          provedor: string
          status: string
          token_api: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          endpoint_url: string
          id?: string
          instance_id: string
          numero_pareado?: string | null
          objeto_id: string
          provedor: string
          status?: string
          token_api: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          endpoint_url?: string
          id?: string
          instance_id?: string
          numero_pareado?: string | null
          objeto_id?: string
          provedor?: string
          status?: string
          token_api?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instancias_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_numeros: {
        Row: {
          ativo: boolean
          criado_em: string | null
          delay_max_segundos: number
          delay_min_segundos: number
          id: string
          instancia_id: string
          numero: string
          teto_diario: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string | null
          delay_max_segundos?: number
          delay_min_segundos?: number
          id?: string
          instancia_id: string
          numero: string
          teto_diario?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string | null
          delay_max_segundos?: number
          delay_min_segundos?: number
          id?: string
          instancia_id?: string
          numero?: string
          teto_diario?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_numeros_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instancias"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          atualizado_em: string | null
          corpo: string
          criado_em: string | null
          id: string
          nome: string
          objeto_id: string
        }
        Insert: {
          atualizado_em?: string | null
          corpo: string
          criado_em?: string | null
          id?: string
          nome: string
          objeto_id: string
        }
        Update: {
          atualizado_em?: string | null
          corpo?: string
          criado_em?: string | null
          id?: string
          nome?: string
          objeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      usuarios_com_email: {
        Row: {
          id: string
          nome_completo: string | null
          papel: string
          ativo: boolean
          criado_em: string | null
          atualizado_em: string | null
          email: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_papel: { Args: never; Returns: string }
      usuario_tem_acesso_objeto: {
        Args: { p_objeto_id: string }
        Returns: boolean
      }
      admin_redefinir_senha: {
        Args: { p_user_id: string; p_nova_senha: string }
        Returns: boolean
      }
      obter_contagem_vagas_grupos: {
        Args: { p_grupo_ids: string[] }
        Returns: {
          grupo_id: string
          total_ativas: number
          total_fila: number
        }[]
      }
      buscar_beneficiario_por_cpf: {
        Args: { p_cpf: string }
        Returns: Json
      }
      submeter_autoinscricao: {
        Args: { p_dados: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
