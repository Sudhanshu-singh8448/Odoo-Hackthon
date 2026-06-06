-- VendorBridge Demo Seed Data
-- Run with: psql -U postgres -d odoo -f seeds/seed.sql
-- Or use: npm run seed (which runs scripts/seed.js)

-- NOTE: The JavaScript seeder (scripts/seed.js) is the PRIMARY seeder.
-- It handles password hashing via bcryptjs.
-- This SQL file is provided as a reference / fallback.
-- Passwords here are pre-hashed for 'password123' with bcrypt.

-- Pre-hashed password for 'password123' (bcrypt, 12 rounds)
-- $2a$12$LJ3m4yv5PmJxZT0Q1G5oD.G9MrcY0V4LiZtqVZX2V0U3xQ8NfZ3pW

-- To seed the database, run:
--   cd backend && npm run seed
-- This will create users, vendors, RFQs, quotations, and activity logs.

-- Default Login Credentials:
-- Admin:     admin@vendorbridge.com / password123
-- Officer:   officer@vendorbridge.com / password123
-- Manager:   manager@vendorbridge.com / password123
-- Vendor 1:  vendor1@example.com / password123
-- Vendor 2:  vendor2@example.com / password123
-- Vendor 3:  vendor3@example.com / password123
