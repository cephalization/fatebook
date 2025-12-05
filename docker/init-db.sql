-- Initialize fate database
-- Note: The POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB env vars
-- already create the 'fate' user and database, but we ensure proper ownership here.

-- Grant all privileges to the fate user on the fate database
GRANT ALL PRIVILEGES ON DATABASE fate TO fate;

-- Ensure fate user has proper schema permissions
GRANT ALL ON SCHEMA public TO fate;
