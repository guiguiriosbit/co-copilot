# Guía: Archivos para Subir a Ubuntu Server

## ✅ ARCHIVOS QUE DEBES SUBIR

### Estructura Completa a Subir:

```
commercial_copilot/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── adController.js
│   │   ├── adminController.js
│   │   └── videoLoopController.js          ← NUEVO
│   ├── models/
│   │   ├── Ad.js
│   │   ├── Campaign.js
│   │   └── GeoZone.js
│   ├── public/                             ← NUEVO directorio
│   │   └── videoloop/                      ← NUEVO (vacío inicialmente)
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── seed.js
│
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── AdDisplay.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   ├── InfoBar.jsx
│   │   │   ├── LocationOverlay.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PlayerPage.jsx
│   │   │   └── SimulationMap.jsx
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   └── pt.json
│   │   ├── utils/
│   │   │   └── languageDetector.js
│   │   ├── App.jsx
│   │   ├── i18n.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── vite.config.js
│
├── DEPLOYMENT.md
├── PROJECT_OVERVIEW.md
├── README.md (si existe)
└── start.sh
```

---

## ❌ ARCHIVOS QUE **NO** DEBES SUBIR

### 1. Node Modules (MUY IMPORTANTE)
```
❌ backend/node_modules/
❌ frontend/node_modules/
```
**Razón:** Estos directorios son enormes (cientos de MB) y se regeneran con `npm install` en el servidor.

### 2. Archivos de Base de Datos Local
```
❌ backend/database.sqlite
```
**Razón:** La base de datos se creará automáticamente en el servidor. Si necesitas migrar datos, hazlo después del despliegue.

### 3. Archivos de Build del Frontend
```
❌ frontend/dist/
```
**Razón:** Se generará en el servidor con `npm run build`.

### 4. Archivos del Sistema
```
❌ .DS_Store
❌ Thumbs.db
❌ desktop.ini
```
**Razón:** Son archivos específicos de macOS/Windows que no se necesitan en el servidor.

### 5. Archivos de Configuración Local
```
❌ backend/.env (si contiene datos sensibles locales)
❌ frontend/.env.local
```
**Razón:** Crearás nuevos archivos `.env` en el servidor con configuración de producción.

### 6. Archivos de Git (si usas SCP/FTP)
```
❌ .git/ (solo si NO usas Git para desplegar)
```
**Razón:** Si usas Git, sí debes incluir `.git/`. Si usas SCP/FTP, no lo necesitas.

### 7. Archivos de Desarrollo
```
❌ backend/check_db.js (opcional, solo para desarrollo)
❌ prompt.md (opcional, documentación de desarrollo)
```

### 8. Videos de Loop (inicialmente)
```
❌ backend/public/videoloop/*.mp4
```
**Razón:** Los videos se subirán después a través del panel admin. No los incluyas en el despliegue inicial para reducir tamaño.

---

## 📦 MÉTODOS RECOMENDADOS PARA SUBIR

### Opción 1: Git (RECOMENDADO) ⭐

**Ventajas:**
- Control de versiones
- Fácil actualización
- Historial de cambios
- Automático excluye archivos innecesarios con `.gitignore`

**Pasos:**

1. **Crear archivo `.gitignore` en la raíz del proyecto:**
```bash
cd /Users/juang/Desktop/commercial_copilot
nano .gitignore
```

Contenido del `.gitignore`:
```
# Node modules
node_modules/
*/node_modules/

# Build outputs
frontend/dist/
frontend/build/

# Database
backend/database.sqlite
backend/*.sqlite

# Environment variables
.env
.env.local
.env.production.local

# System files
.DS_Store
Thumbs.db
desktop.ini

# Logs
*.log
npm-debug.log*

# Videos (subir después vía admin)
backend/public/videoloop/*.mp4
backend/public/videoloop/*.webm
backend/public/videoloop/*.ogg
backend/public/videoloop/*.mov

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary files
*.tmp
.cache/
```

2. **Inicializar Git y subir a GitHub/GitLab:**
```bash
cd /Users/juang/Desktop/commercial_copilot
git init
git add .
git commit -m "Initial commit - Commercial Copilot with video loop"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/commercial_copilot.git
git push -u origin main
```

3. **En el servidor Ubuntu, clonar el repositorio:**
```bash
cd /var/www/commercial_copilot
git clone https://github.com/TU_USUARIO/commercial_copilot.git .
```

---

### Opción 2: SCP/SFTP (Alternativa)

**Ventajas:**
- No requiere Git
- Transferencia directa

**Pasos:**

