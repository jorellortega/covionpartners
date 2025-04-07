-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', SPLIT_PART(new.email, '@', 1)), 
    'partner'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'partner',
      email = EXCLUDED.email,
      name = EXCLUDED.name
  WHERE users.role IS NULL;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert any existing auth users that might be missing from users table
INSERT INTO public.users (id, email, name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)) as name,
  'partner' as role
FROM auth.users
ON CONFLICT (id) DO NOTHING; 