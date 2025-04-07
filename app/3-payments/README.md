# Payment System Documentation

This document explains the architecture, logic, and implementation of the payment system in the COVION STUDIO Partner Portal.

## Overview

The payment system allows partners to withdraw their available balance using three different payment methods:
1. Bank Transfer (ACH) via Plaid
2. PayPal
3. Debit Card via Stripe

## System Architecture

The payment system is built with a client-server architecture:

- **Frontend**: React components handle user interactions and form submissions
- **Backend**: Server-side API routes process withdrawal requests and interact with payment processors
- **Database**: Supabase tables store transaction history and user balances

## Database Schema

The payment system primarily interacts with these tables:
- `cvnpartners_user_balances`: Stores user's available balance
- `cvnpartners_withdrawals`: Records all withdrawal attempts and their statuses
- `cvnpartners_transactions`: Records all financial transactions

## API Routes

- `/api/process-withdrawal`: Processes withdrawal requests
- `/api/withdrawals`: Retrieves withdrawal history for a user
- `/api/user-balance`: Gets current user balance
- `/api/set_access_token`: Exchanges Plaid public token for access token

## Authentication & Security

All payment-related API routes require authentication. The system uses Supabase's Auth system to verify users before processing any financial transactions.

## Payment Flow

1. User selects a payment method 
2. User enters withdrawal amount and any method-specific details
3. Frontend validates the request
4. Backend verifies the user has sufficient balance
5. Backend initiates the appropriate payment process
6. Transaction is recorded in the database
7. User balance is updated

## Implementation Details

See the individual files in this folder for specific implementation details.

