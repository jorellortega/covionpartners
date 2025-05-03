-- Drop existing policies
DROP POLICY IF EXISTS "Users can view projects they own or are members of" ON public.projects;
DROP POLICY IF EXISTS "Project owners can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can view project details" ON public.projects;

-- Create new policies for projects
CREATE POLICY "Enable read access for all authenticated users"
ON public.projects
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
ON public.projects
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for project owners"
ON public.projects
FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Enable delete for project owners"
ON public.projects
FOR DELETE
USING (owner_id = auth.uid());

-- Create policies for team members
CREATE POLICY "Enable read access for all authenticated users"
ON public.team_members
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for project owners"
ON public.team_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_id
  AND projects.owner_id = auth.uid()
));

CREATE POLICY "Enable update for project owners"
ON public.team_members
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_id
  AND projects.owner_id = auth.uid()
));

CREATE POLICY "Enable delete for project owners"
ON public.team_members
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_id
  AND projects.owner_id = auth.uid()
)); 