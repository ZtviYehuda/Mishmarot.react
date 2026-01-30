-- Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default value for weekend alerts (false by default based on current preference)
INSERT INTO system_settings (key, value, description)
VALUES ('alerts_weekend_enabled', 'false', 'האם לאפשר שליחת התראות דיווח בימי שישי ושבת')
ON CONFLICT (key) DO NOTHING;
