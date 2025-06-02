FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeapp -u 1001

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Crear directorio de logs con permisos correctos
RUN mkdir -p logs && chown -R nodeapp:nodejs logs

# Copiar código fuente
COPY --chown=nodeapp:nodejs . .

# Cambiar a usuario no-root
USER nodeapp

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Comando para ejecutar la aplicación
CMD ["npm", "start"]