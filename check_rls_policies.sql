-- Query to check RLS policies for assignment-related tables
-- Run this in your Supabase SQL editor to see current policies

-- Check policies for corporate_task_assignments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'corporate_task_assignments'
ORDER BY policyname;

-- Check policies for organization_goal_assignments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'organization_goal_assignments'
ORDER BY policyname;

-- Check policies for organization_staff
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'organization_staff'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('corporate_task_assignments', 'organization_goal_assignments', 'organization_staff')
ORDER BY tablename;

