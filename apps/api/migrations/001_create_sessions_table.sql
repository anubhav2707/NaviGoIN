-- Create sessions table for user session management
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token TEXT NOT NULL,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    
    -- Indexes for performance
    INDEX idx_user_sessions (user_id, revoked_at),
    INDEX idx_session_expiry (expires_at),
    INDEX idx_active_sessions (user_id, revoked_at, expires_at),
    INDEX idx_device_sessions (device_id, user_id)
);

-- Add comments for documentation
COMMENT ON TABLE sessions IS 'Stores user authentication sessions for managing login states across devices';
COMMENT ON COLUMN sessions.id IS 'Unique session identifier';
COMMENT ON COLUMN sessions.user_id IS 'Reference to the user who owns this session';
COMMENT ON COLUMN sessions.token IS 'Hashed session token for validation';
COMMENT ON COLUMN sessions.device_id IS 'Unique identifier for the device';
COMMENT ON COLUMN sessions.device_name IS 'Human-readable device name';
COMMENT ON COLUMN sessions.device_type IS 'Type of device (mobile, web, tablet)';
COMMENT ON COLUMN sessions.ip_address IS 'IP address from which session was created';
COMMENT ON COLUMN sessions.user_agent IS 'User agent string from the client';
COMMENT ON COLUMN sessions.created_at IS 'When the session was created';
COMMENT ON COLUMN sessions.last_accessed_at IS 'Last time this session was used';
COMMENT ON COLUMN sessions.expires_at IS 'When the session expires';
COMMENT ON COLUMN sessions.revoked_at IS 'When the session was revoked (NULL if active)';
COMMENT ON COLUMN sessions.revoked_reason IS 'Reason for revocation (security, user_action, admin_action, expired)';
