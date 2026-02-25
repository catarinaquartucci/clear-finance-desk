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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      automation_config: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          function_name: string
          id: string
          is_active: boolean | null
          job_name: string
          last_run: string | null
          name: string
          schedule: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          function_name: string
          id?: string
          is_active?: boolean | null
          job_name: string
          last_run?: string | null
          name: string
          schedule: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          function_name?: string
          id?: string
          is_active?: boolean | null
          job_name?: string
          last_run?: string | null
          name?: string
          schedule?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          active: boolean
          agency: string | null
          bank_name: string
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          name: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string
          active?: boolean
          agency?: string | null
          bank_name: string
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          name: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          active?: boolean
          agency?: string | null
          bank_name?: string
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          balance: number | null
          bank_account_id: string
          conciliated: boolean
          conciliated_at: string | null
          conciliated_with_id: string | null
          conciliated_with_type: string | null
          created_at: string
          date: string
          description: string
          id: string
          import_hash: string | null
          reference: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          balance?: number | null
          bank_account_id: string
          conciliated?: boolean
          conciliated_at?: string | null
          conciliated_with_id?: string | null
          conciliated_with_type?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          import_hash?: string | null
          reference?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          balance?: number | null
          bank_account_id?: string
          conciliated?: boolean
          conciliated_at?: string | null
          conciliated_with_id?: string | null
          conciliated_with_type?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          import_hash?: string | null
          reference?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_categories: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_calculated: boolean | null
          name: string
          parent_code: string | null
          sort_order: number
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_calculated?: boolean | null
          name: string
          parent_code?: string | null
          sort_order: number
          type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_calculated?: boolean | null
          name?: string
          parent_code?: string | null
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      cash_flow_data: {
        Row: {
          category_code: string
          created_at: string | null
          id: string
          month: string
          notes: string | null
          projected_value: number | null
          realized_value: number | null
          synced_at: string | null
          synced_from: string | null
          updated_at: string | null
        }
        Insert: {
          category_code: string
          created_at?: string | null
          id?: string
          month: string
          notes?: string | null
          projected_value?: number | null
          realized_value?: number | null
          synced_at?: string | null
          synced_from?: string | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          created_at?: string | null
          id?: string
          month?: string
          notes?: string | null
          projected_value?: number | null
          realized_value?: number | null
          synced_at?: string | null
          synced_from?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_data_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "cash_flow_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      cash_flow_data_detailed: {
        Row: {
          created_at: string | null
          id: string
          marvee_category_description: string | null
          marvee_category_structure: string
          month: string
          projected_value: number | null
          realized_value: number | null
          source_type: string
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          marvee_category_description?: string | null
          marvee_category_structure: string
          month: string
          projected_value?: number | null
          realized_value?: number | null
          source_type: string
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          marvee_category_description?: string | null
          marvee_category_structure?: string
          month?: string
          projected_value?: number | null
          realized_value?: number | null
          source_type?: string
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_flow_expenses: {
        Row: {
          category_description: string | null
          category_structure: string
          created_at: string | null
          document_number: string | null
          expiration_date: string | null
          id: string
          installment: number | null
          marvee_id: number
          month: string
          movement_value: number
        }
        Insert: {
          category_description?: string | null
          category_structure: string
          created_at?: string | null
          document_number?: string | null
          expiration_date?: string | null
          id?: string
          installment?: number | null
          marvee_id: number
          month: string
          movement_value?: number
        }
        Update: {
          category_description?: string | null
          category_structure?: string
          created_at?: string | null
          document_number?: string | null
          expiration_date?: string | null
          id?: string
          installment?: number | null
          marvee_id?: number
          month?: string
          movement_value?: number
        }
        Relationships: []
      }
      cash_flow_revenues: {
        Row: {
          category_description: string | null
          category_structure: string
          created_at: string | null
          document_number: string
          id: string
          installment: number | null
          marvee_id: number
          month: string
          movement_value: number
          payment_date: string | null
        }
        Insert: {
          category_description?: string | null
          category_structure: string
          created_at?: string | null
          document_number: string
          id?: string
          installment?: number | null
          marvee_id: number
          month: string
          movement_value?: number
          payment_date?: string | null
        }
        Update: {
          category_description?: string | null
          category_structure?: string
          created_at?: string | null
          document_number?: string
          id?: string
          installment?: number | null
          marvee_id?: number
          month?: string
          movement_value?: number
          payment_date?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          level: number
          name: string
          parent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          level?: number
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          level?: number
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_documentos: {
        Row: {
          arquivo_url: string
          colaborador_id: string
          created_at: string | null
          id: string
          nome: string
          tipo: string
          uploaded_by: string | null
        }
        Insert: {
          arquivo_url: string
          colaborador_id: string
          created_at?: string | null
          id?: string
          nome: string
          tipo: string
          uploaded_by?: string | null
        }
        Update: {
          arquivo_url?: string
          colaborador_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_documentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_notas: {
        Row: {
          colaborador_id: string
          conteudo: string
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          colaborador_id: string
          conteudo: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          colaborador_id?: string
          conteudo?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_notas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          area: string
          ativo: boolean | null
          chave_pix_cnpj: string | null
          cnpj: string | null
          cpf: string
          created_at: string | null
          created_by: string | null
          data_fim_contrato: string | null
          data_inicio_contrato: string
          data_nascimento: string | null
          email: string
          endereco: string | null
          funcao: string
          has_admin_view_access: boolean | null
          has_finance_access: boolean | null
          has_finance_view_access: boolean | null
          id: string
          is_admin: boolean | null
          nome: string
          regra_ote: string | null
          remuneracao: number
          updated_at: string | null
          user_id: string | null
          variavel: string | null
        }
        Insert: {
          area: string
          ativo?: boolean | null
          chave_pix_cnpj?: string | null
          cnpj?: string | null
          cpf: string
          created_at?: string | null
          created_by?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato: string
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          funcao: string
          has_admin_view_access?: boolean | null
          has_finance_access?: boolean | null
          has_finance_view_access?: boolean | null
          id?: string
          is_admin?: boolean | null
          nome: string
          regra_ote?: string | null
          remuneracao: number
          updated_at?: string | null
          user_id?: string | null
          variavel?: string | null
        }
        Update: {
          area?: string
          ativo?: boolean | null
          chave_pix_cnpj?: string | null
          cnpj?: string | null
          cpf?: string
          created_at?: string | null
          created_by?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato?: string
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          funcao?: string
          has_admin_view_access?: boolean | null
          has_finance_access?: boolean | null
          has_finance_view_access?: boolean | null
          id?: string
          is_admin?: boolean | null
          nome?: string
          regra_ote?: string | null
          remuneracao?: number
          updated_at?: string | null
          user_id?: string | null
          variavel?: string | null
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          document: string | null
          id: string
          name: string
          segment: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          document?: string | null
          id?: string
          name: string
          segment?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          document?: string | null
          id?: string
          name?: string
          segment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      devolucao_anexos: {
        Row: {
          arquivo_url: string
          created_at: string | null
          descricao: string
          devolucao_id: string
          id: string
          ordem: number | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          descricao: string
          devolucao_id: string
          id?: string
          ordem?: number | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          descricao?: string
          devolucao_id?: string
          id?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devolucao_anexos_devolucao_id_fkey"
            columns: ["devolucao_id"]
            isOneToOne: false
            referencedRelation: "devolucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      devolucoes: {
        Row: {
          chave_pix: string
          comprovante_original_url: string | null
          created_at: string | null
          data_prevista_pagamento: string | null
          id: string
          link_venda_hubla: string
          motivo: string
          nome_cliente: string
          responsavel: string
          status: string | null
          tipo_chave_pix: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          chave_pix?: string
          comprovante_original_url?: string | null
          created_at?: string | null
          data_prevista_pagamento?: string | null
          id?: string
          link_venda_hubla: string
          motivo: string
          nome_cliente: string
          responsavel: string
          status?: string | null
          tipo_chave_pix?: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          chave_pix?: string
          comprovante_original_url?: string | null
          created_at?: string | null
          data_prevista_pagamento?: string | null
          id?: string
          link_venda_hubla?: string
          motivo?: string
          nome_cliente?: string
          responsavel?: string
          status?: string | null
          tipo_chave_pix?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      director_bonus_config: {
        Row: {
          annual_base: number
          created_at: string | null
          director_id: string
          id: string
          quarterly_base: number
          updated_at: string | null
          year: number
        }
        Insert: {
          annual_base: number
          created_at?: string | null
          director_id: string
          id?: string
          quarterly_base: number
          updated_at?: string | null
          year: number
        }
        Update: {
          annual_base?: number
          created_at?: string | null
          director_id?: string
          id?: string
          quarterly_base?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      drafts: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      equipamento_fotos: {
        Row: {
          arquivo_url: string
          created_at: string | null
          descricao: string | null
          equipamento_id: string
          id: string
          ordem: number | null
          uploaded_by: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          descricao?: string | null
          equipamento_id: string
          id?: string
          ordem?: number | null
          uploaded_by?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          descricao?: string | null
          equipamento_id?: string
          id?: string
          ordem?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_fotos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          ativo: boolean | null
          colaborador_id: string | null
          created_at: string | null
          data_aquisicao: string | null
          estado: string
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          numero_serie: string | null
          observacoes: string | null
          patrimonio: string | null
          tipo: string
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          colaborador_id?: string | null
          created_at?: string | null
          data_aquisicao?: string | null
          estado?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio?: string | null
          tipo: string
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          colaborador_id?: string | null
          created_at?: string | null
          data_aquisicao?: string | null
          estado?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      financial_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          initial_cash_balance: number | null
          name: string
          start_date: string
          status: Database["public"]["Enums"]["period_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          initial_cash_balance?: number | null
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["period_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          initial_cash_balance?: number | null
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["period_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          achieved_value: number | null
          created_at: string | null
          description: string | null
          id: string
          period_id: string
          target_value: number
          type: Database["public"]["Enums"]["goal_type"]
          updated_at: string | null
        }
        Insert: {
          achieved_value?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          period_id: string
          target_value: number
          type: Database["public"]["Enums"]["goal_type"]
          updated_at?: string | null
        }
        Update: {
          achieved_value?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          period_id?: string
          target_value?: number
          type?: Database["public"]["Enums"]["goal_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string
          customer_id: string | null
          id: string
          invoice_number: string | null
          issued_at: string | null
          net_amount: number
          notes: string | null
          pdf_url: string | null
          receivable_id: string | null
          service_description: string
          status: string
          tax_amount: number
          updated_at: string
        }
        Insert: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          net_amount?: number
          notes?: string | null
          pdf_url?: string | null
          receivable_id?: string | null
          service_description: string
          status?: string
          tax_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          net_amount?: number
          notes?: string | null
          pdf_url?: string | null
          receivable_id?: string | null
          service_description?: string
          status?: string
          tax_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      marvee_category_mapping: {
        Row: {
          cash_flow_category_code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          marvee_category_description: string | null
          marvee_category_structure: string | null
          marvee_cost_center_id: string | null
          marvee_cost_center_name: string | null
          updated_at: string | null
        }
        Insert: {
          cash_flow_category_code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          marvee_category_description?: string | null
          marvee_category_structure?: string | null
          marvee_cost_center_id?: string | null
          marvee_cost_center_name?: string | null
          updated_at?: string | null
        }
        Update: {
          cash_flow_category_code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          marvee_category_description?: string | null
          marvee_category_structure?: string | null
          marvee_cost_center_id?: string | null
          marvee_cost_center_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marvee_category_mapping_cash_flow_category_code_fkey"
            columns: ["cash_flow_category_code"]
            isOneToOne: false
            referencedRelation: "cash_flow_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      marvee_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_type: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at: string
          status: string
          sync_type: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      marvee_transactions: {
        Row: {
          category_level_1_description: string | null
          category_level_1_id: number | null
          category_level_1_structure: string | null
          category_level_2_description: string | null
          category_level_2_id: number | null
          category_level_2_structure: string | null
          category_level_3_description: string | null
          category_level_3_id: number | null
          category_level_3_structure: string | null
          created_at: string | null
          document_number: string | null
          expiration_date: string | null
          id: string
          installment: number | null
          marvee_id: number
          movement_value: number
          payment_date: string | null
          raw_payload: Json | null
          source_type: string
          status: string
          synced_at: string | null
        }
        Insert: {
          category_level_1_description?: string | null
          category_level_1_id?: number | null
          category_level_1_structure?: string | null
          category_level_2_description?: string | null
          category_level_2_id?: number | null
          category_level_2_structure?: string | null
          category_level_3_description?: string | null
          category_level_3_id?: number | null
          category_level_3_structure?: string | null
          created_at?: string | null
          document_number?: string | null
          expiration_date?: string | null
          id?: string
          installment?: number | null
          marvee_id: number
          movement_value?: number
          payment_date?: string | null
          raw_payload?: Json | null
          source_type: string
          status: string
          synced_at?: string | null
        }
        Update: {
          category_level_1_description?: string | null
          category_level_1_id?: number | null
          category_level_1_structure?: string | null
          category_level_2_description?: string | null
          category_level_2_id?: number | null
          category_level_2_structure?: string | null
          category_level_3_description?: string | null
          category_level_3_id?: number | null
          category_level_3_structure?: string | null
          created_at?: string | null
          document_number?: string | null
          expiration_date?: string | null
          id?: string
          installment?: number | null
          marvee_id?: number
          movement_value?: number
          payment_date?: string | null
          raw_payload?: Json | null
          source_type?: string
          status?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      materiais: {
        Row: {
          centro_custo: string
          created_at: string
          id: string
          justificativa: string
          material: string
          nome_solicitante: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          centro_custo: string
          created_at?: string
          id?: string
          justificativa: string
          material: string
          nome_solicitante: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          centro_custo?: string
          created_at?: string
          id?: string
          justificativa?: string
          material?: string
          nome_solicitante?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_planning: {
        Row: {
          created_at: string | null
          distribution: number | null
          expense: number | null
          forecast_expense: number | null
          forecast_revenue: number | null
          id: string
          initial_balance: number | null
          month: string
          notes: string | null
          other_expense: number | null
          other_revenue: number | null
          planned_expense: number | null
          planned_revenue: number | null
          platform_fee: number | null
          revenue: number | null
          revenue_new_sales: number | null
          revenue_recurring_previous: number | null
          tax: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distribution?: number | null
          expense?: number | null
          forecast_expense?: number | null
          forecast_revenue?: number | null
          id?: string
          initial_balance?: number | null
          month: string
          notes?: string | null
          other_expense?: number | null
          other_revenue?: number | null
          planned_expense?: number | null
          planned_revenue?: number | null
          platform_fee?: number | null
          revenue?: number | null
          revenue_new_sales?: number | null
          revenue_recurring_previous?: number | null
          tax?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distribution?: number | null
          expense?: number | null
          forecast_expense?: number | null
          forecast_revenue?: number | null
          id?: string
          initial_balance?: number | null
          month?: string
          notes?: string | null
          other_expense?: number | null
          other_revenue?: number | null
          planned_expense?: number | null
          planned_revenue?: number | null
          platform_fee?: number | null
          revenue?: number | null
          revenue_new_sales?: number | null
          revenue_recurring_previous?: number | null
          tax?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      monthly_targets: {
        Row: {
          created_at: string | null
          id: string
          month: string
          notes: string | null
          revenue_target: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          notes?: string | null
          revenue_target?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          notes?: string | null
          revenue_target?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nota_fiscal_anexos: {
        Row: {
          arquivo_url: string
          created_at: string | null
          descricao: string
          id: string
          nota_fiscal_id: string
          ordem: number | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          descricao: string
          id?: string
          nota_fiscal_id: string
          ordem?: number | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          descricao?: string
          id?: string
          nota_fiscal_id?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nota_fiscal_anexos_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          agencia: string | null
          banco: string | null
          chave_pix: string
          cnpj: string
          conta: string | null
          created_at: string | null
          descricao: string | null
          id: string
          mes_pagamento: string | null
          nome: string
          nota_url: string
          periodo_referencia: string
          status: string | null
          tipo_chave_pix: string | null
          tipo_conta: string | null
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          chave_pix?: string
          cnpj: string
          conta?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          mes_pagamento?: string | null
          nome: string
          nota_url: string
          periodo_referencia: string
          status?: string | null
          tipo_chave_pix?: string | null
          tipo_conta?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          chave_pix?: string
          cnpj?: string
          conta?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          mes_pagamento?: string | null
          nome?: string
          nota_url?: string
          periodo_referencia?: string
          status?: string | null
          tipo_chave_pix?: string | null
          tipo_conta?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action: string
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payable_attachments: {
        Row: {
          created_at: string
          description: string | null
          file_url: string
          id: string
          payable_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url: string
          id?: string
          payable_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          payable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payable_attachments_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "payables"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount: number
          bank_account_id: string | null
          chart_account_id: string | null
          cost_center_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          installment_number: number | null
          installment_total: number | null
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          chart_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          chart_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          chave_pix: string | null
          created_at: string | null
          email: string | null
          id: string
          nome_completo: string | null
          tipo_chave_pix: string | null
          updated_at: string | null
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          nome_completo?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string | null
        }
        Update: {
          chave_pix?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receivables: {
        Row: {
          amount: number
          bank_account_id: string | null
          chart_account_id: string | null
          cost_center_id: string | null
          created_at: string
          customer_id: string | null
          description: string
          due_date: string
          id: string
          installment_number: number | null
          installment_total: number | null
          notes: string | null
          payment_method: string | null
          received_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          chart_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          customer_id?: string | null
          description: string
          due_date: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
          notes?: string | null
          payment_method?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          chart_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date?: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
          notes?: string | null
          payment_method?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      reembolso_anexos: {
        Row: {
          arquivo_url: string
          created_at: string | null
          descricao: string
          id: string
          ordem: number | null
          reembolso_id: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          descricao: string
          id?: string
          ordem?: number | null
          reembolso_id: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          descricao?: string
          id?: string
          ordem?: number | null
          reembolso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reembolso_anexos_reembolso_id_fkey"
            columns: ["reembolso_id"]
            isOneToOne: false
            referencedRelation: "reembolsos"
            referencedColumns: ["id"]
          },
        ]
      }
      reembolsos: {
        Row: {
          centro_custo: string
          chave_pix: string
          comprovante_url: string | null
          created_at: string | null
          data: string
          data_prevista_pagamento: string | null
          id: string
          motivo: string
          nome: string
          status: string | null
          tipo_chave_pix: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          centro_custo: string
          chave_pix: string
          comprovante_url?: string | null
          created_at?: string | null
          data: string
          data_prevista_pagamento?: string | null
          id?: string
          motivo: string
          nome: string
          status?: string | null
          tipo_chave_pix: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          centro_custo?: string
          chave_pix?: string
          comprovante_url?: string | null
          created_at?: string | null
          data?: string
          data_prevista_pagamento?: string | null
          id?: string
          motivo?: string
          nome?: string
          status?: string | null
          tipo_chave_pix?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      sales_target_monthly: {
        Row: {
          achieved_value: number | null
          cash_achieved: number | null
          created_at: string | null
          id: string
          month: string
          monthly_target: number | null
          recurring_achieved: number | null
          sales_target_id: string
          updated_at: string | null
        }
        Insert: {
          achieved_value?: number | null
          cash_achieved?: number | null
          created_at?: string | null
          id?: string
          month: string
          monthly_target?: number | null
          recurring_achieved?: number | null
          sales_target_id: string
          updated_at?: string | null
        }
        Update: {
          achieved_value?: number | null
          cash_achieved?: number | null
          created_at?: string | null
          id?: string
          month?: string
          monthly_target?: number | null
          recurring_achieved?: number | null
          sales_target_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_target_monthly_sales_target_id_fkey"
            columns: ["sales_target_id"]
            isOneToOne: false
            referencedRelation: "sales_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          annual_target: number | null
          cash_sale_percentage: number | null
          created_at: string | null
          id: string
          month_forecast: number | null
          monthly_target: number | null
          period_id: string
          recurring_installments: number | null
          recurring_sale_percentage: number | null
          target_ml_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          annual_target?: number | null
          cash_sale_percentage?: number | null
          created_at?: string | null
          id?: string
          month_forecast?: number | null
          monthly_target?: number | null
          period_id: string
          recurring_installments?: number | null
          recurring_sale_percentage?: number | null
          target_ml_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_target?: number | null
          cash_sale_percentage?: number | null
          created_at?: string | null
          id?: string
          month_forecast?: number | null
          monthly_target?: number | null
          period_id?: string
          recurring_installments?: number | null
          recurring_sale_percentage?: number | null
          target_ml_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          ai_analysis: string | null
          ai_recommendations: Json | null
          created_at: string | null
          expense_change_percent: number | null
          id: string
          name: string
          period_id: string
          projected_cash_balance: number | null
          projected_expenses: number | null
          projected_net_margin: number | null
          projected_revenue: number | null
          projected_taxes: number | null
          revenue_change_percent: number | null
          time_horizon_months: number | null
        }
        Insert: {
          ai_analysis?: string | null
          ai_recommendations?: Json | null
          created_at?: string | null
          expense_change_percent?: number | null
          id?: string
          name: string
          period_id: string
          projected_cash_balance?: number | null
          projected_expenses?: number | null
          projected_net_margin?: number | null
          projected_revenue?: number | null
          projected_taxes?: number | null
          revenue_change_percent?: number | null
          time_horizon_months?: number | null
        }
        Update: {
          ai_analysis?: string | null
          ai_recommendations?: Json | null
          created_at?: string | null
          expense_change_percent?: number | null
          id?: string
          name?: string
          period_id?: string
          projected_cash_balance?: number | null
          projected_expenses?: number | null
          projected_net_margin?: number | null
          projected_revenue?: number | null
          projected_taxes?: number | null
          revenue_change_percent?: number | null
          time_horizon_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          document: string | null
          id: string
          name: string
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          document?: string | null
          id?: string
          name: string
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          document?: string | null
          id?: string
          name?: string
          pix_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_rules: {
        Row: {
          aliquot_percentage: number
          created_at: string | null
          id: string
          is_active: boolean | null
          max_revenue: number | null
          min_revenue: number | null
          name: string
          regime: Database["public"]["Enums"]["tax_regime"]
          updated_at: string | null
        }
        Insert: {
          aliquot_percentage: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_revenue?: number | null
          min_revenue?: number | null
          name: string
          regime: Database["public"]["Enums"]["tax_regime"]
          updated_at?: string | null
        }
        Update: {
          aliquot_percentage?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_revenue?: number | null
          min_revenue?: number | null
          name?: string
          regime?: Database["public"]["Enums"]["tax_regime"]
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_forecast: boolean | null
          is_recurring: boolean | null
          period_id: string
          recurring_interval: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          is_forecast?: boolean | null
          is_recurring?: boolean | null
          period_id: string
          recurring_interval?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_forecast?: boolean | null
          is_recurring?: boolean | null
          period_id?: string
          recurring_interval?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      cash_flow_detailed_view: {
        Row: {
          category_description: string | null
          category_structure: string | null
          month: string | null
          source_type: string | null
          total_value: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_business_days: {
        Args: { days_to_add: number; start_date: string }
        Returns: string
      }
      aggregate_raw_to_detailed: {
        Args: { p_year?: number }
        Returns: {
          created: number
          processed: number
          updated: number
        }[]
      }
      calcular_data_prevista_devolucao: {
        Args: { data_solicitacao: string }
        Returns: string
      }
      calcular_data_prevista_reembolso: {
        Args: { data_solicitacao: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action: string
          p_message: string
          p_reference_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_notas_fiscais_mes: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          nome: string
          periodo_referencia: string
          user_id: string
          valor: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_first_access: { Args: never; Returns: boolean }
      populate_cash_flow_tables: {
        Args: { p_year?: number }
        Returns: {
          expenses_count: number
          expenses_deleted: number
          revenues_count: number
          revenues_deleted: number
        }[]
      }
      setup_primeiro_admin: {
        Args: { p_email: string; p_nome?: string; p_user_id: string }
        Returns: boolean
      }
      validar_colaborador_signup: { Args: { p_email: string }; Returns: Json }
      vincular_user_colaborador: {
        Args: { p_colaborador_email: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "finance" | "finance_viewer" | "admin_viewer"
      goal_type: "sales_volume" | "sales_value" | "net_margin_percentage"
      period_status: "open" | "closed"
      tax_regime: "simples_nacional" | "lucro_presumido" | "lucro_real"
      transaction_type: "revenue" | "expense" | "tax"
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
      app_role: ["admin", "user", "finance", "finance_viewer", "admin_viewer"],
      goal_type: ["sales_volume", "sales_value", "net_margin_percentage"],
      period_status: ["open", "closed"],
      tax_regime: ["simples_nacional", "lucro_presumido", "lucro_real"],
      transaction_type: ["revenue", "expense", "tax"],
    },
  },
} as const
