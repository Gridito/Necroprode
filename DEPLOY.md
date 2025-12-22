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

## Troubleshooting
- **Database Connection Error**: Ensure the `db` service is healthy before the `app` tries to connect. The app is configured to wait/retry, but initial startup might take a few seconds for MySQL to initialize.
