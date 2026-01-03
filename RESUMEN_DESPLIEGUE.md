# Resumen: Archivos para Subir a Ubuntu Server

## 📦 RESPUESTA RÁPIDA

**Debes subir TODO excepto:**
- ❌ `node_modules/` (backend y frontend)
- ❌ `frontend/dist/`
- ❌ `backend/database.sqlite`
- ❌ `.DS_Store` y archivos del sistema
- ❌ Videos en `backend/public/videoloop/` (se suben después vía admin)

## 🚀 MÉTODO RECOMENDADO: Git

```bash
# 1. En tu Mac, inicializa Git (si no lo has hecho)
cd /Users/juang/Desktop/commercial_copilot
git init
git add .
git commit -m "Commercial Copilot with video loop system"

# 2. Sube a GitHub
git remote add origin https://github.com/TU_USUARIO/commercial_copilot.git
git push -u origin main

# 3. En el servidor Ubuntu
cd /var/www/commercial_copilot
git clone https://github.com/TU_USUARIO/commercial_copilot.git .
```

## 📋 MÉTODO ALTERNATIVO: Script Automático

He creado un script que prepara todo automáticamente:

```bash
cd /Users/juang/Desktop/commercial_copilot
./prepare_deploy.sh
```

Este script:
- ✅ Verifica que todos los archivos necesarios existan
- ✅ Crea un archivo `.tar.gz` optimizado
- ✅ Excluye automáticamente archivos innecesarios
- ✅ Genera comandos de despliegue listos para usar

El archivo comprimido se guardará en:
`/tmp/commercial_copilot_deploy/commercial_copilot.tar.gz`

## 📤 TRANSFERIR AL SERVIDOR

```bash
scp /tmp/commercial_copilot_deploy/commercial_copilot.tar.gz \
    usuario@tu-servidor.com:/var/www/commercial_copilot/
```

## 🔧 EN EL SERVIDOR

```bash
# 1. Descomprimir
cd /var/www/commercial_copilot
tar -xzf commercial_copilot.tar.gz
rm commercial_copilot.tar.gz

# 2. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# 3. Construir frontend
cd frontend && npm run build

# 4. Crear directorio para videos
mkdir -p /var/www/commercial_copilot/backend/public/videoloop
sudo chown -R www-data:www-data /var/www/commercial_copilot/backend/public/videoloop
sudo chmod 755 /var/www/commercial_copilot/backend/public/videoloop

# 5. Iniciar con PM2
cd /var/www/commercial_copilot
pm2 start backend/index.js --name commercial-copilot-backend
pm2 save
```

## 📚 DOCUMENTACIÓN COMPLETA

- **[ARCHIVOS_PARA_SUBIR.md](file:///Users/juang/Desktop/commercial_copilot/ARCHIVOS_PARA_SUBIR.md)** - Guía detallada de qué subir
- **[DEPLOYMENT.md](file:///Users/juang/Desktop/commercial_copilot/DEPLOYMENT.md)** - Guía completa de despliegue
- **[.gitignore](file:///Users/juang/Desktop/commercial_copilot/.gitignore)** - Archivos a excluir automáticamente

## ⚡ TAMAÑO ESTIMADO

- Con node_modules: ~500 MB ❌
- Sin node_modules: ~5-10 MB ✅

## ✅ CHECKLIST FINAL

Antes de subir, verifica:
- [ ] Archivo `.gitignore` creado
- [ ] No hay `node_modules/` en tu paquete
- [ ] No hay `frontend/dist/` en tu paquete
- [ ] Has probado el proyecto localmente
- [ ] Tienes las credenciales del servidor
- [ ] Conoces el dominio donde se desplegará
