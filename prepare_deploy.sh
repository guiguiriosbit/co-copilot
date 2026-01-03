#!/bin/bash

# Script de preparación para despliegue en Ubuntu Server
# Commercial Copilot - Video Loop System

echo "================================================"
echo "  Preparando Commercial Copilot para Despliegue"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo -e "${RED}Error: Este script debe ejecutarse desde el directorio raíz del proyecto${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Verificando archivos necesarios...${NC}"

# Verificar archivos críticos
files_to_check=(
    "backend/index.js"
    "backend/package.json"
    "backend/controllers/videoLoopController.js"
    "frontend/package.json"
    "frontend/src/components/PlayerPage.jsx"
    "frontend/src/components/AdDisplay.jsx"
    "frontend/src/components/AdminPage.jsx"
    "DEPLOYMENT.md"
    ".gitignore"
)

missing_files=0
for file in "${files_to_check[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}  ✗ Falta: $file${NC}"
        missing_files=$((missing_files + 1))
    else
        echo -e "${GREEN}  ✓ $file${NC}"
    fi
done

if [ $missing_files -gt 0 ]; then
    echo -e "${RED}Faltan $missing_files archivos críticos. Verifica tu proyecto.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}2. Verificando que node_modules NO esté incluido...${NC}"

if [ -d "backend/node_modules" ] || [ -d "frontend/node_modules" ]; then
    echo -e "${RED}  ✗ Advertencia: node_modules encontrado${NC}"
    echo -e "${YELLOW}    Esto es normal en desarrollo, pero NO debe subirse al servidor${NC}"
else
    echo -e "${GREEN}  ✓ node_modules no encontrado (correcto)${NC}"
fi

echo ""
echo -e "${YELLOW}3. Verificando que dist/ NO esté incluido...${NC}"

if [ -d "frontend/dist" ]; then
    echo -e "${YELLOW}  ⚠ frontend/dist encontrado${NC}"
    echo -e "${YELLOW}    Se regenerará en el servidor con 'npm run build'${NC}"
else
    echo -e "${GREEN}  ✓ frontend/dist no encontrado (correcto)${NC}"
fi

echo ""
echo -e "${YELLOW}4. Creando archivo comprimido para SCP...${NC}"

# Crear directorio temporal
mkdir -p /tmp/commercial_copilot_deploy

# Crear archivo tar.gz excluyendo archivos innecesarios
tar -czf /tmp/commercial_copilot_deploy/commercial_copilot.tar.gz \
  --exclude='node_modules' \
  --exclude='frontend/dist' \
  --exclude='backend/database.sqlite' \
  --exclude='.DS_Store' \
  --exclude='backend/public/videoloop/*.mp4' \
  --exclude='backend/public/videoloop/*.webm' \
  --exclude='backend/public/videoloop/*.ogg' \
  --exclude='backend/public/videoloop/*.mov' \
  --exclude='.git' \
  backend/ frontend/ DEPLOYMENT.md PROJECT_OVERVIEW.md ARCHIVOS_PARA_SUBIR.md start.sh .gitignore

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Archivo creado exitosamente${NC}"
    file_size=$(du -h /tmp/commercial_copilot_deploy/commercial_copilot.tar.gz | cut -f1)
    echo -e "${GREEN}    Tamaño: $file_size${NC}"
    echo -e "${GREEN}    Ubicación: /tmp/commercial_copilot_deploy/commercial_copilot.tar.gz${NC}"
else
    echo -e "${RED}  ✗ Error al crear archivo comprimido${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}5. Generando comandos de despliegue...${NC}"

cat > /tmp/commercial_copilot_deploy/deploy_commands.sh << 'EOF'
#!/bin/bash
# Comandos para ejecutar en el servidor Ubuntu

echo "Comandos de despliegue para Commercial Copilot"
echo "=============================================="
echo ""
echo "1. Transferir archivo al servidor:"
echo "   scp /tmp/commercial_copilot_deploy/commercial_copilot.tar.gz usuario@servidor:/var/www/commercial_copilot/"
echo ""
echo "2. En el servidor, descomprimir:"
echo "   cd /var/www/commercial_copilot"
echo "   tar -xzf commercial_copilot.tar.gz"
echo "   rm commercial_copilot.tar.gz"
echo ""
echo "3. Instalar dependencias del backend:"
echo "   cd /var/www/commercial_copilot/backend"
echo "   npm install"
echo ""
echo "4. Instalar dependencias del frontend:"
echo "   cd /var/www/commercial_copilot/frontend"
echo "   npm install"
echo ""
echo "5. Construir frontend:"
echo "   npm run build"
echo ""
echo "6. Crear directorio para videos:"
echo "   mkdir -p /var/www/commercial_copilot/backend/public/videoloop"
echo "   sudo chown -R www-data:www-data /var/www/commercial_copilot/backend/public/videoloop"
echo "   sudo chmod 755 /var/www/commercial_copilot/backend/public/videoloop"
echo ""
echo "7. Iniciar con PM2:"
echo "   cd /var/www/commercial_copilot"
echo "   pm2 start backend/index.js --name commercial-copilot-backend"
echo "   pm2 save"
echo ""
echo "Ver guía completa en DEPLOYMENT.md"
EOF

chmod +x /tmp/commercial_copilot_deploy/deploy_commands.sh

echo -e "${GREEN}  ✓ Comandos generados en: /tmp/commercial_copilot_deploy/deploy_commands.sh${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✓ Preparación completada exitosamente${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo ""
echo "1. Transferir al servidor:"
echo -e "   ${GREEN}scp /tmp/commercial_copilot_deploy/commercial_copilot.tar.gz usuario@servidor:/var/www/commercial_copilot/${NC}"
echo ""
echo "2. Ver comandos completos:"
echo -e "   ${GREEN}cat /tmp/commercial_copilot_deploy/deploy_commands.sh${NC}"
echo ""
echo "3. Consultar guía detallada:"
echo -e "   ${GREEN}cat DEPLOYMENT.md${NC}"
echo ""
echo -e "${YELLOW}Archivos generados en: /tmp/commercial_copilot_deploy/${NC}"
ls -lh /tmp/commercial_copilot_deploy/
echo ""
