-- Migration: Add slug field to organizations
ALTER TABLE organizations ADD COLUMN slug TEXT;

-- Populate slug for existing organizations (simple slugify: lowercase, replace spaces with dashes)
UPDATE organizations SET slug = lower(replace(name, ' ', '-'));

-- Make slug NOT NULL and UNIQUE
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
ALTER TABLE organizations ADD CONSTRAINT organizations_slug_unique UNIQUE (slug); 