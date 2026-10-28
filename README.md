# Airport API — Installation and Usage Guide

## What Does This Server Do?

The Airport API receives requests from the web application, queries the `aeropuerto_db_up` database, and returns the requested information in JSON format.

It acts as the backend between the web application and the MySQL database, providing endpoints for retrieving flight information, passengers, routes, reservations, and other airport operations.

## User Roles

The application provides three different views based on the user's role: Administrator, Employee, and Public.

### Administrator

The Administrator view provides access to the application's main sections.

<img width="686" height="446" alt="Airport API" src="https://github.com/user-attachments/assets/3d044847-f13a-4f5d-a3ce-11f980166762" />

- View today's flights.
- View frequent passengers.
- View aircraft undergoing maintenance.
- Access the available application sections.

### Employee

The Employee view provides access to passenger-related and operational features.

- View frequent passengers.
- Access the crew assignment section.
- Perform passenger check-in.

### Public

The Public view provides access to flight information without displaying the administrative sections.

- View today's flights.

---

## How to Run the Server

### 1. Install Node.js

If Node.js is not installed, download the LTS version from:

https://nodejs.org

### 2. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

### 3. Configure the Database

Open the `.env` file and update the following values with your MySQL database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=aeropuerto_db_up
```

Replace `your_password_here` with your actual MySQL password.

**Important:** Do not upload your `.env` file or database password to GitHub.

### 4. Start the Server

Run the following command:

```bash
node server.js
```

If everything is configured correctly, you should see a message similar to:

```text
=============================================
  AEROPUERTO API running on port 3000
  Database: aeropuerto_db_up
  Health check: http://localhost:3000/api/health
=============================================
```

### 5. Verify That It Works

Open your browser and navigate to:

http://localhost:3000/api/health

You should receive a JSON response similar to:

```json
{
  "ok": true,
  "data": {
    "servidor": "OK",
    "base_de_datos": "OK"
  }
}
```

If both values are `"OK"`, the server and database connection are working correctly.

### 6. Open the Web Application

If the Express server is configured to serve the frontend, open:

http://localhost:3000/

---

## Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Checks the server and database status |
| GET | `/api/dashboard` | Retrieves general dashboard statistics |
| GET | `/api/vuelos-dia` | Retrieves today's flights (database view) |
| GET | `/api/pasajeros-frecuentes` | Retrieves frequent passengers (database view) |
| GET | `/api/aeronaves-mantenimiento` | Retrieves aircraft undergoing maintenance (database view) |
| GET | `/api/vuelos` | Retrieves all flights |
| GET | `/api/vuelos/:id` | Retrieves details for a specific flight |
| GET | `/api/pasajeros` | Retrieves the passenger list |
| GET | `/api/rutas` | Retrieves the route list |
| GET | `/api/reservaciones` | Retrieves the reservation list |
| POST | `/api/reservaciones` | Creates a reservation |
| POST | `/api/checkin` | Performs passenger check-in |
| POST | `/api/tripulacion/asignar` | Assigns crew members |
| GET | `/api/estadisticas-puntualidad?anio=2026&mes=6` | Retrieves flight punctuality statistics for a given month |

---

## Technologies Used

- **Node.js** — JavaScript runtime.
- **Express.js** — Backend web framework.
- **MySQL** — Relational database.
- **mysql2** — MySQL client for Node.js.
- **CORS** — Allows requests between different origins when configured.

---

## Important Notes

- The database must be named exactly `aeropuerto_db_up`.
- The server runs on port `3000` by default.
- The `.env` file must contain valid database connection settings.
- Database views and stored procedures are maintained separately. Endpoints that depend on them will work once the corresponding database objects are available.
- For development, you can use `npm run dev` if the project has a development script configured and `nodemon` is installed.
- The API endpoint names remain in Spanish because they correspond to the existing backend implementation.

