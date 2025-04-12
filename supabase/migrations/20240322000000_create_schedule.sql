-- Drop existing table if it exists
DROP TABLE IF EXISTS schedule;

-- Create schedule table
CREATE TABLE schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  notes TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraints
ALTER TABLE schedule
  ADD CONSTRAINT schedule_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

ALTER TABLE schedule
  ADD CONSTRAINT schedule_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Add NOT NULL constraints
-- Note: You may need to clean up any NULL values before running these
ALTER TABLE schedule 
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL;

-- Create index for faster queries
CREATE INDEX schedule_project_id_idx ON schedule(project_id);
CREATE INDEX schedule_created_by_idx ON schedule(created_by);
CREATE INDEX schedule_start_time_idx ON schedule(start_time);

-- Enable RLS
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view schedule for projects they are members of"
  ON schedule FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.project_id = schedule.project_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create schedule items for projects they are members of"
  ON schedule FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.project_id = schedule.project_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedule items they created"
  ON schedule FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete schedule items they created"
  ON schedule FOR DELETE
  USING (auth.uid() = created_by);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_schedule_updated_at
  BEFORE UPDATE ON schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 