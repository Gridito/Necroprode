const bcrypt = require('bcrypt');
const db = require('./src/config/db');
require('dotenv').config();

async function createAdmin() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    try {
        // Verificar si el usuario ya existe
        const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (existing.length > 0) {
            console.log(`El usuario "${username}" ya existe.`);
            // Actualizar a admin si no lo es
            const user = existing[0];
            if (user.role !== 'admin') {
                await db.query('UPDATE users SET role = ? WHERE username = ?', ['admin', username]);
                console.log(`Usuario "${username}" actualizado a administrador.`);
            } else {
                console.log(`El usuario "${username}" ya es administrador.`);
            }
            process.exit(0);
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insertar usuario administrador
        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, hash, 'admin']
        );

        console.log('✅ Usuario administrador creado exitosamente!');
        console.log(`   Usuario: ${username}`);
        console.log(`   Contraseña: ${password}`);
        console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión.');
        
    } catch (error) {
        console.error('❌ Error al crear el usuario administrador:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

createAdmin();


