CREATE OR REPLACE VIEW public.organization_staff_with_user AS
SELECT
  s.*,
  u.email,
  p.name,
  p.avatar_url,
  -- Manager information
  manager.name as manager_name,
  manager_user.email as manager_email,
  manager.avatar_url as manager_avatar_url
FROM
  public.organization_staff s
JOIN
  auth.users u ON s.user_id = u.id
LEFT JOIN
  public.profiles p ON p.user_id = u.id
LEFT JOIN
  public.organization_staff manager_staff ON s.reports_to = manager_staff.id
LEFT JOIN
  auth.users manager_user ON manager_staff.user_id = manager_user.id
LEFT JOIN
  public.profiles manager ON manager.user_id = manager_user.id; 