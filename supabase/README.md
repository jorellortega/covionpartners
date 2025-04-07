# Supabase Migrations

This directory contains the database migrations and seed data for the Covion Partners application.

## Structure

- `migrations/` - Contains SQL migration files that define the database schema
- `seed.sql` - Contains initial data for testing and development

## Database Schema

The application uses the following main tables:

1. `users` - Extends Supabase auth.users with additional profile information
2. `projects` - Stores project information and details
3. `transactions` - Records all financial transactions

## Running Migrations

To apply these migrations to your Supabase project:

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push the migrations:
   ```bash
   supabase db push
   ```

4. (Optional) Run the seed data:
   ```bash
   supabase db reset
   ```

## Default Admin Account

The seed data creates a default admin account:
- Email: admin@covionpartners.com
- Password: admin123

**Important**: Change these credentials after first login!

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only view and modify their own data
- Projects are restricted to their owners
- Transactions are restricted to the user who created them

## Adding New Migrations

When adding new migrations:
1. Create a new file in the `migrations/` directory
2. Name it with the format: `YYYYMMDDHHMMSS_description.sql`
3. Include both the up and down migrations
4. Test the migration locally before pushing to production 