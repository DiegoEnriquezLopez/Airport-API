// =============================================
//   AEROPUERTO API - server.js
//   Materia: Bases de Datos Avanzadas
//   Desarrollador: OA
// =============================================

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARES ──────────────────────────────────────────────────────────────
app.use(cors());                          // Permite que Diego se conecte desde su HTML
app.use(express.json());                  // Permite leer JSON en el body de los POST

// ─── CONEXION A LA BASE DE DATOS ─────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── FUNCION HELPER: Respuesta exitosa ────────────────────────────────────────
function respuestaOk(res, data, message = "Operacion exitosa") {
  return res.status(200).json({
    ok: true,
    data: data,
    message: message,
  });
}

// ─── FUNCION HELPER: Respuesta de error ──────────────────────────────────────
function respuestaError(res, statusCode, code, message) {
  return res.status(statusCode).json({
    ok: false,
    error: {
      code: code,
      message: message,
    },
  });
}

// =============================================================================
//   ENDPOINTS
// =============================================================================

// ─── GET /api/health ─────────────────────────────────────────────────────────
// Verifica que el servidor y la BD esten corriendo
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return respuestaOk(res, { servidor: "OK", base_de_datos: "OK" }, "Servidor y BD funcionando correctamente");
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo conectar a la base de datos: " + err.message);
  }
});

// ─── GET /api/dashboard ──────────────────────────────────────────────────────
// Contadores generales para la parte superior del frontend
app.get("/api/dashboard", async (req, res) => {
  try {
    const [[vuelos_hoy]]          = await pool.query("SELECT COUNT(*) AS total FROM vuelos WHERE DATE(fecha_salida) = CURRENT_DATE()");
    const [[vuelos_retrasados]]   = await pool.query("SELECT COUNT(*) AS total FROM vuelos WHERE estado = 'Retrasado' AND DATE(fecha_salida) = CURRENT_DATE()");
    const [[en_mantenimiento]]    = await pool.query("SELECT COUNT(*) AS total FROM aeronaves WHERE estado = 'Mantenimiento'");
    const [[reservaciones_total]] = await pool.query("SELECT COUNT(*) AS total FROM reservaciones");

    return respuestaOk(res, {
      vuelos_hoy:               vuelos_hoy.total,
      vuelos_retrasados:        vuelos_retrasados.total,
      aeronaves_mantenimiento:  en_mantenimiento.total,
      reservaciones_totales:    reservaciones_total.total,
    });
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener el dashboard: " + err.message);
  }
});

// ─── GET /api/vuelos-dia ─────────────────────────────────────────────────────
// Consume la vista vuelos_dia — muestra vuelos programados para hoy
app.get("/api/vuelos-dia", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM vuelos_dia");
    return respuestaOk(res, rows);
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener los vuelos del dia: " + err.message);
  }
});

// ─── GET /api/pasajeros-frecuentes ───────────────────────────────────────────
// Consume la vista pasajeros_frecuentes — pasajeros con mas de 10 vuelos en el ultimo año
app.get("/api/pasajeros-frecuentes", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pasajeros_frecuentes");
    return respuestaOk(res, rows);
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener los pasajeros frecuentes: " + err.message);
  }
});

// ─── GET /api/aeronaves-mantenimiento ────────────────────────────────────────
// Consume la vista aeronaves_mantenimiento — aeronaves en estado Mantenimiento
app.get("/api/aeronaves-mantenimiento", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM aeronaves_mantenimiento");
    return respuestaOk(res, rows);
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener aeronaves en mantenimiento: " + err.message);
  }
});

