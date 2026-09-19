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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      __import_fail: {
        Row: {
          err: string | null
          id: number | null
        }
        Insert: {
          err?: string | null
          id?: number | null
        }
        Update: {
          err?: string | null
          id?: number | null
        }
        Relationships: []
      }
      __import_payload: {
        Row: {
          body: string | null
          id: number
        }
        Insert: {
          body?: string | null
          id: number
        }
        Update: {
          body?: string | null
          id?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          diff: Json
          entity_id: string | null
          entity_type: string
          id: string
          summary: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          summary?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string
        }
        Relationships: []
      }
      catalog_usage_log: {
        Row: {
          action: string
          count: number
          created_at: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          count?: number
          created_at?: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          count?: number
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      category_counts_meta: {
        Row: {
          dirty: boolean
          id: boolean
          last_refresh: string | null
        }
        Insert: {
          dirty?: boolean
          id?: boolean
          last_refresh?: string | null
        }
        Update: {
          dirty?: boolean
          id?: boolean
          last_refresh?: string | null
        }
        Relationships: []
      }
      contact_details: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          label: string
          region: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          label: string
          region?: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          label?: string
          region?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_tags: {
        Row: {
          color: string
          created_at: string
          customer_id: string
          id: string
          tag: string
        }
        Insert: {
          color?: string
          created_at?: string
          customer_id: string
          id?: string
          tag: string
        }
        Update: {
          color?: string
          created_at?: string
          customer_id?: string
          id?: string
          tag?: string
        }
        Relationships: []
      }
      customer_usage_limits: {
        Row: {
          created_at: string
          id: string
          limit_key: string
          limit_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          limit_key: string
          limit_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          limit_key?: string
          limit_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          attempts: number
          created_at: string
          dedupe_key: string | null
          error: string | null
          id: string
          payload: Json
          recipient_email: string
          recipient_user_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject_override: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          dedupe_key?: string | null
          error?: string | null
          id?: string
          payload?: Json
          recipient_email: string
          recipient_user_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject_override?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          dedupe_key?: string | null
          error?: string | null
          id?: string
          payload?: Json
          recipient_email?: string
          recipient_user_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject_override?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_template_settings: {
        Row: {
          enabled: boolean
          label: string
          template_name: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          label?: string
          template_name: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          label?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favourites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      homepage_hero_settings: {
        Row: {
          category_filter: string[]
          category_filters: Json
          enabled_desktop: boolean
          enabled_mobile: boolean
          id: string
          manual_product_ids: string[]
          min_stock: number
          order_by: string
          pause_on_hover: boolean
          product_count: number
          product_source: string
          rotation_interval_ms: number
          show_arrows: boolean
          show_dots: boolean
          show_out_of_stock: boolean
          time_window: string
          updated_at: string
        }
        Insert: {
          category_filter?: string[]
          category_filters?: Json
          enabled_desktop?: boolean
          enabled_mobile?: boolean
          id?: string
          manual_product_ids?: string[]
          min_stock?: number
          order_by?: string
          pause_on_hover?: boolean
          product_count?: number
          product_source?: string
          rotation_interval_ms?: number
          show_arrows?: boolean
          show_dots?: boolean
          show_out_of_stock?: boolean
          time_window?: string
          updated_at?: string
        }
        Update: {
          category_filter?: string[]
          category_filters?: Json
          enabled_desktop?: boolean
          enabled_mobile?: boolean
          id?: string
          manual_product_ids?: string[]
          min_stock?: number
          order_by?: string
          pause_on_hover?: boolean
          product_count?: number
          product_source?: string
          rotation_interval_ms?: number
          show_arrows?: boolean
          show_dots?: boolean
          show_out_of_stock?: boolean
          time_window?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      image_download_log: {
        Row: {
          count: number
          created_at: string
          id: string
          product_id: string | null
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          product_id?: string | null
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          product_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string
          notes: string | null
          product_id: string
          qty_after: number
          qty_change: number
          reference_order_id: string | null
          release_request_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id: string
          notes?: string | null
          product_id: string
          qty_after: number
          qty_change: number
          reference_order_id?: string | null
          release_request_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string
          notes?: string | null
          product_id?: string
          qty_after?: number
          qty_change?: number
          reference_order_id?: string | null
          release_request_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          buyer_address: string
          buyer_name: string
          buyer_vat_number: string
          created_at: string
          currency: string
          id: string
          invoice_number: string
          invoice_type: string
          issue_date: string
          line_items: Json
          order_id: string | null
          payment_method: string
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          qr_code: string
          seller_address: string
          seller_cr_number: string
          seller_name: string
          seller_vat_number: string
          status: string
          store_id: string | null
          subtotal: number
          updated_at: string
          user_id: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          amount?: number
          buyer_address?: string
          buyer_name?: string
          buyer_vat_number?: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          invoice_type?: string
          issue_date?: string
          line_items?: Json
          order_id?: string | null
          payment_method?: string
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          qr_code?: string
          seller_address?: string
          seller_cr_number?: string
          seller_name?: string
          seller_vat_number?: string
          status?: string
          store_id?: string | null
          subtotal?: number
          updated_at?: string
          user_id: string
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          amount?: number
          buyer_address?: string
          buyer_name?: string
          buyer_vat_number?: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          invoice_type?: string
          issue_date?: string
          line_items?: Json
          order_id?: string | null
          payment_method?: string
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          qr_code?: string
          seller_address?: string
          seller_cr_number?: string
          seller_name?: string
          seller_vat_number?: string
          status?: string
          store_id?: string | null
          subtotal?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: []
      }
      label_templates: {
        Row: {
          canvas_json: Json
          created_at: string
          created_by: string
          id: string
          name: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          canvas_json?: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          canvas_json?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      labelling_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_name: string
          id: string
          items_count: number
          label_data: Json | null
          notes: string | null
          order_id: string | null
          status: string
          template_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          items_count?: number
          label_data?: Json | null
          notes?: string | null
          order_id?: string | null
          status?: string
          template_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          items_count?: number
          label_data?: Json | null
          notes?: string | null
          order_id?: string | null
          status?: string
          template_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      noon_attribute_cache: {
        Row: {
          category_code: string
          schema_payload: Json
          synced_at: string
        }
        Insert: {
          category_code: string
          schema_payload?: Json
          synced_at?: string
        }
        Update: {
          category_code?: string
          schema_payload?: Json
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_attribute_cache_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: true
            referencedRelation: "noon_category_cache"
            referencedColumns: ["category_code"]
          },
        ]
      }
      noon_category_cache: {
        Row: {
          category_code: string
          level: number
          name_ar: string
          name_en: string
          parent_code: string | null
          path_ar: string | null
          path_en: string | null
          raw_payload: Json
          synced_at: string
        }
        Insert: {
          category_code: string
          level?: number
          name_ar?: string
          name_en?: string
          parent_code?: string | null
          path_ar?: string | null
          path_en?: string | null
          raw_payload?: Json
          synced_at?: string
        }
        Update: {
          category_code?: string
          level?: number
          name_ar?: string
          name_en?: string
          parent_code?: string | null
          path_ar?: string | null
          path_en?: string | null
          raw_payload?: Json
          synced_at?: string
        }
        Relationships: []
      }
      noon_category_mappings: {
        Row: {
          attribute_values: Json
          connection_id: string
          created_at: string
          id: string
          noon_category_code: string
          noon_category_name: string
          review_status: string
          source_category: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attribute_values?: Json
          connection_id: string
          created_at?: string
          id?: string
          noon_category_code: string
          noon_category_name?: string
          review_status?: string
          source_category: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attribute_values?: Json
          connection_id?: string
          created_at?: string
          id?: string
          noon_category_code?: string
          noon_category_name?: string
          review_status?: string
          source_category?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_category_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "noon_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_connections: {
        Row: {
          created_at: string
          credential_label: string
          enabled_markets: string[]
          id: string
          key_id: string
          last_auth_at: string | null
          last_error: string | null
          last_inventory_sync_at: string | null
          last_order_sync_at: string | null
          last_product_sync_at: string | null
          mode: string
          name: string
          pricing_rules: Json
          private_key_ciphertext: string
          project_code: string
          setup_completed_at: string | null
          status: string
          store_integration_id: string | null
          sync_settings: Json
          updated_at: string
          user_id: string
          webhook_secret_hash: string
        }
        Insert: {
          created_at?: string
          credential_label?: string
          enabled_markets?: string[]
          id?: string
          key_id: string
          last_auth_at?: string | null
          last_error?: string | null
          last_inventory_sync_at?: string | null
          last_order_sync_at?: string | null
          last_product_sync_at?: string | null
          mode?: string
          name?: string
          pricing_rules?: Json
          private_key_ciphertext: string
          project_code: string
          setup_completed_at?: string | null
          status?: string
          store_integration_id?: string | null
          sync_settings?: Json
          updated_at?: string
          user_id: string
          webhook_secret_hash?: string
        }
        Update: {
          created_at?: string
          credential_label?: string
          enabled_markets?: string[]
          id?: string
          key_id?: string
          last_auth_at?: string | null
          last_error?: string | null
          last_inventory_sync_at?: string | null
          last_order_sync_at?: string | null
          last_product_sync_at?: string | null
          mode?: string
          name?: string
          pricing_rules?: Json
          private_key_ciphertext?: string
          project_code?: string
          setup_completed_at?: string | null
          status?: string
          store_integration_id?: string | null
          sync_settings?: Json
          updated_at?: string
          user_id?: string
          webhook_secret_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_connections_store_integration_id_fkey"
            columns: ["store_integration_id"]
            isOneToOne: false
            referencedRelation: "store_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_order_items: {
        Row: {
          created_at: string
          id: string
          name: string
          order_id: string
          partner_sku: string
          product_id: string | null
          quantity: number
          raw_payload: Json
          status: string
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          order_id: string
          partner_sku: string
          product_id?: string | null
          quantity?: number
          raw_payload?: Json
          status?: string
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          partner_sku?: string
          product_id?: string | null
          quantity?: number
          raw_payload?: Json
          status?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "noon_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noon_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_orders: {
        Row: {
          connection_id: string
          created_at: string
          currency: string
          customer_data: Json
          external_reference: string
          external_status: string
          id: string
          market: string
          order_total: number
          placed_at: string | null
          raw_payload: Json
          shipment_data: Json
          status: string
          updated_at: string
          user_id: string
          warehouse_code: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          currency?: string
          customer_data?: Json
          external_reference: string
          external_status?: string
          id?: string
          market?: string
          order_total?: number
          placed_at?: string | null
          raw_payload?: Json
          shipment_data?: Json
          status?: string
          updated_at?: string
          user_id: string
          warehouse_code?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          currency?: string
          customer_data?: Json
          external_reference?: string
          external_status?: string
          id?: string
          market?: string
          order_total?: number
          placed_at?: string | null
          raw_payload?: Json
          shipment_data?: Json
          status?: string
          updated_at?: string
          user_id?: string
          warehouse_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_orders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "noon_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_product_links: {
        Row: {
          attribute_values: Json
          connection_id: string
          content_status: string
          created_at: string
          id: string
          image_status: string
          last_checked_at: string | null
          last_error: string | null
          last_pushed_at: string | null
          noon_category_code: string | null
          noon_sku_parent: string | null
          noon_variant_sku: string | null
          offer_status: Json
          partner_sku: string
          product_id: string
          psku_code: string | null
          qc_status: string
          selected_markets: string[]
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attribute_values?: Json
          connection_id: string
          content_status?: string
          created_at?: string
          id?: string
          image_status?: string
          last_checked_at?: string | null
          last_error?: string | null
          last_pushed_at?: string | null
          noon_category_code?: string | null
          noon_sku_parent?: string | null
          noon_variant_sku?: string | null
          offer_status?: Json
          partner_sku: string
          product_id: string
          psku_code?: string | null
          qc_status?: string
          selected_markets?: string[]
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attribute_values?: Json
          connection_id?: string
          content_status?: string
          created_at?: string
          id?: string
          image_status?: string
          last_checked_at?: string | null
          last_error?: string | null
          last_pushed_at?: string | null
          noon_category_code?: string | null
          noon_sku_parent?: string | null
          noon_variant_sku?: string | null
          offer_status?: Json
          partner_sku?: string
          product_id?: string
          psku_code?: string | null
          qc_status?: string
          selected_markets?: string[]
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_product_links_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "noon_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noon_product_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_product_market_settings: {
        Row: {
          active: boolean
          calculated_price: number | null
          id: string
          market: string
          markup_type: string
          markup_value: number
          minimum_margin_percent: number
          override_price: number | null
          product_link_id: string
          published_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          calculated_price?: number | null
          id?: string
          market: string
          markup_type?: string
          markup_value?: number
          minimum_margin_percent?: number
          override_price?: number | null
          product_link_id: string
          published_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          calculated_price?: number | null
          id?: string
          market?: string
          markup_type?: string
          markup_value?: number
          minimum_margin_percent?: number
          override_price?: number | null
          product_link_id?: string
          published_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_product_market_settings_product_link_id_fkey"
            columns: ["product_link_id"]
            isOneToOne: false
            referencedRelation: "noon_product_links"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_sync_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          connection_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          job_type: string
          last_error: string | null
          locked_at: string | null
          max_attempts: number
          payload: Json
          run_after: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          job_type: string
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          payload?: Json
          run_after?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          job_type?: string
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          payload?: Json
          run_after?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noon_sync_jobs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "noon_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_sync_log: {
        Row: {
          connection_id: string | null
          created_at: string
          detail: Json
          direction: string
          duration_ms: number | null
          entity_id: string
          entity_type: string
          id: string
          market: string
          message: string
          operation: string
          provider_request_id: string
          status: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          detail?: Json
          direction?: string
          duration_ms?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          market?: string
          message?: string
          operation: string
          provider_request_id?: string
          status: string
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          detail?: Json
          direction?: string
          duration_ms?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          market?: string
          message?: string
          operation?: string
          provider_request_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_sync_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "noon_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_warehouses: {
        Row: {
          connection_id: string
          created_at: string
          enabled: boolean
          id: string
          market: string
          noon_status: string
          processing_time: number
          safety_stock: number
          updated_at: string
          user_id: string
          warehouse_code: string
          warehouse_name: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          market: string
          noon_status?: string
          processing_time?: number
          safety_stock?: number
          updated_at?: string
          user_id: string
          warehouse_code: string
          warehouse_name?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          market?: string
          noon_status?: string
          processing_time?: number
          safety_stock?: number
          updated_at?: string
          user_id?: string
          warehouse_code?: string
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_warehouses_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "noon_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      noon_webhook_events: {
        Row: {
          attempt_count: number
          connection_id: string | null
          event_type: string
          id: string
          message_id: string
          order_reference: string
          processed_at: string | null
          processing_error: string | null
          project_code: string
          raw_payload: Json
          received_at: string
          status: string
        }
        Insert: {
          attempt_count?: number
          connection_id?: string | null
          event_type: string
          id?: string
          message_id: string
          order_reference?: string
          processed_at?: string | null
          processing_error?: string | null
          project_code?: string
          raw_payload?: Json
          received_at?: string
          status?: string
        }
        Update: {
          attempt_count?: number
          connection_id?: string | null
          event_type?: string
          id?: string
          message_id?: string
          order_reference?: string
          processed_at?: string | null
          processing_error?: string | null
          project_code?: string
          raw_payload?: Json
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "noon_webhook_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "noon_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_orders: boolean
          email_quotes: boolean
          email_sourcing: boolean
          email_tickets: boolean
          id: string
          in_app_broadcasts: boolean
          in_app_orders: boolean
          in_app_quotes: boolean
          in_app_sourcing: boolean
          in_app_tickets: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_orders?: boolean
          email_quotes?: boolean
          email_sourcing?: boolean
          email_tickets?: boolean
          id?: string
          in_app_broadcasts?: boolean
          in_app_orders?: boolean
          in_app_quotes?: boolean
          in_app_sourcing?: boolean
          in_app_tickets?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_orders?: boolean
          email_quotes?: boolean
          email_sourcing?: boolean
          email_tickets?: boolean
          id?: string
          in_app_broadcasts?: boolean
          in_app_orders?: boolean
          in_app_quotes?: boolean
          in_app_sourcing?: boolean
          in_app_tickets?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          order_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          order_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          order_id?: string
          user_id?: string
        }
        Relationships: []
      }
      order_templates: {
        Row: {
          created_at: string
          destination: string
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          notes: string | null
          products: Json
          schedule_active: boolean
          schedule_frequency: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination?: string
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          notes?: string | null
          products?: Json
          schedule_active?: boolean
          schedule_frequency?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          notes?: string | null
          products?: Json
          schedule_active?: boolean
          schedule_frequency?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          destination: string
          id: string
          metadata: Json
          products: Json
          status: string
          total: number
          tracking_number: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string
          destination?: string
          id?: string
          metadata?: Json
          products?: Json
          status?: string
          total?: number
          tracking_number?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          destination?: string
          id?: string
          metadata?: Json
          products?: Json
          status?: string
          total?: number
          tracking_number?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_view_events: {
        Row: {
          browser: string
          country: string | null
          created_at: string
          device_type: string
          duration_ms: number | null
          id: string
          is_landing: boolean
          language: string | null
          os: string
          path: string
          referral_code: string | null
          referrer: string
          screen_h: number | null
          screen_w: number | null
          session_id: string
          timezone: string | null
          title: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string
          country?: string | null
          created_at?: string
          device_type?: string
          duration_ms?: number | null
          id?: string
          is_landing?: boolean
          language?: string | null
          os?: string
          path: string
          referral_code?: string | null
          referrer?: string
          screen_h?: number | null
          screen_w?: number | null
          session_id: string
          timezone?: string | null
          title?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string
          country?: string | null
          created_at?: string
          device_type?: string
          duration_ms?: number | null
          id?: string
          is_landing?: boolean
          language?: string | null
          os?: string
          path?: string
          referral_code?: string | null
          referrer?: string
          screen_h?: number | null
          screen_w?: number | null
          session_id?: string
          timezone?: string | null
          title?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount_sar: number | null
          created_at: string
          currency: string | null
          environment: string
          error_message: string | null
          id: string
          kind: string
          metadata: Json
          payment_intent_id: string | null
          plan_id: string | null
          provider: string
          session_id: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_sar?: number | null
          created_at?: string
          currency?: string | null
          environment?: string
          error_message?: string | null
          id?: string
          kind: string
          metadata?: Json
          payment_intent_id?: string | null
          plan_id?: string | null
          provider?: string
          session_id?: string | null
          status: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_sar?: number | null
          created_at?: string
          currency?: string | null
          environment?: string
          error_message?: string | null
          id?: string
          kind?: string
          metadata?: Json
          payment_intent_id?: string | null
          plan_id?: string | null
          provider?: string
          session_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          label?: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      platforms: {
        Row: {
          bg_classes: string
          created_at: string
          icon_url: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bg_classes?: string
          created_at?: string
          icon_url?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bg_classes?: string
          created_at?: string
          icon_url?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_activity_daily: {
        Row: {
          activity_date: string
          creator_email: string
          creator_source: string
          product_count: number
        }
        Insert: {
          activity_date: string
          creator_email?: string
          creator_source?: string
          product_count?: number
        }
        Update: {
          activity_date?: string
          creator_email?: string
          creator_source?: string
          product_count?: number
        }
        Relationships: []
      }
      product_alert_runs: {
        Row: {
          created_at: string
          failed: number
          frequency: string
          id: string
          new_products: number
          period_key: string
          queued: number
          recipients: number
          sent: number
          summary: Json
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          failed?: number
          frequency: string
          id?: string
          new_products?: number
          period_key: string
          queued?: number
          recipients?: number
          sent?: number
          summary?: Json
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          failed?: number
          frequency?: string
          id?: string
          new_products?: number
          period_key?: string
          queued?: number
          recipients?: number
          sent?: number
          summary?: Json
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_alert_settings: {
        Row: {
          day_of_week: number
          enabled: boolean
          frequency: string
          id: boolean
          last_run_at: string | null
          max_products: number
          send_hour: number
          updated_at: string
          window_days: number
        }
        Insert: {
          day_of_week?: number
          enabled?: boolean
          frequency?: string
          id?: boolean
          last_run_at?: string | null
          max_products?: number
          send_hour?: number
          updated_at?: string
          window_days?: number
        }
        Update: {
          day_of_week?: number
          enabled?: boolean
          frequency?: string
          id?: boolean
          last_run_at?: string | null
          max_products?: number
          send_hour?: number
          updated_at?: string
          window_days?: number
        }
        Relationships: []
      }
      product_category_counts_cache: {
        Row: {
          cnt: number
          detailed_category: string
          sub_category: string
          top_category: string
          updated_at: string
        }
        Insert: {
          cnt?: number
          detailed_category?: string
          sub_category?: string
          top_category?: string
          updated_at?: string
        }
        Update: {
          cnt?: number
          detailed_category?: string
          sub_category?: string
          top_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          rating: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          rating: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          rating?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_view_events: {
        Row: {
          created_at: string
          id: string
          product_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          bulk_price: number
          bulk_price_usd: number
          cost_usd: number
          created_at: string
          created_by: string | null
          created_by_email: string | null
          created_by_source: string
          description: string | null
          description_ar: string | null
          detailed_category: string
          dropship_price: number
          dropship_price_usd: number
          estimated_delivery: string | null
          gtin: string | null
          id: string
          images: string[]
          is_featured: boolean
          labelling_available: boolean | null
          low_stock_threshold: number
          moq: number
          name: string
          name_ar: string | null
          platforms: string[] | null
          price_sar: number
          price_usd: number
          search_text: string | null
          sku: string
          slug: string | null
          slug_ar: string | null
          source: string
          stock_qty: number
          sub_category: string
          supplier_id: string | null
          top_category: string
          track_inventory: boolean
          updated_at: string
          weight_kg: number
          wl_product_id: string | null
        }
        Insert: {
          bulk_price?: number
          bulk_price_usd?: number
          cost_usd?: number
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          created_by_source?: string
          description?: string | null
          description_ar?: string | null
          detailed_category?: string
          dropship_price?: number
          dropship_price_usd?: number
          estimated_delivery?: string | null
          gtin?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean
          labelling_available?: boolean | null
          low_stock_threshold?: number
          moq?: number
          name: string
          name_ar?: string | null
          platforms?: string[] | null
          price_sar?: number
          price_usd?: number
          search_text?: string | null
          sku: string
          slug?: string | null
          slug_ar?: string | null
          source?: string
          stock_qty?: number
          sub_category?: string
          supplier_id?: string | null
          top_category?: string
          track_inventory?: boolean
          updated_at?: string
          weight_kg?: number
          wl_product_id?: string | null
        }
        Update: {
          bulk_price?: number
          bulk_price_usd?: number
          cost_usd?: number
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          created_by_source?: string
          description?: string | null
          description_ar?: string | null
          detailed_category?: string
          dropship_price?: number
          dropship_price_usd?: number
          estimated_delivery?: string | null
          gtin?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean
          labelling_available?: boolean | null
          low_stock_threshold?: number
          moq?: number
          name?: string
          name_ar?: string | null
          platforms?: string[] | null
          price_sar?: number
          price_usd?: number
          search_text?: string | null
          sku?: string
          slug?: string | null
          slug_ar?: string | null
          source?: string
          stock_qty?: number
          sub_category?: string
          supplier_id?: string | null
          top_category?: string
          track_inventory?: boolean
          updated_at?: string
          weight_kg?: number
          wl_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_wl_product_id_fkey"
            columns: ["wl_product_id"]
            isOneToOne: false
            referencedRelation: "wl_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_address: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_sar: number
          updated_at: string
          uses_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_sar?: number
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_sar?: number
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          admin_reply: string | null
          created_at: string
          destination: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          quoted_price_sar: number | null
          quoted_total_sar: number | null
          status: string
          target_price_sar: number
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          destination?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          quoted_price_sar?: number | null
          quoted_total_sar?: number | null
          status?: string
          target_price_sar?: number
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          destination?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          quoted_price_sar?: number | null
          quoted_total_sar?: number | null
          status?: string
          target_price_sar?: number
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      referral_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          referral_code: string
          referral_user_id: string | null
          referrer_user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          referral_code: string
          referral_user_id?: string | null
          referrer_user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          referral_code?: string
          referral_user_id?: string | null
          referrer_user_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          membership_reward_paid: boolean
          referral_code: string
          referred_by: string | null
          reward_status: string
          rewarded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          membership_reward_paid?: boolean
          referral_code: string
          referred_by?: string | null
          reward_status?: string
          rewarded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          membership_reward_paid?: boolean
          referral_code?: string
          referred_by?: string | null
          reward_status?: string
          rewarded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      release_requests: {
        Row: {
          address_id: string | null
          created_at: string
          destination: string
          fulfillment_type: string
          id: string
          items: Json
          notes: string | null
          shipped_at: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          destination?: string
          fulfillment_type?: string
          id?: string
          items?: Json
          notes?: string | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_id?: string | null
          created_at?: string
          destination?: string
          fulfillment_type?: string
          id?: string
          items?: Json
          notes?: string | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          request_id: string
          request_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          request_id: string
          request_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          request_id?: string
          request_type?: string
          user_id?: string
        }
        Relationships: []
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          order_id: string
          photos: string[]
          reason: string
          refund_amount: number
          resolved_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          order_id: string
          photos?: string[]
          reason: string
          refund_amount?: number
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          photos?: string[]
          reason?: string
          refund_amount?: number
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          address_line1: string
          address_line2: string
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          notes: string | null
          phone: string
          postal_code: string
          recipient_name: string
          region: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string
          address_line2?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          notes?: string | null
          phone?: string
          postal_code?: string
          recipient_name?: string
          region?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          notes?: string | null
          phone?: string
          postal_code?: string
          recipient_name?: string
          region?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          address_line: string
          buyer_type: string
          city: string
          courier_id: string | null
          courier_name: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          import_shipping_sar: number
          items: Json
          metadata: Json
          notes: string
          order_ref: string
          payment_method: string
          payment_status: string
          region: string
          shipping_sar: number
          status: string
          stripe_session_id: string | null
          subtotal_sar: number
          total_sar: number
          updated_at: string
          user_id: string | null
          vat_sar: number
        }
        Insert: {
          address_line: string
          buyer_type?: string
          city: string
          courier_id?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          import_shipping_sar?: number
          items?: Json
          metadata?: Json
          notes?: string
          order_ref: string
          payment_method?: string
          payment_status?: string
          region?: string
          shipping_sar?: number
          status?: string
          stripe_session_id?: string | null
          subtotal_sar?: number
          total_sar?: number
          updated_at?: string
          user_id?: string | null
          vat_sar?: number
        }
        Update: {
          address_line?: string
          buyer_type?: string
          city?: string
          courier_id?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          import_shipping_sar?: number
          items?: Json
          metadata?: Json
          notes?: string
          order_ref?: string
          payment_method?: string
          payment_status?: string
          region?: string
          shipping_sar?: number
          status?: string
          stripe_session_id?: string | null
          subtotal_sar?: number
          total_sar?: number
          updated_at?: string
          user_id?: string | null
          vat_sar?: number
        }
        Relationships: []
      }
      shopify_connections: {
        Row: {
          access_token_ciphertext: string
          api_version: string
          auto_sync: boolean
          created_at: string
          currency: string
          id: string
          last_auth_at: string | null
          last_error: string | null
          last_inventory_sync_at: string | null
          last_order_sync_at: string | null
          last_product_sync_at: string | null
          location_id: string | null
          location_name: string | null
          market: string
          name: string
          pricing_rules: Json
          safety_stock: number
          setup_completed_at: string | null
          shop_domain: string
          shop_name: string | null
          status: string
          store_integration_id: string | null
          updated_at: string
          user_id: string
          webhook_secret_hash: string | null
          webhooks_registered_at: string | null
        }
        Insert: {
          access_token_ciphertext: string
          api_version?: string
          auto_sync?: boolean
          created_at?: string
          currency?: string
          id?: string
          last_auth_at?: string | null
          last_error?: string | null
          last_inventory_sync_at?: string | null
          last_order_sync_at?: string | null
          last_product_sync_at?: string | null
          location_id?: string | null
          location_name?: string | null
          market?: string
          name: string
          pricing_rules?: Json
          safety_stock?: number
          setup_completed_at?: string | null
          shop_domain: string
          shop_name?: string | null
          status?: string
          store_integration_id?: string | null
          updated_at?: string
          user_id: string
          webhook_secret_hash?: string | null
          webhooks_registered_at?: string | null
        }
        Update: {
          access_token_ciphertext?: string
          api_version?: string
          auto_sync?: boolean
          created_at?: string
          currency?: string
          id?: string
          last_auth_at?: string | null
          last_error?: string | null
          last_inventory_sync_at?: string | null
          last_order_sync_at?: string | null
          last_product_sync_at?: string | null
          location_id?: string | null
          location_name?: string | null
          market?: string
          name?: string
          pricing_rules?: Json
          safety_stock?: number
          setup_completed_at?: string | null
          shop_domain?: string
          shop_name?: string | null
          status?: string
          store_integration_id?: string | null
          updated_at?: string
          user_id?: string
          webhook_secret_hash?: string | null
          webhooks_registered_at?: string | null
        }
        Relationships: []
      }
      shopify_order_items: {
        Row: {
          created_at: string
          id: string
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          raw_payload: Json
          sku: string | null
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          raw_payload?: Json
          sku?: string | null
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          raw_payload?: Json
          sku?: string | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopify_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders: {
        Row: {
          connection_id: string
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          external_id: string
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          last_error: string | null
          order_number: string | null
          order_total: number
          placed_at: string | null
          raw_payload: Json
          shipping_address: Json
          status: string
          tejaraa_order_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          external_id: string
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          last_error?: string | null
          order_number?: string | null
          order_total?: number
          placed_at?: string | null
          raw_payload?: Json
          shipping_address?: Json
          status?: string
          tejaraa_order_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          external_id?: string
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          last_error?: string | null
          order_number?: string | null
          order_total?: number
          placed_at?: string | null
          raw_payload?: Json
          shipping_address?: Json
          status?: string
          tejaraa_order_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_orders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "shopify_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_product_links: {
        Row: {
          connection_id: string
          content_status: string
          created_at: string
          handle: string | null
          id: string
          inventory_item_id: string | null
          last_error: string | null
          last_pushed_at: string | null
          markup_type: string
          markup_value: number | null
          override_price: number | null
          partner_sku: string
          product_id: string
          shopify_product_id: string | null
          shopify_variant_id: string | null
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id: string
          content_status?: string
          created_at?: string
          handle?: string | null
          id?: string
          inventory_item_id?: string | null
          last_error?: string | null
          last_pushed_at?: string | null
          markup_type?: string
          markup_value?: number | null
          override_price?: number | null
          partner_sku: string
          product_id: string
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string
          content_status?: string
          created_at?: string
          handle?: string | null
          id?: string
          inventory_item_id?: string | null
          last_error?: string | null
          last_pushed_at?: string | null
          markup_type?: string
          markup_value?: number | null
          override_price?: number | null
          partner_sku?: string
          product_id?: string
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_product_links_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "shopify_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_product_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_sync_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          connection_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          job_type: string
          last_error: string | null
          locked_at: string | null
          max_attempts: number
          payload: Json
          run_after: string
          status: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          connection_id: string
          created_at?: string
          entity_id: string
          entity_type?: string
          id?: string
          job_type: string
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          payload?: Json
          run_after?: string
          status?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          connection_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          job_type?: string
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          payload?: Json
          run_after?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_sync_jobs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "shopify_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_sync_log: {
        Row: {
          connection_id: string
          created_at: string
          detail: Json
          direction: string
          duration_ms: number | null
          id: string
          message: string | null
          operation: string
          status: string
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          detail?: Json
          direction?: string
          duration_ms?: number | null
          id?: string
          message?: string | null
          operation: string
          status: string
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          detail?: Json
          direction?: string
          duration_ms?: number | null
          id?: string
          message?: string | null
          operation?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_sync_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "shopify_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_webhook_events: {
        Row: {
          connection_id: string | null
          created_at: string
          id: string
          processed: boolean
          raw_payload: Json
          shop_domain: string | null
          topic: string
          webhook_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          id?: string
          processed?: boolean
          raw_payload?: Json
          shop_domain?: string | null
          topic: string
          webhook_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          id?: string
          processed?: boolean
          raw_payload?: Json
          shop_domain?: string | null
          topic?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_webhook_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "shopify_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_otps: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
        }
        Relationships: []
      }
      signup_reminder_log: {
        Row: {
          created_at: string
          email: string
          id: string
          stage: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stage: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stage?: string
          user_id?: string
        }
        Relationships: []
      }
      site_events: {
        Row: {
          created_at: string
          id: string
          name: string
          path: string
          props: Json
          session_id: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          path?: string
          props?: Json
          session_id: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          path?: string
          props?: Json
          session_id?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      sourcing_requests: {
        Row: {
          admin_reply: string | null
          attachments: string[]
          category: string
          converted_product_id: string | null
          created_at: string
          destination: string
          id: string
          notes: string | null
          product_link: string | null
          product_name: string
          quantity: number
          quoted_price_sar: number | null
          status: string
          target_price_sar: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          attachments?: string[]
          category?: string
          converted_product_id?: string | null
          created_at?: string
          destination?: string
          id?: string
          notes?: string | null
          product_link?: string | null
          product_name: string
          quantity?: number
          quoted_price_sar?: number | null
          status?: string
          target_price_sar?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          attachments?: string[]
          category?: string
          converted_product_id?: string | null
          created_at?: string
          destination?: string
          id?: string
          notes?: string | null
          product_link?: string | null
          product_name?: string
          quantity?: number
          quoted_price_sar?: number | null
          status?: string
          target_price_sar?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          modules: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          modules?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          modules?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_integrations: {
        Row: {
          api_key_encrypted: string | null
          created_at: string
          id: string
          platform: string
          status: string
          store_name: string
          store_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          platform?: string
          status?: string
          store_name?: string
          store_url?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          platform?: string
          status?: string
          store_name?: string
          store_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sunsky_callback_events: {
        Row: {
          event_type: string
          id: string
          ip_address: string | null
          payload: Json
          processed: boolean
          processing_error: string | null
          received_at: string
          signature_ok: boolean
        }
        Insert: {
          event_type: string
          id?: string
          ip_address?: string | null
          payload?: Json
          processed?: boolean
          processing_error?: string | null
          received_at?: string
          signature_ok?: boolean
        }
        Update: {
          event_type?: string
          id?: string
          ip_address?: string | null
          payload?: Json
          processed?: boolean
          processing_error?: string | null
          received_at?: string
          signature_ok?: boolean
        }
        Relationships: []
      }
      sunsky_categories: {
        Row: {
          category_id: number
          child_count: number | null
          children_synced_at: string | null
          has_children: boolean
          level: number
          name: string
          name_ar: string | null
          parent_id: number | null
          path: string | null
          path_ar: string | null
          product_count: number | null
          raw: Json
          root_id: number | null
          sub_id: number | null
          synced_at: string
        }
        Insert: {
          category_id: number
          child_count?: number | null
          children_synced_at?: string | null
          has_children?: boolean
          level?: number
          name?: string
          name_ar?: string | null
          parent_id?: number | null
          path?: string | null
          path_ar?: string | null
          product_count?: number | null
          raw?: Json
          root_id?: number | null
          sub_id?: number | null
          synced_at?: string
        }
        Update: {
          category_id?: number
          child_count?: number | null
          children_synced_at?: string | null
          has_children?: boolean
          level?: number
          name?: string
          name_ar?: string | null
          parent_id?: number | null
          path?: string | null
          path_ar?: string | null
          product_count?: number | null
          raw?: Json
          root_id?: number | null
          sub_id?: number | null
          synced_at?: string
        }
        Relationships: []
      }
      sunsky_import_jobs: {
        Row: {
          category_id: number
          category_path: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed: number
          filters: Json
          id: string
          imported: number
          last_page: number
          processed: number
          skipped_oos: number
          started_by: string | null
          status: string
          total_estimate: number
          updated: number
          updated_at: string
        }
        Insert: {
          category_id: number
          category_path?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed?: number
          filters?: Json
          id?: string
          imported?: number
          last_page?: number
          processed?: number
          skipped_oos?: number
          started_by?: string | null
          status?: string
          total_estimate?: number
          updated?: number
          updated_at?: string
        }
        Update: {
          category_id?: number
          category_path?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed?: number
          filters?: Json
          id?: string
          imported?: number
          last_page?: number
          processed?: number
          skipped_oos?: number
          started_by?: string | null
          status?: string
          total_estimate?: number
          updated?: number
          updated_at?: string
        }
        Relationships: []
      }
      sunsky_imported_products: {
        Row: {
          created_at: string
          id: string
          imported_at: string
          imported_by: string | null
          in_stock: boolean
          last_category_id: number | null
          last_category_path: string | null
          last_image_urls: Json
          last_price_usd: number | null
          last_stock_qty: number | null
          last_synced_at: string
          markup_override_percent: number | null
          product_id: string | null
          raw_payload: Json
          sunsky_item_no: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          imported_at?: string
          imported_by?: string | null
          in_stock?: boolean
          last_category_id?: number | null
          last_category_path?: string | null
          last_image_urls?: Json
          last_price_usd?: number | null
          last_stock_qty?: number | null
          last_synced_at?: string
          markup_override_percent?: number | null
          product_id?: string | null
          raw_payload?: Json
          sunsky_item_no: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          imported_at?: string
          imported_by?: string | null
          in_stock?: boolean
          last_category_id?: number | null
          last_category_path?: string | null
          last_image_urls?: Json
          last_price_usd?: number | null
          last_stock_qty?: number | null
          last_synced_at?: string
          markup_override_percent?: number | null
          product_id?: string | null
          raw_payload?: Json
          sunsky_item_no?: string
          updated_at?: string
        }
        Relationships: []
      }
      sunsky_orders: {
        Row: {
          country_code: string
          created_at: string
          created_by: string | null
          id: string
          internal_order_id: string | null
          labels: Json
          request_payload: Json
          response_payload: Json
          shipping_method: string | null
          shipping_usd: number | null
          status: string
          sunsky_order_no: string | null
          total_usd: number | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          internal_order_id?: string | null
          labels?: Json
          request_payload?: Json
          response_payload?: Json
          shipping_method?: string | null
          shipping_usd?: number | null
          status?: string
          sunsky_order_no?: string | null
          total_usd?: number | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          internal_order_id?: string | null
          labels?: Json
          request_payload?: Json
          response_payload?: Json
          shipping_method?: string | null
          shipping_usd?: number | null
          status?: string
          sunsky_order_no?: string | null
          total_usd?: number | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sunsky_settings: {
        Row: {
          base_url: string
          created_at: string
          default_country: string
          default_currency: string
          default_markup_percent: number
          id: boolean
          last_balance_check_at: string | null
          last_balance_currency: string | null
          last_balance_value: number | null
          last_sync_at: string | null
          mode: string
          notes: string
          updated_at: string
          webhook_secret: string
        }
        Insert: {
          base_url?: string
          created_at?: string
          default_country?: string
          default_currency?: string
          default_markup_percent?: number
          id?: boolean
          last_balance_check_at?: string | null
          last_balance_currency?: string | null
          last_balance_value?: number | null
          last_sync_at?: string | null
          mode?: string
          notes?: string
          updated_at?: string
          webhook_secret?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          default_country?: string
          default_currency?: string
          default_markup_percent?: number
          id?: boolean
          last_balance_check_at?: string | null
          last_balance_currency?: string | null
          last_balance_value?: number | null
          last_sync_at?: string | null
          mode?: string
          notes?: string
          updated_at?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      sunsky_sync_log: {
        Row: {
          actor_id: string | null
          created_at: string
          endpoint: string
          error_message: string | null
          http_status: number | null
          id: string
          latency_ms: number | null
          request_summary: Json
          response_summary: Json
          result: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          endpoint: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          request_summary?: Json
          response_summary?: Json
          result?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          endpoint?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          request_summary?: Json
          response_summary?: Json
          result?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact_name: string
          country: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          lead_time_days: number
          name: string
          notes: string
          payment_terms: string
          phone: string
          updated_at: string
        }
        Insert: {
          contact_name?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          lead_time_days?: number
          name: string
          notes?: string
          payment_terms?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          contact_name?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          lead_time_days?: number
          name?: string
          notes?: string
          payment_terms?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invite_email: string
          invite_token: string
          member_role: Database["public"]["Enums"]["team_member_role"]
          member_user_id: string | null
          owner_id: string
          status: Database["public"]["Enums"]["team_invite_status"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invite_email: string
          invite_token?: string
          member_role?: Database["public"]["Enums"]["team_member_role"]
          member_user_id?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["team_invite_status"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invite_email?: string
          invite_token?: string
          member_role?: Database["public"]["Enums"]["team_member_role"]
          member_user_id?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["team_invite_status"]
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          source: string
          ticket_id: string
          user_id: string
          whatsapp_msg_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          source?: string
          ticket_id: string
          user_id: string
          whatsapp_msg_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          source?: string
          ticket_id?: string
          user_id?: string
          whatsapp_msg_id?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          last_admin_wa_msg_id: string | null
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          last_admin_wa_msg_id?: string | null
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          last_admin_wa_msg_id?: string | null
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_limit_defaults: {
        Row: {
          label: string
          limit_key: string
          limit_value: string
          updated_at: string
        }
        Insert: {
          label?: string
          limit_key: string
          limit_value?: string
          updated_at?: string
        }
        Update: {
          label?: string
          limit_key?: string
          limit_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string
          id: string
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string
          id?: string
          stripe_session_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string
          id?: string
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      warehouse_inventory: {
        Row: {
          created_at: string
          id: string
          last_movement_at: string
          notes: string | null
          product_id: string
          product_name: string
          qty_available: number | null
          qty_on_hand: number
          qty_reserved: number
          sku: string
          source_order_id: string | null
          storage_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_movement_at?: string
          notes?: string | null
          product_id: string
          product_name?: string
          qty_available?: number | null
          qty_on_hand?: number
          qty_reserved?: number
          sku?: string
          source_order_id?: string | null
          storage_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_movement_at?: string
          notes?: string | null
          product_id?: string
          product_name?: string
          qty_available?: number | null
          qty_on_hand?: number
          qty_reserved?: number
          sku?: string
          source_order_id?: string | null
          storage_started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          environment: string
          event_id: string
          event_type: string
          id: string
          payload_summary: Json
          provider: string
          received_at: string
        }
        Insert: {
          environment?: string
          event_id: string
          event_type: string
          id?: string
          payload_summary?: Json
          provider?: string
          received_at?: string
        }
        Update: {
          environment?: string
          event_id?: string
          event_type?: string
          id?: string
          payload_summary?: Json
          provider?: string
          received_at?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          body: string
          created_at: string
          customer_name: string
          direction: string
          error: string | null
          from_number: string | null
          id: string
          status: string
          ticket_id: string | null
          to_number: string
          user_id: string | null
          wa_msg_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          customer_name?: string
          direction: string
          error?: string | null
          from_number?: string | null
          id?: string
          status?: string
          ticket_id?: string | null
          to_number?: string
          user_id?: string | null
          wa_msg_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          customer_name?: string
          direction?: string
          error?: string | null
          from_number?: string | null
          id?: string
          status?: string
          ticket_id?: string | null
          to_number?: string
          user_id?: string | null
          wa_msg_id?: string | null
        }
        Relationships: []
      }
      wl_applications: {
        Row: {
          account_country: string
          business_name: string
          business_type: string
          city: string
          contact_email: string
          contact_mobile: string
          contact_name: string
          country: string
          created_at: string
          documents: Json
          id: string
          review_notes: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["wl_application_status"]
          submitted_at: string
          trading_name: string
          updated_at: string
          user_id: string
          warehouses: Json
          website: string
        }
        Insert: {
          account_country?: string
          business_name?: string
          business_type?: string
          city?: string
          contact_email?: string
          contact_mobile?: string
          contact_name?: string
          country?: string
          created_at?: string
          documents?: Json
          id?: string
          review_notes?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["wl_application_status"]
          submitted_at?: string
          trading_name?: string
          updated_at?: string
          user_id: string
          warehouses?: Json
          website?: string
        }
        Update: {
          account_country?: string
          business_name?: string
          business_type?: string
          city?: string
          contact_email?: string
          contact_mobile?: string
          contact_name?: string
          country?: string
          created_at?: string
          documents?: Json
          id?: string
          review_notes?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["wl_application_status"]
          submitted_at?: string
          trading_name?: string
          updated_at?: string
          user_id?: string
          warehouses?: Json
          website?: string
        }
        Relationships: []
      }
      wl_channel_connections: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          key_hash: string
          key_prefix: string
          last_order_at: string | null
          last_push_at: string | null
          name: string
          notes: string
          orders_pull_secret: string
          orders_pull_url: string
          push_secret: string
          push_url: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          key_hash?: string
          key_prefix?: string
          last_order_at?: string | null
          last_push_at?: string | null
          name: string
          notes?: string
          orders_pull_secret?: string
          orders_pull_url?: string
          push_secret?: string
          push_url?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          key_hash?: string
          key_prefix?: string
          last_order_at?: string | null
          last_push_at?: string | null
          name?: string
          notes?: string
          orders_pull_secret?: string
          orders_pull_url?: string
          push_secret?: string
          push_url?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      wl_channel_sync_log: {
        Row: {
          connection_id: string | null
          created_at: string
          detail: Json
          direction: string
          event: string
          id: string
          status: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          detail?: Json
          direction?: string
          event?: string
          id?: string
          status?: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          detail?: Json
          direction?: string
          event?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wl_channel_sync_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wl_channel_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      wl_integrations: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          key_hash: string
          key_prefix: string
          last_error: string
          last_status: string
          last_sync_at: string | null
          name: string
          notes: string
          pull_secret: string
          pull_url: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          key_hash?: string
          key_prefix?: string
          last_error?: string
          last_status?: string
          last_sync_at?: string | null
          name: string
          notes?: string
          pull_secret?: string
          pull_url?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          key_hash?: string
          key_prefix?: string
          last_error?: string
          last_status?: string
          last_sync_at?: string | null
          name?: string
          notes?: string
          pull_secret?: string
          pull_url?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      wl_inventory_batches: {
        Row: {
          accepted: number
          created_at: string
          detail: Json
          id: string
          integration_id: string
          rejected: number
          request_id: string
          source: string
          status: string
        }
        Insert: {
          accepted?: number
          created_at?: string
          detail?: Json
          id?: string
          integration_id: string
          rejected?: number
          request_id?: string
          source?: string
          status?: string
        }
        Update: {
          accepted?: number
          created_at?: string
          detail?: Json
          id?: string
          integration_id?: string
          rejected?: number
          request_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wl_inventory_batches_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "wl_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      wl_inventory_log: {
        Row: {
          batch_id: string | null
          created_at: string
          detail: Json
          id: string
          integration_id: string | null
          message: string
          sku: string
          status: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          integration_id?: string | null
          message?: string
          sku?: string
          status?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          integration_id?: string | null
          message?: string
          sku?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wl_inventory_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "wl_inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wl_inventory_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "wl_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      wl_market_flags: {
        Row: {
          code: string
          created_at: string
          image_url: string
          name: string
          note: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          image_url?: string
          name?: string
          note?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          image_url?: string
          name?: string
          note?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      wl_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          sku: string
          supplier_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          name?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          sku?: string
          supplier_id: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string
          supplier_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "wl_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "wl_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wl_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "wl_products"
            referencedColumns: ["id"]
          },
        ]
      }
      wl_orders: {
        Row: {
          buyer_country: string
          channel: string
          connection_id: string | null
          created_at: string
          currency: string
          external_reference: string
          external_status: string
          id: string
          order_value: number
          product_summary: string
          quantity: number
          raw_payload: Json
          reference: string
          shipping: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          buyer_country?: string
          channel?: string
          connection_id?: string | null
          created_at?: string
          currency?: string
          external_reference?: string
          external_status?: string
          id?: string
          order_value?: number
          product_summary?: string
          quantity?: number
          raw_payload?: Json
          reference?: string
          shipping?: string
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          buyer_country?: string
          channel?: string
          connection_id?: string | null
          created_at?: string
          currency?: string
          external_reference?: string
          external_status?: string
          id?: string
          order_value?: number
          product_summary?: string
          quantity?: number
          raw_payload?: Json
          reference?: string
          shipping?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wl_orders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wl_channel_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      wl_partner_profiles: {
        Row: {
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          mobile: string
          suspended_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id: string
          last_name?: string
          mobile?: string
          suspended_at?: string | null
          updated_at?: string
          username?: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          mobile?: string
          suspended_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      wl_payout_detail_history: {
        Row: {
          action: string
          actor_id: string | null
          bank_account_name: string
          bank_iban: string
          bank_name: string
          created_at: string
          document_name: string
          document_path: string
          id: string
          note: string
          status: string
          supplier_id: string
        }
        Insert: {
          action?: string
          actor_id?: string | null
          bank_account_name?: string
          bank_iban?: string
          bank_name?: string
          created_at?: string
          document_name?: string
          document_path?: string
          id?: string
          note?: string
          status?: string
          supplier_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          bank_account_name?: string
          bank_iban?: string
          bank_name?: string
          created_at?: string
          document_name?: string
          document_path?: string
          id?: string
          note?: string
          status?: string
          supplier_id?: string
        }
        Relationships: []
      }
      wl_payout_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          note: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          note?: string
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          note?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      wl_products: {
        Row: {
          brand: string
          brand_ar: string | null
          category: string
          category_id: number | null
          category_l1_id: number | null
          category_l2_id: number | null
          category_l3_id: number | null
          category_path: string | null
          created_at: string
          currency: string
          description: string
          description_ar: string | null
          dropship_price: number
          id: string
          images: Json
          is_active: boolean
          moq: number
          name: string
          name_ar: string | null
          review_notes: string
          sku: string
          status: Database["public"]["Enums"]["wl_product_status"]
          stock: number
          supplier_id: string
          updated_at: string
          warehouse: string
          wholesale_price: number
        }
        Insert: {
          brand?: string
          brand_ar?: string | null
          category?: string
          category_id?: number | null
          category_l1_id?: number | null
          category_l2_id?: number | null
          category_l3_id?: number | null
          category_path?: string | null
          created_at?: string
          currency?: string
          description?: string
          description_ar?: string | null
          dropship_price?: number
          id?: string
          images?: Json
          is_active?: boolean
          moq?: number
          name: string
          name_ar?: string | null
          review_notes?: string
          sku?: string
          status?: Database["public"]["Enums"]["wl_product_status"]
          stock?: number
          supplier_id: string
          updated_at?: string
          warehouse?: string
          wholesale_price?: number
        }
        Update: {
          brand?: string
          brand_ar?: string | null
          category?: string
          category_id?: number | null
          category_l1_id?: number | null
          category_l2_id?: number | null
          category_l3_id?: number | null
          category_path?: string | null
          created_at?: string
          currency?: string
          description?: string
          description_ar?: string | null
          dropship_price?: number
          id?: string
          images?: Json
          is_active?: boolean
          moq?: number
          name?: string
          name_ar?: string | null
          review_notes?: string
          sku?: string
          status?: Database["public"]["Enums"]["wl_product_status"]
          stock?: number
          supplier_id?: string
          updated_at?: string
          warehouse?: string
          wholesale_price?: number
        }
        Relationships: []
      }
      wl_settings: {
        Row: {
          bank_account_name: string
          bank_iban: string
          bank_name: string
          channels: Json
          created_at: string
          default_currency: string
          dropship_enabled: boolean
          dropship_uplift: number
          low_stock_threshold: number
          min_order_value: number
          order_notifications: boolean
          payout_document: string
          payout_document_name: string
          payout_review_notes: string
          payout_reviewed_at: string | null
          payout_status: string
          payout_submitted_at: string | null
          stock_notifications: boolean
          supplier_id: string
          updated_at: string
        }
        Insert: {
          bank_account_name?: string
          bank_iban?: string
          bank_name?: string
          channels?: Json
          created_at?: string
          default_currency?: string
          dropship_enabled?: boolean
          dropship_uplift?: number
          low_stock_threshold?: number
          min_order_value?: number
          order_notifications?: boolean
          payout_document?: string
          payout_document_name?: string
          payout_review_notes?: string
          payout_reviewed_at?: string | null
          payout_status?: string
          payout_submitted_at?: string | null
          stock_notifications?: boolean
          supplier_id: string
          updated_at?: string
        }
        Update: {
          bank_account_name?: string
          bank_iban?: string
          bank_name?: string
          channels?: Json
          created_at?: string
          default_currency?: string
          dropship_enabled?: boolean
          dropship_uplift?: number
          low_stock_threshold?: number
          min_order_value?: number
          order_notifications?: boolean
          payout_document?: string
          payout_document_name?: string
          payout_review_notes?: string
          payout_reviewed_at?: string | null
          payout_status?: string
          payout_submitted_at?: string | null
          stock_notifications?: boolean
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      wl_user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["wl_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["wl_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["wl_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_category_counts: {
        Row: {
          cnt: number | null
          detailed_category: string | null
          sub_category: string | null
          top_category: string | null
        }
        Relationships: []
      }
      product_rating_stats: {
        Row: {
          avg_rating: number | null
          product_id: string | null
          review_count: number | null
        }
        Relationships: []
      }
      product_view_counts: {
        Row: {
          product_id: string | null
          total_views: number | null
          views_30d: number | null
          views_7d: number | null
          views_90d: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      __import_exec: { Args: { sql: string }; Returns: undefined }
      accept_team_invite: { Args: { _token: string }; Returns: Json }
      admin_adjust_inventory: {
        Args: { _inventory_id: string; _qty_change: number; _reason: string }
        Returns: Json
      }
      admin_list_customers: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          id: string
          lifetime: number
          order_count: number
          tags: Json
          total_count: number
          user_id: string
          wallet_balance: number
        }[]
      }
      admin_product_add_stats: { Args: { _days?: number }; Returns: Json }
      admin_send_notification: {
        Args: { _body: string; _link: string; _title: string; _user_id: string }
        Returns: Json
      }
      analytics_session_timeline: {
        Args: { _session_id: string }
        Returns: {
          at: string
          detail: string
          kind: string
          label: string
        }[]
      }
      analytics_sessions: {
        Args: { _days?: number; _limit?: number; _search?: string }
        Returns: {
          browser: string
          converted: boolean
          country: string
          device_type: string
          display_name: string
          email: string
          first_seen: string
          landing_page: string
          last_page: string
          last_seen: string
          page_views: number
          referrer: string
          session_id: string
          user_id: string
          visitor_id: string
        }[]
      }
      analytics_summary: { Args: { _days?: number }; Returns: Json }
      apply_pricing_formula:
        | { Args: never; Returns: number }
        | {
            Args: { _cost_usd?: number; _source?: string; _weight_kg?: number }
            Returns: number
          }
      apply_referral_code: { Args: { _code: string }; Returns: Json }
      broadcast_notification: {
        Args: {
          _audience?: string
          _body: string
          _link: string
          _title: string
        }
        Returns: number
      }
      build_zatca_qr: {
        Args: {
          _seller_name: string
          _seller_vat: string
          _timestamp: string
          _total: number
          _vat: number
        }
        Returns: string
      }
      claim_guest_shop_orders: { Args: never; Returns: Json }
      create_notification: {
        Args: {
          _body: string
          _link: string
          _metadata?: Json
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      gen_referral_code: { Args: never; Returns: string }
      generate_invoice_for_order: {
        Args: { _order_id: string }
        Returns: string
      }
      generate_invoice_number: { Args: never; Returns: string }
      get_team_owner: { Args: { _user_id: string }; Returns: string }
      get_user_plan_limit: {
        Args: { _limit_key: string; _user_id: string }
        Returns: number
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_module_access: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hunt_catalog_products: {
        Args: {
          _category?: string
          _in_stock?: boolean
          _limit?: number
          _max_price?: number
          _min_price?: number
          _offset?: number
          _relaxed?: boolean
          _source?: string
          _terms: string[]
        }
        Returns: {
          bulk_price: number
          bulk_price_usd: number
          cost_usd: number
          created_at: string
          detailed_category: string
          dropship_price: number
          dropship_price_usd: number
          estimated_delivery: string
          id: string
          images: string[]
          is_featured: boolean
          labelling_available: boolean
          match_score: number
          moq: number
          name: string
          name_ar: string
          platforms: string[]
          price_sar: number
          price_usd: number
          sku: string
          source: string
          stock_qty: number
          sub_category: string
          top_category: string
          total_count: number
          track_inventory: boolean
          weight_kg: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: boolean
      }
      notify_admins: {
        Args: {
          _body: string
          _link: string
          _metadata?: Json
          _title: string
          _type: string
        }
        Returns: undefined
      }
      pricing_setting: {
        Args: { _default: number; _key: string }
        Returns: number
      }
      product_digest_stats: {
        Args: { _limit?: number; _since: string }
        Returns: Json
      }
      queue_email:
        | {
            Args: {
              _dedupe_key?: string
              _payload: Json
              _recipient_email?: string
              _template_name: string
              _user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              _dedupe_key?: string
              _payload: Json
              _recipient_email?: string
              _template_name: string
              _user_id: string
            }
            Returns: string
          }
      read_email_batch: {
        Args: { batch_size?: number; queue_name: string; vt?: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          vt_at: string
        }[]
      }
      record_page_duration: {
        Args: { _id: string; _ms: number }
        Returns: undefined
      }
      redeem_promo_code: { Args: { _code: string }; Returns: Json }
      refresh_category_counts_cache: { Args: never; Returns: number }
      refresh_category_counts_if_dirty: { Args: never; Returns: Json }
      reprice_products_batch: {
        Args: { _batch_size?: number }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { _txt: string }; Returns: string }
      sunsky_rebuild_category_paths: { Args: never; Returns: number }
      sunsky_rebuild_category_paths_ar: { Args: never; Returns: number }
      team_can_buy: { Args: { _user_id: string }; Returns: boolean }
      track_referral_visit: {
        Args: { _code: string; _meta?: Json }
        Returns: Json
      }
      validate_promo_code: {
        Args: { _code: string; _order_total: number }
        Returns: Json
      }
      wallet_admin_adjust: {
        Args: {
          _amount: number
          _description: string
          _type: string
          _user_id: string
        }
        Returns: Json
      }
      wallet_apply: {
        Args: {
          _amount: number
          _description: string
          _stripe_session_id?: string
          _type: string
          _user_id: string
        }
        Returns: Json
      }
      wallet_credit_from_payment: {
        Args: {
          _amount: number
          _description: string
          _stripe_session_id: string
          _user_id: string
        }
        Returns: Json
      }
      wallet_debit_for_order: {
        Args: { _amount: number; _order_id: string }
        Returns: Json
      }
      wallet_debit_for_release: {
        Args: { _amount: number; _release_id: string }
        Returns: Json
      }
      wallet_get_balance: { Args: never; Returns: number }
      wants_notification: {
        Args: { _type: string; _user_id: string }
        Returns: boolean
      }
      weight_fee_in_price: { Args: { _source: string }; Returns: boolean }
      wl_catalog_image_urls: { Args: { _images: Json }; Returns: string[] }
      wl_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["wl_role"]
          _user_id: string
        }
        Returns: boolean
      }
      wl_resync_catalog: { Args: never; Returns: Json }
      wl_supplier_is_approved: { Args: { _user_id: string }; Returns: boolean }
      wl_sync_product_to_catalog: { Args: { _wl_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "staff"
      team_invite_status: "pending" | "accepted" | "revoked"
      team_member_role: "owner" | "admin" | "member" | "viewer" | "buyer"
      wl_application_status: "pending" | "approved" | "rejected"
      wl_product_status:
        | "draft"
        | "pending"
        | "active"
        | "rejected"
        | "out_of_stock"
      wl_role: "admin" | "supplier" | "staff" | "finance" | "viewer"
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
    Enums: {
      app_role: ["admin", "moderator", "user", "staff"],
      team_invite_status: ["pending", "accepted", "revoked"],
      team_member_role: ["owner", "admin", "member", "viewer", "buyer"],
      wl_application_status: ["pending", "approved", "rejected"],
      wl_product_status: [
        "draft",
        "pending",
        "active",
        "rejected",
        "out_of_stock",
      ],
      wl_role: ["admin", "supplier", "staff", "finance", "viewer"],
    },
  },
} as const
