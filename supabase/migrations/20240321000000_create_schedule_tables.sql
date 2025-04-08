-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create events table first since it's referenced by other tables
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees UUID[] DEFAULT ARRAY[]::UUID[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event attendees table after events
CREATE TABLE IF NOT EXISTS event_attendees (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Create team availability table
CREATE TABLE IF NOT EXISTS team_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_hours TEXT[],
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'out_of_office')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create schedule invites table
CREATE TABLE IF NOT EXISTS schedule_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  message TEXT,
  can_edit BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updates table
CREATE TABLE IF NOT EXISTS updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,
  date TIMESTAMP WITH TIME ZONE,
  category TEXT,
  full_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  target_role TEXT
);

-- Now that all tables exist, we can create triggers
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_team_availability_updated_at ON team_availability;
DROP TRIGGER IF EXISTS update_schedule_invites_updated_at ON schedule_invites;
DROP TRIGGER IF EXISTS update_updates_updated_at ON updates;

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_availability_updated_at
  BEFORE UPDATE ON team_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_invites_updated_at
  BEFORE UPDATE ON schedule_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updates_updated_at
  BEFORE UPDATE ON updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security after tables exist
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

-- Create policies after RLS is enabled
-- Create policies for events
CREATE POLICY "Users can view events for projects they are members of"
  ON events FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners and admins can create events"
  ON events FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners and admins can update events"
  ON events FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE owner_id = auth.uid()
    )
  );

-- Create policies for event attendees
CREATE POLICY "Users can view their own event attendees"
  ON event_attendees FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Project owners and admins can manage event attendees"
  ON event_attendees FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE project_id IN (
        SELECT id FROM projects
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Create policies for team availability
CREATE POLICY "Users can view team availability"
  ON team_availability FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM team_members
      WHERE project_id IN (
        SELECT project_id FROM team_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own availability"
  ON team_availability FOR ALL
  USING (user_id = auth.uid());

-- Create policies for schedule invites
CREATE POLICY "Project owners can manage schedule invites"
  ON schedule_invites FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invites sent to them"
  ON schedule_invites FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid())); 