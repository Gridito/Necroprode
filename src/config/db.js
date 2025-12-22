const mysql = require('mysql2');
require('dotenv').config();

// Support multiple cloud platforms' environment variable names
// Railway, Render, Heroku, etc. use different variable names
function getDbConfig() {
    // Railway MySQL service variables (check this first as it's most specific)
    if (process.env.MYSQL_HOST || process.env.MYSQLUSER) {
        return {
            host: process.env.MYSQL_HOST || process.env.MYSQLHOST,
            port: parseInt(process.env.MYSQL_PORT || process.env.MYSQLPORT || '3306'),
            user: process.env.MYSQLUSER || process.env.MYSQL_USER,
            password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD,
            database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
        };
    }

    // Try DATABASE_URL (some platforms use this)
    if (process.env.DATABASE_URL) {
        try {
            // Handle mysql://user:pass@host:port/db format
            const url = process.env.DATABASE_URL.replace(/^mysql:\/\//, 'http://');
            const parsed = new URL(url);
            return {
                host: parsed.hostname,
                port: parseInt(parsed.port || '3306'),
                user: parsed.username,
                password: parsed.password,
                database: parsed.pathname.slice(1), // Remove leading '/'
            };
        } catch (e) {
            console.warn('⚠️ No se pudo parsear DATABASE_URL, usando variables estándar');
        }
    }

    // Standard variables (docker-compose, local, etc.)
    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || process.env.MYSQL_USER,
        password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
        database: process.env.DB_NAME || process.env.MYSQL_DATABASE,
    };
}

const dbConfig = getDbConfig();

// Log configuration (without password) for debugging
console.log('📊 Configuración de base de datos:', {
    host: dbConfig.host || 'NO CONFIGURADO',
    port: dbConfig.port || 'NO CONFIGURADO',
    user: dbConfig.user || 'NO CONFIGURADO',
    password: dbConfig.password ? '***' : 'NO CONFIGURADO',
    database: dbConfig.database || 'NO CONFIGURADO',
});

// Validate required fields
if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
    console.error('❌ Error: Faltan variables de entorno de base de datos');
    console.error('Variables disponibles:', Object.keys(process.env).filter(k => 
        k.includes('DB_') || k.includes('MYSQL') || k.includes('DATABASE')
    ));
    throw new Error('Variables de entorno de base de datos no configuradas correctamente');
}

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Add connection timeout and retry options
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000,
});

module.exports = pool.promise();
