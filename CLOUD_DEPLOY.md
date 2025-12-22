# Guía de Despliegue en la Nube - Necroprode

Esta guía te ayudará a desplegar Necroprode en diferentes plataformas de cloud.

## 📋 Requisitos Previos

- Cuenta en una plataforma de cloud (AWS, DigitalOcean, Azure, etc.)
- Conocimientos básicos de Docker y línea de comandos
- Acceso SSH a tu servidor (si usas VPS)

---

## 🚀 Opción 1: DigitalOcean App Platform (Recomendado - Más Fácil)

### Paso 1: Preparar el Repositorio
1. Sube tu código a GitHub/GitLab/Bitbucket
2. Asegúrate de que el repositorio sea público o conecta tu cuenta

### Paso 2: Crear la Aplicación
1. Ve a [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click en "Create App"
3. Conecta tu repositorio
4. Selecciona la rama `main` o `master`

### Paso 3: Configurar Servicios

#### Servicio 1: Base de Datos MySQL
1. Click en "Add Resource" → "Database"
2. Selecciona "MySQL"
3. Elige el plan (Starter es suficiente para comenzar)
4. Anota las credenciales que se generan

#### Servicio 2: Aplicación Web
1. Configura el servicio web:
   - **Build Command**: `npm install && npm rebuild bcrypt --build-from-source`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3000`
   - **Environment Variables**:
     ```
     DB_HOST=<hostname_del_database>
     DB_USER=<usuario_del_database>
     DB_PASSWORD=<password_del_database>
     DB_NAME=necroprode
     JWT_SECRET=<genera_un_secreto_aleatorio>
     DEADLINE_DATE=2025-12-31T23:59:59
     PORT=3000
     ```

### Paso 4: Desplegar
1. Click en "Create Resources"
2. Espera a que se complete el despliegue (5-10 minutos)
3. Tu app estará disponible en `https://tu-app.ondigitalocean.app`

### Paso 5: Crear Usuario Administrador
1. Ve a la consola de tu aplicación
2. Ejecuta: `npm run create-admin`
   - O manualmente: `node create-admin.js`

---

## 🚀 Opción 2: DigitalOcean Droplet (VPS)

### Paso 1: Crear Droplet
1. Ve a DigitalOcean → Create → Droplets
2. Elige:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic, $12/mes (2GB RAM) mínimo
   - **Region**: Elige la más cercana
   - **Authentication**: SSH keys (recomendado)

### Paso 2: Conectar al Servidor
```bash
ssh root@tu_ip_del_servidor
```

### Paso 3: Instalar Docker y Docker Compose
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Verificar instalación
docker --version
docker-compose --version
```

### Paso 4: Subir el Código
```bash
# Opción A: Clonar desde Git
git clone https://github.com/tu-usuario/necroprode.git
cd necroprode

# Opción B: Subir archivos con SCP (desde tu máquina local)
# scp -r . root@tu_ip:/root/necroprode
```

### Paso 5: Configurar Variables de Entorno
```bash
# Crear archivo .env
nano .env
```

Pega el siguiente contenido (ajusta los valores):
```env
DB_ROOT_PASSWORD=tu_password_seguro_aqui
DB_USER=necro_user
DB_PASSWORD=tu_password_db_aqui
DB_NAME=necroprode
JWT_SECRET=$(openssl rand -base64 32)
DEADLINE_DATE=2025-12-31T23:59:59
PORT=3000
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`

### Paso 6: Construir y Desplegar
```bash
# Construir y levantar los contenedores
docker-compose up -d --build

# Ver logs para verificar que todo funciona
docker-compose logs -f app
```

### Paso 7: Configurar Firewall
```bash
# Permitir puertos necesarios
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Paso 8: Configurar Nginx (Opcional pero Recomendado)
```bash
# Instalar Nginx
apt install nginx -y

# Crear configuración
nano /etc/nginx/sites-available/necroprode
```

Pega esta configuración:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar sitio
ln -s /etc/nginx/sites-available/necroprode /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Paso 9: Crear Usuario Administrador
```bash
docker-compose exec app npm run create-admin
```

### Paso 10: Configurar SSL con Let's Encrypt (Opcional)
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d tu-dominio.com
```

---

## 🚀 Opción 3: AWS EC2

### Paso 1: Crear Instancia EC2
1. Ve a AWS Console → EC2 → Launch Instance
2. Elige:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (gratis por 12 meses) o t3.small
   - **Security Group**: Abre puertos 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - **Key Pair**: Crea o usa una existente

### Paso 2-9: Sigue los mismos pasos que DigitalOcean Droplet
(Instalar Docker, subir código, configurar, etc.)

### Paso 10: Configurar Elastic IP (Opcional)
1. EC2 → Elastic IPs → Allocate Elastic IP
2. Asocia la IP a tu instancia
3. Usa esta IP para acceder a tu aplicación

---

## 🚀 Opción 4: Railway.app (Muy Fácil)

### Paso 1: Crear Cuenta
1. Ve a [Railway.app](https://railway.app)
2. Crea una cuenta con GitHub

### Paso 2: Crear Proyecto
1. Click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Elige tu repositorio

### Paso 3: Agregar Base de Datos
1. Click en "New" → "Database" → "MySQL"
2. Railway creará automáticamente las variables de entorno

### Paso 4: Configurar Variables de Base de Datos

**⚠️ IMPORTANTE**: En Railway, NO puedes usar `localhost` como `DB_HOST`. Debes usar el hostname del servicio MySQL.

1. **Obtener el hostname del MySQL**:
   - Ve a tu servicio **MySQL** → **Variables**
   - Busca la variable `MYSQL_HOST` o `MYSQLHOST`
   - **Copia ese valor** (será algo como `containers-us-west-xxx.railway.app` o similar)
   - También anota: `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

2. **Configurar en el servicio web**:
   - Ve a tu servicio **Necroprode (web)** → **Variables**
   - Agrega estas variables:
     ```
     DB_HOST=<valor_de_MYSQL_HOST>  ⚠️ NO uses "localhost"!
     DB_USER=<valor_de_MYSQLUSER>
     DB_PASSWORD=<valor_de_MYSQLPASSWORD>
     DB_NAME=<valor_de_MYSQLDATABASE>
     DB_PORT=3306
     JWT_SECRET=<genera_un_secreto>
     DEADLINE_DATE=2025-12-31T23:59:59
     PORT=3000
     ```

3. **Verificar**:
   - Asegúrate de que `DB_HOST` NO sea `localhost`
   - Debe ser el hostname completo del servicio MySQL

### Paso 5: Desplegar
1. Railway detectará automáticamente el Dockerfile
2. El despliegue comenzará automáticamente
3. Tu app estará en `https://tu-app.railway.app`

### Paso 6: Crear Admin
1. Ve a la consola del servicio
2. Ejecuta: `npm run create-admin`

---

## 🔐 Generar JWT_SECRET Seguro

En todas las opciones, necesitas un JWT_SECRET seguro. Genera uno así:

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## ✅ Verificación Post-Despliegue

1. **Verificar que la app está corriendo**:
   - Visita la URL de tu aplicación
   - Deberías ver la pantalla de login

2. **Verificar base de datos**:
   ```bash
   docker-compose exec db mysql -u root -p -e "SHOW TABLES;" necroprode
   ```

3. **Crear usuario administrador**:
   ```bash
   docker-compose exec app npm run create-admin
   ```

4. **Probar login**:
   - Usa las credenciales del admin creado
   - Verifica que puedes acceder al panel de administración

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que las variables de entorno DB_* estén correctas
- Asegúrate de que el servicio de base de datos esté corriendo
- Revisa los logs: `docker-compose logs db`

### Error: "Port already in use"
- Cambia el puerto en docker-compose.yml o .env
- O detén el proceso que usa el puerto

### Error: "bcrypt module not found"
- Reconstruye el contenedor: `docker-compose build --no-cache app`

### Las tablas no se crean
- La app las crea automáticamente al iniciar
- Revisa los logs: `docker-compose logs app`
- Busca el mensaje "✅ Base de datos inicializada correctamente"

---

## 📝 Notas Importantes

1. **Seguridad**:
   - Nunca subas el archivo `.env` a Git
   - Usa contraseñas fuertes
   - Configura SSL/HTTPS en producción

2. **Backups**:
   - Configura backups regulares de la base de datos
   - En DigitalOcean: usa "Backups" en el droplet
   - En otros servicios: usa `mysqldump` periódicamente

3. **Monitoreo**:
   - Configura alertas de uptime
   - Monitorea el uso de recursos
   - Revisa logs regularmente

4. **Escalabilidad**:
   - Para más tráfico, considera usar un load balancer
   - Separa la base de datos en un servicio dedicado
   - Usa CDN para archivos estáticos

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs: `docker-compose logs`
2. Verifica las variables de entorno
3. Asegúrate de que todos los servicios estén corriendo
4. Revisa la documentación de tu plataforma de cloud

