export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  goals: string;
  target_market: string;
  accepts_support: boolean;
  open_positions: any[];
  show_project_access?: boolean;
  public_resources_enabled?: boolean;
  actions_enabled?: boolean;
  public_open_positions_enabled?: boolean;
  is_favorite?: boolean;
} 