const { getDatabase } = require('../models/database');

let ioInstance;

function setupWebSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

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
