# Aeropuerto API — Guía de Instalación y Uso

## ¿Qué hace este servidor?
Recibe peticiones de la página web de Diego, consulta la base de datos de Alizee/Fernando, y regresa la información en JSON.

<img width="686" height="446" alt="image" src="https://github.com/user-attachments/assets/3d044847-f13a-4f5d-a3ce-11f980166762" />


## Pasos para correrlo

### 1. Instalar Node.js
Si no lo tienes, descárgalo de: https://nodejs.org (versión LTS)

### 2. Instalar dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 3. Configurar la base de datos
Abre el archivo `.env` y cambia estos valores con los tuyos:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contrasena_aqui
DB_NAME=aeropuerto_db_up
```

### 4. Correr el servidor
```bash
node server.js
```
Si todo está bien, verás:
```
=============================================
  AEROPUERTO API corriendo en puerto 3000
  Base de datos: aeropuerto_db_up
  Health check: http://localhost:3000/api/health
=============================================
```

### 5. Verificar que funciona
Abre tu navegador y ve a:
```
http://localhost:3000/api/health
```
Debes ver:
```json
{ "ok": true, "data": { "servidor": "OK", "base_de_datos": "OK" } }
```

---

## Endpoints disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Verifica servidor y BD |
| GET | `/api/dashboard` | Contadores generales |
| GET | `/api/vuelos-dia` | Vuelos de hoy (vista) |
| GET | `/api/pasajeros-frecuentes` | Pasajeros frecuentes (vista) |
| GET | `/api/aeronaves-mantenimiento` | Aeronaves en mantenimiento (vista) |
| GET | `/api/vuelos` | Lista todos los vuelos |
| GET | `/api/vuelos/:id` | Detalle de un vuelo |
| GET | `/api/pasajeros` | Lista pasajeros |
| GET | `/api/rutas` | Lista rutas |
| GET | `/api/reservaciones` | Lista reservaciones |
| POST | `/api/reservaciones` | Crea una reservación |
| POST | `/api/checkin` | Check-in automático |
| POST | `/api/tripulacion/asignar` | Asigna tripulación |
| GET | `/api/estadisticas-puntualidad?anio=2026&mes=6` | Estadísticas de puntualidad |

---

## Notas importantes

- La BD debe llamarse exactamente `aeropuerto_db_up`
- El servidor corre en el puerto 3000
- Para desarrollo puedes usar `npm run dev` si tienes nodemon instalado
- Las vistas y stored procedures los hace Fernando — cuando los tenga listos, el servidor los llama automáticamente
