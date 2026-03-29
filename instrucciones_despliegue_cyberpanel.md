# Guía Práctica: Desplegar `commercial_copilot` en CyberPanel vía GitHub

Esta guía está diseñada considerando que la aplicación tiene un Frontend (React/Vite) y un Backend (Node.js), y asume que ya tienes tu servidor Proxmox corriendo con CyberPanel y los DNS de tu dominio configurados.

## 1. Conectar CyberPanel con GitHub (Git Manager)
1. Ingresa a **CyberPanel** y ve a **Websites > Create Website**. Crea el sitio para tu frontend (ej. `midominio.com`).
2. Ve a **Websites > List Websites** y haz clic en **Manage** en tu nuevo sitio.
3. Busca la herramienta **Git Manager**.
4. Ingresa la URL de tu repositorio de GitHub. 
   - *Si el repo es privado*, CyberPanel te mostrará una clave SSH. Cópiala y pégala en **GitHub > Configuración del repositorio > Deploy keys**.
5. Adjunta el repositorio. Esto clonará los archivos dentro de la carpeta `/home/midominio.com/public_html/`.
6. *(Opcional)* Copia la URL del **Webhook** que te da CyberPanel y agrégala en GitHub (Settings > Webhooks) para que el servidor jale los cambios automáticamente en cada `git push`.

---

## 2. Despliegue del Frontend (Archivos Estáticos)
CyberPanel (OpenLiteSpeed) es excelente sirviendo archivos estáticos. 

1. Conéctate por **SSH** a tu servidor.
2. Navega a la carpeta del frontend clonada:
   ```bash
   cd /home/midominio.com/public_html/frontend
   ```
3. Instala y compila el proyecto:
   ```bash
   npm install
   npm run build
   ```
4. Mueve el contenido compilado (la carpeta `dist` o `build`) a la raíz del sitio public_html para que sea visible en la web:
   ```bash
   cp -r dist/* /home/midominio.com/public_html/
   ```
5. Emitir SSL: En CyberPanel, ve a **SSL > Manage SSL** y emite un certificado para `midominio.com`.

---

## 3. Despliegue del Backend (Node.js + PM2)
Lo más práctico en CyberPanel para Node.js es usar un Proxy Inverso (Reverse Proxy) junto con PM2. Te sugiero crear un subdominio (ej. `api.midominio.com`) desde CyberPanel para este fin.

1. En la consola **SSH**, instala PM2 globalmente si no lo tienes:
   ```bash
   npm install -g pm2
   ```
2. Ve a la carpeta de tu backend (clonado previamente o ubicado en el public_html del subdominio de la api):
   ```bash
   cd /home/midominio.com/public_html/backend
   ```
3. Instala dependencias y prepara tus variables de entorno:
   ```bash
   npm install
   cp .env.example .env
   nano .env # (Configura tus strings de DB, JWT y puertos ej. PORT=3000)
   ```
4. Inicia tu servidor en segundo plano:
   ```bash
   pm2 start controllers/authController.js --name "copilot-backend"
   pm2 save
   pm2 startup
   ```

### Configurar el Proxy Inverso (Reverse Proxy)
Para que las peticiones web lleguen a Node.js desde el exterior:
1. En CyberPanel, ve a **Websites > List Websites > Manage** en el sitio de tu API (`api.midominio.com`).
2. Ve a **vHost Conf** (Configuración de host virtual) o a **Rewrite Rules** (Reglas de reescritura).
3. Añade la configuración para redirigir todo el tráfico web al puerto de tu Node.js (ej. 3000):
   ```apache
   REWRITERULE ^(.*)$ HTTP://127.0.0.1:3000/$1 [P]
   ```
4. Aplica el **SSL** gratuito de CyberPanel para `api.midominio.com`.

---

## 4. Resumen del Flujo de Trabajo
A partir de ahora, cuando hagas un cambio:
1. Haces `git push` a `main` en GitHub.
2. El webhook le avisa a CyberPanel que actualice el código git.
3. Si cambiaste el **frontend**: Entras por SSH y corres `npm run build`.
4. Si cambiaste el **backend**: Entras por SSH y corres `pm2 restart copilot-backend`.
