const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'carceles.db');

let db;

function getDatabase() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    -- Tabla de recintos penitenciarios
    CREATE TABLE IF NOT EXISTS recintos (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      direccion TEXT,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      poligono TEXT, -- JSON array de coordenadas del perímetro
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de zonas dentro del recinto
    CREATE TABLE IF NOT EXISTS zonas (
      id TEXT PRIMARY KEY,
      recinto_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('patio', 'celda', 'acceso', 'enfermeria', 'taller', 'visita', 'administracion', 'perimetro')),
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      radio REAL DEFAULT 10, -- radio en metros para área de influencia
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recinto_id) REFERENCES recintos(id) ON DELETE CASCADE
    );

    -- Tabla de gendarmes / operadores
    CREATE TABLE IF NOT EXISTS gendarmes (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      rut TEXT UNIQUE NOT NULL,
      cargo TEXT NOT NULL DEFAULT 'Gendarme',
      recinto_id TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      activo INTEGER DEFAULT 1,
      ultima_ubicacion_lat REAL,
      ultima_ubicacion_lng REAL,
      ultima_zona_id TEXT,
      ultimo_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recinto_id) REFERENCES recintos(id),
      FOREIGN KEY (ultima_zona_id) REFERENCES zonas(id)
    );

    -- Tabla de dispositivos móviles detectados (celulares)
    CREATE TABLE IF NOT EXISTS dispositivos_detectados (
      id TEXT PRIMARY KEY,
      imei TEXT,
      mac_address TEXT,
      fabricante TEXT,
      modelo TEXT,
      tipo_dispositivo TEXT DEFAULT 'celular' CHECK(tipo_dispositivo IN ('celular', 'tablet', 'smartwatch', 'desconocido')),
      primera_deteccion DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultima_deteccion DATETIME DEFAULT CURRENT_TIMESTAMP,
      senial_db INTEGER, -- intensidad de señal en dB
      frecuencia_mhz REAL,
      recinto_id TEXT NOT NULL,
      zona_id TEXT,
      latitud REAL,
      longitud REAL,
      es_autorizado INTEGER DEFAULT 0,
      es_activo INTEGER DEFAULT 1,
      notas TEXT,
      FOREIGN KEY (recinto_id) REFERENCES recintos(id),
      FOREIGN KEY (zona_id) REFERENCES zonas(id)
    );

    -- Tabla de alertas
    CREATE TABLE IF NOT EXISTS alertas (
      id TEXT PRIMARY KEY,
      recinto_id TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN (
        'celular_no_autorizado', 'celular_autorizado_zona_restringida',
        'gendarme_inactivo', 'gendarme_fuera_zona',
        'dron_detectado', 'movimiento_sospechoso',
        'puerta_abierta', 'alarma_general',
        'dron_activo', 'dron_bateria_baja', 'dron_perdido'
      )),
      severidad TEXT NOT NULL CHECK(severidad IN ('baja', 'media', 'alta', 'critica')),
      titulo TEXT NOT NULL,
      descripcion TEXT,
      latitud REAL,
      longitud REAL,
      zona_id TEXT,
      dispositivo_id TEXT,
      gendarme_id TEXT,
      dron_id TEXT,
      resuelta INTEGER DEFAULT 0,
      resuelta_por TEXT,
      resuelta_en DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recinto_id) REFERENCES recintos(id),
      FOREIGN KEY (zona_id) REFERENCES zonas(id),
      FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_detectados(id),
      FOREIGN KEY (gendarme_id) REFERENCES gendarmes(id)
    );

    -- Tabla de drones
    CREATE TABLE IF NOT EXISTS drones (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      modelo TEXT,
      recinto_id TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'en_base' CHECK(estado IN (
        'en_base', 'despegando', 'en_vuelo', 'regresando', 'cargando', 'mantenimiento', 'perdido'
      )),
      bateria INTEGER DEFAULT 100, -- porcentaje
      altitud REAL DEFAULT 0,
      velocidad REAL DEFAULT 0,
      latitud REAL,
      longitud REAL,
      modo_vuelo TEXT DEFAULT 'manual' CHECK(modo_vuelo IN ('manual', 'automatico', 'patrulla', 'bajo_demanda')),
      camara_activa INTEGER DEFAULT 0,
      transmision_video INTEGER DEFAULT 0,
      ultimo_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recinto_id) REFERENCES recintos(id)
    );

    -- Tabla de rutas de patrullaje de drones
    CREATE TABLE IF NOT EXISTS rutas_dron (
      id TEXT PRIMARY KEY,
      dron_id TEXT NOT NULL,
      nombre TEXT,
      puntos TEXT NOT NULL, -- JSON array de {lat, lng, alt}
      activa INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dron_id) REFERENCES drones(id) ON DELETE CASCADE
    );

    -- Tabla de logs de eventos
    CREATE TABLE IF NOT EXISTS logs_eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recinto_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descripcion TEXT,
      metadata TEXT, -- JSON con datos adicionales
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recinto_id) REFERENCES recintos(id)
    );

    -- Índices para mejorar rendimiento
    CREATE INDEX IF NOT EXISTS idx_dispositivos_recinto ON dispositivos_detectados(recinto_id);
    CREATE INDEX IF NOT EXISTS idx_dispositivos_activo ON dispositivos_detectados(es_activo);
    CREATE INDEX IF NOT EXISTS idx_alertas_recinto ON alertas(recinto_id);
    CREATE INDEX IF NOT EXISTS idx_alertas_resuelta ON alertas(resuelta);
    CREATE INDEX IF NOT EXISTS idx_alertas_created ON alertas(created_at);
    CREATE INDEX IF NOT EXISTS idx_gendarmes_recinto ON gendarmes(recinto_id);
    CREATE INDEX IF NOT EXISTS idx_gendarmes_activo ON gendarmes(activo);
    CREATE INDEX IF NOT EXISTS idx_drones_recinto ON drones(recinto_id);
    CREATE INDEX IF NOT EXISTS idx_logs_recinto ON logs_eventos(recinto_id);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON logs_eventos(created_at);
  `);
}

module.exports = { getDatabase };
