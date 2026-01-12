# Necroprode

**Necroprode** is a dark, minimalist death prediction game where users create lists of celebrities they predict might pass away within a given timeframe.

## Features
- **User Authentication**: Secure registration and login.
- **List Management**: Create and edit a list of up to 10 names.
- **Deadlines**: Lists lock automatically after a configured deadline.
- **Admin Panel**: Manage users and assign ages to deceased celebrities to calculate scores.
- **Scoring System**: Automatic point calculation based on age at death (younger = more points).
- **Dark Mode UI**: Sleek, modern interface using Tailwind CSS.
- **Dockerized**: Fully containerized application with MySQL database.

## Quick Start
1.  Clone the repository.
2.  Run `docker-compose up --build`.
3.  Access the app at `http://localhost:3000`.

### Admin User

**El usuario administrador se crea automáticamente** cuando la base de datos se inicializa por primera vez.

**Credenciales por defecto**:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión por seguridad.

El usuario admin se crea automáticamente mediante:
- `init.sql`: Se ejecuta cuando MySQL se inicia por primera vez
- `src/config/init-db.js`: Se ejecuta cada vez que la aplicación inicia (como respaldo)

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions
