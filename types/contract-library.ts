// Contract Library Types
export interface ContractTemplate {
  id: string
  organization_id: string
  name: string
  description?: string
  category: string
  contract_text: string
  variables: string[] // Variable placeholders like ["user_name", "date", "company_name"]
  is_public: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SignatureField {
  id: string
  type: 'name' | 'signature' | 'date' | 'email' | 'text'
  label: string
  placeholder: string
  required: boolean
  position: {
    page: number
    x?: number
    y?: number
  }
  placeholder_text?: string
}

export interface Contract {
  id: string
  organization_id: string
  template_id?: string
  title: string
  description?: string
  contract_text: string
  file_url?: string
  file_name?: string
  file_type?: string
  status: 'draft' | 'pending' | 'sent' | 'signed' | 'expired' | 'cancelled'
  category: string
  variables: Record<string, any> // Filled variables like {"user_name": "John Doe", "date": "2024-01-01"}
  signature_fields?: SignatureField[] // Signature field definitions
  expires_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ContractSignature {
  id: string
  contract_id: string
  signer_name: string
  signer_email?: string
  signer_user_id?: string
  signature_data?: string
  signed_at: string
  ip_address?: string
  user_agent?: string
  status: 'pending' | 'signed' | 'declined'
  notes?: string
  signature_field_values?: Record<string, any> // Filled values for signature fields
}

export interface ContractAccessCode {
  id: string
  contract_id: string
  access_code: string
  expires_at?: string
  max_uses: number
  current_uses: number
  created_by?: string
  created_at: string
}

// API Request/Response Types
export interface CreateContractTemplateRequest {
  organization_id: string
  name: string
  description?: string
  category: string
  contract_text: string
  variables?: string[]
  is_public?: boolean
}

export interface UpdateContractTemplateRequest {
  name?: string
  description?: string
  category?: string
  contract_text?: string
  variables?: string[]
  is_public?: boolean
}

export interface CreateContractRequest {
  organization_id: string
  template_id?: string
  title: string
  description?: string
  contract_text: string
  file_url?: string
  file_name?: string
  file_type?: string
  category?: string
  variables?: Record<string, any>
  signature_fields?: SignatureField[]
  expires_at?: string
}

export interface UpdateContractRequest {
  title?: string
  description?: string
  contract_text?: string
  status?: string
  category?: string
  variables?: Record<string, any>
  signature_fields?: SignatureField[]
  expires_at?: string
}

export interface CreateSignatureRequest {
  contract_id: string
  signer_name: string
  signer_email?: string
  signature_data?: string
  signature_field_values?: Record<string, any>
  notes?: string
}

export interface CreateAccessCodeRequest {
  contract_id: string
  expires_at?: string
  max_uses?: number
}

export interface ContractWithSignatures extends Contract {
  signatures: ContractSignature[]
  template?: ContractTemplate
  access_codes: ContractAccessCode[]
}

export interface ContractStats {
  total_contracts: number
  draft_contracts: number
  pending_contracts: number
  signed_contracts: number
  expired_contracts: number
  total_templates: number
  recent_contracts: Contract[]
}

// Contract categories
export const CONTRACT_CATEGORIES = [
  'general',
  'employment',
  'service',
  'nda',
  'partnership',
  'vendor',
  'client',
  'legal',
  'financial',
  'other'
] as const

export type ContractCategory = typeof CONTRACT_CATEGORIES[number]

// Contract status options
export const CONTRACT_STATUSES = [
  'draft',
  'pending',
  'sent',
  'signed',
  'expired',
  'cancelled'
] as const

export type ContractStatus = typeof CONTRACT_STATUSES[number]

// Signature status options
export const SIGNATURE_STATUSES = [
  'pending',
  'signed',
  'declined'
] as const

export type SignatureStatus = typeof SIGNATURE_STATUSES[number] 