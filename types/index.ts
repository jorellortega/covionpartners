export interface User {
  id: string
  email: string
  name: string
  role: 'partner' | 'admin' | 'investor' | 'viewer'
  created_at: string
  updated_at: string
  avatar_url?: string | null
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
  is_private: boolean
  owner_id: string
  owner_name?: string
  owner?: {
    id: string
    name: string
    email: string
  }
  invested?: number | null
  roi?: number | null
  progress?: number | null
  budget?: number | null
  media_files?: MediaFile[] | null
  project_key?: string | null
  visibility: 'private' | 'public'
  team_members?: TeamMember[] | null
  funding_goal?: number | null
  current_funding?: number | null
  accepts_donations?: boolean
  promo_title?: string | null
  promo_description?: string | null
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

export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string
  project_id: string
  assigned_to: string
  assigned_user?: {
    id: string
    name: string
    email: string
  }
} 