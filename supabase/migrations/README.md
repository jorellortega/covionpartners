# Database Migrations

This directory contains the SQL migrations for setting up the database schema and initial data.

## Files

1. `001_initial_schema.sql` - Creates the database schema including:
   - Tables: users, projects, transactions
   - Enums: user_role, project_status, project_type, transaction_type, transaction_status
   - RLS policies for security
   - Triggers for updated_at timestamps

2. `002_seed_data.sql` - Inserts initial data including:
   - Default admin user
   - Sample projects
   - Sample transactions

## Running the Migrations

To run these migrations in Supabase:

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a "New Query"
4. Copy and paste the contents of `001_initial_schema.sql`
5. Run the query
6. Create another "New Query"
7. Copy and paste the contents of `002_seed_data.sql`
8. Run the query

## Default Admin Account

After running the migrations, you'll have a default admin account:
- Email: admin@covionpartners.com
- Password: admin123

**Important**: Change these credentials after first login!

## Adding New Migrations

When adding new migrations:
1. Create a new file with a sequential number (e.g., `003_new_feature.sql`)
2. Include both the up and down migrations
3. Test the migration locally before applying to production 