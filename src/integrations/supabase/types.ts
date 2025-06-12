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
      compare_po_invoice_table: {
        Row: {
          compare_bill_details: Json | null
          compare_item_details: Json | null
          compare_summary_individual: string | null
          created_at: string
          id: number
          invoice_date: string | null
          invoice_file_name: string | null
          po_date: string | null
          po_file_name: string | null
        }
        Insert: {
          compare_bill_details?: Json | null
          compare_item_details?: Json | null
          compare_summary_individual?: string | null
          created_at?: string
          id?: number
          invoice_date?: string | null
          invoice_file_name?: string | null
          po_date?: string | null
          po_file_name?: string | null
        }
        Update: {
          compare_bill_details?: Json | null
          compare_item_details?: Json | null
          compare_summary_individual?: string | null
          created_at?: string
          id?: number
          invoice_date?: string | null
          invoice_file_name?: string | null
          po_date?: string | null
          po_file_name?: string | null
        }
        Relationships: []
      }
      compare_po_multi_invoice: {
        Row: {
          compaison_summary_all: Json | null
          created_at: string
          id: number
          invoice_file_names: Json | null
          po_file_name: string | null
        }
        Insert: {
          compaison_summary_all?: Json | null
          created_at?: string
          id?: number
          invoice_file_names?: Json | null
          po_file_name?: string | null
        }
        Update: {
          compaison_summary_all?: Json | null
          created_at?: string
          id?: number
          invoice_file_names?: Json | null
          po_file_name?: string | null
        }
        Relationships: []
      }
      compare_source_document: {
        Row: {
          created_at: string
          doc_json_extract: Json | null
          doc_title: string | null
          doc_type: string | null
          id: number
        }
        Insert: {
          created_at?: string
          doc_json_extract?: Json | null
          doc_title?: string | null
          doc_type?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          doc_json_extract?: Json | null
          doc_title?: string | null
          doc_type?: string | null
          id?: number
        }
        Relationships: []
      }
      compare_target_docs: {
        Row: {
          created_at: string
          doc_json_1: Json | null
          doc_json_2: Json | null
          doc_json_3: Json | null
          doc_json_4: Json | null
          doc_json_5: Json | null
          doc_title_1: string | null
          doc_title_2: string | null
          doc_title_3: string | null
          doc_title_4: string | null
          doc_title_5: string | null
          doc_type_1: string | null
          doc_type_2: string | null
          doc_type_3: string | null
          doc_type_4: string | null
          doc_type_5: string | null
          id: number
        }
        Insert: {
          created_at?: string
          doc_json_1?: Json | null
          doc_json_2?: Json | null
          doc_json_3?: Json | null
          doc_json_4?: Json | null
          doc_json_5?: Json | null
          doc_title_1?: string | null
          doc_title_2?: string | null
          doc_title_3?: string | null
          doc_title_4?: string | null
          doc_title_5?: string | null
          doc_type_1?: string | null
          doc_type_2?: string | null
          doc_type_3?: string | null
          doc_type_4?: string | null
          doc_type_5?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          doc_json_1?: Json | null
          doc_json_2?: Json | null
          doc_json_3?: Json | null
          doc_json_4?: Json | null
          doc_json_5?: Json | null
          doc_title_1?: string | null
          doc_title_2?: string | null
          doc_title_3?: string | null
          doc_title_4?: string | null
          doc_title_5?: string | null
          doc_type_1?: string | null
          doc_type_2?: string | null
          doc_type_3?: string | null
          doc_type_4?: string | null
          doc_type_5?: string | null
          id?: number
        }
        Relationships: []
      }
      Doc_Compare_results: {
        Row: {
          created_at: string
          doc_compare_count_targets: number | null
          doc_compare_results: Json | null
          doc_id_compare: number | null
          doc_type_source: string | null
          doc_type_target: string | null
          id: number
        }
        Insert: {
          created_at?: string
          doc_compare_count_targets?: number | null
          doc_compare_results?: Json | null
          doc_id_compare?: number | null
          doc_type_source?: string | null
          doc_type_target?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          doc_compare_count_targets?: number | null
          doc_compare_results?: Json | null
          doc_id_compare?: number | null
          doc_type_source?: string | null
          doc_type_target?: string | null
          id?: number
        }
        Relationships: []
      }
      extracted_json: {
        Row: {
          created_at: string
          file_name: string | null
          id: number
          json_extract: Json
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: number
          json_extract: Json
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: number
          json_extract?: Json
        }
        Relationships: []
      }
      extracted_tables: {
        Row: {
          confidence: number | null
          created_at: string
          file_id: string | null
          headers: Json
          id: string
          rows: Json
          title: string
          user_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          file_id?: string | null
          headers: Json
          id?: string
          rows: Json
          title: string
          user_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          file_id?: string | null
          headers?: Json
          id?: string
          rows?: Json
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extracted_tables_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          description: string | null
          hsn_sac: string | null
          id: number
          invoice_id: number | null
          item_confidence: number | null
          item_index: number
          quantity: number | null
          serial_number: string | null
          total_amount: number
          unit_price: number | null
        }
        Insert: {
          description?: string | null
          hsn_sac?: string | null
          id?: number
          invoice_id?: number | null
          item_confidence?: number | null
          item_index: number
          quantity?: number | null
          serial_number?: string | null
          total_amount: number
          unit_price?: number | null
        }
        Update: {
          description?: string | null
          hsn_sac?: string | null
          id?: number
          invoice_id?: number | null
          item_confidence?: number | null
          item_index?: number
          quantity?: number | null
          serial_number?: string | null
          total_amount?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          bill_to_gst_number: string | null
          confidence_score: number | null
          document_quality_notes: string | null
          extraction_date: string | null
          id: number
          invoice_date: string
          invoice_number: string
          po_number: string | null
          raw_json: Json
          seal_and_sign_present: boolean | null
          seal_sign_image: string | null
          shipping_address: string | null
          supplier_gst_number: string | null
        }
        Insert: {
          bill_to_gst_number?: string | null
          confidence_score?: number | null
          document_quality_notes?: string | null
          extraction_date?: string | null
          id?: number
          invoice_date: string
          invoice_number: string
          po_number?: string | null
          raw_json: Json
          seal_and_sign_present?: boolean | null
          seal_sign_image?: string | null
          shipping_address?: string | null
          supplier_gst_number?: string | null
        }
        Update: {
          bill_to_gst_number?: string | null
          confidence_score?: number | null
          document_quality_notes?: string | null
          extraction_date?: string | null
          id?: number
          invoice_date?: string
          invoice_number?: string
          po_number?: string | null
          raw_json?: Json
          seal_and_sign_present?: boolean | null
          seal_sign_image?: string | null
          shipping_address?: string | null
          supplier_gst_number?: string | null
        }
        Relationships: []
      }
      po_table: {
        Row: {
          bill_to_address: string | null
          created_at: string
          del_end_date: string | null
          del_start_date: string | null
          description: Json | null
          file_name: string | null
          gstn: string | null
          id: number
          po_date: string | null
          po_number: number
          project: string | null
          ship_to: string | null
          terms_conditions: string | null
          user_id: string | null
          vendor_code: string | null
        }
        Insert: {
          bill_to_address?: string | null
          created_at?: string
          del_end_date?: string | null
          del_start_date?: string | null
          description?: Json | null
          file_name?: string | null
          gstn?: string | null
          id?: number
          po_date?: string | null
          po_number: number
          project?: string | null
          ship_to?: string | null
          terms_conditions?: string | null
          user_id?: string | null
          vendor_code?: string | null
        }
        Update: {
          bill_to_address?: string | null
          created_at?: string
          del_end_date?: string | null
          del_start_date?: string | null
          description?: Json | null
          file_name?: string | null
          gstn?: string | null
          id?: number
          po_date?: string | null
          po_number?: number
          project?: string | null
          ship_to?: string | null
          terms_conditions?: string | null
          user_id?: string | null
          vendor_code?: string | null
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
      uploaded_files: {
        Row: {
          created_at: string
          file_size: number
          file_type: string
          id: string
          name: string
          processed: boolean | null
          storage_path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_size: number
          file_type: string
          id?: string
          name: string
          processed?: boolean | null
          storage_path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          processed?: boolean | null
          storage_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_run: string | null
          name: string
          success_rate: number
          total_runs: number
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run?: string | null
          name: string
          success_rate?: number
          total_runs?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run?: string | null
          name?: string
          success_rate?: number
          total_runs?: number
          updated_at?: string
          user_id?: string
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
