-- Create work submissions table
CREATE TABLE IF NOT EXISTS work_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  budget_currency TEXT DEFAULT 'USD',
  timeline_days INTEGER,
  skills_required TEXT[],
  deliverables TEXT,
  additional_requirements TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'rejected', 'in_progress', 'completed')),
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create work assignments table (for approved submissions)
CREATE TABLE IF NOT EXISTS work_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES work_submissions(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  start_date DATE,
  due_date DATE,
  actual_completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_assignments ENABLE ROW LEVEL SECURITY;

-- Work submissions policies
CREATE POLICY "Users can view their own submissions"
  ON work_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all submissions"
  ON work_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can create their own submissions"
  ON work_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending submissions"
  ON work_submissions FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can update any submission"
  ON work_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- Work assignments policies
CREATE POLICY "Users can view their own assignments"
  ON work_assignments FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins can view all assignments"
  ON work_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can create assignments"
  ON work_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Assigned users can update their assignments"
  ON work_assignments FOR UPDATE
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins can update any assignment"
  ON work_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_work_submissions_user_id ON work_submissions(user_id);
CREATE INDEX idx_work_submissions_status ON work_submissions(status);
CREATE INDEX idx_work_submissions_category ON work_submissions(category);
CREATE INDEX idx_work_submissions_created_at ON work_submissions(created_at);

CREATE INDEX idx_work_assignments_submission_id ON work_assignments(submission_id);
CREATE INDEX idx_work_assignments_assigned_to ON work_assignments(assigned_to);
CREATE INDEX idx_work_assignments_status ON work_assignments(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_work_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_work_submissions_updated_at
  BEFORE UPDATE ON work_submissions
  FOR EACH ROW EXECUTE FUNCTION update_work_submissions_updated_at();

CREATE TRIGGER update_work_assignments_updated_at
  BEFORE UPDATE ON work_assignments
  FOR EACH ROW EXECUTE FUNCTION update_work_submissions_updated_at(); 