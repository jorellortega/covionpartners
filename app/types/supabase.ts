export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          amount: number
          type: string
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          amount: number
          type: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          amount?: number
          type?: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          stripe_customer_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string | null
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