const express = require('express');
const router = express.Router();
const { getDatabase } = require('../models/database');

// Obtener resumen completo del dashboard
router.get('/resumen', (req, res) => {
  try {
    const db = getDatabase();
    const { recinto_id } = req.query;
    let whereClause = '';
    let params = [];
    if (recinto_id) { whereClause = ' WHERE recinto_id = ?'; params.push(recinto_id); }

    // Gendarmes activos
    const gendarmesActivos = db.prepare(`
      SELECT COUNT(*) as total FROM gendarmes WHERE activo = 1
    `).get();

    // Gendarmes inactivos (sin heartbeat en últimos 5 min)
    const gendarmesInactivos = db.prepare(`
      SELECT COUNT(*) as total FROM gendarmes 
      WHERE activo = 1 AND (ultimo_heartbeat IS NULL OR 
        datetime(ultimo_heartbeat) < datetime('now', '-5 minutes'))
    `).get();

    // Dispositivos activos detectados
    const dispositivosActivos = db.prepare(`
      SELECT COUNT(*) as total FROM dispositivos_detectados 
      WHERE es_activo = 1
    `).get();

    // Dispositivos no autorizados
    const dispositivosNoAutorizados = db.prepare(`
      SELECT COUNT(*) as total FROM dispositivos_detectados 
      WHERE es_activo = 1 AND es_autorizado = 0
    `).get();

    // Alertas activas
    const alertasActivas = db.prepare(`
      SELECT COUNT(*) as total FROM alertas WHERE resuelta = 0
    `).get();

    // Alertas críticas activas
    const alertasCriticas = db.prepare(`
      SELECT COUNT(*) as total FROM alertas 
      WHERE resuelta = 0 AND severidad = 'critica'
    `).get();

    // Drones activos (en vuelo)
    const dronesActivos = db.prepare(`
      SELECT COUNT(*) as total FROM drones 
      WHERE estado IN ('en_vuelo', 'despegando', 'patrulla')
    `).get();

    // Drones en base
    const dronesBase = db.prepare(`
      SELECT COUNT(*) as total FROM drones WHERE estado = 'en_base'
    `).get();

    // Últimas alertas
    const ultimasAlertas = db.prepare(`
      SELECT a.*, z.nombre as zona_nombre,
        g.nombre || ' ' || g.apellido as gendarme_nombre
      FROM alertas a
      LEFT JOIN zonas z ON a.zona_id = z.id
      LEFT JOIN gendarmes g ON a.gendarme_id = g.id
      WHERE a.resuelta = 0
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all();

    // Gendarmes con ubicación reciente
    const gendarmesUbicacion = db.prepare(`
      SELECT g.id, g.nombre, g.apellido, g.rut, g.cargo, 
        g.ultima_ubicacion_lat, g.ultima_ubicacion_lng,
        g.ultimo_heartbeat, z.nombre as zona_nombre,
        CASE WHEN g.ultimo_heartbeat IS NOT NULL AND 
          datetime(g.ultimo_heartbeat) > datetime('now', '-5 minutes')
          THEN 1 ELSE 0 END as en_linea
      FROM gendarmes g
      LEFT JOIN zonas z ON g.ultima_zona_id = z.id
      WHERE g.activo = 1
      ORDER BY g.apellido, g.nombre
    `).all();

    // Dispositivos detectados recientemente
    const dispositivosRecientes = db.prepare(`
      SELECT d.*, z.nombre as zona_nombre
      FROM dispositivos_detectados d
      LEFT JOIN zonas z ON d.zona_id = z.id
      WHERE d.es_activo = 1
      ORDER BY d.ultima_deteccion DESC
      LIMIT 20
    `).all();

    // Resumen por recinto
    const resumenRecintos = db.prepare(`
      SELECT r.id, r.nombre, r.latitud, r.longitud,
        (SELECT COUNT(*) FROM gendarmes WHERE recinto_id = r.id AND activo = 1) as gendarmes_activos,
        (SELECT COUNT(*) FROM dispositivos_detectados WHERE recinto_id = r.id AND es_activo = 1 AND es_autorizado = 0) as dispositivos_no_autorizados,
        (SELECT COUNT(*) FROM alertas WHERE recinto_id = r.id AND resuelta = 0) as alertas_activas,
        (SELECT COUNT(*) FROM alertas WHERE recinto_id = r.id AND resuelta = 0 AND severidad = 'critica') as alertas_criticas,
        (SELECT COUNT(*) FROM drones WHERE recinto_id = r.id AND estado IN ('en_vuelo', 'despegando', 'patrulla')) as drones_activos
      FROM recintos r
    `).all();

    res.json({
      gendarmes: {
        activos: gendarmesActivos.total,
        inactivos: gendarmesInactivos.total,
        lista: gendarmesUbicacion
      },
      dispositivos: {
        activos: dispositivosActivos.total,
        no_autorizados: dispositivosNoAutorizados.total,
        lista: dispositivosRecientes
      },
      alertas: {
        activas: alertasActivas.total,
        criticas: alertasCriticas.total,
        ultimas: ultimasAlertas
      },
      drones: {
        activos: dronesActivos.total,
        en_base: dronesBase.total
      },
      recintos: resumenRecintos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener datos para el mapa (todas las entidades con ubicación)
router.get('/mapa', (req, res) => {
  try {
    const db = getDatabase();
    const { recinto_id } = req.query;

    // Recintos
    const recintos = db.prepare('SELECT * FROM recintos').all();

    // Zonas
    let zonasQuery = 'SELECT * FROM zonas';
    const zonasParams = [];
    if (recinto_id) { zonasQuery += ' WHERE recinto_id = ?'; zonasParams.push(recinto_id); }
    const zonas = db.prepare(zonasQuery).all(...zonasParams);

    // Gendarmes con ubicación
    let gendarmesQuery = `
      SELECT g.id, g.nombre, g.apellido, g.rut, g.cargo,
        g.ultima_ubicacion_lat, g.ultima_ubicacion_lng, g.ultima_zona_id,
        g.ultimo_heartbeat, z.nombre as zona_nombre,
        CASE WHEN g.ultimo_heartbeat IS NOT NULL AND 
          datetime(g.ultimo_heartbeat) > datetime('now', '-5 minutes')
          THEN 1 ELSE 0 END as en_linea
      FROM gendarmes g
      LEFT JOIN zonas z ON g.ultima_zona_id = z.id
      WHERE g.activo = 1 AND g.ultima_ubicacion_lat IS NOT NULL
    `;
    const gendarmesParams = [];
    if (recinto_id) { gendarmesQuery += ' AND g.recinto_id = ?'; gendarmesParams.push(recinto_id); }
    const gendarmes = db.prepare(gendarmesQuery).all(...gendarmesParams);

    // Dispositivos detectados con ubicación
    let dispositivosQuery = `
      SELECT d.id, d.fabricante, d.modelo, d.tipo_dispositivo, d.senial_db,
        d.latitud, d.longitud, d.zona_id, d.es_autorizado, d.ultima_deteccion,
        z.nombre as zona_nombre
      FROM dispositivos_detectados d
      LEFT JOIN zonas z ON d.zona_id = z.id
      WHERE d.es_activo = 1 AND d.latitud IS NOT NULL
    `;
    const dispositivosParams = [];
    if (recinto_id) { dispositivosQuery += ' AND d.recinto_id = ?'; dispositivosParams.push(recinto_id); }
    const dispositivos = db.prepare(dispositivosQuery).all(...dispositivosParams);

    // Drones con ubicación
    let dronesQuery = `
      SELECT d.id, d.nombre, d.modelo, d.estado, d.bateria, d.altitud, d.velocidad,
        d.latitud, d.longitud, d.modo_vuelo, d.camara_activa
      FROM drones d
      WHERE d.latitud IS NOT NULL
    `;
    const dronesParams = [];
    if (recinto_id) { dronesQuery += ' AND d.recinto_id = ?'; dronesParams.push(recinto_id); }
    const drones = db.prepare(dronesQuery).all(...dronesParams);

    // Alertas activas con ubicación
    let alertasQuery = `
      SELECT a.id, a.tipo, a.severidad, a.titulo, a.descripcion,
        a.latitud, a.longitud, a.zona_id, a.created_at,
        z.nombre as zona_nombre
      FROM alertas a
      LEFT JOIN zonas z ON a.zona_id = z.id
      WHERE a.resuelta = 0 AND a.latitud IS NOT NULL
    `;
    const alertasParams = [];
    if (recinto_id) { alertasQuery += ' AND a.recinto_id = ?'; alertasParams.push(recinto_id); }
    const alertas = db.prepare(alertasQuery).all(...alertasParams);

    res.json({
      recintos,
      zonas,
      gendarmes,
      dispositivos,
      drones,
      alertas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
