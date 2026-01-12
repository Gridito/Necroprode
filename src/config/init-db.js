const db = require('./db');

/**
 * Initialize database tables if they don't exist
 * This ensures tables are created even if init.sql wasn't executed
 * Safe to run multiple times - uses IF NOT EXISTS
 */
async function initializeDatabase(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log('Verificando estructura de la base de datos...');

            // Create users table
            await db.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'user') DEFAULT 'user',
                    total_score INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create lists table
            await db.query(`
                CREATE TABLE IF NOT EXISTS lists (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    age INT DEFAULT NULL,
                    is_dead BOOLEAN DEFAULT FALSE,
                    calculated_points INT DEFAULT 0,
                    bonus_points INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);

            // Agregar columna bonus_points si no existe (para bases de datos existentes)
            try {
                await db.query(`ALTER TABLE lists ADD COLUMN bonus_points INT DEFAULT 0`);
                console.log('✅ Columna bonus_points agregada');
            } catch (e) {
                // La columna ya existe, ignorar error
            }

            // Create config table
            await db.query(`
                CREATE TABLE IF NOT EXISTS config (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    config_key VARCHAR(255) NOT NULL UNIQUE,
                    config_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            // Insert default deadline if it doesn't exist
            await db.query(`
                INSERT IGNORE INTO config (config_key, config_value) 
                VALUES ('deadline_date', ?)
            `, [process.env.DEADLINE_DATE || '2025-12-31T23:59:59']);

            // Insert default admin user if it doesn't exist
            // Hash para contraseña 'admin123' generado con bcrypt (rounds: 10)
            const adminHash = '$2b$10$xXAEOZaExVioqdcgmrUqdOpo6LAy2TNssh8UHykv.AqEG1M3IbCES';
            await db.query(`
                INSERT IGNORE INTO users (username, password_hash, role) 
                VALUES ('admin', ?, 'admin')
            `, [adminHash]);

            console.log('✅ Base de datos inicializada correctamente');
            return;
        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                // Database not ready yet, retry
                if (i < retries - 1) {
                    console.log(`⏳ Base de datos no disponible, reintentando en ${delay/1000}s... (${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            console.error('❌ Error al inicializar la base de datos:', error.message);
            
            // Provide helpful error message on connection refused
            if (error.code === 'ECONNREFUSED' && i === retries - 1) {
                console.error('');
                console.error('🔍 DIAGNÓSTICO:');
                console.error('   El error ECONNREFUSED significa que no se puede conectar al host de la base de datos.');
                console.error('   Verifica que:');
                console.error('   1. DB_HOST tenga el hostname correcto del servicio MySQL (NO "localhost")');
                console.error('   2. El servicio MySQL esté corriendo en Railway');
                console.error('   3. Las variables DB_USER, DB_PASSWORD, DB_NAME estén correctas');
                console.error('');
            }
            
            // On last retry, throw error to prevent server from starting
            if (i === retries - 1) {
                throw new Error(`No se pudo conectar a la base de datos después de ${retries} intentos`);
            }
        }
    }
}

module.exports = initializeDatabase;

