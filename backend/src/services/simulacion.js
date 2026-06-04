const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

let intervalos = [];

function startSimulation(io) {
  console.log('🎮 Iniciando simulación de datos...');
  
  // Limpiar intervalos anteriores
  intervalos.forEach(i => clearInterval(i));
  intervalos = [];

  // Simular heartbeats de gendarmes cada 10 segundos
  const gendarmeInterval = setInterval(() => {
    try {
      const db = getDatabase();
      const gendarmes = db.prepare(
        "SELECT id, recinto_id, ultima_ubicacion_lat, ultima_ubicacion_lng FROM gendarmes WHERE activo = 1"
      ).all();

      gendarmes.forEach(g => {
        // Simular movimiento dentro del recinto
        const lat = g.ultima_ubicacion_lat || -33.456;
        const lng = g.ultima_ubicacion_lng || -70.648;
        const newLat = lat + (Math.random() - 0.5) * 0.001;
        const newLng = lng + (Math.random() - 0.5) * 0.001;

        db.prepare(`
          UPDATE gendarmes SET ultima_ubicacion_lat = ?, ultima_ubicacion_lng = ?,
            ultimo_heartbeat = datetime('now')
          WHERE id = ?
        `).run(newLat, newLng, g.id);

        if (io) {
          io.to(`recinto_${g.recinto_id}`).emit('gendarme_ubicacion', {
            gendarme_id: g.id,
            latitud: newLat,
            longitud: newLng,
            timestamp: new Date().toISOString()
          });
        }
      });
    } catch (err) {
      // Silenciar errores de simulación
    }
  }, 10000);
  intervalos.push(gendarmeInterval);

  // Simular detección de dispositivos cada 30 segundos
  const dispositivoInterval = setInterval(() => {
    try {
      const db = getDatabase();
      const recintos = db.prepare('SELECT id FROM recintos').all();
      
      if (recintos.length === 0) return;

      const recinto = recintos[Math.floor(Math.random() * recintos.length)];
      const zonas = db.prepare('SELECT id, latitud, longitud FROM zonas WHERE recinto_id = ?').all(recinto.id);
      
      if (zonas.length === 0) return;

      const zona = zonas[Math.floor(Math.random() * zonas.length)];
      
      // 30% de probabilidad de detectar un dispositivo
      if (Math.random() < 0.3) {
        const fabricantes = ['Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Apple', 'LG'];
        const modelos = ['Galaxy A54', 'Redmi Note 12', 'Moto G84', 'P60 Pro', 'iPhone 14', 'K62'];
        const imeis = [
          '35' + Array(13).fill(0).map(() => Math.floor(Math.random() * 10)).join(''),
          '86' + Array(13).fill(0).map(() => Math.floor(Math.random() * 10)).join(''),
          '49' + Array(13).fill(0).map(() => Math.floor(Math.random() * 10)).join('')
        ];
        const macs = Array(6).fill(0).map(() => 
          Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join(':');

        const dispositivoData = {
          id: uuidv4(),
          imei: imeis[Math.floor(Math.random() * imeis.length)],
          mac_address: macs,
          fabricante: fabricantes[Math.floor(Math.random() * fabricantes.length)],
          modelo: modelos[Math.floor(Math.random() * modelos.length)],
          senial_db: Math.floor(Math.random() * 40) - 90, // -90 a -50 dB
          frecuencia_mhz: 1800 + Math.floor(Math.random() * 600),
          recinto_id: recinto.id,
          zona_id: zona.id,
          latitud: zona.latitud + (Math.random() - 0.5) * 0.0005,
          longitud: zona.longitud + (Math.random() - 0.5) * 0.0005
        };

        // Verificar si ya existe
        const existente = db.prepare(
          'SELECT id, es_autorizado FROM dispositivos_detectados WHERE mac_address = ?'
        ).get(dispositivoData.mac_address);

        if (existente) {
          db.prepare(`
            UPDATE dispositivos_detectados SET ultima_deteccion = datetime('now'),
              senial_db = ?, latitud = ?, longitud = ?, zona_id = ?, es_activo = 1
            WHERE id = ?
          `).run(dispositivoData.senial_db, dispositivoData.latitud, 
            dispositivoData.longitud, dispositivoData.zona_id, existente.id);
        } else {
          db.prepare(`
            INSERT INTO dispositivos_detectados (id, imei, mac_address, fabricante, modelo,
              senial_db, frecuencia_mhz, recinto_id, zona_id, latitud, longitud)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(dispositivoData.id, dispositivoData.imei, dispositivoData.mac_address,
            dispositivoData.fabricante, dispositivoData.modelo, dispositivoData.senial_db,
            dispositivoData.frecuencia_mhz, dispositivoData.recinto_id, dispositivoData.zona_id,
            dispositivoData.latitud, dispositivoData.longitud);

          // Crear alerta
          const alertaId = uuidv4();
          db.prepare(`
            INSERT INTO alertas (id, recinto_id, tipo, severidad, titulo, descripcion,
              dispositivo_id, zona_id, latitud, longitud)
            VALUES (?, ?, 'celular_no_autorizado', 'critica', ?, ?, ?, ?, ?, ?)
          `).run(alertaId, dispositivoData.recinto_id,
            `📱 Celular no autorizado detectado`,
            `Se detectó ${dispositivoData.fabricante} ${dispositivoData.modelo} ` +
            `(señal: ${dispositivoData.senial_db}dB)`,
            dispositivoData.id, dispositivoData.zona_id,
            dispositivoData.latitud, dispositivoData.longitud);

          if (io) {
            io.to(`recinto_${dispositivoData.recinto_id}`).emit('nueva_alerta', {
              id: alertaId,
              tipo: 'celular_no_autorizado',
              severidad: 'critica',
              titulo: `📱 Celular no autorizado detectado`,
              descripcion: `${dispositivoData.fabricante} ${dispositivoData.modelo}`,
              dispositivo_id: dispositivoData.id,
              zona_id: dispositivoData.zona_id,
              latitud: dispositivoData.latitud,
              longitud: dispositivoData.longitud,
              created_at: new Date().toISOString()
            });
          }
        }

        if (io) {
          io.to(`recinto_${dispositivoData.recinto_id}`).emit('dispositivo_actualizado', {
            ...dispositivoData,
            es_autorizado: existente ? existente.es_autorizado : 0,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      // Silenciar errores de simulación
    }
  }, 30000);
  intervalos.push(dispositivoInterval);

  // Simular drones cada 15 segundos
  const dronInterval = setInterval(() => {
    try {
      const db = getDatabase();
      const drones = db.prepare(
        "SELECT id, recinto_id, estado, latitud, longitud, altitud, bateria FROM drones WHERE estado IN ('en_vuelo', 'despegando', 'patrulla')"
      ).all();

      drones.forEach(d => {
        const newLat = (d.latitud || -33.456) + (Math.random() - 0.5) * 0.002;
        const newLng = (d.longitud || -70.648) + (Math.random() - 0.5) * 0.002;
        const newAlt = Math.max(10, (d.altitud || 50) + (Math.random() - 0.5) * 5);
        const newBateria = Math.max(0, (d.bateria || 100) - Math.random() * 0.5);

        db.prepare(`
          UPDATE drones SET latitud = ?, longitud = ?, altitud = ?,
            velocidad = ?, bateria = ?, ultimo_heartbeat = datetime('now')
          WHERE id = ?
        `).run(newLat, newLng, newAlt, 5 + Math.random() * 10, newBateria, d.id);

        if (io) {
          io.to(`recinto_${d.recinto_id}`).emit('dron_ubicacion', {
            dron_id: d.id,
            latitud: newLat,
            longitud: newLng,
            altitud: newAlt,
            velocidad: 5 + Math.random() * 10,
            bateria: newBateria,
            timestamp: new Date().toISOString()
          });
        }

        // Alerta si batería baja
        if (newBateria < 20 && io) {
          const alertaId = uuidv4();
          db.prepare(`
            INSERT INTO alertas (id, recinto_id, tipo, severidad, titulo, descripcion, dron_id, latitud, longitud)
            VALUES (?, ?, 'dron_bateria_baja', 'alta', ?, ?, ?, ?, ?)
          `).run(alertaId, d.recinto_id,
            `⚠️ Batería baja del dron`,
            `El dron tiene ${Math.round(newBateria)}% de batería`,
            d.id, newLat, newLng);

          io.to(`recinto_${d.recinto_id}`).emit('nueva_alerta', {
            id: alertaId,
            tipo: 'dron_bateria_baja',
            severidad: 'alta',
            titulo: `⚠️ Batería baja del dron`,
            dron_id: d.id,
            latitud: newLat,
            longitud: newLng,
            created_at: new Date().toISOString()
          });
        }
      });
    } catch (err) {
      // Silenciar errores de simulación
    }
  }, 15000);
  intervalos.push(dronInterval);

  console.log('✅ Simulación iniciada (gendarmes, dispositivos, drones)');
}

function stopSimulation() {
  intervalos.forEach(i => clearInterval(i));
  intervalos = [];
  console.log('⏹️ Simulación detenida');
}

module.exports = { startSimulation, stopSimulation };
