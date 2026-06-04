const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

// Obtener todos los drones
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { recinto_id, estado } = req.query;
    let query = `
      SELECT d.*, r.nombre as recinto_nombre
      FROM drones d
      LEFT JOIN recintos r ON d.recinto_id = r.id
      WHERE 1=1
    `;
    const params = [];
    if (recinto_id) { query += ' AND d.recinto_id = ?'; params.push(recinto_id); }
    if (estado) { query += ' AND d.estado = ?'; params.push(estado); }
    query += ' ORDER BY d.nombre';
    const drones = db.prepare(query).all(...params);
    res.json(drones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener dron por ID
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const dron = db.prepare(`
      SELECT d.*, r.nombre as recinto_nombre
      FROM drones d
      LEFT JOIN recintos r ON d.recinto_id = r.id
      WHERE d.id = ?
    `).get(req.params.id);
    if (!dron) return res.status(404).json({ error: 'Dron no encontrado' });
    res.json(dron);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear dron
router.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const { nombre, modelo, recinto_id } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO drones (id, nombre, modelo, recinto_id)
      VALUES (?, ?, ?, ?)
    `).run(id, nombre, modelo, recinto_id);
    const dron = db.prepare('SELECT * FROM drones WHERE id = ?').get(id);
    res.status(201).json(dron);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar estado del dron
router.patch('/:id/estado', (req, res) => {
  try {
    const db = getDatabase();
    const { estado, bateria, altitud, velocidad, latitud, longitud, modo_vuelo } = req.body;
    const updates = [];
    const params = [];
    
    if (estado) { updates.push('estado = ?'); params.push(estado); }
    if (bateria !== undefined) { updates.push('bateria = ?'); params.push(bateria); }
    if (altitud !== undefined) { updates.push('altitud = ?'); params.push(altitud); }
    if (velocidad !== undefined) { updates.push('velocidad = ?'); params.push(velocidad); }
    if (latitud !== undefined) { updates.push('latitud = ?'); params.push(latitud); }
    if (longitud !== undefined) { updates.push('longitud = ?'); params.push(longitud); }
    if (modo_vuelo) { updates.push('modo_vuelo = ?'); params.push(modo_vuelo); }
    
    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);
    
    db.prepare(`UPDATE drones SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const dron = db.prepare('SELECT * FROM drones WHERE id = ?').get(req.params.id);
    res.json(dron);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comando para dron (despegar, aterrizar, patrullar, etc.)
router.post('/:id/comando', (req, res) => {
  try {
    const db = getDatabase();
    const { comando } = req.body;
    const dron = db.prepare('SELECT * FROM drones WHERE id = ?').get(req.params.id);
    if (!dron) return res.status(404).json({ error: 'Dron no encontrado' });

    let nuevoEstado = dron.estado;
    switch (comando) {
      case 'despegar':
        if (dron.estado !== 'en_base') 
          return res.status(400).json({ error: 'El dron debe estar en base para despegar' });
        nuevoEstado = 'despegando';
        break;
      case 'aterrizar':
        if (!['en_vuelo', 'despegando', 'patrulla'].includes(dron.estado))
          return res.status(400).json({ error: 'El dron debe estar en vuelo para aterrizar' });
        nuevoEstado = 'regresando';
        break;
      case 'iniciar_patrulla':
        if (dron.estado !== 'en_base')
          return res.status(400).json({ error: 'El dron debe estar en base' });
        nuevoEstado = 'despegando';
        break;
      case 'regresar_base':
        nuevoEstado = 'regresando';
        break;
      case 'activar_camara':
        db.prepare('UPDATE drones SET camara_activa = 1 WHERE id = ?').run(req.params.id);
        break;
      case 'desactivar_camara':
        db.prepare('UPDATE drones SET camara_activa = 0 WHERE id = ?').run(req.params.id);
        break;
      default:
        return res.status(400).json({ error: `Comando desconocido: ${comando}` });
    }

    if (nuevoEstado !== dron.estado) {
      db.prepare("UPDATE drones SET estado = ?, updated_at = datetime('now') WHERE id = ?")
        .run(nuevoEstado, req.params.id);
    }

    res.json({ 
      message: `Comando '${comando}' ejecutado`, 
      dron: db.prepare('SELECT * FROM drones WHERE id = ?').get(req.params.id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener rutas de un dron
router.get('/:id/rutas', (req, res) => {
  try {
    const db = getDatabase();
    const rutas = db.prepare('SELECT * FROM rutas_dron WHERE dron_id = ? AND activa = 1')
      .all(req.params.id);
    res.json(rutas.map(r => ({ ...r, puntos: JSON.parse(r.puntos) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear ruta para dron
router.post('/:id/rutas', (req, res) => {
  try {
    const db = getDatabase();
    const { nombre, puntos } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO rutas_dron (id, dron_id, nombre, puntos)
      VALUES (?, ?, ?, ?)
    `).run(id, req.params.id, nombre, JSON.stringify(puntos));
    const ruta = db.prepare('SELECT * FROM rutas_dron WHERE id = ?').get(id);
    res.status(201).json({ ...ruta, puntos: JSON.parse(ruta.puntos) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar dron
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { nombre, modelo } = req.body;
    db.prepare("UPDATE drones SET nombre = ?, modelo = ?, updated_at = datetime('now') WHERE id = ?")
      .run(nombre, modelo, req.params.id);
    const dron = db.prepare('SELECT * FROM drones WHERE id = ?').get(req.params.id);
    res.json(dron);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar dron
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM drones WHERE id = ?').run(req.params.id);
    res.json({ message: 'Dron eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
