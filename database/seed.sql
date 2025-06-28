-- Seed for cvnpartners_user_balances
INSERT INTO cvnpartners_user_balances (
  user_id, balance, currency, pending_balance, locked_balance, status, last_updated
) VALUES (
  'c81c3d21-d383-44b2-96b5-a475f82114ef', 10000.00, 'USD', 0, 0, 'active', CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  currency = EXCLUDED.currency,
  pending_balance = EXCLUDED.pending_balance,
  locked_balance = EXCLUDED.locked_balance,
  status = EXCLUDED.status,
  last_updated = EXCLUDED.last_updated;

-- Seed organizations (already inserted, but included for completeness)
INSERT INTO organizations (id, name, description, owner_id, subscription_plan, created_at, updated_at) VALUES
  ('b7cfefde-f1f7-438f-addd-d2364f649e79', 'Covion Studio, inc', 'Multimedia Technology', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'enterprise', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Seed jobs
INSERT INTO jobs (
  id, organization_id, poster_id, title, description, location, remote, job_type, salary_min, salary_max, salary_currency, requirements, benefits, skills, experience_level, education_level, application_deadline, status, created_at, updated_at
) VALUES
  ('job-0001-0001-0001-0001-000000000001', 'b7cfefde-f1f7-438f-addd-d2364f649e79', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'Frontend Developer', 'Develop and maintain web UIs.', 'Remote', true, 'full-time', 90000, 120000, 'USD', '{"3+ years React experience"}', '{"Health", "Dental", "Vision"}', '{"React", "TypeScript", "CSS"}', 'mid', 'Bachelor', '2025-12-31', 'open', now(), now()),
  ('job-0002-0002-0002-0002-000000000002', 'b7cfefde-f1f7-438f-addd-d2364f649e79', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'Backend Engineer', 'Work on scalable APIs.', 'New York, NY', false, 'full-time', 100000, 140000, 'USD', '{"5+ years Node.js experience"}', '{"401k", "PTO"}', '{"Node.js", "PostgreSQL", "REST"}', 'senior', 'Bachelor', '2025-12-31', 'open', now(), now()),
  ('job-0003-0003-0003-0003-000000000003', 'b7cfefde-f1f7-438f-addd-d2364f649e79', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'UI/UX Designer', 'Design user interfaces and experiences.', 'San Francisco, CA', false, 'full-time', 80000, 110000, 'USD', '{"2+ years design experience"}', '{"Flexible hours"}', '{"Figma", "Sketch", "Adobe XD"}', 'mid', 'Bachelor', '2025-12-31', 'open', now(), now()),
  ('job-0004-0004-0004-0004-000000000004', 'b7cfefde-f1f7-438f-addd-d2364f649e79', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'DevOps Engineer', 'Automate and manage cloud infrastructure.', 'Remote', true, 'full-time', 110000, 150000, 'USD', '{"3+ years AWS experience"}', '{"Remote work"}', '{"AWS", "Terraform", "CI/CD"}', 'senior', 'Bachelor', '2025-12-31', 'open', now(), now());

-- Seed job applications
INSERT INTO job_applications (
  id, job_id, user_id, cover_letter, status, created_at, updated_at
) VALUES
  ('app-0001-0001-0001-0001-000000000001', 'job-0001-0001-0001-0001-000000000001', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'I am passionate about frontend development.', 'applied', now(), now()),
  ('app-0002-0002-0002-0002-000000000002', 'job-0002-0002-0002-0002-000000000002', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'Experienced in backend systems.', 'applied', now(), now()),
  ('app-0003-0003-0003-0003-000000000003', 'job-0003-0003-0003-0003-000000000003', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'UI/UX is my passion.', 'applied', now(), now()),
  ('app-0004-0004-0004-0004-000000000004', 'job-0004-0004-0004-0004-000000000004', '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6', 'DevOps is my specialty.', 'applied', now(), now()); 