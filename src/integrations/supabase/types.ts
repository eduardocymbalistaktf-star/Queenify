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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          buyer_email: string
          buyer_name: string | null
          buyer_phone: string | null
          cart_value: number
          created_at: string
          id: string
          last_attempt_at: string | null
          product_id: string
          recovered_at: string | null
          recovery_attempts: number
          recovery_status: string
          user_id: string
        }
        Insert: {
          buyer_email: string
          buyer_name?: string | null
          buyer_phone?: string | null
          cart_value?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          product_id: string
          recovered_at?: string | null
          recovery_attempts?: number
          recovery_status?: string
          user_id: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          cart_value?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          product_id?: string
          recovered_at?: string | null
          recovery_attempts?: number
          recovery_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abandoned_carts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      boost_purchases: {
        Row: {
          auto_renew: boolean
          created_at: string
          ends_at: string
          id: string
          payment_method: string
          plan_id: string
          price_paid: number
          product_id: string | null
          renewal_status: string
          starts_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          ends_at: string
          id?: string
          payment_method?: string
          plan_id: string
          price_paid?: number
          product_id?: string | null
          renewal_status?: string
          starts_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          payment_method?: string
          plan_id?: string
          price_paid?: number
          product_id?: string | null
          renewal_status?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chargebacks: {
        Row: {
          amount: number
          created_at: string
          id: string
          negative_balance: number
          paid_at: string | null
          product_id: string
          reason: string | null
          sale_id: string
          serasa_deadline: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          negative_balance?: number
          paid_at?: string | null
          product_id: string
          reason?: string | null
          sale_id: string
          serasa_deadline?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          negative_balance?: number
          paid_at?: string | null
          product_id?: string
          reason?: string | null
          sale_id?: string
          serasa_deadline?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkout_links: {
        Row: {
          created_at: string
          id: string
          name: string
          product_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          product_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_settings: {
        Row: {
          accent_color: string | null
          banner_url: string | null
          countdown_enabled: boolean
          countdown_minutes: number | null
          created_at: string
          custom_cta_text: string | null
          custom_header_text: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          product_id: string
          secondary_color: string | null
          show_guarantee_badge: boolean
          show_security_badge: boolean
          show_testimonials: boolean
          theme: string
          updated_at: string
          urgency_enabled: boolean
          urgency_text: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          banner_url?: string | null
          countdown_enabled?: boolean
          countdown_minutes?: number | null
          created_at?: string
          custom_cta_text?: string | null
          custom_header_text?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          product_id: string
          secondary_color?: string | null
          show_guarantee_badge?: boolean
          show_security_badge?: boolean
          show_testimonials?: boolean
          theme?: string
          updated_at?: string
          urgency_enabled?: boolean
          urgency_text?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string | null
          banner_url?: string | null
          countdown_enabled?: boolean
          countdown_minutes?: number | null
          created_at?: string
          custom_cta_text?: string | null
          custom_header_text?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          product_id?: string
          secondary_color?: string | null
          show_guarantee_badge?: boolean
          show_security_badge?: boolean
          show_testimonials?: boolean
          theme?: string
          updated_at?: string
          urgency_enabled?: boolean
          urgency_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_invites: {
        Row: {
          created_at: string
          id: string
          invite_token: string
          invitee_email: string
          inviter_id: string
          message: string | null
          responded_at: string | null
          role: string
          share_percentage: number | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_token?: string
          invitee_email: string
          inviter_id: string
          message?: string | null
          responded_at?: string | null
          role?: string
          share_percentage?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_token?: string
          invitee_email?: string
          inviter_id?: string
          message?: string | null
          responded_at?: string | null
          role?: string
          share_percentage?: number | null
          status?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_purchase: number | null
          product_id: string | null
          starts_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase?: number | null
          product_id?: string | null
          starts_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase?: number | null
          product_id?: string | null
          starts_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          duration_minutes: number | null
          id: string
          is_free_preview: boolean
          module_id: string
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean
          module_id: string
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean
          module_id?: string
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          display_order: number
          id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          display_order?: number
          id?: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          display_order?: number
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          product_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          product_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          product_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      external_webhook_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_received_at: string | null
          source: string
          token: string
          total_received: number
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_received_at?: string | null
          source?: string
          token?: string
          total_received?: number
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_received_at?: string | null
          source?: string
          token?: string
          total_received?: number
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_bumps: {
        Row: {
          bump_product_id: string
          created_at: string
          discount_percent: number | null
          id: string
          is_active: boolean | null
          product_id: string
        }
        Insert: {
          bump_product_id: string
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          product_id: string
        }
        Update: {
          bump_product_id?: string
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_bumps_bump_product_id_fkey"
            columns: ["bump_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_bump_product_id_fkey"
            columns: ["bump_product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          owner_id: string | null
          path: string
          product_id: string | null
          referrer: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string | null
          path: string
          product_id?: string | null
          referrer?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string | null
          path?: string
          product_id?: string | null
          referrer?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          ad_auto_review: boolean | null
          ad_block_adult_content: boolean | null
          ad_block_financial_promises: boolean | null
          ad_block_health_claims: boolean | null
          ad_block_misleading: boolean | null
          ad_block_prohibited: boolean | null
          ad_max_daily_budget: number | null
          ad_pixel_verification: boolean | null
          ad_require_disclaimer: boolean | null
          ad_require_landing_page: boolean | null
          allow_affiliate_requests: boolean | null
          allow_collaboration: boolean | null
          allow_email_marketing: boolean | null
          allow_public_profile: boolean | null
          anti_fraud_enabled: boolean | null
          auto_payout: boolean | null
          chargeback_auto_block: boolean | null
          created_at: string
          escrow_days: number | null
          id: string
          max_refund_rate: number | null
          require_kyc_above: number | null
          updated_at: string
          user_id: string
          withdrawal_cooldown_hours: number | null
          withdrawal_min_amount: number | null
        }
        Insert: {
          ad_auto_review?: boolean | null
          ad_block_adult_content?: boolean | null
          ad_block_financial_promises?: boolean | null
          ad_block_health_claims?: boolean | null
          ad_block_misleading?: boolean | null
          ad_block_prohibited?: boolean | null
          ad_max_daily_budget?: number | null
          ad_pixel_verification?: boolean | null
          ad_require_disclaimer?: boolean | null
          ad_require_landing_page?: boolean | null
          allow_affiliate_requests?: boolean | null
          allow_collaboration?: boolean | null
          allow_email_marketing?: boolean | null
          allow_public_profile?: boolean | null
          anti_fraud_enabled?: boolean | null
          auto_payout?: boolean | null
          chargeback_auto_block?: boolean | null
          created_at?: string
          escrow_days?: number | null
          id?: string
          max_refund_rate?: number | null
          require_kyc_above?: number | null
          updated_at?: string
          user_id: string
          withdrawal_cooldown_hours?: number | null
          withdrawal_min_amount?: number | null
        }
        Update: {
          ad_auto_review?: boolean | null
          ad_block_adult_content?: boolean | null
          ad_block_financial_promises?: boolean | null
          ad_block_health_claims?: boolean | null
          ad_block_misleading?: boolean | null
          ad_block_prohibited?: boolean | null
          ad_max_daily_budget?: number | null
          ad_pixel_verification?: boolean | null
          ad_require_disclaimer?: boolean | null
          ad_require_landing_page?: boolean | null
          allow_affiliate_requests?: boolean | null
          allow_collaboration?: boolean | null
          allow_email_marketing?: boolean | null
          allow_public_profile?: boolean | null
          anti_fraud_enabled?: boolean | null
          auto_payout?: boolean | null
          chargeback_auto_block?: boolean | null
          created_at?: string
          escrow_days?: number | null
          id?: string
          max_refund_rate?: number | null
          require_kyc_above?: number | null
          updated_at?: string
          user_id?: string
          withdrawal_cooldown_hours?: number | null
          withdrawal_min_amount?: number | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          is_verified_purchase: boolean
          product_id: string
          rating: number
          reviewer_avatar: string | null
          reviewer_id: string | null
          reviewer_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id: string
          rating?: number
          reviewer_avatar?: string | null
          reviewer_id?: string | null
          reviewer_name?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id?: string
          rating?: number
          reviewer_avatar?: string | null
          reviewer_id?: string | null
          reviewer_name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          billing_interval: string | null
          billing_type: string
          category: string | null
          commission_rate: number | null
          created_at: string
          delivery_type: string | null
          description: string | null
          guarantee_days: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          language: string | null
          name: string
          niche: string | null
          price: number
          sub_niche: string | null
          tags: string[] | null
          total_sales: number | null
          tracking_pixel: string | null
          trial_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval?: string | null
          billing_type?: string
          category?: string | null
          commission_rate?: number | null
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          guarantee_days?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          language?: string | null
          name: string
          niche?: string | null
          price?: number
          sub_niche?: string | null
          tags?: string[] | null
          total_sales?: number | null
          tracking_pixel?: string | null
          trial_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?: string | null
          billing_type?: string
          category?: string | null
          commission_rate?: number | null
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          guarantee_days?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          language?: string | null
          name?: string
          niche?: string | null
          price?: number
          sub_niche?: string | null
          tags?: string[] | null
          total_sales?: number | null
          tracking_pixel?: string | null
          trial_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          motivo: string
          resposta: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          motivo: string
          resposta?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          motivo?: string
          resposta?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roas_alert_executions: {
        Row: {
          alerts_created: number
          campaigns_checked: number
          created_at: string
          error_message: string | null
          id: string
          status: string
          triggered_by: string
          user_id: string
        }
        Insert: {
          alerts_created?: number
          campaigns_checked?: number
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          triggered_by?: string
          user_id: string
        }
        Update: {
          alerts_created?: number
          campaigns_checked?: number
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          triggered_by?: string
          user_id?: string
        }
        Relationships: []
      }
      roas_alert_schedules: {
        Row: {
          created_at: string
          cron_jobid: number | null
          frequency: string
          hour_utc: number
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          cron_jobid?: number | null
          frequency?: string
          hour_utc?: number
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id: string
          weekday?: number
        }
        Update: {
          created_at?: string
          cron_jobid?: number | null
          frequency?: string
          hour_utc?: number
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string
          role: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by: string
          role: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          enabled: boolean
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          affiliate_name: string | null
          amount: number
          buyer_email: string
          buyer_name: string | null
          commission_amount: number | null
          created_at: string
          external_reference: string | null
          external_source: string | null
          fbclid: string | null
          gclid: string | null
          id: string
          landing_url: string | null
          mp_payment_id: string | null
          payment_details: Json | null
          payment_method: string | null
          product_id: string
          sold_at: string
          status: string
          ttclid: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          affiliate_name?: string | null
          amount: number
          buyer_email: string
          buyer_name?: string | null
          commission_amount?: number | null
          created_at?: string
          external_reference?: string | null
          external_source?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          landing_url?: string | null
          mp_payment_id?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          product_id: string
          sold_at?: string
          status?: string
          ttclid?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          affiliate_name?: string | null
          amount?: number
          buyer_email?: string
          buyer_name?: string | null
          commission_amount?: number | null
          created_at?: string
          external_reference?: string | null
          external_source?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          landing_url?: string | null
          mp_payment_id?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          product_id?: string
          sold_at?: string
          status?: string
          ttclid?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          student_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          student_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_bot_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_bot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_bot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "tracking_bot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_campaigns: {
        Row: {
          created_at: string
          daily_budget: number | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          platform: string
          start_date: string | null
          total_spent: number | null
          updated_at: string
          user_id: string
          utm_campaign: string
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          daily_budget?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          platform?: string
          start_date?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
          utm_campaign: string
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          daily_budget?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          platform?: string
          start_date?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
          utm_campaign?: string
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      tracking_costs: {
        Row: {
          amount: number
          campaign_id: string | null
          clicks: number | null
          created_at: string
          date: string
          id: string
          impressions: number | null
          notes: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          campaign_id?: string | null
          clicks?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          clicks?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_costs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "tracking_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_name: string
          id: string
          platform: string
          response: Json | null
          sale_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_name?: string
          id?: string
          platform: string
          response?: Json | null
          sale_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_name?: string
          id?: string
          platform?: string
          response?: Json | null
          sale_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_pixels: {
        Row: {
          access_token: string
          conversion_label: string | null
          created_at: string
          events_sent_count: number
          id: string
          is_active: boolean
          last_event_at: string | null
          pixel_id: string
          platform: string
          test_event_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          conversion_label?: string | null
          created_at?: string
          events_sent_count?: number
          id?: string
          is_active?: boolean
          last_event_at?: string | null
          pixel_id: string
          platform: string
          test_event_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          conversion_label?: string | null
          created_at?: string
          events_sent_count?: number
          id?: string
          is_active?: boolean
          last_event_at?: string | null
          pixel_id?: string
          platform?: string
          test_event_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutorial_progress: {
        Row: {
          completed_at: string
          id: string
          step_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          step_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          step_key?: string
          user_id?: string
        }
        Relationships: []
      }
      upsell_flows: {
        Row: {
          created_at: string
          discount_percent: number | null
          display_order: number
          flow_type: string
          id: string
          is_active: boolean
          product_id: string
          upsell_product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          display_order?: number
          flow_type?: string
          id?: string
          is_active?: boolean
          product_id: string
          upsell_product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          display_order?: number
          flow_type?: string
          id?: string
          is_active?: boolean
          product_id?: string
          upsell_product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_flows_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_flows_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_flows_upsell_product_id_fkey"
            columns: ["upsell_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_flows_upsell_product_id_fkey"
            columns: ["upsell_product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_competition_stats: {
        Row: {
          cooldown_until: string | null
          has_top1_badge: boolean
          id: string
          level_at_win: string | null
          total_stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cooldown_until?: string | null
          has_top1_badge?: boolean
          id?: string
          level_at_win?: string | null
          total_stars?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cooldown_until?: string | null
          has_top1_badge?: boolean
          id?: string
          level_at_win?: string | null
          total_stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_pixels: {
        Row: {
          created_at: string
          id: string
          pixel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pixel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pixel_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          accent_color: string | null
          backup_codes: string[] | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          bio: string | null
          created_at: string
          custom_domain: string | null
          doc_address_url: string | null
          doc_cpf_url: string | null
          doc_rg_url: string | null
          doc_selfie_url: string | null
          domain_verified: boolean | null
          id: string
          notification_preferences: Json | null
          pix_key: string | null
          pix_key_type: string | null
          show_frame: boolean | null
          show_level: boolean | null
          social_instagram: string | null
          social_tiktok: string | null
          social_youtube: string | null
          theme: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          backup_codes?: string[] | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          bio?: string | null
          created_at?: string
          custom_domain?: string | null
          doc_address_url?: string | null
          doc_cpf_url?: string | null
          doc_rg_url?: string | null
          doc_selfie_url?: string | null
          domain_verified?: boolean | null
          id?: string
          notification_preferences?: Json | null
          pix_key?: string | null
          pix_key_type?: string | null
          show_frame?: boolean | null
          show_level?: boolean | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_youtube?: string | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          backup_codes?: string[] | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          bio?: string | null
          created_at?: string
          custom_domain?: string | null
          doc_address_url?: string | null
          doc_cpf_url?: string | null
          doc_rg_url?: string | null
          doc_selfie_url?: string | null
          domain_verified?: boolean | null
          id?: string
          notification_preferences?: Json | null
          pix_key?: string | null
          pix_key_type?: string | null
          show_frame?: boolean | null
          show_level?: boolean | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_youtube?: string | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_rate_limits: {
        Row: {
          id: string
          request_count: number
          token_id: string
          window_start: string
        }
        Insert: {
          id?: string
          request_count?: number
          token_id: string
          window_start?: string
        }
        Update: {
          id?: string
          request_count?: number
          token_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_rate_limits_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "external_webhook_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          secret_key: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          secret_key?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          secret_key?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_competitions: {
        Row: {
          boost_awarded: boolean
          created_at: string
          id: string
          stars_earned: number
          total_sales_amount: number
          total_sales_count: number
          week_start: string
          winner_product_id: string
          winner_user_id: string
        }
        Insert: {
          boost_awarded?: boolean
          created_at?: string
          id?: string
          stars_earned?: number
          total_sales_amount?: number
          total_sales_count?: number
          week_start: string
          winner_product_id: string
          winner_user_id: string
        }
        Update: {
          boost_awarded?: boolean
          created_at?: string
          id?: string
          stars_earned?: number
          total_sales_amount?: number
          total_sales_count?: number
          week_start?: string
          winner_product_id?: string
          winner_user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products_public: {
        Row: {
          billing_interval: string | null
          billing_type: string | null
          category: string | null
          commission_rate: number | null
          created_at: string | null
          delivery_type: string | null
          description: string | null
          guarantee_days: number | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          language: string | null
          name: string | null
          niche: string | null
          price: number | null
          sub_niche: string | null
          tags: string[] | null
          total_sales: number | null
          trial_days: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_interval?: string | null
          billing_type?: string | null
          category?: string | null
          commission_rate?: number | null
          created_at?: string | null
          delivery_type?: string | null
          description?: string | null
          guarantee_days?: number | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          language?: string | null
          name?: string | null
          niche?: string | null
          price?: number | null
          sub_niche?: string | null
          tags?: string[] | null
          total_sales?: number | null
          trial_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_interval?: string | null
          billing_type?: string | null
          category?: string | null
          commission_rate?: number | null
          created_at?: string | null
          delivery_type?: string | null
          description?: string | null
          guarantee_days?: number | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          language?: string | null
          name?: string | null
          niche?: string | null
          price?: number | null
          sub_niche?: string | null
          tags?: string[] | null
          total_sales?: number | null
          trial_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tracking_pixels_safe: {
        Row: {
          conversion_label: string | null
          created_at: string | null
          events_sent_count: number | null
          id: string | null
          is_active: boolean | null
          last_event_at: string | null
          pixel_id: string | null
          platform: string | null
          test_event_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversion_label?: string | null
          created_at?: string | null
          events_sent_count?: number | null
          id?: string | null
          is_active?: boolean | null
          last_event_at?: string | null
          pixel_id?: string | null
          platform?: string | null
          test_event_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversion_label?: string | null
          created_at?: string | null
          events_sent_count?: number | null
          id?: string | null
          is_active?: boolean | null
          last_event_at?: string | null
          pixel_id?: string | null
          platform?: string | null
          test_event_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_invite_by_token: { Args: { _token: string }; Returns: Json }
      get_public_profile_settings: { Args: { _user_id: string }; Returns: Json }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      schedule_user_roas_cron: {
        Args: {
          p_cron_expr: string
          p_fn_url: string
          p_job_name: string
          p_service_key: string
          p_user_id: string
        }
        Returns: number
      }
      unschedule_user_roas_cron: {
        Args: { p_job_name: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderador" | "produtor" | "afiliado"
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
      app_role: ["admin", "moderador", "produtor", "afiliado"],
    },
  },
} as const
