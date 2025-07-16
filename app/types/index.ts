export interface Project {
  goals?: string;
  target_market?: string;
  open_positions?: any[];
  public_resources_enabled?: boolean;
  public_open_positions_enabled?: boolean;
  actions_enabled?: boolean;
}

export interface Job {
  id: string;
  employer_id: string;
  organization_id?: string;
  title: string;
  company: string;
  location?: string;
  remote: boolean;
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  description: string;
  requirements?: string;
  benefits?: string;
  skills?: string[];
  experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  education_level?: string;
  application_deadline?: string;
  is_active: boolean;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
  employer?: {
    full_name: string;
    company: string;
    avatar_url?: string;
    slug?: string;
  };
  organization?: {
    id: string;
    name: string;
    slug?: string;
  };
  thumbnail_url?: string;
  job_image_url?: string;
  filled_by?: {
    id: string;
    name: string;
    avatar_url: string;
    email: string;
  };
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter?: string;
  resume_url?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
  applied_at: string;
  reviewed_at?: string;
  job?: Job;
  applicant?: {
    full_name: string;
    avatar_url?: string;
    position?: string;
  };
} 