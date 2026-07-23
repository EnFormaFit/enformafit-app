# EnFormaFit App — Backend

## Stack
- **Node.js + Express** — API REST
- **PostgreSQL** — Base de datos
- **JWT** — Autenticación
- **node-cron** — Notificaciones automáticas

## Estructura
```
backend/
  db/
    schema.sql      ← Estructura completa de la BD
    index.js        ← Conexión a PostgreSQL
  engine/
    nutricion.js    ← Motor de cálculo nutricional
    rutinas.js      ← Asignador y cascada de rutinas
  middleware/
    auth.js         ← JWT middleware
  routes/
    auth.js         ← Login / tokens
    clientes.js     ← CRUD clientes + generación de planes
    entreno.js      ← Registro entreno, revisiones, check-ins
  server.js         ← Entrada principal
```

## Instalación local

```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales
npm install
node server.js
```

## Variables de entorno necesarias
Ver `.env.example`

## Despliegue en Railway (recomendado)

1. Crea cuenta en railway.app
2. New Project → Deploy from GitHub
3. Añade las variables de entorno desde .env.example
4. Railway crea la base de datos PostgreSQL automáticamente
5. Ejecuta el schema: Railway → PostgreSQL → Query → pega schema.sql

## API Endpoints principales

### Auth
- `POST /api/auth/login` — Login entrenador o cliente

### Clientes (entrenador)
- `GET  /api/clientes` — Listar todos
- `POST /api/clientes` — Crear cliente manualmente
- `GET  /api/clientes/:id` — Ver cliente
- `PATCH /api/clientes/:id` — Actualizar
- `POST /api/clientes/:id/generar-plan` — Generar plan completo
- `POST /api/clientes/:id/aprobar-plan/:bloqueId` — Aprobar y hacer visible
- `POST /api/clientes/:id/ajuste-kcal` — Ajuste rápido ±kcal
- `GET  /api/clientes/:id/siguiente-rutina` — Sugerir siguiente bloque

### Entrenamiento
- `GET  /api/entreno/mi-rutina` — Rutina activa del cliente
- `POST /api/entreno/registrar-serie` — Registrar serie
- `POST /api/entreno/peso` — Apuntar peso diario
- `GET  /api/entreno/peso` — Historial de peso
- `POST /api/entreno/revision` — Subir revisión
- `GET  /api/entreno/revisiones/pendientes` — Revisiones por revisar
- `POST /api/entreno/checkin` — Check-in semanal (1:1)
