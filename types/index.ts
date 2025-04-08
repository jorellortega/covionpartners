export interface User {
  id: string
  email: string
  name: string
  role: 'partner' | 'admin' | 'investor' | 'viewer'
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  project_id: string
  user_id: string
  role: 'lead' | 'member' | 'advisor' | 'consultant'
  joined_at: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: string
  type: string
  deadline: string
  created_at: string
  updated_at: string
  owner_id: string
  owner_name?: string
  invested: number
  roi: number
  progress: number
  budget?: number
  media_files?: MediaFile[]
}

export interface ProjectRole {
  name: string
  description: string
  status: string
}

export interface Transaction {
  id: string
  amount: number
  type: 'deposit' | 'withdrawal' | 'investment' | 'payout'
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  user_id: string
  project_id?: string
}

export interface DashboardStats {
  totalBalance: number
  activeProjects: number
  totalInvestments: number
  averageROI: number
}

export interface MediaFile {
  name: string
  type: string
  size: number
  url: string
  aspect_ratio?: '16:9' | '9:16' | 'square'
  created_at: string
} 