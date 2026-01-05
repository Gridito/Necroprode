const mysql = require('mysql2/promise');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbPort = parseInt(process.env.DB_PORT || '3306');

// Log configuration for debugging
console.log('📊 Configuración de base de datos:', {
    host: dbHost,
    port: dbPort,
    user: dbUser || 'NO CONFIGURADO',
    password: dbPassword ? '***' : 'NO CONFIGURADO',
    database: dbName || 'NO CONFIGURADO',
});

// Validate required fields
if (!dbHost || !dbUser || !dbPassword || !dbName) {
    console.error('❌ Error: Faltan variables de entorno de base de datos');
    console.error('');
    console.error('Variables requeridas:');
    console.error('  - DB_HOST (actualmente:', dbHost, ')');
    console.error('  - DB_USER (actualmente:', dbUser || 'NO CONFIGURADO', ')');
    console.error('  - DB_PASSWORD (actualmente:', dbPassword ? '***' : 'NO CONFIGURADO', ')');
    console.error('  - DB_NAME (actualmente:', dbName || 'NO CONFIGURADO', ')');
    console.error('');
    if (dbHost === 'localhost') {
        console.error('⚠️  PROBLEMA DETECTADO: DB_HOST está configurado como "localhost"');
        console.error('   En Railway, NO puedes usar "localhost" para conectarte a otro servicio.');
        console.error('   Necesitas usar el hostname del servicio MySQL.');
    }
    throw new Error('Variables de entorno de base de datos no configuradas correctamente');
}

// Warn if using localhost in what seems like a cloud environment
if (dbHost === 'localhost' && process.env.RAILWAY_ENVIRONMENT) {
    console.warn('⚠️  ADVERTENCIA: Estás usando "localhost" como DB_HOST en Railway.');
    console.warn('   Esto NO funcionará. Necesitas usar el hostname del servicio MySQL.');
}

// Configuración del pool con mejor manejo de reconexión
const poolConfig = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,        // 30 segundos para conectar
    enableKeepAlive: true,        // Mantener conexiones vivas
    keepAliveInitialDelay: 10000, // Ping cada 10 segundos
};

let pool = mysql.createPool(poolConfig);

// Función para recrear el pool si es necesario
function recreatePool() {
    console.log('🔄 Recreando pool de conexiones...');
    try {
        pool.end().catch(() => {}); // Ignorar errores al cerrar
    } catch (e) {
        // Ignorar
    }
    pool = mysql.createPool(poolConfig);
    console.log('✅ Pool de conexiones recreado');
}

// Wrapper para queries con reintentos automáticos
async function queryWithRetry(sql, params, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await pool.query(sql, params);
            return result;
        } catch (error) {
            const isConnectionError = 
                error.code === 'ECONNREFUSED' || 
                error.code === 'PROTOCOL_CONNECTION_LOST' ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                error.message.includes('connect ECONNREFUSED') ||
                error.message.includes('Connection lost');

            if (isConnectionError && attempt < retries) {
                console.log(`⚠️ Error de conexión (intento ${attempt}/${retries}): ${error.code || error.message}`);
                
                // Esperar antes de reintentar (backoff exponencial)
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`⏳ Esperando ${waitTime}ms antes de reintentar...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                // Recrear el pool en el segundo intento
                if (attempt === 2) {
                    recreatePool();
                }
            } else {
                throw error;
            }
        }
    }
}

// Wrapper para getConnection con reintentos
async function getConnectionWithRetry(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const connection = await pool.getConnection();
            return connection;
        } catch (error) {
            const isConnectionError = 
                error.code === 'ECONNREFUSED' || 
                error.code === 'PROTOCOL_CONNECTION_LOST' ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT';

            if (isConnectionError && attempt < retries) {
                console.log(`⚠️ Error obteniendo conexión (intento ${attempt}/${retries}): ${error.code || error.message}`);
                
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`⏳ Esperando ${waitTime}ms antes de reintentar...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                if (attempt === 2) {
                    recreatePool();
                }
            } else {
                throw error;
            }
        }
    }
}

// Exportar objeto con métodos mejorados
module.exports = {
    query: (sql, params) => queryWithRetry(sql, params),
    getConnection: () => getConnectionWithRetry(),
    // Acceso directo al pool por si se necesita
    getPool: () => pool,
    // Método para verificar conexión
    ping: async () => {
        try {
            await pool.query('SELECT 1');
            return true;
        } catch (error) {
            return false;
        }
    }
};
