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
      institutions: {
        Row: {
          id: string
          name: string
          code: string
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          settings: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          settings?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          settings?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          institution_id: string | null
          role: 'super_admin' | 'school_admin' | 'accountant' | 'teacher' | 'student' | 'parent'
          first_name: string
          last_name: string | null
          email: string
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          institution_id?: string | null
          role: 'super_admin' | 'school_admin' | 'accountant' | 'teacher' | 'student' | 'parent'
          first_name: string
          last_name?: string | null
          email: string
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string | null
          role?: 'super_admin' | 'school_admin' | 'accountant' | 'teacher' | 'student' | 'parent'
          first_name?: string
          last_name?: string | null
          email?: string
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          institution_id: string
          name: string
          code: string
          description: string | null
          academic_year: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          code: string
          description?: string | null
          academic_year: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          code?: string
          description?: string | null
          academic_year?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          institution_id: string
          class_id: string | null
          roll_number: string
          first_name: string
          last_name: string | null
          date_of_birth: string | null
          gender: string | null
          address: string | null
          emergency_contact: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_email: string | null
          parent_contact_id: string | null
          admission_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          class_id?: string | null
          roll_number: string
          first_name: string
          last_name?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          emergency_contact?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          parent_contact_id?: string | null
          admission_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          class_id?: string | null
          roll_number?: string
          first_name?: string
          last_name?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          emergency_contact?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          parent_contact_id?: string | null
          admission_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      fee_plans: {
        Row: {
          id: string
          institution_id: string
          class_id: string | null
          name: string
          description: string | null
          academic_year: string
          version: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          class_id?: string | null
          name: string
          description?: string | null
          academic_year: string
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          class_id?: string | null
          name?: string
          description?: string | null
          academic_year?: string
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      fee_items: {
        Row: {
          id: string
          fee_plan_id: string
          name: string
          description: string | null
          amount: number
          fee_type: 'fixed' | 'recurring' | 'irregular'
          due_date: string | null
          recurring_month: number | null
          is_optional: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fee_plan_id: string
          name: string
          description?: string | null
          amount: number
          fee_type: 'fixed' | 'recurring' | 'irregular'
          due_date?: string | null
          recurring_month?: number | null
          is_optional?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fee_plan_id?: string
          name?: string
          description?: string | null
          amount?: number
          fee_type?: 'fixed' | 'recurring' | 'irregular'
          due_date?: string | null
          recurring_month?: number | null
          is_optional?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      student_fees: {
        Row: {
          id: string
          student_id: string
          fee_plan_id: string
          academic_year: string
          total_amount: number
          discount_amount: number
          discount_reason: string | null
          scholarship_amount: number
          scholarship_reason: string | null
          net_amount: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          fee_plan_id: string
          academic_year: string
          total_amount: number
          discount_amount?: number
          discount_reason?: string | null
          scholarship_amount?: number
          scholarship_reason?: string | null
          net_amount: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          fee_plan_id?: string
          academic_year?: string
          total_amount?: number
          discount_amount?: number
          discount_reason?: string | null
          scholarship_amount?: number
          scholarship_reason?: string | null
          net_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      student_fee_items: {
        Row: {
          id: string
          student_fee_id: string
          fee_item_id: string
          amount: number
          due_date: string
          is_paid: boolean
          paid_amount: number
          penalty_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_fee_id: string
          fee_item_id: string
          amount: number
          due_date: string
          is_paid?: boolean
          paid_amount?: number
          penalty_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_fee_id?: string
          fee_item_id?: string
          amount?: number
          due_date?: string
          is_paid?: boolean
          paid_amount?: number
          penalty_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      penalty_rules: {
        Row: {
          id: string
          institution_id: string
          name: string
          penalty_type: 'fixed' | 'percentage'
          penalty_value: number
          frequency: string
          grace_period_days: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          penalty_type: 'fixed' | 'percentage'
          penalty_value: number
          frequency?: string
          grace_period_days?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          penalty_type?: 'fixed' | 'percentage'
          penalty_value?: number
          frequency?: string
          grace_period_days?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          institution_id: string
          student_id: string
          payment_method: 'online' | 'cash' | 'cheque' | 'dd' | 'upi' | 'card' | 'netbanking'
          amount: number
          status: 'pending' | 'success' | 'failed' | 'refunded' | 'disputed'
          transaction_id: string | null
          pg_order_id: string | null
          pg_response: Json | null
          receipt_number: string | null
          notes: string | null
          collected_by: string | null
          collected_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          student_id: string
          payment_method: 'online' | 'cash' | 'cheque' | 'dd' | 'upi' | 'card' | 'netbanking'
          amount: number
          status?: 'pending' | 'success' | 'failed' | 'refunded' | 'disputed'
          transaction_id?: string | null
          pg_order_id?: string | null
          pg_response?: Json | null
          receipt_number?: string | null
          notes?: string | null
          collected_by?: string | null
          collected_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          student_id?: string
          payment_method?: 'online' | 'cash' | 'cheque' | 'dd' | 'upi' | 'card' | 'netbanking'
          amount?: number
          status?: 'pending' | 'success' | 'failed' | 'refunded' | 'disputed'
          transaction_id?: string | null
          pg_order_id?: string | null
          pg_response?: Json | null
          receipt_number?: string | null
          notes?: string | null
          collected_by?: string | null
          collected_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      payment_fee_items: {
        Row: {
          id: string
          payment_id: string
          student_fee_item_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          student_fee_item_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          student_fee_item_id?: string
          amount?: number
          created_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          payment_id: string
          receipt_number: string
          pdf_url: string | null
          qr_code: string | null
          is_cancelled: boolean
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          receipt_number: string
          pdf_url?: string | null
          qr_code?: string | null
          is_cancelled?: boolean
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          receipt_number?: string
          pdf_url?: string | null
          qr_code?: string | null
          is_cancelled?: boolean
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reminder_templates: {
        Row: {
          id: string
          institution_id: string
          name: string
          type: 'whatsapp' | 'sms' | 'email'
          subject: string | null
          content: string
          variables: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          type: 'whatsapp' | 'sms' | 'email'
          subject?: string | null
          content: string
          variables?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          type?: 'whatsapp' | 'sms' | 'email'
          subject?: string | null
          content?: string
          variables?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reminder_schedules: {
        Row: {
          id: string
          institution_id: string
          template_id: string
          name: string
          days_before_due: number
          days_after_due: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          template_id: string
          name: string
          days_before_due?: number
          days_after_due?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          template_id?: string
          name?: string
          days_before_due?: number
          days_after_due?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reminder_logs: {
        Row: {
          id: string
          institution_id: string
          student_id: string
          template_id: string
          schedule_id: string | null
          type: 'whatsapp' | 'sms' | 'email'
          status: 'pending' | 'sent' | 'failed'
          recipient: string
          content: string
          sent_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          student_id: string
          template_id: string
          schedule_id?: string | null
          type: 'whatsapp' | 'sms' | 'email'
          status?: 'pending' | 'sent' | 'failed'
          recipient: string
          content: string
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          student_id?: string
          template_id?: string
          schedule_id?: string | null
          type?: 'whatsapp' | 'sms' | 'email'
          status?: 'pending' | 'sent' | 'failed'
          recipient?: string
          content?: string
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          institution_id: string
          user_id: string | null
          table_name: string
          record_id: string
          action: string
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          user_id?: string | null
          table_name: string
          record_id: string
          action: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          user_id?: string | null
          table_name?: string
          record_id?: string
          action?: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
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
  }
}
