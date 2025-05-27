export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        ]
      }
      clientes: {
        Row: {
          ativo: boolean | null
          categoria_estabelecimento_id: number | null
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
          estoque_minimo: number | null
          id: string
          nome: string
          unidade_medida: string
          updated_at: string
          volume_bruto: number
        }
        Insert: {
          categoria: string
          created_at?: string
          custo_medio: number
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          unidade_medida: string
          updated_at?: string
          volume_bruto: number
        }
        Update: {
          categoria?: string
          created_at?: string
          custo_medio?: number
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
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
          descricao: string | null
          id: string
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
          descricao?: string | null
          id?: string
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
          descricao?: string | null
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
