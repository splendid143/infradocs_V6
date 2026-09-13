// Placeholder database types - will be replaced by `supabase gen types typescript --local`
// Run: npm run supabase:gen

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          user_code: string
          name: string
          email: string
          role: 'ADMIN' | 'ENGINEER' | 'VIEWER'
          account_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED'
          approval_status: 'PENDING' | 'APPROVED' | 'REJECTED'
          is_active: boolean
          department: string | null
          created_at: string
          approved_at: string | null
          approved_by: string | null
          disabled_at: string | null
          disabled_by: string | null
          last_login_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
        Relationships: []
      }
      sites: {
        Row: {
          id: string
          site_id: string
          name: string
          description: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['sites']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sites']['Row']>
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          site_id: string
          room_id: string
          name: string
          description: string | null
          room_type: string | null
          floor: string | null
          status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rooms']['Row']>
        Relationships: []
      }
      racks: {
        Row: {
          id: string
          room_id: string
          rack_id: string
          name: string
          description: string | null
          rack_type: string | null
          height_u: number
          position: number | null
          status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['racks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['racks']['Row']>
        Relationships: []
      }
      equipment: {
        Row: {
          id: string
          rack_id: string
          equipment_id: string
          name: string
          description: string | null
          equipment_type: string | null
          manufacturer: string | null
          model: string | null
          serial_number: string | null
          asset_tag: string | null
          position_u: number | null
          height_u: number
          status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['equipment']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['equipment']['Row']>
        Relationships: []
      }
      equipment_ports: {
        Row: {
          id: string
          equipment_id: string
          port_number: string
          port_name: string | null
          port_type: string | null
          speed: string | null
          protocol: string | null
          status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['equipment_ports']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['equipment_ports']['Row']>
        Relationships: []
      }
      patch_panels: {
        Row: {
          id: string
          rack_id: string
          panel_id: string
          name: string
          description: string | null
          panel_type: string | null
          port_count: number
          position_u: number | null
          height_u: number
          status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['patch_panels']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['patch_panels']['Row']>
        Relationships: []
      }
      patch_ports: {
        Row: {
          id: string
          patch_panel_id: string
          port_number: string
          port_name: string | null
          port_type: string | null
          status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['patch_ports']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['patch_ports']['Row']>
        Relationships: []
      }
      cables: {
        Row: {
          id: string
          cable_id: string
          cable_type: 'FIBER' | 'COPPER' | 'COAX' | 'POWER' | 'OTHER'
          specification: string | null
          length_m: number | null
          length_ft: number | null
          quantity: number
          status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['cables']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cables']['Row']>
        Relationships: []
      }
      cable_endpoints: {
        Row: {
          id: string
          cable_id: string
          endpoint_label: 'A' | 'B'
          endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'
          equipment_port_id: string | null
          patch_port_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cable_endpoints']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cable_endpoints']['Row']>
        Relationships: []
      }
      attachments: {
        Row: {
          id: string
          record_type: string
          record_id: string
          file_name: string
          storage_path: string
          mime_type: string
          size_bytes: number
          uploaded_by: string
          uploaded_at: string
          description: string | null
          document_type: 'INSTALLATION' | 'TEST_REPORT' | 'COMMISSIONING' | 'VENDOR_DOC' | 'DIAGRAM' | 'INSPECTION' | 'OTHER' | null
          attachment_type: 'PHOTO' | 'DOCUMENT'
        }
        Insert: Omit<Database['public']['Tables']['attachments']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['attachments']['Row']>
        Relationships: []
      }
      notes: {
        Row: {
          id: string
          record_type: string
          record_id: string
          content: string
          created_by: string
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notes']['Row']>
        Relationships: []
      }
      status_history: {
        Row: {
          id: string
          record_type: string
          record_id: string
          old_status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED' | null
          new_status: 'PLANNED' | 'INSTALLED' | 'TESTED' | 'VERIFIED' | 'ISSUE' | 'REMOVED' | 'ARCHIVED'
          changed_by: string
          changed_at: string
          reason: string | null
        }
        Insert: Omit<Database['public']['Tables']['status_history']['Row'], 'id' | 'changed_at'>
        Update: Partial<Database['public']['Tables']['status_history']['Row']>
        Relationships: []
      }
      qr_codes: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          token: string
          created_at: string
          created_by: string
          expires_at: string | null
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['qr_codes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['qr_codes']['Row']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          created_at: string
          actor_id: string
          action: string
          entity_type: string
          entity_id: string
          entity_display: string
          old_values: Json | null
          new_values: Json | null
          details: string | null
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}