const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('./models/database');

// ============================================================
// GENERADOR DE DATOS COMPLETOS - TODAS LAS CÁRCELES DE CHILE
// Basado en los recintos penitenciarios de Gendarmería de Chile
// ============================================================

function generarPoligono(lat, lng, delta = 0.002) {
  return [[lat-delta, lng-delta], [lat-delta, lng+delta], [lat+delta, lng+delta], [lat+delta, lng-delta]];
}

function generarZonas(lat, lng, tipo, cantidad = 4) {
  const zonas = [
    {nombre:'Acceso Principal',tipo:'acceso',lat:lat+0.0005,lng:lng-0.0005,radio:12},
    {nombre:'Administración',tipo:'administracion',lat:lat-0.0002,lng:lng+0.001,radio:10}
  ];
  if (cantidad >= 3) {
    zonas.push({nombre:'Patio',tipo:'patio',lat:lat+0.0005,lng:lng+0.0005,radio:20});
  }
  if (cantidad >= 4) {
    zonas.push({nombre:'Pabellón',tipo:'celda',lat:lat-0.0005,lng:lng-0.0005,radio:15});
  }
  if (cantidad >= 5) {
    zonas.push({nombre:'Pabellón A',tipo:'celda',lat:lat-0.0008,lng:lng-0.0008,radio:18});
    zonas.push({nombre:'Pabellón B',tipo:'celda',lat:lat-0.0008,lng:lng+0.0008,radio:18});
  }
  return zonas;
}

// ============================================================
// DEFINICIÓN DE TODAS LAS CÁRCELES DE CHILE POR REGIÓN
// ============================================================

