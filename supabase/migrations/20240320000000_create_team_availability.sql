-- Create team_availability table
CREATE TABLE IF NOT EXISTS team_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  date DATE NOT NULL,
  available_hours TEXT[],
  status TEXT CHECK (status IN ('available', 'busy', 'out_of_office')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS team_availability_user_id_idx ON team_availability(user_id);
CREATE INDEX IF NOT EXISTS team_availability_date_idx ON team_availability(date);

-- Enable RLS
ALTER TABLE team_availability ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own availability"
  ON team_availability FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability"
  ON team_availability FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability"
  ON team_availability FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability"
  ON team_availability FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at
CREATE TRIGGER update_team_availability_updated_at
  BEFORE UPDATE ON team_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 