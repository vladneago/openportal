-- OpenPortal — Database Initialization
-- This script runs once when the PostgreSQL container is first created.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram matching for fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- Remove accents for search
CREATE EXTENSION IF NOT EXISTS "citext";          -- Case-insensitive text

-- Create a function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
