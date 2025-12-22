const mysql = require('mysql2');
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
        console.error('');
        console.error('   Para solucionarlo:');
        console.error('   1. Ve a tu servicio MySQL en Railway → Variables');
        console.error('   2. Busca "MYSQL_HOST" o "MYSQLHOST"');
        console.error('   3. Copia ese valor');
        console.error('   4. Ve a tu servicio web → Variables');
        console.error('   5. Configura DB_HOST con ese valor (NO uses "localhost")');
    }
    throw new Error('Variables de entorno de base de datos no configuradas correctamente');
}

// Warn if using localhost in what seems like a cloud environment
if (dbHost === 'localhost' && process.env.RAILWAY_ENVIRONMENT) {
    console.warn('⚠️  ADVERTENCIA: Estás usando "localhost" como DB_HOST en Railway.');
    console.warn('   Esto NO funcionará. Necesitas usar el hostname del servicio MySQL.');
}

const pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
});

module.exports = pool.promise();
