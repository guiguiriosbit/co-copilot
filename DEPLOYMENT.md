# Guía de Despliegue - Commercial Copilot en Ubuntu Server con Virtualmin

## Requisitos Previos

- Ubuntu Server con Virtualmin instalado
- Acceso SSH al servidor
- Dominio configurado (ej: `comercialcopilot.tudominio.com`)
- Node.js 18+ y npm instalados en el servidor

## Paso 1: Preparar el Servidor

### 1.1 Conectar al servidor vía SSH
```bash
ssh usuario@tu-servidor.com
```

### 1.2 Instalar Node.js y npm (si no están instalados)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verificar instalación
npm --version
```

### 1.3 Instalar PM2 (gestor de procesos)
```bash
sudo npm install -g pm2
```

### 1.4 Crear directorio para la aplicación
```bash
sudo mkdir -p /var/www/commercial_copilot
sudo chown -R $USER:$USER /var/www/commercial_copilot
```

## Paso 2: Transferir Archivos al Servidor

### Opción A: Usando SCP desde tu Mac
```bash
# Desde tu Mac, en el directorio del proyecto
cd ~/Desktop/commercial_copilot
tar -czf commercial_copilot.tar.gz backend frontend start.sh package.json
scp commercial_copilot.tar.gz usuario@tu-servidor.com:/var/www/commercial_copilot/
```

### Opción B: Usando Git (recomendado)
```bash
# En tu Mac, inicializa git si no lo has hecho
cd ~/Desktop/commercial_copilot
git init
git add .
git commit -m "Initial commit"