1. **Crear archivo comprimido excluyendo archivos innecesarios:**
```bash
cd /Users/juang/Desktop/commercial_copilot

tar -czf commercial_copilot.tar.gz \
  --exclude='node_modules' \
  --exclude='frontend/dist' \
  --exclude='backend/database.sqlite' \
  --exclude='.DS_Store' \
  --exclude='backend/public/videoloop/*.mp4' \
  backend/ frontend/ DEPLOYMENT.md PROJECT_OVERVIEW.md start.sh
```

2. **Transferir al servidor:**
```bash
scp commercial_copilot.tar.gz usuario@tu-servidor.com:/var/www/commercial_copilot/
```

3. **En el servidor, descomprimir:**
```bash
ssh usuario@tu-servidor.com
cd /var/www/commercial_copilot
tar -xzf commercial_copilot.tar.gz
rm commercial_copilot.tar.gz
```

---

### Opción 3: Rsync (Avanzado)

**Ventajas:**
- Sincronización incremental
- Solo transfiere archivos modificados
- Muy eficiente para actualizaciones

**Comando:**
```bash
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='frontend/dist' \
  --exclude='backend/database.sqlite' \
  --exclude='.DS_Store' \
  --exclude='backend/public/videoloop/*.mp4' \
  /Users/juang/Desktop/commercial_copilot/ \
  usuario@tu-servidor.com:/var/www/commercial_copilot/
```

---

## 📋 CHECKLIST PRE-DESPLIEGUE

Antes de subir archivos al servidor, verifica:

- [ ] Has creado el archivo `.gitignore` (si usas Git)
- [ ] Has eliminado archivos sensibles de `.env`
- [ ] No hay `node_modules/` en tu paquete
- [ ] No hay `frontend/dist/` en tu paquete
- [ ] Has documentado las variables de entorno necesarias
- [ ] Tienes backup de tu base de datos local (si tiene datos importantes)
- [ ] Has probado el proyecto localmente después de los últimos cambios

---

## 🔧 CONFIGURACIÓN POST-DESPLIEGUE

Una vez subidos los archivos al servidor:

### 1. Instalar dependencias:
```bash
# Backend
cd /var/www/commercial_copilot/backend
npm install

# Frontend
cd /var/www/commercial_copilot/frontend
npm install
```

### 2. Crear directorio para videos de loop:
```bash
mkdir -p /var/www/commercial_copilot/backend/public/videoloop
chmod 755 /var/www/commercial_copilot/backend/public/videoloop
```

### 3. Configurar variables de entorno:
```bash
# Backend
cd /var/www/commercial_copilot/backend
nano .env
```

Contenido:
```env
PORT=5000
NODE_ENV=production
```

### 4. Construir frontend:
```bash
cd /var/www/commercial_copilot/frontend
npm run build
```

### 5. Configurar permisos:
```bash
sudo chown -R www-data:www-data /var/www/commercial_copilot
sudo chmod -R 755 /var/www/commercial_copilot
```

---

## 📊 TAMAÑO ESTIMADO DE TRANSFERENCIA

| Método | Tamaño Aproximado |
|--------|-------------------|
| **Con node_modules** | ~500 MB - 1 GB ❌ |
| **Sin node_modules (correcto)** | ~5-10 MB ✅ |
| **Solo código fuente** | ~2-3 MB ✅ |

---

## 🚀 ACTUALIZACIÓN FUTURA

Para actualizar el proyecto después del despliegue inicial:

### Con Git:
```bash
cd /var/www/commercial_copilot
git pull origin main
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart commercial-copilot-backend
```

### Con SCP:
```bash
# En tu Mac
tar -czf update.tar.gz backend/ frontend/
scp update.tar.gz usuario@servidor:/var/www/commercial_copilot/

# En el servidor
cd /var/www/commercial_copilot
tar -xzf update.tar.gz
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart commercial-copilot-backend
```

---

## ⚠️ ERRORES COMUNES A EVITAR

1. ❌ **Subir node_modules** → Hace la transferencia lenta y puede causar conflictos
2. ❌ **No crear el directorio videoloop** → Los uploads de video fallarán
3. ❌ **Olvidar permisos** → La app no podrá escribir en la base de datos
4. ❌ **No hacer build del frontend** → El sitio no funcionará
5. ❌ **Usar configuración de desarrollo en producción** → Problemas de CORS y URLs

---

## 📞 SOPORTE

Si tienes problemas durante el despliegue, revisa:
- [DEPLOYMENT.md](file:///Users/juang/Desktop/commercial_copilot/DEPLOYMENT.md) - Guía completa de despliegue
- [PROJECT_OVERVIEW.md](file:///Users/juang/Desktop/commercial_copilot/PROJECT_OVERVIEW.md) - Arquitectura del proyecto
- Logs del servidor: `pm2 logs commercial-copilot-backend`
- Logs de Nginx: `sudo tail -f /var/log/nginx/error.log`
