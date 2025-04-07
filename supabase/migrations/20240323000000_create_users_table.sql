-- Check if users table exists and create if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Create users table to extend auth.users
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT,
      role TEXT NOT NULL CHECK (role IN ('admin', 'partner', 'investor', 'viewer')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
  END IF;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Create trigger to update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update your user's role to partner if not already set
INSERT INTO public.users (id, name, role)
SELECT id, email, 'partner'
FROM auth.users
WHERE email = current_setting('request.jwt.claim.email', true)
ON CONFLICT (id) DO UPDATE
SET role = 'partner'
WHERE users.role != 'partner'; 