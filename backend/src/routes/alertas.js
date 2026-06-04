const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

// Obtener todas las alertas
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { recinto_id, resuelta, tipo, severidad, limit } = req.query;
    let query = `
      SELECT a.*, z.nombre as zona_nombre, 
        d.fabricante || ' ' || d.modelo as dispositivo_info,
        g.nombre || ' ' || g.apellido as gendarme_nombre,
        dr.nombre as dron_nombre,
        r.nombre as recinto_nombre
      FROM alertas a
      LEFT JOIN zonas z ON a.zona_id = z.id
      LEFT JOIN dispositivos_detectados d ON a.dispositivo_id = d.id
      LEFT JOIN gendarmes g ON a.gendarme_id = g.id
      LEFT JOIN drones dr ON a.dron_id = dr.id
      LEFT JOIN recintos r ON a.recinto_id = r.id
      WHERE 1=1
    `;
    const params = [];
    if (recinto_id) { query += ' AND a.recinto_id = ?'; params.push(recinto_id); }
    if (resuelta !== undefined) { query += ' AND a.resuelta = ?'; params.push(resuelta); }
    if (tipo) { query += ' AND a.tipo = ?'; params.push(tipo); }
    if (severidad) { query += ' AND a.severidad = ?'; params.push(severidad); }
    query += ' ORDER BY a.created_at DESC';
    if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
    
    const alertas = db.prepare(query).all(...params);
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener alerta por ID
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const alerta = db.prepare(`
      SELECT a.*, z.nombre as zona_nombre,
        d.fabricante || ' ' || d.modelo as dispositivo_info,
        g.nombre || ' ' || g.apellido as gendarme_nombre,
        dr.nombre as dron_nombre
      FROM alertas a
      LEFT JOIN zonas z ON a.zona_id = z.id
      LEFT JOIN dispositivos_detectados d ON a.dispositivo_id = d.id
      LEFT JOIN gendarmes g ON a.gendarme_id = g.id
      LEFT JOIN drones dr ON a.dron_id = dr.id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!alerta) return res.status(404).json({ error: 'Alerta no encontrada' });
    res.json(alerta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear alerta manual
router.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const { recinto_id, tipo, severidad, titulo, descripcion, 
            latitud, longitud, zona_id, dispositivo_id, gendarme_id, dron_id } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO alertas (id, recinto_id, tipo, severidad, titulo, descripcion,
        latitud, longitud, zona_id, dispositivo_id, gendarme_id, dron_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, recinto_id, tipo, severidad, titulo, descripcion,
      latitud, longitud, zona_id, dispositivo_id, gendarme_id, dron_id);
    const alerta = db.prepare('SELECT * FROM alertas WHERE id = ?').get(id);
    res.status(201).json(alerta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolver alerta
router.patch('/:id/resolver', (req, res) => {
  try {
    const db = getDatabase();
    const { resuelta_por } = req.body;
    db.prepare(`
      UPDATE alertas SET resuelta = 1, resuelta_por = ?, resuelta_en = datetime('now')
      WHERE id = ?
    `).run(resuelta_por, req.params.id);
    const alerta = db.prepare('SELECT * FROM alertas WHERE id = ?').get(req.params.id);
    res.json(alerta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener estadísticas de alertas
router.get('/stats/resumen', (req, res) => {
  try {
    const db = getDatabase();
    const { recinto_id } = req.query;
    let params = [];
    let whereClause = '';
    if (recinto_id) { whereClause = ' WHERE recinto_id = ?'; params.push(recinto_id); }

    const total = db.prepare(`SELECT COUNT(*) as total FROM alertas${whereClause}`).get(...params);
    const activas = db.prepare(`SELECT COUNT(*) as activas FROM alertas${whereClause} AND resuelta = 0`).get(...params);
    const porSeveridad = db.prepare(`
      SELECT severidad, COUNT(*) as count FROM alertas${whereClause ? whereClause + ' AND' : ' WHERE'} resuelta = 0 
      GROUP BY severidad
    `).all(...params);
    const porTipo = db.prepare(`
      SELECT tipo, COUNT(*) as count FROM alertas${whereClause ? whereClause + ' AND' : ' WHERE'} resuelta = 0 
      GROUP BY tipo ORDER BY count DESC
    `).all(...params);

    res.json({
      total: total.total,
      activas: activas.activas,
      porSeveridad,
      porTipo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