# Sube a GitHub/GitLab
# Luego en el servidor:
cd /var/www/commercial_copilot
git clone https://github.com/tuusuario/commercial_copilot.git .
```

## Paso 3: Configurar la Aplicación en el Servidor

### 3.1 Descomprimir archivos (si usaste SCP)
```bash
cd /var/www/commercial_copilot
tar -xzf commercial_copilot.tar.gz
rm commercial_copilot.tar.gz
```

### 3.2 Instalar dependencias del backend
```bash
cd /var/www/commercial_copilot/backend
npm install
```

### 3.3 Instalar dependencias del frontend
```bash
cd /var/www/commercial_copilot/frontend
npm install
```

### 3.4 Construir el frontend para producción
```bash
cd /var/www/commercial_copilot/frontend
npm run build
```

## Paso 4: Configurar Variables de Entorno

### 4.1 Crear archivo .env para el backend
```bash
cd /var/www/commercial_copilot/backend
nano .env
```

Agregar:
```env
PORT=5000
NODE_ENV=production
```

### 4.2 Actualizar configuración del frontend
```bash
cd /var/www/commercial_copilot/frontend
nano .env.production
```

Agregar:
```env
VITE_API_URL=https://comercialcopilot.tudominio.com/api
```

## Paso 5: Configurar PM2 para el Backend

### 5.1 Crear archivo de configuración PM2
```bash
cd /var/www/commercial_copilot
nano ecosystem.config.js
```

Contenido:
```javascript
module.exports = {
  apps: [{
    name: 'commercial-copilot-backend',
    script: './backend/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### 5.2 Iniciar la aplicación con PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Seguir las instrucciones que aparezcan
```

### 5.3 Verificar que el backend está corriendo
```bash
pm2 status
pm2 logs commercial-copilot-backend
```

## Paso 6: Configurar Nginx en Virtualmin

### 6.1 Crear Virtual Server en Virtualmin
1. Acceder a Virtualmin: `https://tu-servidor.com:10000`
2. Ir a **Create Virtual Server**
3. Configurar:
   - Domain name: `comercialcopilot.tudominio.com`
   - Administration password: [tu contraseña]
   - Crear el servidor

### 6.2 Configurar Nginx como Reverse Proxy

Editar la configuración de Nginx:
```bash
sudo nano /etc/nginx/sites-available/comercialcopilot.tudominio.com
```

Contenido:
```nginx
server {
    listen 80;
    server_name comercialcopilot.tudominio.com;

    # Permitir uploads de videos grandes (hasta 100MB)
    client_max_body_size 100M;

    # Servir archivos estáticos del frontend
    root /var/www/commercial_copilot/frontend/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/commercial_copilot_access.log;
    error_log /var/log/nginx/commercial_copilot_error.log;

    # Proxy para el backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout para uploads grandes
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Servir archivos públicos (videos del loop)
    location /public {
        alias /var/www/commercial_copilot/backend/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Servir archivos estáticos del frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3 Habilitar el sitio y reiniciar Nginx
```bash
sudo ln -s /etc/nginx/sites-available/comercialcopilot.tudominio.com /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar configuración
sudo systemctl restart nginx
```

## Paso 7: Configurar SSL con Let's Encrypt

### 7.1 Instalar Certbot
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

### 7.2 Obtener certificado SSL
```bash
sudo certbot --nginx -d comercialcopilot.tudominio.com
```

Seguir las instrucciones en pantalla.

### 7.3 Verificar renovación automática
```bash
sudo certbot renew --dry-run
```

## Paso 8: Configurar Base de Datos SQLite

La base de datos SQLite se creará automáticamente en:
```bash
/var/www/commercial_copilot/backend/database.sqlite
```

Asegurar permisos correctos:
```bash
sudo chown -R www-data:www-data /var/www/commercial_copilot/backend/database.sqlite
sudo chmod 664 /var/www/commercial_copilot/backend/database.sqlite
```

## Paso 9: Configurar Directorio de Video Loop

### 9.1 Crear directorio para videos
```bash
mkdir -p /var/www/commercial_copilot/backend/public/videoloop
```

### 9.2 Configurar permisos para permitir uploads
```bash
sudo chown -R www-data:www-data /var/www/commercial_copilot/backend/public/videoloop
sudo chmod 755 /var/www/commercial_copilot/backend/public/videoloop
```

### 9.3 Verificar que el directorio existe
```bash
ls -la /var/www/commercial_copilot/backend/public/
```

> **Nota:** Los videos se subirán después a través del panel de administración. No es necesario subir videos durante el despliegue inicial.

## Paso 10: Verificación Final

### 10.1 Verificar servicios
```bash
# Backend
pm2 status
curl http://localhost:5000/api/health  # Si tienes un endpoint de health

# Nginx
sudo systemctl status nginx

# Acceder desde navegador
# https://comercialcopilot.tudominio.com
```

### 10.2 Ver logs en caso de problemas
```bash
# Logs del backend
pm2 logs commercial-copilot-backend

# Logs de Nginx
sudo tail -f /var/log/nginx/commercial_copilot_error.log
```

## Paso 11: Mantenimiento

### Actualizar la aplicación
```bash
cd /var/www/commercial_copilot

# Si usas Git
git pull origin main

# Reinstalar dependencias si es necesario
cd backend && npm install
cd ../frontend && npm install

# Reconstruir frontend
cd frontend && npm run build

# Reiniciar backend
pm2 restart commercial-copilot-backend
```

### Monitoreo
```bash
# Ver estado de PM2
pm2 status

# Ver uso de recursos
pm2 monit

# Ver logs en tiempo real
pm2 logs commercial-copilot-backend --lines 100
```

### Backup de la base de datos
```bash
# Crear backup
cp /var/www/commercial_copilot/backend/database.sqlite \
   /var/www/commercial_copilot/backend/database.sqlite.backup.$(date +%Y%m%d)

# Automatizar backups diarios (agregar a crontab)
sudo crontab -e
# Agregar:
# 0 2 * * * cp /var/www/commercial_copilot/backend/database.sqlite /var/www/commercial_copilot/backend/database.sqlite.backup.$(date +\%Y\%m\%d)
```

### Backup de videos del loop
```bash
# Crear backup de videos
tar -czf videoloop_backup_$(date +%Y%m%d).tar.gz \
   /var/www/commercial_copilot/backend/public/videoloop/

# Mover a directorio de backups
mv videoloop_backup_*.tar.gz /var/backups/
```

## Solución de Problemas Comunes

### El backend no inicia
```bash
pm2 logs commercial-copilot-backend
# Verificar que el puerto 5000 no esté en uso
sudo lsof -i :5000
```

### Error 502 Bad Gateway
```bash
# Verificar que el backend esté corriendo
pm2 status
# Verificar configuración de Nginx
sudo nginx -t
```

### Problemas con permisos de base de datos
```bash
sudo chown -R www-data:www-data /var/www/commercial_copilot/backend/
sudo chmod 775 /var/www/commercial_copilot/backend/
sudo chmod 664 /var/www/commercial_copilot/backend/database.sqlite
```

### Error al subir videos en el panel admin
```bash
# Verificar permisos del directorio videoloop
ls -la /var/www/commercial_copilot/backend/public/videoloop/
sudo chown -R www-data:www-data /var/www/commercial_copilot/backend/public/videoloop/
sudo chmod 755 /var/www/commercial_copilot/backend/public/videoloop/
```

### Videos no se reproducen en el player
```bash
# Verificar que Nginx esté sirviendo archivos estáticos
curl http://localhost/public/videoloop/
# Verificar configuración de Nginx para servir /public
```

## Seguridad Adicional

### Configurar firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Limitar acceso al backend
En el archivo de configuración de Nginx, puedes agregar autenticación básica o restricciones de IP para rutas administrativas.

### Limitar tamaño de uploads (para videos grandes)
En la configuración de Nginx, agregar:
```nginx
client_max_body_size 100M;
```

---

**¡Listo!** Tu aplicación Commercial Copilot debería estar funcionando en:
`https://comercialcopilot.tudominio.com`
