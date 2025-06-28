-- Migration: Add foreign key from jobs.organization_id to organizations.id
ALTER TABLE jobs
ADD CONSTRAINT fk_jobs_organization_id
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE SET NULL; 