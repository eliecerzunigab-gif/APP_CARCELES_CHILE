const { getDatabase } = require('../models/database');

let ioInstance;

// Funciones normalizadoras para estandarizar datos entre backend y frontend
function normalizarRecinto(r) {
  return {
    id: r.id,
    nombre: r.nombre,
    region: r.region || '',
    latitud: r.latitud,
    longitud: r.longitud,
    tipo: r.tipo || 'Complejo Penitenciario',
    capacidad: r.capacidad || 0,
    poblacion_actual: r.poblacion_actual || 0,
    nivel_seguridad: r.nivel_seguridad || 'alta',
    activo: r.activo !== 0
  };
}

function normalizarGendarme(g) {
  return {
    id: g.id,
    nombre: g.nombre || `Gendarme #${g.id}`,
    rut: g.rut || '',
    recinto_id: g.recinto_id,
    recinto_nombre: g.recinto_nombre || '',
    estado: g.estado || 'activo',
    latitud: g.ultima_ubicacion_lat || g.latitud || 0,
    longitud: g.ultima_ubicacion_lng || g.longitud || 0,
    ultimo_heartbeat: g.ultimo_heartbeat || null,
    bateria: g.bateria || 100,
    zona_id: g.ultima_zona_id || null,
    activo: g.activo !== 0
  };
}

function normalizarDispositivo(d) {
  return {
    id: d.id,
    imei: d.imei || '',
    mac_address: d.mac_address || '',
    fabricante: d.fabricante || 'Desconocido',
    modelo: d.modelo || '',
    intensidad_senal: d.senial_db ? Math.min(100, Math.max(0, (d.senial_db + 90) * 2.5)) : 50,
    senial_db: d.senial_db || 0,
    frecuencia_mhz: d.frecuencia_mhz || 0,
    recinto_id: d.recinto_id,
    recinto_nombre: d.recinto_nombre || '',
    zona_id: d.zona_id || null,
    latitud: d.latitud || 0,
    longitud: d.longitud || 0,
    autorizado: d.es_autorizado === 1,
    bateria: d.bateria || Math.floor(Math.random() * 50) + 30,
    ultima_deteccion: d.ultima_deteccion || null,
    activo: d.es_activo !== 0
  };
}

function normalizarDron(d) {
  return {
    id: d.id,
    nombre: d.nombre || `Dron #${d.id}`,
    recinto_id: d.recinto_id,
    recinto_nombre: d.recinto_nombre || '',
    estado: d.estado || 'en_tierra',
    latitud: d.latitud || 0,
    longitud: d.longitud || 0,
    altitud: d.altitud || 0,
    velocidad: d.velocidad || 0,
    bateria: d.bateria || 100,
    modelo: d.modelo || 'DJI Matrice 30T',
    activo: d.activo !== 0
  };
}

function normalizarAlerta(a) {
  return {
    id: a.id,
    recinto_id: a.recinto_id,
    recinto_nombre: a.recinto_nombre || '',
    tipo: a.tipo || a.titulo || 'Alerta',
    nivel: a.severidad === 'critica' ? 'alta' : a.severidad || 'media',
    severidad: a.severidad || 'media',
    descripcion: a.descripcion || '',
    zona: a.zona_id ? `Zona ${a.zona_id}` : null,
    zona_id: a.zona_id || null,
    dispositivo_id: a.dispositivo_id || null,
    dron_id: a.dron_id || null,
    latitud: a.latitud || 0,
    longitud: a.longitud || 0,
    fecha: a.created_at || a.fecha || null,
    resuelta: a.resuelta === 1,
    fecha_resolucion: a.resuelta_en || null
  };
}

function setupWebSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Enviar datos iniciales al conectar
    try {
      const db = getDatabase();
      const recintos = db.prepare('SELECT * FROM recintos').all();
      const gendarmes = db.prepare(`
        SELECT g.*, r.nombre as recinto_nombre, r.latitud as recinto_lat, r.longitud as recinto_lng
        FROM gendarmes g LEFT JOIN recintos r ON g.recinto_id = r.id
      `).all();
      const dispositivos = db.prepare(`
        SELECT d.*, r.nombre as recinto_nombre 
        FROM dispositivos_detectados d LEFT JOIN recintos r ON d.recinto_id = r.id
        WHERE d.es_activo = 1
      `).all();
      const drones = db.prepare(`
        SELECT d.*, r.nombre as recinto_nombre 
        FROM drones d LEFT JOIN recintos r ON d.recinto_id = r.id
      `).all();
      const alertas = db.prepare(`
        SELECT a.*, r.nombre as recinto_nombre 
        FROM alertas a LEFT JOIN recintos r ON a.recinto_id = r.id
        ORDER BY a.created_at DESC LIMIT 100
      `).all();

      socket.emit('datos_iniciales', {
        recintos: recintos.map(normalizarRecinto),
        gendarmes: gendarmes.map(normalizarGendarme),
        dispositivos: dispositivos.map(normalizarDispositivo),
        drones: drones.map(normalizarDron),
        alertas: alertas.map(normalizarAlerta)
      });
    } catch (err) {
      console.error('Error enviando datos iniciales:', err.message);
    }

    // Unirse a sala de un recinto específico
    socket.on('join_recinto', (recintoId) => {
      socket.join(`recinto_${recintoId}`);
      console.log(`Cliente ${socket.id} unido a recinto ${recintoId}`);
    });

    // Salir de sala de recinto
    socket.on('leave_recinto', (recintoId) => {
      socket.leave(`recinto_${recintoId}`);
    });

    // Heartbeat de gendarme
    socket.on('gendarme_heartbeat', (data) => {
      try {
        const db = getDatabase();
        const { gendarme_id, latitud, longitud, zona_id } = data;
        db.prepare(`
          UPDATE gendarmes 
          SET ultima_ubicacion_lat = ?, ultima_ubicacion_lng = ?, 
              ultima_zona_id = ?, ultimo_heartbeat = datetime('now')
          WHERE id = ?
        `).run(latitud, longitud, zona_id, gendarme_id);

        // Emitir a todos en el recinto
        io.to(`recinto_${data.recinto_id}`).emit('gendarme_ubicacion', {
          gendarme_id,
          latitud,
          longitud,
          zona_id,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error en heartbeat gendarme:', err.message);
      }
    });

    // Heartbeat de dron
    socket.on('dron_heartbeat', (data) => {
      try {
        const db = getDatabase();
        const { dron_id, latitud, longitud, altitud, velocidad, bateria } = data;
        db.prepare(`
          UPDATE drones 
          SET latitud = ?, longitud = ?, altitud = ?, velocidad = ?, 
              bateria = ?, ultimo_heartbeat = datetime('now')
          WHERE id = ?
        `).run(latitud, longitud, altitud, velocidad, bateria, dron_id);

        io.to(`recinto_${data.recinto_id}`).emit('dron_ubicacion', {
          dron_id,
          latitud,
          longitud,
          altitud,
          velocidad,
          bateria,
          timestamp: new Date().toISOString()
        });

        // Alerta si batería baja
        if (bateria < 20) {
          const alertaId = require('uuid').v4();
          db.prepare(`
            INSERT INTO alertas (id, recinto_id, tipo, severidad, titulo, descripcion, dron_id, latitud, longitud)
            VALUES (?, ?, 'dron_bateria_baja', 'alta', ?, ?, ?, ?, ?)
          `).run(alertaId, data.recinto_id, 
            `Batería baja del dron ${dron_id}`,
            `El dron tiene ${bateria}% de batería restante`,
            dron_id, latitud, longitud);

          io.to(`recinto_${data.recinto_id}`).emit('nueva_alerta', {
            id: alertaId,
            tipo: 'dron_bateria_baja',
            severidad: 'alta',
            titulo: `Batería baja del dron ${dron_id}`,
            descripcion: `El dron tiene ${bateria}% de batería restante`,
            dron_id,
            latitud,
            longitud,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error en heartbeat dron:', err.message);
      }
    });

    // Detección de dispositivo móvil
    socket.on('dispositivo_detectado', (data) => {
      try {
        const db = getDatabase();
        const { id, imei, mac_address, fabricante, modelo, senial_db, 
                frecuencia_mhz, recinto_id, zona_id, latitud, longitud } = data;

        // Verificar si ya existe
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
        } else {
          db.prepare(`
            INSERT INTO dispositivos_detectados (id, imei, mac_address, fabricante, modelo, 
              senial_db, frecuencia_mhz, recinto_id, zona_id, latitud, longitud)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(id, imei, mac_address, fabricante, modelo, senial_db, 
            frecuencia_mhz, recinto_id, zona_id, latitud, longitud);

          // Crear alerta si no es autorizado
          if (!existente || !existente.es_autorizado) {
            const alertaId = require('uuid').v4();
            db.prepare(`
              INSERT INTO alertas (id, recinto_id, tipo, severidad, titulo, descripcion, 
                dispositivo_id, zona_id, latitud, longitud)
              VALUES (?, ?, 'celular_no_autorizado', 'critica', ?, ?, ?, ?, ?, ?)
            `).run(alertaId, recinto_id,
              `📱 Celular no autorizado detectado`,
              `Se detectó un dispositivo ${fabricante || 'desconocido'} ${modelo || ''} ` +
              `(señal: ${senial_db}dB) en zona ${zona_id || 'desconocida'}`,
              id, zona_id, latitud, longitud);

            io.to(`recinto_${recinto_id}`).emit('nueva_alerta', {
              id: alertaId,
              tipo: 'celular_no_autorizado',
              severidad: 'critica',
              titulo: `📱 Celular no autorizado detectado`,
              dispositivo_id: id,
              zona_id,
              latitud,
              longitud,
              created_at: new Date().toISOString()
            });
          }
        }

        io.to(`recinto_${recinto_id}`).emit('dispositivo_actualizado', {
          ...data,
          es_autorizado: existente ? existente.es_autorizado : 0,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error en detección dispositivo:', err.message);
      }
    });

    // Comando para dron
    socket.on('dron_comando', (data) => {
      const { dron_id, comando, recinto_id } = data;
      console.log(`Comando para dron ${dron_id}: ${comando}`);
      // Reenviar comando al dron (simulado)
      io.to(`recinto_${recinto_id}`).emit('dron_comando_recibido', {
        dron_id,
        comando,
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

    // Resolver alerta
    socket.on('resolver_alerta', (data) => {
      try {
        const db = getDatabase();
        const { alerta_id, resuelta_por } = data;
        db.prepare(`
          UPDATE alertas SET resuelta = 1, resuelta_por = ?, resuelta_en = datetime('now')
          WHERE id = ?
        `).run(resuelta_por, alerta_id);

        io.emit('alerta_resuelta', {
          alerta_id,
          resuelta_por,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error al resolver alerta:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });
}

function getIO() {
  return ioInstance;
}

module.exports = { setupWebSocket, getIO };