// ─── GET /api/vuelos ─────────────────────────────────────────────────────────
// Lista todos los vuelos con aerolinea, ruta y aeronave
app.get("/api/vuelos", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        v.vuelo_id,
        a.nombre        AS aerolinea,
        a.codigo_iata,
        r.aeropuerto_origen,
        r.aeropuerto_destino,
        an.modelo       AS aeronave,
        v.fecha_salida,
        v.fecha_llegada_estimada,
        v.puerta_embarque,
        v.estado
      FROM vuelos v
      JOIN aerolineas a  ON v.aerolinea_id  = a.aerolinea_id
      JOIN rutas r       ON v.ruta_id       = r.ruta_id
      JOIN aeronaves an  ON v.aeronave_id   = an.aeronave_id
      ORDER BY v.fecha_salida DESC
    `);
    return respuestaOk(res, rows);
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener la lista de vuelos: " + err.message);
  }
});

// ─── GET /api/vuelos/:id ─────────────────────────────────────────────────────
// Detalle completo de un vuelo especifico
app.get("/api/vuelos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT
        v.vuelo_id,
        a.nombre        AS aerolinea,
        a.codigo_iata,
        r.aeropuerto_origen,
        r.aeropuerto_destino,
        r.distancia_km,
        r.tiempo_estimado_min,
        an.modelo       AS aeronave,
        an.capacidad_pasajeros,
        v.fecha_salida,
        v.fecha_llegada_estimada,
        v.fecha_llegada_real,
        v.puerta_embarque,
        v.estado
      FROM vuelos v
      JOIN aerolineas a  ON v.aerolinea_id  = a.aerolinea_id
      JOIN rutas r       ON v.ruta_id       = r.ruta_id
      JOIN aeronaves an  ON v.aeronave_id   = an.aeronave_id
      WHERE v.vuelo_id = ?
    `, [id]);

    if (rows.length === 0) {
      return respuestaError(res, 404, "NOT_FOUND", `No se encontro el vuelo con id ${id}`);
    }
    return respuestaOk(res, rows[0]);
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener el vuelo: " + err.message);
  }
});

// ─── GET /api/pasajeros ──────────────────────────────────────────────────────
// Lista pasajeros para seleccionar al crear una reservacion
app.get("/api/pasajeros", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        pasajero_id,
        pasaporte,
        nombre,
        apellido,
        email,
        nacionalidad,
        programa_fidelidad
      FROM pasajeros
      ORDER BY apellido, nombre
    `);
    return respuestaOk(res, rows);
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener los pasajeros: " + err.message);
  }
});

// ─── GET /api/rutas ──────────────────────────────────────────────────────────
// Lista rutas para asignar tripulacion
app.get("/api/rutas", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ruta_id,
        aeropuerto_origen,
        aeropuerto_destino,
        distancia_km,
        tiempo_estimado_min
      FROM rutas
      ORDER BY aeropuerto_origen
    `);
    return respuestaOk(res, rows);
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener las rutas: " + err.message);
  }
});

