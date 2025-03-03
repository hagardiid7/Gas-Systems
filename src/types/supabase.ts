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
      orders: {
        Row: {
          id: string
          created_at: string
          user_id: string
          lpg_type: string
          quantity: number
          status: string
          latitude: number | null
          longitude: number | null
          address: string | null
          assigned_to: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          lpg_type: string
          quantity: number
          status?: string
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          assigned_to?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          lpg_type?: string
          quantity?: number
          status?: string
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          assigned_to?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          phone_number: string | null
          role: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          phone_number?: string | null
          role?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          phone_number?: string | null
          role?: string
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