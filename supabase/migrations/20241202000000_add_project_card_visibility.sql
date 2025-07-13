-- Add boolean fields to control visibility of project cards
ALTER TABLE projects
ADD COLUMN show_project_info BOOLEAN DEFAULT true,
ADD COLUMN show_project_overview BOOLEAN DEFAULT true,
ADD COLUMN show_project_expenses BOOLEAN DEFAULT true;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN projects.show_project_info IS 'Controls visibility of the Project Information card';
COMMENT ON COLUMN projects.show_project_overview IS 'Controls visibility of the Project Overview card';
COMMENT ON COLUMN projects.show_project_expenses IS 'Controls visibility of the Project Expenses card'; 