-- Migration: Add recurring expense support to expenses table
ALTER TABLE expenses
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence VARCHAR(32),
ADD COLUMN next_payment_date DATE; 