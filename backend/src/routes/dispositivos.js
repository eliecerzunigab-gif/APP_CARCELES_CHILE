const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

// Obtener todos los dispositivos detectados
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { recinto_id, activo, autorizado } = req.query;
    let query = `
      SELECT d.*, z.nombre as zona_nombre, r.nombre as recinto_nombre
      FROM dispositivos_detectados d
      LEFT JOIN zonas z ON d.zona_id = z.id
      LEFT JOIN recintos r ON d.recinto_id = r.id
      WHERE 1=1
    `;
    const params = [];
    if (recinto_id) { query += ' AND d.recinto_id = ?'; params.push(recinto_id); }
    if (activo !== undefined) { query += ' AND d.es_activo = ?'; params.push(activo); }
    if (autorizado !== undefined) { query += ' AND d.es_autorizado = ?'; params.push(autorizado); }
    query += ' ORDER BY d.ultima_deteccion DESC';
    const dispositivos = db.prepare(query).all(...params);
    res.json(dispositivos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener dispositivo por ID
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const dispositivo = db.prepare(`
      SELECT d.*, z.nombre as zona_nombre, r.nombre as recinto_nombre
      FROM dispositivos_detectados d
      LEFT JOIN zonas z ON d.zona_id = z.id
      LEFT JOIN recintos r ON d.recinto_id = r.id
      WHERE d.id = ?
    `).get(req.params.id);
    if (!dispositivo) return res.status(404).json({ error: 'Dispositivo no encontrado' });
    res.json(dispositivo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar detección de dispositivo
router.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const { imei, mac_address, fabricante, modelo, tipo_dispositivo, 
            senial_db, frecuencia_mhz, recinto_id, zona_id, latitud, longitud } = req.body;
    
    // Verificar si ya existe por MAC o IMEI
    const existente = db.prepare(
      'SELECT id, es_autorizado FROM dispositivos_detectados WHERE mac_address = ? OR imei = ?'
    ).get(mac_address, imei);

    if (existente) {
      db.prepare(`
        UPDATE dispositivos_detectados 
        SET ultima_deteccion = datetime('now'), senial_db = ?, 
            latitud = ?, longitud = ?, zona_id = ?, es_activo = 1
        WHERE id = ?
      `).run(senial_db, latitud, longitud, zona_id, existente.id);
      const dispositivo = db.prepare('SELECT * FROM dispositivos_detectados WHERE id = ?').get(existente.id);
      return res.json(dispositivo);
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO dispositivos_detectados (id, imei, mac_address, fabricante, modelo, 
        tipo_dispositivo, senial_db, frecuencia_mhz, recinto_id, zona_id, latitud, longitud)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, imei, mac_address, fabricante, modelo, tipo_dispositivo || 'celular',
      senial_db, frecuencia_mhz, recinto_id, zona_id, latitud, longitud);
    
    const dispositivo = db.prepare('SELECT * FROM dispositivos_detectados WHERE id = ?').get(id);
    res.status(201).json(dispositivo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Autorizar/desautorizar dispositivo
router.patch('/:id/autorizar', (req, res) => {
  try {
    const db = getDatabase();
    const { es_autorizado } = req.body;
    db.prepare('UPDATE dispositivos_detectados SET es_autorizado = ? WHERE id = ?')
      .run(es_autorizado, req.params.id);
    const dispositivo = db.prepare('SELECT * FROM dispositivos_detectados WHERE id = ?').get(req.params.id);
    res.json(dispositivo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar dispositivo
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { fabricante, modelo, tipo_dispositivo, notas, es_autorizado } = req.body;
    db.prepare(`
      UPDATE dispositivos_detectados SET fabricante = ?, modelo = ?, tipo_dispositivo = ?,
        notas = ?, es_autorizado = ?
      WHERE id = ?
    `).run(fabricante, modelo, tipo_dispositivo, notas, es_autorizado, req.params.id);
    const dispositivo = db.prepare('SELECT * FROM dispositivos_detectados WHERE id = ?').get(req.params.id);
    res.json(dispositivo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
