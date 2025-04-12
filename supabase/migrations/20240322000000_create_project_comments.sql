-- Create project_comments table
CREATE TABLE IF NOT EXISTS public.project_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS project_comments_project_id_idx ON public.project_comments(project_id);
CREATE INDEX IF NOT EXISTS project_comments_user_id_idx ON public.project_comments(user_id);

-- Enable Row Level Security
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view comments on their projects"
    ON public.project_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            LEFT JOIN public.team_members ON team_members.project_id = projects.id
            WHERE projects.id = project_comments.project_id
            AND (
                projects.owner_id = auth.uid()
                OR team_members.user_id = auth.uid()
                OR projects.visibility = 'public'
            )
        )
    );

CREATE POLICY "Users can create comments on their projects"
    ON public.project_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            LEFT JOIN public.team_members ON team_members.project_id = projects.id
            WHERE projects.id = project_comments.project_id
            AND (
                projects.owner_id = auth.uid()
                OR team_members.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their own comments"
    ON public.project_comments
    FOR DELETE
    USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_project_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_project_comments_updated_at
    BEFORE UPDATE ON public.project_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_project_comments_updated_at(); 