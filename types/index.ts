export interface User {
  id: string
  email: string
  name: string
  role: 'partner' | 'admin' | 'investor' | 'viewer' | 'ceo' | 'public'
  created_at: string
  updated_at: string
  avatar_url?: string | null
}

export interface TeamMember {
  id: string
  project_id: string
  user_id: string
  role: 'lead' | 'member' | 'advisor' | 'consultant'
  status: 'active' | 'inactive' | 'pending'
  joined_at: string
  created_at: string
  updated_at: string
  user?: User
  position?: string
  access_level?: number
}

export interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: 'active' | 'inactive' | 'completed'
  progress: number
  deadline?: string
  budget?: number
  invested?: number
  roi?: number
  created_at: string
  updated_at: string
  owner_id: string
  is_private: boolean
  owner_name?: string
  owner?: {
    id: string
    name: string
    email: string
  }
  media_files?: MediaFile[] | null
  project_key?: string | null
  visibility: 'private' | 'public'
  team_members?: TeamMember[] | null
  funding_goal?: number | null
  current_funding?: number | null
  accepts_support?: boolean
  promo_title?: string | null
  promo_description?: string | null
  external_links?: Array<{
    title: string
    url: string
    description?: string
  }> | null
  show_make_deal?: boolean
  show_invest?: boolean
  show_collaborate?: boolean
  show_project_info?: boolean
  show_project_overview?: boolean
  show_project_expenses?: boolean
  public_resources_enabled?: boolean
  actions_enabled?: boolean
  public_open_positions_enabled?: boolean
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
  storage_name?: string
  type: string
  size: number
  url: string
  aspect_ratio?: '16:9' | '9:16' | 'square'
  created_at: string
  team_only?: boolean
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

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  storage_name?: string;
  url: string;
  type: string;
  size: number;
  aspect_ratio?: '16:9' | '9:16' | 'square';
  created_at: string;
  team_only: boolean;
  access_level: number;
  label_status?: string;
  custom_label?: string;
} 