// ─── GET /api/reservaciones ──────────────────────────────────────────────────
// Lista reservaciones con info del vuelo y pasajero
app.get("/api/reservaciones", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.reservacion_id,
        r.asiento,
        r.clase,
        r.estado,
        r.precio,
        r.metodo_pago,
        r.fecha_reservacion,
        p.nombre        AS pasajero_nombre,
        p.apellido      AS pasajero_apellido,
        p.pasaporte,
        v.vuelo_id,
        a.nombre        AS aerolinea,
        ru.aeropuerto_origen,
        ru.aeropuerto_destino,
        v.fecha_salida
      FROM reservaciones r
      JOIN pasajeros p  ON r.pasajero_id  = p.pasajero_id
      JOIN vuelos v     ON r.vuelo_id     = v.vuelo_id
      JOIN aerolineas a ON v.aerolinea_id = a.aerolinea_id
      JOIN rutas ru     ON v.ruta_id      = ru.ruta_id
      ORDER BY r.fecha_reservacion DESC
    `);
    return respuestaOk(res, rows);
  } catch (err) {
    return respuestaError(res, 500, "DB_ERROR", "No se pudo obtener las reservaciones: " + err.message);
  }
});

// ─── POST /api/reservaciones ─────────────────────────────────────────────────
// Ejecuta sp_proceso_reservacion para crear una reservacion completa
// Body esperado: { vuelo_id, pasajero_id, clase, asiento, precio, metodo_pago }
app.post("/api/reservaciones", async (req, res) => {
  const { vuelo_id, pasajero_id, clase, asiento, precio, metodo_pago } = req.body;

  // Validacion de campos requeridos
  if (!vuelo_id || !pasajero_id || !clase || !asiento || !precio || !metodo_pago) {
    return respuestaError(res, 400, "MISSING_FIELDS", "Faltan campos requeridos: vuelo_id, pasajero_id, clase, asiento, precio, metodo_pago");
  }

  try {
    // Fernando hace el SP, nosotros solo hacemos el CALL
    const [rows] = await pool.query(
      "CALL sp_proceso_reservacion(?, ?, ?, ?, ?, ?)",
      [vuelo_id, pasajero_id, clase, asiento, precio, metodo_pago]
    );

    // El SP regresa un result set en rows[0]
    const resultado = rows[0][0];
    return respuestaOk(res, resultado, "Reservacion creada");
  } catch (err) {
    // Si el SP lanza un error de negocio (SQLSTATE 45000), lo capturamos aqui
    return respuestaError(res, 400, "SP_ERROR", err.message);
  }
});

// ─── POST /api/checkin ───────────────────────────────────────────────────────
// Ejecuta checkin_automatico — check-in masivo para un vuelo
// Body esperado: { vuelo_id }
app.post("/api/checkin", async (req, res) => {
  const { vuelo_id } = req.body;

  if (!vuelo_id) {
    return respuestaError(res, 400, "MISSING_FIELDS", "Falta el campo requerido: vuelo_id");
  }

  try {
    const [rows] = await pool.query(
      "CALL checkin_automatico(?)",
      [vuelo_id]
    );

    const resultado = rows[0];
    return respuestaOk(res, resultado, "Check-in automatico realizado con exito");
  } catch (err) {
    return respuestaError(res, 400, "SP_ERROR", err.message);
  }
});

// ─── POST /api/tripulacion/asignar ───────────────────────────────────────────
// Ejecuta asignar_tripulacion — asigna tripulacion a un vuelo por fecha y ruta
// Body esperado: { fecha_vuelo, ruta_id }
app.post("/api/tripulacion/asignar", async (req, res) => {
  const { fecha_vuelo, ruta_id } = req.body;

  if (!fecha_vuelo || !ruta_id) {
    return respuestaError(res, 400, "MISSING_FIELDS", "Faltan campos requeridos: fecha_vuelo, ruta_id");
  }

  try {
    const [rows] = await pool.query(
      "CALL asignar_tripulacion(?, ?)",
      [fecha_vuelo, ruta_id]
    );

    const resultado = rows[0];
    return respuestaOk(res, resultado, "Tripulacion asignada correctamente");
  } catch (err) {
    // Si no hay vuelo valido o ya tiene tripulacion, el SP lanza SQLSTATE 45000
    return respuestaError(res, 400, "SP_ERROR", err.message);
  }
});

// ─── GET /api/estadisticas-puntualidad ───────────────────────────────────────
// Ejecuta calcular_estadisticas_puntualidad — reporte mensual por aerolinea
// Query params: ?anio=2026&mes=6
app.get("/api/estadisticas-puntualidad", async (req, res) => {
  const { anio, mes } = req.query;

  if (!anio || !mes) {
    return respuestaError(res, 400, "MISSING_PARAMS", "Faltan parametros requeridos: anio, mes  (ej: ?anio=2026&mes=6)");
  }

  try {
    const [rows] = await pool.query(
      "CALL calcular_estadisticas_puntualidad(?, ?)",
      [parseInt(anio), parseInt(mes)]
    );

    const resultado = rows[0];
    return respuestaOk(res, resultado, `Estadisticas de puntualidad para ${mes}/${anio}`);
  } catch (err) {
    return respuestaError(res, 500, "SP_ERROR", "No se pudo calcular las estadisticas: " + err.message);
  }
});

// ─── RUTA NO ENCONTRADA (404) ─────────────────────────────────────────────────
app.use((req, res) => {
  return respuestaError(res, 404, "NOT_FOUND", `La ruta ${req.method} ${req.originalUrl} no existe`);
});

// ─── INICIAR SERVIDOR ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("=============================================");
  console.log(`  AEROPUERTO API corriendo en puerto ${PORT}`);
  console.log(`  Base de datos: ${process.env.DB_NAME}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log("=============================================");
});