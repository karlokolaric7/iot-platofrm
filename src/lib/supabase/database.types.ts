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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string
          owner_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: string
          owner_id: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: string
          owner_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          dev_eui: string | null
          serial_number: string | null
          connectivity: string
          type: string
          status: string
          tags: string[]
          app_eui: string | null
          last_seen: string | null
          settings: Json
          latitude: number | null
          longitude: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          dev_eui?: string | null
          serial_number?: string | null
          connectivity?: string
          type?: string
          status?: string
          tags?: string[]
          last_seen?: string | null
          settings?: Json
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          dev_eui?: string | null
          serial_number?: string | null
          connectivity?: string
          type?: string
          status?: string
          tags?: string[]
          last_seen?: string | null
          settings?: Json
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      fields: {
        Row: {
          id: string
          device_id: string
          name: string
          alias: string
          type: string
          unit: string | null
          icon: string | null
          color: string | null
          show_on_dashboard: boolean
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          name: string
          alias: string
          type?: string
          unit?: string | null
          icon?: string | null
          color?: string | null
          show_on_dashboard?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          name?: string
          alias?: string
          type?: string
          unit?: string | null
          icon?: string | null
          color?: string | null
          show_on_dashboard?: boolean
          created_at?: string
        }
      }
      measurements: {
        Row: {
          id: number
          time: string
          device_id: string
          field_id: string
          value: number
          metadata: Json
        }
        Insert: {
          id?: number
          time?: string
          device_id: string
          field_id: string
          value: number
          metadata?: Json
        }
        Update: {
          id?: number
          time?: string
          device_id?: string
          field_id?: string
          value?: number
          metadata?: Json
        }
      }
      dashboards: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          layout: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          layout?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          layout?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      widgets: {
        Row: {
          id: string
          dashboard_id: string
          type: string
          title: string
          config: Json
          device_id: string | null
          field_id: string | null
          x: number
          y: number
          w: number
          h: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dashboard_id: string
          type: string
          title: string
          config?: Json
          device_id?: string | null
          field_id?: string | null
          x: number
          y: number
          w: number
          h: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dashboard_id?: string
          type?: string
          title?: string
          config?: Json
          device_id?: string | null
          field_id?: string | null
          x?: number
          y?: number
          w?: number
          h?: number
          created_at?: string
          updated_at?: string
        }
      }
      gateways: {
        Row: {
          id: string
          workspace_id: string
          name: string
          type: string
          eui: string | null
          status: string
          last_seen: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          type: string
          eui?: string | null
          status?: string
          last_seen?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          type?: string
          eui?: string | null
          status?: string
          last_seen?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      rules: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          is_active: boolean
          condition: Json
          actions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          is_active?: boolean
          condition: Json
          actions: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          condition?: Json
          actions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          workspace_id: string
          device_id: string | null
          rule_id: string | null
          severity: string
          title: string
          message: string
          is_resolved: boolean
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          device_id?: string | null
          rule_id?: string | null
          severity?: string
          title: string
          message: string
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          device_id?: string | null
          rule_id?: string | null
          severity?: string
          title?: string
          message?: string
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
