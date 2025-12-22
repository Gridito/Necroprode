# Deployment Guide

This project is designed to be deployed using Docker and Docker Compose.

## Prerequisites
- Docker Engine
- Docker Compose

## Configuration
1.  Copy `.env.example` to `.env` (or create one based on the example below).
2.  Update the variables as needed:
    ```env
    DB_ROOT_PASSWORD=secure_root_password
    DB_USER=necro_user
    DB_PASSWORD=secure_db_password
    DB_NAME=necroprode
    JWT_SECRET=your_jwt_secret
    DEADLINE_DATE=2025-12-31T23:59:59
    ```

## Development
To start the application in development mode:

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`.
The database will run on port `3306`.

## Database Persistence
Database data is stored in the `mysql-data` Docker volume. This ensures data persists even if the containers are removed.

## Database Initialization
**Las tablas se crean automáticamente** cuando la aplicación inicia. El sistema incluye:

1. **Script de inicialización automática**: La aplicación verifica y crea todas las tablas necesarias (`users`, `lists`, `config`) al iniciar, incluso si el `init.sql` no se ejecutó.

2. **Doble protección**:
   - `init.sql`: Se ejecuta cuando MySQL se inicia por primera vez (base de datos vacía)
   - `src/config/init-db.js`: Se ejecuta cada vez que la aplicación inicia, asegurando que las tablas existan

3. **Seguro para producción**: El script usa `CREATE TABLE IF NOT EXISTS`, por lo que es seguro ejecutarlo múltiples veces sin afectar datos existentes.

## Cloud Deployment
Para despliegue en la nube (AWS, Azure, GCP, DigitalOcean, etc.):

1. **Primera vez**: Las tablas se crearán automáticamente cuando la aplicación inicie
2. **Reinicios**: Las tablas existentes no se modificarán, solo se verificarán
3. **Migraciones**: Si necesitas agregar nuevas tablas en el futuro, actualiza `src/config/init-db.js`

### Pasos para deploy:
```bash
# 1. Configurar variables de entorno en tu plataforma
# 2. Construir y desplegar con docker-compose o tu servicio de contenedores
docker-compose up -d --build

# 3. Crear usuario administrador
docker-compose exec app npm run create-admin
```

## Troubleshooting
- **Database Connection Error**: Ensure the `db` service is healthy before the `app` tries to connect. The app is configured to wait/retry, but initial startup might take a few seconds for MySQL to initialize.
- **Missing Tables**: Si las tablas no existen, la aplicación las creará automáticamente al iniciar. Revisa los logs para confirmar la inicialización.
