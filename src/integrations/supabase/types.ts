export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agendamentos_clientes: {
        Row: {
          cliente_id: string
          created_at: string
          data_proxima_reposicao: string | null
          id: string
          itens_personalizados: Json | null
          quantidade_total: number
          status_agendamento: string
          substatus_pedido: string | null
          tipo_pedido: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_proxima_reposicao?: string | null
          id?: string
          itens_personalizados?: Json | null
          quantidade_total?: number
          status_agendamento?: string
          substatus_pedido?: string | null
          tipo_pedido?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_proxima_reposicao?: string | null
          id?: string
          itens_personalizados?: Json | null
          quantidade_total?: number
          status_agendamento?: string
          substatus_pedido?: string | null
          tipo_pedido?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_consolidados"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "agendamentos_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_materialized"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          email: string | null
          id: string
          ip_address: unknown
          success: boolean
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address: unknown
          success?: boolean
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
        }
        Relationships: []
      }
      cache_analise_giro: {
        Row: {
          created_at: string | null
          dados: Json
          expires_at: string | null
          filtros: Json | null
          id: string
          tipo_analise: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dados: Json
          expires_at?: string | null
          filtros?: Json | null
          id?: string
          tipo_analise: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dados?: Json
          expires_at?: string | null
          filtros?: Json | null
          id?: string
          tipo_analise?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_estabelecimento: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: number
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      categorias_produto: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: number
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean | null
          categoria_estabelecimento_id: number | null
          categorias_habilitadas: Json | null
          cnpj_cpf: string | null
          contabilizar_giro_medio: boolean | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          emite_nota_fiscal: boolean | null
          endereco_entrega: string | null
          forma_pagamento: string | null
          giro_medio_semanal: number | null
          id: string
          instrucoes_entrega: string | null
          janelas_entrega: Json | null
          link_google_maps: string | null
          meta_giro_semanal: number | null
          nome: string
          observacoes: string | null
          periodicidade_padrao: number | null
          proxima_data_reposicao: string | null
          quantidade_padrao: number | null
          representante_id: number | null
          rota_entrega_id: number | null
          status_agendamento: string | null
          status_cliente: string | null
          tipo_cobranca: string | null
          tipo_logistica: string | null
          ultima_data_reposicao_efetiva: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          categoria_estabelecimento_id?: number | null
          categorias_habilitadas?: Json | null
          cnpj_cpf?: string | null
          contabilizar_giro_medio?: boolean | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          emite_nota_fiscal?: boolean | null
          endereco_entrega?: string | null
          forma_pagamento?: string | null
          giro_medio_semanal?: number | null
          id?: string
          instrucoes_entrega?: string | null
          janelas_entrega?: Json | null
          link_google_maps?: string | null
          meta_giro_semanal?: number | null
          nome: string
          observacoes?: string | null
          periodicidade_padrao?: number | null
          proxima_data_reposicao?: string | null
          quantidade_padrao?: number | null
          representante_id?: number | null
          rota_entrega_id?: number | null
          status_agendamento?: string | null
          status_cliente?: string | null
          tipo_cobranca?: string | null
          tipo_logistica?: string | null
          ultima_data_reposicao_efetiva?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          categoria_estabelecimento_id?: number | null
          categorias_habilitadas?: Json | null
          cnpj_cpf?: string | null
          contabilizar_giro_medio?: boolean | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          emite_nota_fiscal?: boolean | null
          endereco_entrega?: string | null
          forma_pagamento?: string | null
          giro_medio_semanal?: number | null
          id?: string
          instrucoes_entrega?: string | null
          janelas_entrega?: Json | null
          link_google_maps?: string | null
          meta_giro_semanal?: number | null
          nome?: string
          observacoes?: string | null
          periodicidade_padrao?: number | null
          proxima_data_reposicao?: string | null
          quantidade_padrao?: number | null
          representante_id?: number | null
          rota_entrega_id?: number | null
          status_agendamento?: string | null
          status_cliente?: string | null
          tipo_cobranca?: string | null
          tipo_logistica?: string | null
          ultima_data_reposicao_efetiva?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clientes_categorias: {
        Row: {
          categoria_id: number
          cliente_id: string
          created_at: string
          id: string
        }
        Insert: {
          categoria_id: number
          cliente_id: string
          created_at?: string
          id?: string
        }
        Update: {
          categoria_id?: number
          cliente_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_categorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_categorias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_categorias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_consolidados"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "clientes_categorias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_materialized"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      componentes_produto: {
        Row: {
          created_at: string
          id: string
          item_id: string
          produto_id: string
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          produto_id: string
          quantidade: number
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          produto_id?: string
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "componentes_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_finais"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          configuracoes: Json
          created_at: string
          id: string
          modulo: string
          updated_at: string
        }
        Insert: {
          configuracoes?: Json
          created_at?: string
          id?: string
          modulo: string
          updated_at?: string
        }
        Update: {
          configuracoes?: Json
          created_at?: string
          id?: string
          modulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      confirmacoes_reposicao: {
        Row: {
          agendamento_id: string | null
          cliente_id: string
          confirmado_por: string | null
          created_at: string
          data_contato: string
          id: string
          observacoes: string | null
          status_contato: string
          ultimo_contato_em: string | null
          updated_at: string
        }
        Insert: {
          agendamento_id?: string | null
          cliente_id: string
          confirmado_por?: string | null
          created_at?: string
          data_contato?: string
          id?: string
          observacoes?: string | null
          status_contato?: string
          ultimo_contato_em?: string | null
          updated_at?: string
        }
        Update: {
          agendamento_id?: string | null
          cliente_id?: string
          confirmado_por?: string | null
          created_at?: string
          data_contato?: string
          id?: string
          observacoes?: string | null
          status_contato?: string
          ultimo_contato_em?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custos_fixos: {
        Row: {
          created_at: string
          frequencia: string
          id: string
          nome: string
          observacoes: string | null
          subcategoria: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          frequencia?: string
          id?: string
          nome: string
          observacoes?: string | null
          subcategoria: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          frequencia?: string
          id?: string
          nome?: string
          observacoes?: string | null
          subcategoria?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      custos_variaveis: {
        Row: {
          created_at: string
          frequencia: string
          id: string
          nome: string
          observacoes: string | null
          percentual_faturamento: number
          subcategoria: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          frequencia?: string
          id?: string
          nome: string
          observacoes?: string | null
          percentual_faturamento?: number
          subcategoria: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          frequencia?: string
          id?: string
          nome?: string
          observacoes?: string | null
          percentual_faturamento?: number
          subcategoria?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: number
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: number
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: number
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      giros_semanais_personalizados: {
        Row: {
          categoria_id: number
          cliente_id: string
          created_at: string
          giro_semanal: number
          id: string
          updated_at: string
        }
        Insert: {
          categoria_id: number
          cliente_id: string
          created_at?: string
          giro_semanal?: number
          id?: string
          updated_at?: string
        }
        Update: {
          categoria_id?: number
          cliente_id?: string
          created_at?: string
          giro_semanal?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico_entregas: {
        Row: {
          cliente_id: string
          created_at: string
          data: string
          editado_manualmente: boolean | null
          id: string
          itens: Json
          observacao: string | null
          quantidade: number
          status_anterior: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data?: string
          editado_manualmente?: boolean | null
          id?: string
          itens?: Json
          observacao?: string | null
          quantidade: number
          status_anterior?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data?: string
          editado_manualmente?: boolean | null
          id?: string
          itens?: Json
          observacao?: string | null
          quantidade?: number
          status_anterior?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico_giro_semanal_consolidado: {
        Row: {
          cliente_id: string
          created_at: string | null
          giro_categoria: Json | null
          giro_semanal: number
          id: string
          semana: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          giro_categoria?: Json | null
          giro_semanal?: number
          id?: string
          semana: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          giro_categoria?: Json | null
          giro_semanal?: number
          id?: string
          semana?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_giro_semanal_consolidado_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_giro_semanal_consolidado_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_consolidados"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "historico_giro_semanal_consolidado_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_materialized"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      historico_producao: {
        Row: {
          created_at: string
          data_producao: string
          formas_producidas: number
          id: string
          observacoes: string | null
          origem: string | null
          produto_id: string | null
          produto_nome: string
          turno: string | null
          unidades_calculadas: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_producao: string
          formas_producidas: number
          id?: string
          observacoes?: string | null
          origem?: string | null
          produto_id?: string | null
          produto_nome: string
          turno?: string | null
          unidades_calculadas: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_producao?: string
          formas_producidas?: number
          id?: string
          observacoes?: string | null
          origem?: string | null
          produto_id?: string | null
          produto_nome?: string
          turno?: string | null
          unidades_calculadas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_producao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          categoria: string
          created_at: string
          custo_medio: number
          estoque_atual: number | null
          estoque_ideal: number | null
          estoque_minimo: number | null
          id: string
          nome: string
          ultima_entrada: string | null
          unidade_medida: string
          updated_at: string
          volume_bruto: number
        }
        Insert: {
          categoria: string
          created_at?: string
          custo_medio: number
          estoque_atual?: number | null
          estoque_ideal?: number | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          ultima_entrada?: string | null
          unidade_medida: string
          updated_at?: string
          volume_bruto: number
        }
        Update: {
          categoria?: string
          created_at?: string
          custo_medio?: number
          estoque_atual?: number | null
          estoque_ideal?: number | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          ultima_entrada?: string | null
          unidade_medida?: string
          updated_at?: string
          volume_bruto?: number
        }
        Relationships: []
      }
      itens_receita: {
        Row: {
          created_at: string
          id: string
          insumo_id: string
          quantidade: number
          receita_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insumo_id: string
          quantidade: number
          receita_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insumo_id?: string
          quantidade?: number
          receita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_receita_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_receita_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas_base"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque_insumos: {
        Row: {
          created_at: string
          data_movimentacao: string
          id: string
          insumo_id: string
          observacao: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string
          data_movimentacao?: string
          id?: string
          insumo_id: string
          observacao?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          created_at?: string
          data_movimentacao?: string
          id?: string
          insumo_id?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_insumos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque_produtos: {
        Row: {
          created_at: string
          data_movimentacao: string
          id: string
          observacao: string | null
          produto_id: string
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string
          data_movimentacao?: string
          id?: string
          observacao?: string | null
          produto_id: string
          quantidade: number
          tipo: string
        }
        Update: {
          created_at?: string
          data_movimentacao?: string
          id?: string
          observacao?: string | null
          produto_id?: string
          quantidade?: number
          tipo?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cliente_id: string
          contato_entrega: string | null
          created_at: string
          data_entrega: string | null
          data_pedido: string
          endereco_entrega: string | null
          id: string
          itens: Json
          numero_pedido_cliente: string | null
          observacoes: string | null
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          cliente_id: string
          contato_entrega?: string | null
          created_at?: string
          data_entrega?: string | null
          data_pedido?: string
          endereco_entrega?: string | null
          id?: string
          itens?: Json
          numero_pedido_cliente?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          cliente_id?: string
          contato_entrega?: string | null
          created_at?: string
          data_entrega?: string | null
          data_pedido?: string
          endereco_entrega?: string | null
          id?: string
          itens?: Json
          numero_pedido_cliente?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_consolidados"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_materialized"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      precos_categoria_cliente: {
        Row: {
          categoria_id: number
          cliente_id: string
          created_at: string
          id: string
          preco_unitario: number
          updated_at: string
        }
        Insert: {
          categoria_id: number
          cliente_id: string
          created_at?: string
          id?: string
          preco_unitario?: number
          updated_at?: string
        }
        Update: {
          categoria_id?: number
          cliente_id?: string
          created_at?: string
          id?: string
          preco_unitario?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "precos_categoria_cliente_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precos_categoria_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precos_categoria_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_consolidados"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "precos_categoria_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "dados_analise_giro_materialized"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          categoria_id: number | null
          created_at: string
          custo_total: number | null
          custo_unitario: number | null
          descricao: string | null
          estoque_minimo: number | null
          id: string
          margem_lucro: number | null
          nome: string
          peso_unitario: number | null
          preco_venda: number | null
          subcategoria_id: number | null
          unidades_por_forma: number | null
          unidades_producao: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          categoria_id?: number | null
          created_at?: string
          custo_total?: number | null
          custo_unitario?: number | null
          descricao?: string | null
          estoque_minimo?: number | null
          id?: string
          margem_lucro?: number | null
          nome: string
          peso_unitario?: number | null
          preco_venda?: number | null
          subcategoria_id?: number | null
          unidades_por_forma?: number | null
          unidades_producao?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          categoria_id?: number | null
          created_at?: string
          custo_total?: number | null
          custo_unitario?: number | null
          descricao?: string | null
          estoque_minimo?: number | null
          id?: string
          margem_lucro?: number | null
          nome?: string
          peso_unitario?: number | null
          preco_venda?: number | null
          subcategoria_id?: number | null
          unidades_por_forma?: number | null
          unidades_producao?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      produtos_finais: {
        Row: {
          ativo: boolean
          categoria_id: number | null
          created_at: string
          custo_total: number | null
          custo_unitario: number | null
          descricao: string | null
          estoque_atual: number | null
          estoque_ideal: number | null
          estoque_minimo: number | null
          id: string
          margem_lucro: number | null
          nome: string
          peso_unitario: number | null
          preco_venda: number | null
          subcategoria_id: number | null
          unidades_producao: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: number | null
          created_at?: string
          custo_total?: number | null
          custo_unitario?: number | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_ideal?: number | null
          estoque_minimo?: number | null
          id?: string
          margem_lucro?: number | null
          nome: string
          peso_unitario?: number | null
          preco_venda?: number | null
          subcategoria_id?: number | null
          unidades_producao?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: number | null
          created_at?: string
          custo_total?: number | null
          custo_unitario?: number | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_ideal?: number | null
          estoque_minimo?: number | null
          id?: string
          margem_lucro?: number | null
          nome?: string
          peso_unitario?: number | null
          preco_venda?: number | null
          subcategoria_id?: number | null
          unidades_producao?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      proporcoes_padrao: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          percentual: number
          produto_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          percentual: number
          produto_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          percentual?: number
          produto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proporcoes_padrao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "produtos_finais"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas_base: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          rendimento: number
          unidade_rendimento: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          rendimento: number
          unidade_rendimento: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          rendimento?: number
          unidade_rendimento?: string
          updated_at?: string
        }
        Relationships: []
      }
      representantes: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: number
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: number
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: number
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rotas_entrega: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: number
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      sabores: {
        Row: {
          ativo: boolean | null
          created_at: string
          custo_unitario: number | null
          em_producao: number | null
          estoque_ideal: number | null
          estoque_minimo: number | null
          id: string
          nome: string
          percentual_padrao_dist: number | null
          preco_venda: number | null
          saldo_atual: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          custo_unitario?: number | null
          em_producao?: number | null
          estoque_ideal?: number | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          percentual_padrao_dist?: number | null
          preco_venda?: number | null
          saldo_atual?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          custo_unitario?: number | null
          em_producao?: number | null
          estoque_ideal?: number | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          percentual_padrao_dist?: number | null
          preco_venda?: number | null
          saldo_atual?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subcategorias_custos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcategorias_produto: {
        Row: {
          ativo: boolean | null
          categoria_id: number
          created_at: string | null
          descricao: string | null
          id: number
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id: number
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: number
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategorias_produto_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produto"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_cobranca: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: number
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_logistica: {
        Row: {
          ativo: boolean
          created_at: string
          id: number
          nome: string
          percentual_logistico: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: number
          nome: string
          percentual_logistico?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: number
          nome?: string
          percentual_logistico?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      dados_analise_giro_consolidados: {
        Row: {
          achievement_meta: number | null
          categoria_estabelecimento_nome: string | null
          categorias_habilitadas: Json | null
          cliente_id: string | null
          cliente_nome: string | null
          cnpj_cpf: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string | null
          data_consolidacao: string | null
          desvio_padrao_giro: number | null
          endereco_entrega: string | null
          faturamento_semanal_previsto: number | null
          giro_medio_historico: number | null
          giro_semanal_calculado: number | null
          giro_ultima_semana: number | null
          meta_giro_semanal: number | null
          periodicidade_padrao: number | null
          quantidade_padrao: number | null
          representante_nome: string | null
          rota_entrega_nome: string | null
          semaforo_performance: string | null
          status_cliente: string | null
          updated_at: string | null
          variacao_percentual: number | null
        }
        Relationships: []
      }
      dados_analise_giro_materialized: {
        Row: {
          achievement_meta: number | null
          categoria_estabelecimento_nome: string | null
          categorias_habilitadas: Json | null
          cliente_id: string | null
          cliente_nome: string | null
          cnpj_cpf: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string | null
          data_consolidacao: string | null
          desvio_padrao_giro: number | null
          endereco_entrega: string | null
          faturamento_semanal_previsto: number | null
          giro_medio_historico: number | null
          giro_semanal_calculado: number | null
          giro_ultima_semana: number | null
          meta_giro_semanal: number | null
          periodicidade_padrao: number | null
          quantidade_padrao: number | null
          representante_nome: string | null
          rota_entrega_nome: string | null
          semaforo_performance: string | null
          status_cliente: string | null
          updated_at: string | null
          variacao_percentual: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_cliente_status_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nome: string
          ativo: boolean
          status_cliente: string
          inconsistencia: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_ip_address: unknown
          p_email?: string
          p_attempt_type?: string
          p_time_window?: unknown
          p_max_attempts?: number
        }
        Returns: boolean
      }
      get_request_ip: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          user_id: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      populate_historico_giro_semanal: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_dados_analise_giro: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_cnpj_cpf: {
        Args: { doc: string }
        Returns: boolean
      }
      validate_email: {
        Args: { email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
