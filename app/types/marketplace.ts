export interface MarketplaceOpportunity {
  id: string
  title: string
  description: string
  budget: number
  required_skills: string[]
  estimated_duration: string
  status: 'open' | 'in_progress' | 'completed' | 'closed'
  created_at: string
  updated_at: string
  created_by: string
  category: string
  location: string
  experience_level: string
  project_type: string
  is_featured: boolean
  views_count: number
  applications_count: number
} 