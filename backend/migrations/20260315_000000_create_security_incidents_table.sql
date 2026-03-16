-- Security Incidents Table - RBI/SEBI Compliance
-- Immutable audit trail for all security events

CREATE TABLE IF NOT EXISTS security_incidents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    incident_type VARCHAR(100) NOT NULL,
    details LONGTEXT,
    user_agent VARCHAR(500),
    url VARCHAR(500),
    timestamp DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for fast querying
    INDEX idx_incident_type (incident_type),
    INDEX idx_created_at (created_at),
    INDEX idx_timestamp (timestamp),
    
    -- Ensure immutability - no updates allowed
    CONSTRAINT no_update CHECK (1=1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trigger to prevent updates (immutable log)
DELIMITER //
CREATE TRIGGER prevent_security_incident_update
BEFORE UPDATE ON security_incidents
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Security incidents are immutable and cannot be updated';
END//
DELIMITER ;

-- Create trigger to prevent deletes (immutable log)
DELIMITER //
CREATE TRIGGER prevent_security_incident_delete
BEFORE DELETE ON security_incidents
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Security incidents are immutable and cannot be deleted';
END//
DELIMITER ;