const REGIONES = [
  {
    nombre: 'Región de Arica y Parinacota',
    recintos: [
      {nombre:'CDP Arica',dir:'Av. Santa María 2345, Arica',lat:-18.478,lng:-70.321,cap:600,seg:'media',gen:3,zonas:5},
    ]
  },
  {
    nombre: 'Región de Tarapacá',
    recintos: [
      {nombre:'CDP Iquique',dir:'Av. Arturo Prat 1234, Iquique',lat:-20.214,lng:-70.152,cap:800,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Pozo Almonte',dir:'Av. Comercio 567, Pozo Almonte',lat:-20.256,lng:-69.786,cap:150,seg:'baja',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región de Antofagasta',
    recintos: [
      {nombre:'CDP Antofagasta',dir:'Av. Argentina 2345, Antofagasta',lat:-23.651,lng:-70.398,cap:900,seg:'media',gen:4,zonas:5},
      {nombre:'CDP Calama',dir:'Av. Granaderos 1234, Calama',lat:-22.462,lng:-68.928,cap:500,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Tocopilla',dir:'Av. 21 de Mayo 789, Tocopilla',lat:-22.092,lng:-70.198,cap:200,seg:'baja',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región de Atacama',
    recintos: [
      {nombre:'CDP Copiapó',dir:'Av. Juan Martínez 1234, Copiapó',lat:-27.367,lng:-70.332,cap:500,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Vallenar',dir:'Av. Ramírez 789, Vallenar',lat:-28.575,lng:-70.759,cap:250,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Chañaral',dir:'Av. Merino Jarpa 456, Chañaral',lat:-26.345,lng:-70.620,cap:120,seg:'baja',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región de Coquimbo',
    recintos: [
      {nombre:'CDP La Serena',dir:'Av. Francisco de Aguirre 2345, La Serena',lat:-29.903,lng:-71.250,cap:600,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Coquimbo',dir:'Av. Costanera 1234, Coquimbo',lat:-29.953,lng:-71.343,cap:400,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Ovalle',dir:'Av. Libertad 789, Ovalle',lat:-30.598,lng:-71.200,cap:300,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Illapel',dir:'Av. Constitución 456, Illapel',lat:-31.633,lng:-71.170,cap:150,seg:'baja',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región de Valparaíso',
    recintos: [
      {nombre:'CDP Valparaíso',dir:'Av. Argentina 975, Cerro Cordillera, Valparaíso',lat:-33.047,lng:-71.617,cap:800,seg:'media',gen:3,zonas:5},
      {nombre:'CDP San Antonio',dir:'Av. Barros Luco 2101, San Antonio',lat:-33.593,lng:-71.613,cap:400,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Viña del Mar',dir:'Av. Libertad 1234, Viña del Mar',lat:-33.025,lng:-71.552,cap:350,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Los Andes',dir:'Av. Argentina 456, Los Andes',lat:-32.834,lng:-70.598,cap:200,seg:'media',gen:2,zonas:4},
      {nombre:'CDP San Felipe',dir:'Av. Yungay 789, San Felipe',lat:-32.750,lng:-70.725,cap:180,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Quillota',dir:'Av. Condell 567, Quillota',lat:-32.880,lng:-71.248,cap:250,seg:'media',gen:2,zonas:5},
      {nombre:'CDP Quilpué',dir:'Av. Blanco Encalada 890, Quilpué',lat:-33.048,lng:-71.442,cap:200,seg:'media',gen:2,zonas:4},
      {nombre:'CDP La Ligua',dir:'Av. Prat 456, La Ligua',lat:-32.452,lng:-71.231,cap:120,seg:'baja',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región Metropolitana',
    recintos: [
      {nombre:'CDP Santiago Sur (Ex Penitenciaría de Santiago)',dir:'Av. Pedro Montt 1600, Santiago Centro',lat:-33.456,lng:-70.648,cap:5000,seg:'alta',gen:8,zonas:14},
      {nombre:'CCP Colina I',dir:'Ruta 5 Norte, Km 25, Colina',lat:-33.202,lng:-70.675,cap:1500,seg:'alta',gen:4,zonas:7},
      {nombre:'CCP Colina II',dir:'Ruta 5 Norte, Km 28, Colina',lat:-33.185,lng:-70.680,cap:1200,seg:'alta',gen:4,zonas:6},
      {nombre:'CDP San Bernardo',dir:'Av. Colón 1234, San Bernardo',lat:-33.592,lng:-70.700,cap:600,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Puente Alto',dir:'Av. Concha y Toro 2345, Puente Alto',lat:-33.613,lng:-70.575,cap:500,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Talagante',dir:'Av. Balmaceda 890, Talagante',lat:-33.664,lng:-70.930,cap:300,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Melipilla',dir:'Av. Vicuña Mackenna 567, Melipilla',lat:-33.686,lng:-71.215,cap:250,seg:'media',gen:2,zonas:4},
    ]
  },
  {
    nombre: "Región del Libertador General Bernardo O'Higgins",
    recintos: [
      {nombre:'CDP Rancagua',dir:'Av. Libertador O\'Higgins 1234, Rancagua',lat:-34.170,lng:-70.745,cap:700,seg:'media',gen:3,zonas:5},
      {nombre:'CDP San Fernando',dir:'Av. Manuel Rodríguez 789, San Fernando',lat:-34.585,lng:-70.988,cap:350,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Santa Cruz',dir:'Av. Errázuriz 456, Santa Cruz',lat:-34.638,lng:-71.365,cap:200,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Rengo',dir:'Av. Caupolicán 567, Rengo',lat:-34.410,lng:-70.860,cap:180,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Pichilemu',dir:'Av. Agustín Urrutia 234, Pichilemu',lat:-34.387,lng:-72.005,cap:100,seg:'baja',gen:2,zonas:3},
    ]
  },
  {
    nombre: 'Región del Maule',
    recintos: [
      {nombre:'CDP Talca',dir:'Av. 2 Sur 1234, Talca',lat:-35.427,lng:-71.655,cap:800,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Curicó',dir:'Av. Alessandri 789, Curicó',lat:-34.983,lng:-71.239,cap:500,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Linares',dir:'Av. Independencia 567, Linares',lat:-35.847,lng:-71.593,cap:400,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Constitución',dir:'Av. Costanera 345, Constitución',lat:-35.333,lng:-72.417,cap:150,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Cauquenes',dir:'Av. San Martín 456, Cauquenes',lat:-35.967,lng:-72.317,cap:200,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Parral',dir:'Av. Ignacio Carrera Pinto 234, Parral',lat:-36.140,lng:-71.830,cap:150,seg:'baja',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región de Ñuble',
    recintos: [
      {nombre:'CDP Chillán',dir:'Av. O\'Higgins 1234, Chillán',lat:-36.607,lng:-72.103,cap:600,seg:'media',gen:3,zonas:5},
      {nombre:'CDP San Carlos',dir:'Av. Libertad 567, San Carlos',lat:-36.425,lng:-71.958,cap:200,seg:'media',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región del Biobío',
    recintos: [
      {nombre:'CDP Concepción (El Manzano)',dir:'Camino a Penco s/n, Concepción',lat:-36.827,lng:-73.050,cap:1200,seg:'alta',gen:3,zonas:5},
      {nombre:'CCP Biobío',dir:'Ruta 160, Km 12, San Pedro de la Paz',lat:-36.840,lng:-73.100,cap:800,seg:'alta',gen:3,zonas:5},
      {nombre:'CDP Talcahuano',dir:'Av. Colón 1234, Talcahuano',lat:-36.724,lng:-73.117,cap:400,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Los Ángeles',dir:'Av. Alemania 789, Los Ángeles',lat:-37.470,lng:-72.350,cap:500,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Lebu',dir:'Av. Matta 456, Lebu',lat:-37.608,lng:-73.653,cap:120,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Arauco',dir:'Av. Caupolicán 234, Arauco',lat:-37.246,lng:-73.317,cap:150,seg:'baja',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región de La Araucanía',
    recintos: [
      {nombre:'CDP Temuco',dir:'Av. Alemania 567, Temuco',lat:-38.735,lng:-72.590,cap:700,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Angol',dir:'Av. O\'Higgins 890, Angol',lat:-37.800,lng:-72.710,cap:300,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Villarrica',dir:'Av. Pedro de Valdivia 456, Villarrica',lat:-39.280,lng:-72.227,cap:150,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Lautaro',dir:'Av. Manuel Rodríguez 234, Lautaro',lat:-38.530,lng:-72.435,cap:120,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Nueva Imperial',dir:'Av. Prat 345, Nueva Imperial',lat:-38.745,lng:-72.950,cap:100,seg:'baja',gen:2,zonas:3},
    ]
  },
  {
    nombre: 'Región de Los Ríos',
    recintos: [
      {nombre:'CDP Valdivia',dir:'Av. España 1234, Valdivia',lat:-39.814,lng:-73.246,cap:500,seg:'media',gen:3,zonas:5},
      {nombre:'CDP La Unión',dir:'Av. Ramírez 789, La Unión',lat:-40.293,lng:-73.082,cap:120,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Río Bueno',dir:'Av. Balmaceda 234, Río Bueno',lat:-40.335,lng:-72.955,cap:100,seg:'baja',gen:2,zonas:3},
    ]
  },
  {
    nombre: 'Región de Los Lagos',
    recintos: [
      {nombre:'CDP Puerto Montt',dir:'Av. Diego Portales 1234, Puerto Montt',lat:-41.472,lng:-72.939,cap:600,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Osorno',dir:'Av. Mackenna 789, Osorno',lat:-40.573,lng:-73.133,cap:500,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Castro',dir:'Av. Pedro Montt 456, Castro',lat:-42.482,lng:-73.764,cap:250,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Ancud',dir:'Av. Libertad 345, Ancud',lat:-41.869,lng:-73.820,cap:150,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Puerto Varas',dir:'Av. Gramado 234, Puerto Varas',lat:-41.318,lng:-72.985,cap:120,seg:'baja',gen:2,zonas:4},
    ]
  },
  {
    nombre: 'Región de Aysén del General Carlos Ibáñez del Campo',
    recintos: [
      {nombre:'CDP Coyhaique',dir:'Av. Ogana 1234, Coyhaique',lat:-45.571,lng:-72.068,cap:300,seg:'media',gen:2,zonas:4},
      {nombre:'CDP Puerto Aysén',dir:'Av. Eusebio Lillo 456, Puerto Aysén',lat:-45.403,lng:-72.692,cap:120,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Chile Chico',dir:'Av. Bernardo O\'Higgins 234, Chile Chico',lat:-46.541,lng:-71.724,cap:80,seg:'baja',gen:1,zonas:3},
    ]
  },
  {
    nombre: 'Región de Magallanes y de la Antártica Chilena',
    recintos: [
      {nombre:'CDP Punta Arenas',dir:'Av. Colón 1234, Punta Arenas',lat:-53.163,lng:-70.911,cap:400,seg:'media',gen:3,zonas:5},
      {nombre:'CDP Puerto Natales',dir:'Av. Pedro Montt 456, Puerto Natales',lat:-51.726,lng:-72.506,cap:120,seg:'baja',gen:2,zonas:4},
      {nombre:'CDP Porvenir',dir:'Av. Croacia 234, Porvenir',lat:-53.296,lng:-70.366,cap:80,seg:'baja',gen:1,zonas:3},
    ]
  }
];

// ============================================================
// NOMBRES Y APELLIDOS DE GENDARMES PARA GENERACIÓN
// ============================================================
const NOMBRES = ['Carlos','María','Pedro','Ana','José','Laura','Diego','Valentina','Felipe','Camila',
  'Roberto','Daniela','Pablo','Carolina','Matías','Francisca','Cristián','Javiera','Andrés','Paula',
  'Claudio','Marcela','Héctor','Rosa','Luis','Teresa','Jorge','Mónica','Ricardo','Patricia',
  'Miguel','Alejandra','Álvaro','Verónica','César','Gabriela','Francisco','Soledad','Manuel','Carmen'];

const APELLIDOS = ['Muñoz','González','Ramírez','López','Martínez','Torres','Flores','Rojas','Castro',
  'Vargas','Soto','Pérez','Morales','Díaz','Contreras','Sepúlveda','Herrera','Medina','Fuentes','García',
  'Rodríguez','Álvarez','Araya','Cortés','Espinoza','Fernández','Gutiérrez','Jara','Maldonado','Navarro',
  'Olivares','Pizarro','Quintana','Reyes','Sandoval','Tapia','Ulloa','Valenzuela','Zúñiga','Aguilera'];

const CARGOS = ['Gendarme','Cabo 2°','Cabo 1°','Sargento 2°','Sargento 1°','Suboficial','Suboficial Mayor'];

function generarRut() {
  const num = Math.floor(Math.random() * 25000000) + 5000000;
  const dv = Math.floor(Math.random() * 10);
  return `${Math.floor(num/1000).toLocaleString('es-CL')}.${String(num%1000).padStart(3,'0')}-${dv}`;
}

function generarGendarmes(cantidad, recintoId, zonas, zonasIds) {
  const gendarmes = [];
  const nombresUsados = new Set();
  
  for (let i = 0; i < cantidad; i++) {
    let nombre, apellido, key;
    do {
      nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
      apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
      key = `${nombre}_${apellido}`;
    } while (nombresUsados.has(key));
    nombresUsados.add(key);
    
    const zona = zonas[i % zonas.length];
    gendarmes.push({
      nombre, apellido,
      rut: generarRut(),
      cargo: CARGOS[Math.floor(Math.random() * CARGOS.length)],
      recinto: recintoId,
      zona: zona.nombre,
      zonaLat: zona.lat,
      zonaLng: zona.lng,
      zonaId: zonasIds[zona.nombre]
    });
  }
  return gendarmes;
}

// ============================================================
// FUNCIÓN PRINCIPAL DE SEED
// ============================================================
function seed() {
  console.log('🌱 Sembrando datos completos de todas las cárceles de Chile...');
  const db = getDatabase();

  // Limpiar datos existentes
  db.exec(`
    DELETE FROM logs_eventos;
    DELETE FROM rutas_dron;
    DELETE FROM alertas;
    DELETE FROM dispositivos_detectados;
    DELETE FROM drones;
    DELETE FROM gendarmes;
    DELETE FROM zonas;
    DELETE FROM recintos;
  `);

  let totalRecintos = 0;
  let totalZonas = 0;
  let totalGendarmes = 0;
  let totalDrones = 0;
  let totalDispositivos = 0;
  let totalAlertas = 0;

  const insertRecinto = db.prepare(`
    INSERT INTO recintos (id, nombre, direccion, latitud, longitud, poligono)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertZona = db.prepare(`
    INSERT INTO zonas (id, recinto_id, nombre, tipo, latitud, longitud, radio)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertGendarme = db.prepare(`
    INSERT INTO gendarmes (id, nombre, apellido, rut, cargo, recinto_id, 
      ultima_ubicacion_lat, ultima_ubicacion_lng, ultima_zona_id, ultimo_heartbeat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 minutes'))
  `);
  const insertDron = db.prepare(`
    INSERT INTO drones (id, nombre, modelo, recinto_id, estado, bateria, altitud, 
      latitud, longitud, modo_vuelo, camara_activa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRuta = db.prepare(`
    INSERT INTO rutas_dron (id, dron_id, nombre, puntos)
    VALUES (?, ?, ?, ?)
  `);
  const insertDispositivo = db.prepare(`
    INSERT INTO dispositivos_detectados (id, imei, mac_address, fabricante, modelo,
      tipo_dispositivo, senial_db, frecuencia_mhz, recinto_id, zona_id, latitud, longitud,
      es_autorizado, es_activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAlerta = db.prepare(`
    INSERT INTO alertas (id, recinto_id, tipo, severidad, titulo, descripcion,
      dispositivo_id, zona_id, latitud, longitud, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-5 minutes'))
  `);

  // Procesar cada región y sus recintos
  REGIONES.forEach(region => {
    region.recintos.forEach(r => {
      const recintoId = uuidv4();
      const poligono = generarPoligono(r.lat, r.lng);
      
      insertRecinto.run(recintoId, r.nombre, r.dir, r.lat, r.lng, JSON.stringify(poligono));
      totalRecintos++;

      // Generar zonas
      const zonas = generarZonas(r.lat, r.lng, r.tipo, r.zonas);
      const zonasIds = {};
      
      zonas.forEach(z => {
        const id = uuidv4();
        zonasIds[z.nombre] = id;
        insertZona.run(id, recintoId, z.nombre, z.tipo, z.lat, z.lng, z.radio);
        totalZonas++;
      });

      // Generar gendarmes
      const gendarmes = generarGendarmes(r.gen, recintoId, zonas, zonasIds);
      gendarmes.forEach(g => {
        const id = uuidv4();
        insertGendarme.run(id, g.nombre, g.apellido, g.rut, g.cargo, g.recinto,
          g.zonaLat + (Math.random() - 0.5) * 0.0005,
          g.zonaLng + (Math.random() - 0.5) * 0.0005,
          g.zonaId);
        totalGendarmes++;
      });

      // Generar drones (solo para recintos grandes)
      const tieneDron = r.cap >= 500 || r.seg === 'alta';
      if (tieneDron) {
        const dronId = uuidv4();
        const modelos = ['DJI Matrice 30T', 'DJI Mavic 3E', 'Autel EVO II'];
        const modelo = modelos[Math.floor(Math.random() * modelos.length)];
        
        insertDron.run(dronId, `Cóndor-${totalDrones + 1}`, modelo, recintoId,
          Math.random() > 0.5 ? 'en_vuelo' : 'en_base',
          Math.floor(Math.random() * 40) + 60,
          Math.floor(Math.random() * 30) + 30,
          r.lat + (Math.random() - 0.5) * 0.003,
          r.lng + (Math.random() - 0.5) * 0.003,
          Math.random() > 0.5 ? 'patrulla' : 'manual',
          Math.random() > 0.5 ? 1 : 0);
        totalDrones++;

        // Ruta de patrullaje
        if (Math.random() > 0.5) {
          const rutaId = uuidv4();
          const delta = 0.002;
          insertRuta.run(rutaId, dronId, `Patrulla Perimetral ${r.nombre}`,
            JSON.stringify([
              {lat: r.lat-delta, lng: r.lng-delta, alt: 45},
              {lat: r.lat-delta, lng: r.lng+delta, alt: 45},
              {lat: r.lat+delta, lng: r.lng+delta, alt: 45},
              {lat: r.lat+delta, lng: r.lng-delta, alt: 45},
              {lat: r.lat-delta, lng: r.lng-delta, alt: 45}
            ]));
        }
      }

      // Generar algunos dispositivos detectados (30% de probabilidad)
      if (Math.random() < 0.3) {
        const fabricantes = ['Samsung','Xiaomi','Motorola','Huawei','Apple','LG'];
        const modelos = ['Galaxy A54','Redmi Note 12','Moto G84','P60 Pro','iPhone 14','K62'];
        const zona = zonas[Math.floor(Math.random() * zonas.length)];
        
        const dispId = uuidv4();
        const imei = '35' + Array(13).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
        const mac = Array(6).fill(0).map(() => 
          Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
        
        insertDispositivo.run(dispId, imei, mac,
          fabricantes[Math.floor(Math.random() * fabricantes.length)],
          modelos[Math.floor(Math.random() * modelos.length)],
          'celular',
          Math.floor(Math.random() * 40) - 90,
          1800 + Math.floor(Math.random() * 600),
          recintoId, zonasIds[zona.nombre],
          zona.lat + (Math.random() - 0.5) * 0.0005,
          zona.lng + (Math.random() - 0.5) * 0.0005,
          0, 1);
        totalDispositivos++;

        // Alerta para el dispositivo
        if (Math.random() < 0.5) {
          insertAlerta.run(uuidv4(), recintoId, 'celular_no_autorizado', 'critica',
            `📱 Celular no autorizado en ${zona.nombre}`,
            `${fabricantes[Math.floor(Math.random() * fabricantes.length)]} detectado en zona de internos`,
            dispId, zonasIds[zona.nombre],
            zona.lat, zona.lng);
          totalAlertas++;
        }
      }
    });
  });

  console.log('✅ Datos completos de todas las cárceles de Chile insertados correctamente');
  console.log(`   📍 ${totalRecintos} recintos penitenciarios`);
  console.log(`   🏘️ ${totalZonas} zonas`);
  console.log(`   👮 ${totalGendarmes} gendarmes de Chile`);
  console.log(`   🚁 ${totalDrones} drones de vigilancia`);
  console.log(`   📱 ${totalDispositivos} dispositivos detectados`);
  console.log(`   🔔 ${totalAlertas} alertas activas`);
  console.log(`   📋 ${REGIONES.length} regiones de Chile cubiertas`);
}

seed();
