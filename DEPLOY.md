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

📖 **Para una guía completa y detallada de despliegue en la nube, consulta [CLOUD_DEPLOY.md](./CLOUD_DEPLOY.md)**

La guía incluye instrucciones paso a paso para:
- ✅ DigitalOcean App Platform (más fácil)
- ✅ DigitalOcean Droplet (VPS)
- ✅ AWS EC2
- ✅ Railway.app
- ✅ Configuración de SSL/HTTPS
- ✅ Troubleshooting común

### Resumen Rápido:
```bash
# 1. Configurar variables de entorno (.env)
# 2. Construir y desplegar
docker-compose up -d --build

# 3. Crear usuario administrador
docker-compose exec app npm run create-admin
```

**Nota**: Las tablas se crearán automáticamente cuando la aplicación inicie.

## Troubleshooting
- **Database Connection Error**: Ensure the `db` service is healthy before the `app` tries to connect. The app is configured to wait/retry, but initial startup might take a few seconds for MySQL to initialize.
- **Missing Tables**: Si las tablas no existen, la aplicación las creará automáticamente al iniciar. Revisa los logs para confirmar la inicialización.
