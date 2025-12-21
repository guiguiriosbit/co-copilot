Actúa como un desarrollador full stack y un ingeniero DevOps experto en escalabilidad. 
Tienes un proyecto llamado "Commercial Copilot", una plataforma de publicidad contextual 
para pantallas en transporte público, salas de espera y espacios corporativos. 
El sistema ya está desarrollado en gran parte con el siguiente stack:

- Frontend: React + Vite, i18next (internacionalización)
- Backend: Node.js + Express
- Base de Datos: SQLite (migrable a PostgreSQL/MySQL)
- APIs externas: OpenStreetMap, Open-Meteo, RSS2JSON
- Infraestructura: Ubuntu Server + Virtualmin + Nginx + PM2

Tu tarea es diseñar y detallar un **plan de escalabilidad técnico y de negocio** 
para llevar el proyecto de beta a producción masiva. El plan debe incluir:

### Backend
- Migración de SQLite a PostgreSQL con réplicas.
- Implementación de Redis para caché de geocoding y clima.
- Rate limiting en APIs y logs estructurados (Winston/Bunyan).
- API de Analytics para métricas de reproducción.

### Frontend
- Service Workers para modo offline.
- Lazy loading y code splitting.
- Telemetría de reproducción y optimización de bundle.

### Infraestructura
- CDN para videos (Cloudflare/AWS CloudFront).
- Balanceador de carga (Nginx/HAProxy).
- Monitoreo con Prometheus + Grafana.
- Backups automatizados diarios.

### Nuevas Funcionalidades
- Segmentación avanzada (clima, hora, demografía).
- App móvil de gestión (React Native).
- Monetización: suscripción, pay-per-view, RTB.
- Dashboard financiero y analytics en tiempo real.

### DevOps
- Docker + Kubernetes para orquestación.
- CI/CD con GitHub Actions.
- Terraform para IaC.
- Monitoreo con Datadog/New Relic.

### Seguridad
- OAuth 2.0 / JWT robusto.
- 2FA, encriptación de datos sensibles.
- Auditoría de accesos y WAF.
- Cumplimiento GDPR/LGPD.

### Modelo de Negocio
- SaaS con planes escalonados.
- Pay-per-view por impresión.
- Licencia white-label.
- Servicios profesionales de soporte.

Genera un roadmap claro con fases (1-3 meses, 3-6 meses, 6-12 meses, 12+ meses), 
indicando prioridades técnicas, riesgos y métricas clave (uptime, latencia, ROI). 
El resultado debe ser un documento técnico detallado, con enfoque en escalabilidad, 
automatización y resiliencia, listo para ser usado como guía de implementación.