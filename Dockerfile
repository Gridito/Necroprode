FROM node:18-alpine

WORKDIR /app

# Instalar dependencias necesarias para compilar módulos nativos como bcrypt
RUN apk add --no-cache python3 make g++

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias y forzar compilación de módulos nativos desde el código fuente
RUN npm install && \
    npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
