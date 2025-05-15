-- First, create sample projects
INSERT INTO projects (id, name, description, status, type, deadline, owner_id, invested, roi, progress, budget)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Eco-Friendly Housing Project', 'Sustainable housing development with green technology', 'active', 'investment', '2024-12-31', 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733', 500000, 15, 30, 2000000),
  ('00000000-0000-0000-0000-000000000002', 'AI Healthcare Platform', 'AI-powered healthcare management system', 'active', 'investment', '2024-10-15', 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733', 750000, 20, 45, 3000000),
  ('00000000-0000-0000-0000-000000000003', 'Renewable Energy Initiative', 'Solar and wind energy farm development', 'pending', 'investment', '2025-03-01', '7cc9878d-0ec3-4a8f-9d06-a727f13950e0', 1000000, 25, 20, 5000000),
  ('00000000-0000-0000-0000-000000000004', 'Smart City Infrastructure', 'IoT-based city infrastructure modernization', 'active', 'investment', '2024-11-30', 'ecc3992a-7a84-496b-8772-b09cc01450e7', 300000, 18, 60, 1200000),
  ('00000000-0000-0000-0000-000000000005', 'EdTech Learning Platform', 'Online education platform with AI tutors', 'active', 'investment', '2024-09-15', 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733', 250000, 22, 75, 1000000);

-- Then, insert sample project roles
INSERT INTO project_roles (project_id, user_id, role_name, description, status)
VALUES
  -- Project 1 roles
  ('00000000-0000-0000-0000-000000000001', 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733', 'Project Manager', 'Oversees project execution and team coordination', 'active'),
  ('00000000-0000-0000-0000-000000000001', '7cc9878d-0ec3-4a8f-9d06-a727f13950e0', 'Developer', 'Handles technical implementation', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'ecc3992a-7a84-496b-8772-b09cc01450e7', 'Designer', 'Creates UI/UX designs', 'active'),
  
  -- Project 2 roles
  ('00000000-0000-0000-0000-000000000002', 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733', 'Product Owner', 'Defines product requirements and priorities', 'active'),
  ('00000000-0000-0000-0000-000000000002', '7cc9878d-0ec3-4a8f-9d06-a727f13950e0', 'QA Engineer', 'Ensures product quality through testing', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'ecc3992a-7a84-496b-8772-b09cc01450e7', 'DevOps Engineer', 'Manages deployment and infrastructure', 'active'),
  
  -- Project 3 roles
  ('00000000-0000-0000-0000-000000000003', '7cc9878d-0ec3-4a8f-9d06-a727f13950e0', 'Team Lead', 'Leads development team', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733', 'Frontend Developer', 'Implements user interface', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'ecc3992a-7a84-496b-8772-b09cc01450e7', 'Backend Developer', 'Handles server-side logic', 'active'),
  
  -- Project 4 roles
  ('00000000-0000-0000-0000-000000000004', 'ecc3992a-7a84-496b-8772-b09cc01450e7', 'UX Designer', 'Focuses on user experience', 'active'),
  ('00000000-0000-0000-0000-000000000004', 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733', 'Content Writer', 'Creates project documentation', 'active'),
  ('00000000-0000-0000-0000-000000000004', '7cc9878d-0ec3-4a8f-9d06-a727f13950e0', 'Marketing Specialist', 'Handles project promotion', 'active'),
  
  -- Project 5 roles
  ('00000000-0000-0000-0000-000000000005', 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733', 'Business Analyst', 'Analyzes business requirements', 'active'),
  ('00000000-0000-0000-0000-000000000005', '7cc9878d-0ec3-4a8f-9d06-a727f13950e0', 'Data Scientist', 'Handles data analysis and modeling', 'active'),
  ('00000000-0000-0000-0000-000000000005', 'ecc3992a-7a84-496b-8772-b09cc01450e7', 'Security Expert', 'Ensures project security', 'active');

-- Note: Make sure the user_ids exist in your auth.users table
-- You can check existing users with:
-- SELECT id FROM auth.users; 

-- Create project_open_roles table
CREATE TABLE IF NOT EXISTS project_open_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  description TEXT,
  positions_needed INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create project_role_applications table
CREATE TABLE IF NOT EXISTS project_role_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role_id UUID REFERENCES project_open_roles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  cover_letter TEXT,
  experience TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert sample open roles for projects
INSERT INTO project_open_roles (project_id, role_name, description, positions_needed, status)
VALUES 
  -- For Project 1
  ((SELECT id FROM projects LIMIT 1), 'Investment Analyst', 'Financial analysis and market research', 2, 'open'),
  ((SELECT id FROM projects LIMIT 1), 'Project Manager', 'Coordinate team and track progress', 1, 'open'),
  ((SELECT id FROM projects LIMIT 1), 'Legal Advisor', 'Legal compliance and documentation', 1, 'open'),
  -- For Project 2
  ((SELECT id FROM projects OFFSET 1 LIMIT 1), 'Technical Lead', 'Lead technical implementation and architecture', 1, 'open'),
  ((SELECT id FROM projects OFFSET 1 LIMIT 1), 'Marketing Specialist', 'Handle project marketing and promotion', 2, 'open');

-- Enable Row Level Security (RLS)
ALTER TABLE project_open_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_role_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for project_open_roles
CREATE POLICY "Public roles are viewable by everyone" ON project_open_roles
  FOR SELECT USING (true);

CREATE POLICY "Project owners can manage roles" ON project_open_roles
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM projects WHERE id = project_id
    )
  );

-- Create policies for project_role_applications
CREATE POLICY "Users can view their own applications" ON project_role_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications" ON project_role_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can view applications" ON project_role_applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM projects WHERE id = project_id
    )
  );

-- Insert baseball-themed project
INSERT INTO projects (
  name,
  description,
  status,
  type,
  deadline,
  owner_id,
  invested,
  roi,
  progress,
  budget
) VALUES (
  'Next-Gen Baseball Analytics Platform',
  'Developing a cutting-edge baseball analytics platform that combines real-time player tracking, advanced statistics, and machine learning to revolutionize team management and player development. The platform will offer comprehensive insights for teams, scouts, and players.',
  'active',
  'investment',
  (CURRENT_DATE + INTERVAL '6 months'),
  'ccac7ddc-f895-4822-a4cf-3a3a72ed1733',
  250000,
  15,
  35,
  750000
) RETURNING id;

-- Insert open roles for the baseball project
INSERT INTO project_open_roles (project_id, role_name, description, positions_needed, status) 
SELECT 
  p.id as project_id,
  roles.role_name,
  roles.description,
  roles.positions_needed,
  roles.status
FROM 
  projects p,
  (VALUES 
    ('Baseball Data Scientist', 'Lead the development of advanced baseball analytics models and statistical analysis. Experience with sabermetrics and player performance metrics required.', 2, 'open'),
    ('Sports Technology Engineer', 'Develop and maintain the real-time player tracking system and data collection infrastructure. Experience with sports technology and sensor systems preferred.', 2, 'open'),
    ('UI/UX Designer', 'Design intuitive interfaces for displaying complex baseball statistics and analytics. Knowledge of baseball and data visualization required.', 1, 'open'),
    ('Baseball Operations Analyst', 'Bridge the gap between data science and baseball operations. Strong understanding of baseball strategy and analytics required.', 1, 'open'),
    ('Full Stack Developer', 'Build and maintain the web application for the analytics platform. Experience with real-time data processing and visualization required.', 2, 'open')
  ) as roles(role_name, description, positions_needed, status)
WHERE p.owner_id = 'ccac7ddc-f895-4822-a4cf-3a3a72ed1733'
AND p.name = 'Next-Gen Baseball Analytics Platform';

-- Seed expenses for project 038720f6-b3bb-4d93-a452-c147184b9050
INSERT INTO expenses (project_id, user_id, description, amount, category, status, due_date, receipt_url, notes)
VALUES
  -- Marketing expenses
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Social Media Ads Campaign', 1500.00, 'Marketing', 'Approved', '2024-05-15', 'https://storage.example.com/receipts/social_ads.pdf', 'Q2 marketing campaign'),
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Content Creation Services', 800.00, 'Marketing', 'Pending', '2024-05-20', NULL, 'Blog posts and social media content'),
  
  -- Development expenses
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Cloud Hosting Services', 250.00, 'Development', 'Paid', '2024-05-01', 'https://storage.example.com/receipts/cloud_hosting.pdf', 'Monthly AWS services'),
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Development Tools License', 1200.00, 'Development', 'Approved', '2024-06-01', 'https://storage.example.com/receipts/dev_tools.pdf', 'Annual subscription'),
  
  -- Office expenses
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Office Supplies', 350.00, 'Office', 'Paid', '2024-04-15', 'https://storage.example.com/receipts/supplies.pdf', 'Monthly office supplies'),
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Team Building Event', 2000.00, 'Office', 'Pending', '2024-06-15', NULL, 'Quarterly team building'),
  
  -- Travel expenses
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Client Meeting Travel', 750.00, 'Travel', 'Approved', '2024-05-10', 'https://storage.example.com/receipts/travel.pdf', 'Airfare and accommodation'),
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Conference Registration', 1200.00, 'Travel', 'Rejected', '2024-07-01', NULL, 'Tech conference registration'),
  
  -- Software expenses
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Project Management Software', 500.00, 'Software', 'Paid', '2024-04-01', 'https://storage.example.com/receipts/pm_software.pdf', 'Monthly subscription'),
  ('038720f6-b3bb-4d93-a452-c147184b9050', 'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'Design Software License', 1800.00, 'Software', 'Approved', '2024-06-01', 'https://storage.example.com/receipts/design_software.pdf', 'Annual license renewal'); 