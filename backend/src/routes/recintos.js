const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

// Obtener todos los recintos (con contadores para vista nacional)
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const recintos = db.prepare('SELECT * FROM recintos ORDER BY nombre').all();
    
    // Agregar contadores por recinto
    const recintosConDatos = recintos.map(r => {
      const gendarmesActivos = db.prepare(
        "SELECT COUNT(*) as count FROM gendarmes WHERE recinto_id = ? AND activo = 1 AND " +
        "(ultimo_heartbeat IS NOT NULL AND datetime(ultimo_heartbeat) > datetime('now', '-5 minutes'))"
      ).get(r.id);
      
      const dispositivosNoAutorizados = db.prepare(
        "SELECT COUNT(*) as count FROM dispositivos_detectados WHERE recinto_id = ? AND es_autorizado = 0 AND es_activo = 1"
      ).get(r.id);
      
      const alertasActivas = db.prepare(
        "SELECT COUNT(*) as count FROM alertas WHERE recinto_id = ? AND resuelta = 0"
      ).get(r.id);
      
      const alertasCriticas = db.prepare(
        "SELECT COUNT(*) as count FROM alertas WHERE recinto_id = ? AND resuelta = 0 AND severidad = 'critica'"
      ).get(r.id);
      
      const dronesActivos = db.prepare(
        "SELECT COUNT(*) as count FROM drones WHERE recinto_id = ? AND estado IN ('en_vuelo', 'patrulla', 'despegando')"
      ).get(r.id);
      
      return {
        ...r,
        gendarmes_activos: gendarmesActivos.count,
        dispositivos_no_autorizados: dispositivosNoAutorizados.count,
        alertas_activas: alertasActivas.count,
        alertas_criticas: alertasCriticas.count,
        drones_activos: dronesActivos.count
      };
    });
    
    res.json(recintosConDatos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un recinto por ID
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const recinto = db.prepare('SELECT * FROM recintos WHERE id = ?').get(req.params.id);
    if (!recinto) return res.status(404).json({ error: 'Recinto no encontrado' });
    res.json(recinto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener zonas de un recinto
router.get('/:id/zonas', (req, res) => {
  try {
    const db = getDatabase();
    const zonas = db.prepare('SELECT * FROM zonas WHERE recinto_id = ? ORDER BY nombre').all(req.params.id);
    res.json(zonas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear recinto
router.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const { nombre, direccion, latitud, longitud, poligono } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO recintos (id, nombre, direccion, latitud, longitud, poligono)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, nombre, direccion, latitud, longitud, JSON.stringify(poligono));
    const recinto = db.prepare('SELECT * FROM recintos WHERE id = ?').get(id);
    res.status(201).json(recinto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar recinto
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { nombre, direccion, latitud, longitud, poligono } = req.body;
    db.prepare(`
      UPDATE recintos SET nombre = ?, direccion = ?, latitud = ?, longitud = ?, 
        poligono = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(nombre, direccion, latitud, longitud, JSON.stringify(poligono), req.params.id);
    const recinto = db.prepare('SELECT * FROM recintos WHERE id = ?').get(req.params.id);
    res.json(recinto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar recinto
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM recintos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Recinto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
