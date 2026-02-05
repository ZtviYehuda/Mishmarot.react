
-- Add email column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='email') THEN 
        ALTER TABLE employees ADD COLUMN email VARCHAR(255); 
        CREATE INDEX idx_employees_email ON employees(email);
    END IF; 
END $$;

-- Create table for verification codes
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- Index for cleanup and lookup
CREATE INDEX IF NOT EXISTS idx_codes_email_active ON verification_codes(email, is_used, expires_at);
