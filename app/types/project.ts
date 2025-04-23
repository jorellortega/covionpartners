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
  accepts_donations: boolean;
  open_positions: any[];
} 