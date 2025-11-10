-- Step 1: Check if the tables exist
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name IN (
    'corporate_task_assignments',
    'organization_goal_assignments',
    'organization_staff',
    'corporate_tasks',
    'organization_goals'
)
ORDER BY table_name;

-- Step 2: Check if RLS is enabled on these tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
    'corporate_task_assignments',
    'organization_goal_assignments',
    'organization_staff'
)
ORDER BY tablename;

-- Step 3: Check ALL policies (without filtering by table name first)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd
LIMIT 50;

-- Step 4: Check if policies exist but with different table names
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

