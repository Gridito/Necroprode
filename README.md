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
3.  Create an admin user by running `npm run create-admin` (or `node create-admin.js`).
4.  Access the app at `http://localhost:3000`.

### Creating an Admin User

To create an admin user, you can:

1. **Using npm script** (recommended):
   ```bash
   npm run create-admin
   ```

2. **Directly with node**:
   ```bash
   node create-admin.js
   ```

By default, the script creates a user with:
- **Username**: `admin` (or set `ADMIN_USERNAME` in `.env`)
- **Password**: `admin123` (or set `ADMIN_PASSWORD` in `.env`)

**Important**: Change the default password after first login!

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.
