const db = require('./src/config/db');
require('dotenv').config();

async function createConfigTable() {
    try {
        // Create config table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(255) NOT NULL UNIQUE,
                config_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Insert default deadline if it doesn't exist
        const [existing] = await db.query('SELECT * FROM config WHERE config_key = ?', ['deadline_date']);
        
        if (existing.length === 0) {
            const defaultDeadline = process.env.DEADLINE_DATE || '2025-12-31T23:59:59';
            await db.query(
                'INSERT INTO config (config_key, config_value) VALUES (?, ?)',
                ['deadline_date', defaultDeadline]
            );
            console.log('✅ Tabla config creada y fecha límite por defecto insertada.');
        } else {
            console.log('✅ Tabla config ya existe y tiene configuración.');
        }

        console.log('✅ Configuración completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error al crear la tabla config:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

createConfigTable();

