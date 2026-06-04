const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

// Obtener todos los gendarmes
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { recinto_id, activo } = req.query;
    let query = `
      SELECT g.*, z.nombre as zona_nombre, r.nombre as recinto_nombre
      FROM gendarmes g
      LEFT JOIN zonas z ON g.ultima_zona_id = z.id
      LEFT JOIN recintos r ON g.recinto_id = r.id
      WHERE 1=1
    `;
    const params = [];
    if (recinto_id) { query += ' AND g.recinto_id = ?'; params.push(recinto_id); }
    if (activo !== undefined) { query += ' AND g.activo = ?'; params.push(activo); }
    query += ' ORDER BY g.apellido, g.nombre';
    const gendarmes = db.prepare(query).all(...params);
    res.json(gendarmes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener gendarme por ID
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const gendarme = db.prepare(`
      SELECT g.*, z.nombre as zona_nombre, r.nombre as recinto_nombre
      FROM gendarmes g
      LEFT JOIN zonas z ON g.ultima_zona_id = z.id
      LEFT JOIN recintos r ON g.recinto_id = r.id
      WHERE g.id = ?
    `).get(req.params.id);
    if (!gendarme) return res.status(404).json({ error: 'Gendarme no encontrado' });
    res.json(gendarme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear gendarme
router.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const { nombre, apellido, rut, cargo, recinto_id, telefono, email } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO gendarmes (id, nombre, apellido, rut, cargo, recinto_id, telefono, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, nombre, apellido, rut, cargo || 'Gendarme', recinto_id, telefono, email);
    const gendarme = db.prepare('SELECT * FROM gendarmes WHERE id = ?').get(id);
    res.status(201).json(gendarme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar ubicación del gendarme
router.patch('/:id/ubicacion', (req, res) => {
  try {
    const db = getDatabase();
    const { latitud, longitud, zona_id } = req.body;
    db.prepare(`
      UPDATE gendarmes SET ultima_ubicacion_lat = ?, ultima_ubicacion_lng = ?,
        ultima_zona_id = ?, ultimo_heartbeat = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(latitud, longitud, zona_id, req.params.id);
    res.json({ message: 'Ubicación actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar gendarme
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { nombre, apellido, rut, cargo, telefono, email, activo } = req.body;
    db.prepare(`
      UPDATE gendarmes SET nombre = ?, apellido = ?, rut = ?, cargo = ?,
        telefono = ?, email = ?, activo = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(nombre, apellido, rut, cargo, telefono, email, activo, req.params.id);
    const gendarme = db.prepare('SELECT * FROM gendarmes WHERE id = ?').get(req.params.id);
    res.json(gendarme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar gendarme
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM gendarmes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Gendarme eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
