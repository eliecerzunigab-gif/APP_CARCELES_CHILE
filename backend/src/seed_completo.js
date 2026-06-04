// ============================================================
// seed_completo.js - Poblar base de datos con datos completos
// 66 recintos penitenciarios de Chile, gendarmes, zonas, drones
// ============================================================
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('./models/database');

function seedDatabase() {
  console.log('🌱 Sembrando base de datos con datos completos...');
  const db = getDatabase();

  // Limpiar datos existentes
  db.exec('DELETE FROM logs_eventos');
  db.exec('DELETE FROM rutas_dron');
  db.exec('DELETE FROM alertas');
  db.exec('DELETE FROM dispositivos_detectados');
  db.exec('DELETE FROM drones');
  db.exec('DELETE FROM gendarmes');
  db.exec('DELETE FROM zonas');
  db.exec('DELETE FROM recintos');

  // ============================================================
  // DATOS DE RECINTOS PENITENCIARIOS DE CHILE
  // ============================================================
  const recintosData = [
    // Región de Arica y Parinacota
    { nombre: "CDP Arica", direccion: "Av. Santa María 2345, Arica", latitud: -18.478, longitud: -70.321, region: "Región de Arica y Parinacota" },
    
    // Región de Tarapacá
    { nombre: "CDP Iquique", direccion: "Av. Arturo Prat 1234, Iquique", latitud: -20.214, longitud: -70.152, region: "Región de Tarapacá" },
    { nombre: "CDP Pozo Almonte", direccion: "Av. Comercio 567, Pozo Almonte", latitud: -20.256, longitud: -69.786, region: "Región de Tarapacá" },
    
    // Región de Antofagasta
    { nombre: "CDP Antofagasta", direccion: "Av. Argentina 2345, Antofagasta", latitud: -23.651, longitud: -70.398, region: "Región de Antofagasta" },
    { nombre: "CDP Calama", direccion: "Av. Granaderos 1234, Calama", latitud: -22.462, longitud: -68.928, region: "Región de Antofagasta" },
    { nombre: "CDP Tocopilla", direccion: "Av. 21 de Mayo 789, Tocopilla", latitud: -22.092, longitud: -70.198, region: "Región de Antofagasta" },
    
    // Región de Atacama
    { nombre: "CDP Copiapó", direccion: "Av. Juan Martínez 1234, Copiapó", latitud: -27.367, longitud: -70.332, region: "Región de Atacama" },
    { nombre: "CDP Vallenar", direccion: "Av. Ramírez 789, Vallenar", latitud: -28.575, longitud: -70.759, region: "Región de Atacama" },
    { nombre: "CDP Chañaral", direccion: "Av. Merino Jarpa 456, Chañaral", latitud: -26.345, longitud: -70.620, region: "Región de Atacama" },
    
    // Región de Coquimbo
    { nombre: "CDP La Serena", direccion: "Av. Francisco de Aguirre 2345, La Serena", latitud: -29.903, longitud: -71.250, region: "Región de Coquimbo" },
    { nombre: "CDP Coquimbo", direccion: "Av. Costanera 1234, Coquimbo", latitud: -29.953, longitud: -71.343, region: "Región de Coquimbo" },
    { nombre: "CDP Ovalle", direccion: "Av. Libertad 789, Ovalle", latitud: -30.598, longitud: -71.200, region: "Región de Coquimbo" },
    { nombre: "CDP Illapel", direccion: "Av. Constitución 456, Illapel", latitud: -31.633, longitud: -71.170, region: "Región de Coquimbo" },
    
    // Región de Valparaíso
    { nombre: "CDP Valparaíso", direccion: "Av. Argentina 975, Cerro Cordillera, Valparaíso", latitud: -33.047, longitud: -71.617, region: "Región de Valparaíso" },
    { nombre: "CDP San Antonio", direccion: "Av. Barros Luco 2101, San Antonio", latitud: -33.593, longitud: -71.613, region: "Región de Valparaíso" },
    { nombre: "CDP Viña del Mar", direccion: "Av. Libertad 1234, Viña del Mar", latitud: -33.025, longitud: -71.552, region: "Región de Valparaíso" },
    { nombre: "CDP Los Andes", direccion: "Av. Argentina 456, Los Andes", latitud: -32.834, longitud: -70.598, region: "Región de Valparaíso" },
    { nombre: "CDP San Felipe", direccion: "Av. Yungay 789, San Felipe", latitud: -32.750, longitud: -70.725, region: "Región de Valparaíso" },
    { nombre: "CDP Quillota", direccion: "Av. Condell 567, Quillota", latitud: -32.880, longitud: -71.248, region: "Región de Valparaíso" },
    { nombre: "CDP Quilpué", direccion: "Av. Blanco Encalada 890, Quilpué", latitud: -33.048, longitud: -71.442, region: "Región de Valparaíso" },
    { nombre: "CDP La Ligua", direccion: "Av. Prat 456, La Ligua", latitud: -32.452, longitud: -71.231, region: "Región de Valparaíso" },
    
    // Región Metropolitana
    { nombre: "CDP Santiago Sur (Ex Penitenciaría de Santiago)", direccion: "Av. Pedro Montt 1600, Santiago Centro", latitud: -33.456, longitud: -70.648, region: "Región Metropolitana" },
    { nombre: "CCP Colina I", direccion: "Ruta 5 Norte, Km 25, Colina", latitud: -33.202, longitud: -70.675, region: "Región Metropolitana" },
    { nombre: "CCP Colina II", direccion: "Ruta 5 Norte, Km 28, Colina", latitud: -33.185, longitud: -70.680, region: "Región Metropolitana" },
    { nombre: "CDP San Bernardo", direccion: "Av. Colón 1234, San Bernardo", latitud: -33.592, longitud: -70.700, region: "Región Metropolitana" },
    { nombre: "CDP Puente Alto", direccion: "Av. Concha y Toro 2345, Puente Alto", latitud: -33.613, longitud: -70.575, region: "Región Metropolitana" },
    { nombre: "CDP Talagante", direccion: "Av. Balmaceda 890, Talagante", latitud: -33.664, longitud: -70.930, region: "Región Metropolitana" },
    { nombre: "CDP Melipilla", direccion: "Av. Vicuña Mackenna 567, Melipilla", latitud: -33.686, longitud: -71.215, region: "Región Metropolitana" },
    
    // Región del Libertador General Bernardo O'Higgins
    { nombre: "CDP Rancagua", direccion: "Av. Libertador O'Higgins 1234, Rancagua", latitud: -34.170, longitud: -70.745, region: "Región del Libertador General Bernardo O'Higgins" },
    { nombre: "CDP San Fernando", direccion: "Av. Manuel Rodríguez 789, San Fernando", latitud: -34.585, longitud: -70.988, region: "Región del Libertador General Bernardo O'Higgins" },
    { nombre: "CDP Santa Cruz", direccion: "Av. Errázuriz 456, Santa Cruz", latitud: -34.638, longitud: -71.365, region: "Región del Libertador General Bernardo O'Higgins" },
    { nombre: "CDP Rengo", direccion: "Av. Caupolicán 567, Rengo", latitud: -34.410, longitud: -70.860, region: "Región del Libertador General Bernardo O'Higgins" },
    { nombre: "CDP Pichilemu", direccion: "Av. Agustín Urrutia 234, Pichilemu", latitud: -34.387, longitud: -72.005, region: "Región del Libertador General Bernardo O'Higgins" },
    
    // Región del Maule
    { nombre: "CDP Talca", direccion: "Av. 2 Sur 1234, Talca", latitud: -35.427, longitud: -71.655, region: "Región del Maule" },
    { nombre: "CDP Curicó", direccion: "Av. Alessandri 789, Curicó", latitud: -34.983, longitud: -71.239, region: "Región del Maule" },
    { nombre: "CDP Linares", direccion: "Av. Independencia 567, Linares", latitud: -35.847, longitud: -71.593, region: "Región del Maule" },
    { nombre: "CDP Constitución", direccion: "Av. Costanera 345, Constitución", latitud: -35.333, longitud: -72.417, region: "Región del Maule" },
    { nombre: "CDP Cauquenes", direccion: "Av. San Martín 456, Cauquenes", latitud: -35.967, longitud: -72.317, region: "Región del Maule" },
    { nombre: "CDP Parral", direccion: "Av. Ignacio Carrera Pinto 234, Parral", latitud: -36.140, longitud: -71.830, region: "Región del Maule" },
    
    // Región de Ñuble
    { nombre: "CDP Chillán", direccion: "Av. O'Higgins 1234, Chillán", latitud: -36.607, longitud: -72.103, region: "Región de Ñuble" },
    { nombre: "CDP San Carlos", direccion: "Av. Libertad 567, San Carlos", latitud: -36.425, longitud: -71.958, region: "Región de Ñuble" },
    
    // Región del Biobío
    { nombre: "CDP Concepción (El Manzano)", direccion: "Camino a Penco s/n, Concepción", latitud: -36.827, longitud: -73.050, region: "Región del Biobío" },
    { nombre: "CCP Biobío", direccion: "Ruta 160, Km 12, San Pedro de la Paz", latitud: -36.840, longitud: -73.100, region: "Región del Biobío" },
    { nombre: "CDP Talcahuano", direccion: "Av. Colón 1234, Talcahuano", latitud: -36.724, longitud: -73.117, region: "Región del Biobío" },
    { nombre: "CDP Los Ángeles", direccion: "Av. Alemania 789, Los Ángeles", latitud: -37.470, longitud: -72.350, region: "Región del Biobío" },
    { nombre: "CDP Lebu", direccion: "Av. Matta 456, Lebu", latitud: -37.608, longitud: -73.653, region: "Región del Biobío" },
    { nombre: "CDP Arauco", direccion: "Av. Caupolicán 234, Arauco", latitud: -37.246, longitud: -73.317, region: "Región del Biobío" },
    
    // Región de La Araucanía
    { nombre: "CDP Temuco", direccion: "Av. Alemania 567, Temuco", latitud: -38.735, longitud: -72.590, region: "Región de La Araucanía" },
    { nombre: "CDP Angol", direccion: "Av. O'Higgins 890, Angol", latitud: -37.800, longitud: -72.710, region: "Región de La Araucanía" },
    { nombre: "CDP Villarrica", direccion: "Av. Pedro de Valdivia 456, Villarrica", latitud: -39.280, longitud: -72.227, region: "Región de La Araucanía" },
    { nombre: "CDP Lautaro", direccion: "Av. Manuel Rodríguez 234, Lautaro", latitud: -38.530, longitud: -72.435, region: "Región de La Araucanía" },
    { nombre: "CDP Nueva Imperial", direccion: "Av. Prat 345, Nueva Imperial", latitud: -38.745, longitud: -72.950, region: "Región de La Araucanía" },
    
    // Región de Los Ríos
    { nombre: "CDP Valdivia", direccion: "Av. España 1234, Valdivia", latitud: -39.814, longitud: -73.246, region: "Región de Los Ríos" },
    { nombre: "CDP La Unión", direccion: "Av. Ramírez 789, La Unión", latitud: -40.293, longitud: -73.082, region: "Región de Los Ríos" },
    { nombre: "CDP Río Bueno", direccion: "Av. Balmaceda 234, Río Bueno", latitud: -40.335, longitud: -72.955, region: "Región de Los Ríos" },
    
    // Región de Los Lagos
    { nombre: "CDP Puerto Montt", direccion: "Av. Diego Portales 1234, Puerto Montt", latitud: -41.472, longitud: -72.939, region: "Región de Los Lagos" },
    { nombre: "CDP Osorno", direccion: "Av. Mackenna 789, Osorno", latitud: -40.573, longitud: -73.133, region: "Región de Los Lagos" },
    { nombre: "CDP Castro", direccion: "Av. Pedro Montt 456, Castro", latitud: -42.482, longitud: -73.764, region: "Región de Los Lagos" },
    { nombre: "CDP Ancud", direccion: "Av. Libertad 345, Ancud", latitud: -41.869, longitud: -73.820, region: "Región de Los Lagos" },
    { nombre: "CDP Puerto Varas", direccion: "Av. Gramado 234, Puerto Varas", latitud: -41.318, longitud: -72.985, region: "Región de Los Lagos" },
    
    // Región de Aysén
    { nombre: "CDP Coyhaique", direccion: "Av. Ogana 1234, Coyhaique", latitud: -45.571, longitud: -72.068, region: "Región de Aysén del General Carlos Ibáñez del Campo" },
    { nombre: "CDP Puerto Aysén", direccion: "Av. Eusebio Lillo 456, Puerto Aysén", latitud: -45.403, longitud: -72.692, region: "Región de Aysén del General Carlos Ibáñez del Campo" },
    { nombre: "CDP Chile Chico", direccion: "Av. Bernardo O'Higgins 234, Chile Chico", latitud: -46.541, longitud: -71.724, region: "Región de Aysén del General Carlos Ibáñez del Campo" },
    
    // Región de Magallanes
    { nombre: "CDP Punta Arenas", direccion: "Av. Colón 1234, Punta Arenas", latitud: -53.163, longitud: -70.911, region: "Región de Magallanes y de la Antártica Chilena" },
    { nombre: "CDP Puerto Natales", direccion: "Av. Pedro Montt 456, Puerto Natales", latitud: -51.726, longitud: -72.506, region: "Región de Magallanes y de la Antártica Chilena" },
    { nombre: "CDP Porvenir", direccion: "Av. Croacia 234, Porvenir", latitud: -53.296, longitud: -70.366, region: "Región de Magallanes y de la Antártica Chilena" }
  ];

  // Insertar recintos
  const insertRecinto = db.prepare(`
    INSERT INTO recintos (id, nombre, direccion, latitud, longitud)
    VALUES (?, ?, ?, ?, ?)
  `);

  const recintosInsertados = [];
  for (const r of recintosData) {
    const id = uuidv4();
    insertRecinto.run(id, r.nombre, r.direccion, r.latitud, r.longitud);
    recintosInsertados.push({ ...r, id });
  }
  console.log(`  ✅ ${recintosInsertados.length} recintos insertados`);

  // ============================================================
  // ZONAS para cada recinto
  // ============================================================
  const tiposZona = ['patio', 'celda', 'acceso', 'enfermeria', 'taller', 'visita', 'administracion', 'perimetro'];
  const nombresZona = {
    'patio': 'Patio Principal',
    'celda': 'Módulo de Celdas',
    'acceso': 'Control de Acceso',
    'enfermeria': 'Enfermería',
    'taller': 'Taller',
    'visita': 'Sala de Visitas',
    'administracion': 'Administración',
    'perimetro': 'Perímetro Exterior'
  };

  const insertZona = db.prepare(`
    INSERT INTO zonas (id, recinto_id, nombre, tipo, latitud, longitud, radio)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let totalZonas = 0;
  for (const recinto of recintosInsertados) {
    // Crear 4-6 zonas por recinto
    const numZonas = 4 + Math.floor(Math.random() * 3);
    const zonasUsadas = new Set();
    
    for (let i = 0; i < numZonas; i++) {
      const tipo = tiposZona[Math.floor(Math.random() * tiposZona.length)];
      if (zonasUsadas.has(tipo)) continue;
      zonasUsadas.add(tipo);
      
      const zonaId = uuidv4();
      const offsetLat = (Math.random() - 0.5) * 0.002;
      const offsetLng = (Math.random() - 0.5) * 0.002;
      
      insertZona.run(
        zonaId,
        recinto.id,
        nombresZona[tipo] || tipo,
        tipo,
        recinto.latitud + offsetLat,
        recinto.longitud + offsetLng,
        10 + Math.floor(Math.random() * 20)
      );
      totalZonas++;
    }
  }
  console.log(`  ✅ ${totalZonas} zonas insertadas`);

  // ============================================================
  // GENDARMES para cada recinto
  // ============================================================
  const nombres = [
    'Carlos', 'María', 'José', 'Ana', 'Luis', 'Patricia', 'Jorge', 'Claudia',
    'Miguel', 'Rosa', 'Andrés', 'Sandra', 'Francisco', 'Mónica', 'Ricardo',
    'Verónica', 'Pablo', 'Carolina', 'Daniel', 'Marcela', 'Alejandro', 'Paula',
    'Manuel', 'Andrea', 'Felipe', 'Gabriela', 'Juan', 'Elena', 'Pedro', 'Valentina'
  ];
  const apellidos = [
    'González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva',
    'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández',
    'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela', 'Castillo', 'Ramírez',
    'Reyes', 'Gutiérrez', 'Castro', 'Vargas', 'Álvarez', 'Cruz', 'Sandoval', 'Peña'
  ];
  const cargos = ['Gendarme', 'Cabo', 'Sargento', 'Suboficial', 'Oficial', 'Teniente', 'Capitán', 'Mayor'];

  const insertGendarme = db.prepare(`
    INSERT INTO gendarmes (id, nombre, apellido, rut, cargo, recinto_id, telefono, activo,
      ultima_ubicacion_lat, ultima_ubicacion_lng, ultimo_heartbeat)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, datetime('now', ?))
  `);

  let totalGendarmes = 0;
  for (const recinto of recintosInsertados) {
    // 5-15 gendarmes por recinto según capacidad
    const numGendarmes = 5 + Math.floor(Math.random() * 11);
    
    for (let i = 0; i < numGendarmes; i++) {
      const gendarmeId = uuidv4();
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      const rut = `${Math.floor(Math.random() * 25000000 + 5000000)}-${Math.floor(Math.random() * 9) + 1}`;
      const cargo = cargos[Math.floor(Math.random() * cargos.length)];
      const telefono = `+569${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      
      // Ubicación inicial cerca del recinto
      const offsetLat = (Math.random() - 0.5) * 0.001;
      const offsetLng = (Math.random() - 0.5) * 0.001;
      
      // Heartbeat aleatorio (entre -5 min y ahora)
      const minutosAtras = Math.floor(Math.random() * 5);
      
      insertGendarme.run(
        gendarmeId, nombre, apellido, rut, cargo, recinto.id, telefono,
        recinto.latitud + offsetLat, recinto.longitud + offsetLng,
        `-${minutosAtras} minutes`
      );
      totalGendarmes++;
    }
  }
  console.log(`  ✅ ${totalGendarmes} gendarmes insertados`);

  // ============================================================
  // DRONES para recintos principales
  // ============================================================
  const modelosDron = ['DJI Mavic 3', 'DJI Phantom 4', 'Autel EVO II', 'Skydio 2+', 'Parrot Anafi'];
  const nombresDron = ['Centinela-1', 'Centinela-2', 'Vigía-1', 'Vigía-2', 'Águila-1', 'Halcón-1', 'Lince-1', 'Zorro-1'];

  const insertDron = db.prepare(`
    INSERT INTO drones (id, nombre, modelo, recinto_id, estado, bateria, altitud, velocidad,
      latitud, longitud, modo_vuelo, camara_activa, ultimo_heartbeat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let totalDrones = 0;
  // Solo recintos grandes tienen drones
  const recintosConDrones = recintosInsertados.filter((_, i) => 
    i % 3 === 0 || recintosInsertados[i].nombre.includes('Santiago') || 
    recintosInsertados[i].nombre.includes('Colina') || recintosInsertados[i].nombre.includes('Concepción')
  );

  for (const recinto of recintosConDrones) {
    const numDrones = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numDrones; i++) {
      const dronId = uuidv4();
      const nombre = nombresDron[Math.floor(Math.random() * nombresDron.length)] + '-' + recinto.nombre.split(' ').pop();
      const modelo = modelosDron[Math.floor(Math.random() * modelosDron.length)];
      const estados = ['en_base', 'en_base', 'en_base', 'en_vuelo', 'cargando'];
      const estado = estados[Math.floor(Math.random() * estados.length)];
      const bateria = estado === 'en_base' ? 80 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 40);
      const altitud = estado === 'en_vuelo' ? 20 + Math.floor(Math.random() * 40) : 0;
      const velocidad = estado === 'en_vuelo' ? 2 + Math.random() * 8 : 0;
      const offsetLat = (Math.random() - 0.5) * 0.003;
      const offsetLng = (Math.random() - 0.5) * 0.003;

      insertDron.run(
        dronId, nombre, modelo, recinto.id, estado, bateria, altitud, velocidad,
        recinto.latitud + offsetLat, recinto.longitud + offsetLng,
        estado === 'en_vuelo' ? 'patrulla' : 'manual',
        estado === 'en_vuelo' ? 1 : 0
      );
      totalDrones++;
    }
  }
  console.log(`  ✅ ${totalDrones} drones insertados`);

  // ============================================================
  // DISPOSITIVOS detectados (simulados)
  // ============================================================
  const fabricantes = ['Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Apple', 'LG', 'Honor', 'Realme'];
  const modelos = ['Galaxy A54', 'Redmi Note 12', 'Moto G84', 'P60 Pro', 'iPhone 14', 'K62', 'Honor 90', 'Realme 11'];

  const insertDispositivo = db.prepare(`
    INSERT INTO dispositivos_detectados (id, imei, mac_address, fabricante, modelo,
      tipo_dispositivo, senial_db, frecuencia_mhz, recinto_id, zona_id, latitud, longitud,
      es_autorizado, es_activo, primera_deteccion, ultima_deteccion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', ?), datetime('now'))
  `);

  let totalDispositivos = 0;
  for (const recinto of recintosInsertados) {
    // 2-8 dispositivos por recinto
    const numDispositivos = 2 + Math.floor(Math.random() * 7);
    const zonasRecinto = db.prepare('SELECT id, latitud, longitud FROM zonas WHERE recinto_id = ?').all(recinto.id);
    
    for (let i = 0; i < numDispositivos; i++) {
      const dispId = uuidv4();
      const imei = `${Math.floor(Math.random() * 100)}${Array(13).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`;
      const mac = Array(6).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
      const fabricante = fabricantes[Math.floor(Math.random() * fabricantes.length)];
      const modelo = modelos[Math.floor(Math.random() * modelos.length)];
      const senial = Math.floor(Math.random() * 40) - 90;
      const esAutorizado = Math.random() < 0.3 ? 1 : 0; // 30% autorizados
      const zona = zonasRecinto.length > 0 ? zonasRecinto[Math.floor(Math.random() * zonasRecinto.length)] : null;
      const minutosAtras = Math.floor(Math.random() * 60);

      insertDispositivo.run(
        dispId, imei, mac, fabricante, modelo, 'celular', senial,
        1800 + Math.floor(Math.random() * 600), recinto.id,
        zona ? zona.id : null,
        zona ? zona.latitud + (Math.random() - 0.5) * 0.0005 : recinto.latitud + (Math.random() - 0.5) * 0.001,
        zona ? zona.longitud + (Math.random() - 0.5) * 0.0005 : recinto.longitud + (Math.random() - 0.5) * 0.001,
        esAutorizado, `-${minutosAtras} minutes`
      );
      totalDispositivos++;
    }
  }
  console.log(`  ✅ ${totalDispositivos} dispositivos insertados`);

  // ============================================================
  // ALERTAS (algunas activas para demostración)
  // ============================================================
  const tiposAlerta = ['celular_no_autorizado', 'gendarme_inactivo', 'dron_bateria_baja', 'movimiento_sospechoso'];
  const severidades = ['critica', 'alta', 'media', 'baja'];
  const titulosAlerta = {
    'celular_no_autorizado': '📱 Celular no autorizado detectado',
    'gendarme_inactivo': '👮 Gendarme sin señal',
    'dron_bateria_baja': '🔋 Batería baja del dron',
    'movimiento_sospechoso': '👤 Movimiento sospechoso detectado'
  };

  const insertAlerta = db.prepare(`
    INSERT INTO alertas (id, recinto_id, tipo, severidad, titulo, descripcion,
      latitud, longitud, zona_id, dispositivo_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  let totalAlertas = 0;
  // Crear alertas en algunos recintos
  for (const recinto of recintosInsertados.slice(0, Math.floor(recintosInsertados.length * 0.4))) {
    const numAlertas = 1 + Math.floor(Math.random() * 3);
    const zonasRecinto = db.prepare('SELECT id, latitud, longitud FROM zonas WHERE recinto_id = ?').all(recinto.id);
    const dispositivosRecinto = db.prepare('SELECT id FROM dispositivos_detectados WHERE recinto_id = ? AND es_autorizado = 0').all(recinto.id);

    for (let i = 0; i < numAlertas; i++) {
      const alertaId = uuidv4();
      const tipo = tiposAlerta[Math.floor(Math.random() * tiposAlerta.length)];
      const severidad = severidades[Math.floor(Math.random() * severidades.length)];
      const zona = zonasRecinto.length > 0 ? zonasRecinto[Math.floor(Math.random() * zonasRecinto.length)] : null;
      const dispositivo = tipo === 'celular_no_autorizado' && dispositivosRecinto.length > 0
        ? dispositivosRecinto[Math.floor(Math.random() * dispositivosRecinto.length)]
        : null;
      const minutosAtras = Math.floor(Math.random() * 30);

      insertAlerta.run(
        alertaId, recinto.id, tipo, severidad,
        titulosAlerta[tipo] || 'Alerta de seguridad',
        `Alerta generada automáticamente en ${recinto.nombre}`,
        zona ? zona.latitud : recinto.latitud,
        zona ? zona.longitud : recinto.longitud,
        zona ? zona.id : null,
        dispositivo ? dispositivo.id : null,
        `-${minutosAtras} minutes`
      );
      totalAlertas++;
    }
  }
  console.log(`  ✅ ${totalAlertas} alertas insertadas`);

  console.log('✅ Base de datos sembrada completamente!');
  console.log(`   📊 Resumen:`);
  console.log(`   🏛️  ${recintosInsertados.length} recintos`);
  console.log(`   📍 ${totalZonas} zonas`);
  console.log(`   👮 ${totalGendarmes} gendarmes`);
  console.log(`   🚁 ${totalDrones} drones`);
  console.log(`   📱 ${totalDispositivos} dispositivos`);
  console.log(`   🔔 ${totalAlertas} alertas`);
}

// Ejecutar si se llama directamente
seedDatabase();

module.exports = { seedDatabase };
