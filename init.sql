CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    total_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT DEFAULT NULL,
    is_dead BOOLEAN DEFAULT FALSE,
    calculated_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default deadline (will be set via the admin panel)
-- Default to end of 2025 if not set via admin panel
INSERT IGNORE INTO config (config_key, config_value) 
VALUES ('deadline_date', '2025-12-31T23:59:59');

-- Insert default admin user (Password: admin123)
-- Hash generado con bcrypt (rounds: 10) para la contraseña 'admin123'
-- IMPORTANTE: Cambia la contraseña después del primer inicio de sesión
INSERT IGNORE INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$xXAEOZaExVioqdcgmrUqdOpo6LAy2TNssh8UHykv.AqEG1M3IbCES', 'admin');
