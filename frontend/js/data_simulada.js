// ============================================
// SISGEN - Datos Simulados para GitHub Pages
// ============================================

const DATOS_SIMULADOS = {
  recintos: generarRecintos(),
  gendarmes: [],
  dispositivos: [],
  drones: [],
  alertas: []
};

// Generar 66 recintos de Chile
function generarRecintos() {
  const recintos = [
    { id: 1, nombre: "Complejo Penitenciario Santiago", region: "Región Metropolitana", latitud: -33.456, longitud: -70.648, tipo: "Complejo Penitenciario", capacidad: 5000, nivel_seguridad: "alta" },
    { id: 2, nombre: "CDP Santiago Sur", region: "Región Metropolitana", latitud: -33.512, longitud: -70.672, tipo: "Centro Detención Preventiva", capacidad: 2000, nivel_seguridad: "alta" },
    { id: 3, nombre: "Penal de Alta Seguridad", region: "Región Metropolitana", latitud: -33.478, longitud: -70.625, tipo: "Penal Alta Seguridad", capacidad: 1500, nivel_seguridad: "máxima" },
    { id: 4, nombre: "CCP Colina I", region: "Región Metropolitana", latitud: -33.202, longitud: -70.675, tipo: "Centro Cumplimiento Penitenciario", capacidad: 3000, nivel_seguridad: "alta" },
    { id: 5, nombre: "CCP Colina II", region: "Región Metropolitana", latitud: -33.195, longitud: -70.668, tipo: "Centro Cumplimiento Penitenciario", capacidad: 2500, nivel_seguridad: "media" },
    { id: 6, nombre: "CP Valparaíso", region: "Región de Valparaíso", latitud: -33.047, longitud: -71.621, tipo: "Complejo Penitenciario", capacidad: 2000, nivel_seguridad: "alta" },
    { id: 7, nombre: "CP Concepción", region: "Región del Biobío", latitud: -36.827, longitud: -73.050, tipo: "Complejo Penitenciario", capacidad: 2500, nivel_seguridad: "alta" },
    { id: 8, nombre: "CP Rancagua", region: "Región del Libertador B. O'Higgins", latitud: -34.171, longitud: -70.741, tipo: "Complejo Penitenciario", capacidad: 1500, nivel_seguridad: "media" },
    { id: 9, nombre: "CP Talca", region: "Región del Maule", latitud: -35.427, longitud: -71.655, tipo: "Complejo Penitenciario", capacidad: 1800, nivel_seguridad: "media" },
    { id: 10, nombre: "CP Temuco", region: "Región de La Araucanía", latitud: -38.735, longitud: -72.590, tipo: "Complejo Penitenciario", capacidad: 1600, nivel_seguridad: "alta" },
    { id: 11, nombre: "CP Antofagasta", region: "Región de Antofagasta", latitud: -23.651, longitud: -70.395, tipo: "Complejo Penitenciario", capacidad: 1200, nivel_seguridad: "alta" },
    { id: 12, nombre: "CP Iquique", region: "Región de Tarapacá", latitud: -20.214, longitud: -70.152, tipo: "Complejo Penitenciario", capacidad: 1000, nivel_seguridad: "media" },
    { id: 13, nombre: "CP La Serena", region: "Región de Coquimbo", latitud: -29.903, longitud: -71.249, tipo: "Complejo Penitenciario", capacidad: 1100, nivel_seguridad: "media" },
    { id: 14, nombre: "CP Puerto Montt", region: "Región de Los Lagos", latitud: -41.469, longitud: -72.942, tipo: "Complejo Penitenciario", capacidad: 900, nivel_seguridad: "media" },
    { id: 15, nombre: "CP Punta Arenas", region: "Región de Magallanes", latitud: -53.164, longitud: -70.917, tipo: "Complejo Penitenciario", capacidad: 600, nivel_seguridad: "media" },
    { id: 16, nombre: "CP Copiapó", region: "Región de Atacama", latitud: -27.366, longitud: -70.332, tipo: "Complejo Penitenciario", capacidad: 800, nivel_seguridad: "media" },
    { id: 17, nombre: "CP Los Ángeles", region: "Región del Biobío", latitud: -37.470, longitud: -72.352, tipo: "Centro Cumplimiento Penitenciario", capacidad: 700, nivel_seguridad: "media" },
    { id: 18, nombre: "CP Valdivia", region: "Región de Los Ríos", latitud: -39.814, longitud: -73.246, tipo: "Complejo Penitenciario", capacidad: 800, nivel_seguridad: "media" },
    { id: 19, nombre: "CP Coquimbo", region: "Región de Coquimbo", latitud: -29.953, longitud: -71.339, tipo: "Centro Cumplimiento Penitenciario", capacidad: 600, nivel_seguridad: "baja" },
    { id: 20, nombre: "CP Arica", region: "Región de Arica y Parinacota", latitud: -18.479, longitud: -70.307, tipo: "Complejo Penitenciario", capacidad: 700, nivel_seguridad: "media" },
    { id: 21, nombre: "CP Calama", region: "Región de Antofagasta", latitud: -22.462, longitud: -68.927, tipo: "Centro Cumplimiento Penitenciario", capacidad: 500, nivel_seguridad: "media" },
    { id: 22, nombre: "CP San Felipe", region: "Región de Valparaíso", latitud: -32.750, longitud: -70.726, tipo: "Centro Detención Preventiva", capacidad: 400, nivel_seguridad: "baja" },
    { id: 23, nombre: "CP Quillota", region: "Región de Valparaíso", latitud: -32.880, longitud: -71.248, tipo: "Centro Cumplimiento Penitenciario", capacidad: 500, nivel_seguridad: "media" },
    { id: 24, nombre: "CP San Antonio", region: "Región de Valparaíso", latitud: -33.593, longitud: -71.614, tipo: "Centro Detención Preventiva", capacidad: 350, nivel_seguridad: "baja" },
    { id: 25, nombre: "CP Melipilla", region: "Región Metropolitana", latitud: -33.685, longitud: -71.215, tipo: "Centro Cumplimiento Penitenciario", capacidad: 400, nivel_seguridad: "media" },
    { id: 26, nombre: "CP Talagante", region: "Región Metropolitana", latitud: -33.664, longitud: -70.931, tipo: "Centro Detención Preventiva", capacidad: 300, nivel_seguridad: "baja" },
    { id: 27, nombre: "CP Puente Alto", region: "Región Metropolitana", latitud: -33.613, longitud: -70.575, tipo: "Centro Cumplimiento Penitenciario", capacidad: 600, nivel_seguridad: "media" },
    { id: 28, nombre: "CP San Bernardo", region: "Región Metropolitana", latitud: -33.592, longitud: -70.700, tipo: "Centro Detención Preventiva", capacidad: 500, nivel_seguridad: "media" },
    { id: 29, nombre: "CP Curicó", region: "Región del Maule", latitud: -34.983, longitud: -71.239, tipo: "Centro Cumplimiento Penitenciario", capacidad: 500, nivel_seguridad: "media" },
    { id: 30, nombre: "CP Linares", region: "Región del Maule", latitud: -35.847, longitud: -71.593, tipo: "Centro Cumplimiento Penitenciario", capacidad: 400, nivel_seguridad: "baja" },
    { id: 31, nombre: "CP Chillán", region: "Región de Ñuble", latitud: -36.607, longitud: -72.103, tipo: "Complejo Penitenciario", capacidad: 800, nivel_seguridad: "media" },
    { id: 32, nombre: "CP Los Andes", region: "Región de Valparaíso", latitud: -32.834, longitud: -70.598, tipo: "Centro Detención Preventiva", capacidad: 300, nivel_seguridad: "baja" },
    { id: 33, nombre: "CP San Fernando", region: "Región del Libertador B. O'Higgins", latitud: -34.584, longitud: -70.988, tipo: "Centro Cumplimiento Penitenciario", capacidad: 400, nivel_seguridad: "media" },
    { id: 34, nombre: "CP Santa Cruz", region: "Región del Libertador B. O'Higgins", latitud: -34.638, longitud: -71.365, tipo: "Centro Detención Preventiva", capacidad: 250, nivel_seguridad: "baja" },
    { id: 35, nombre: "CP Angol", region: "Región de La Araucanía", latitud: -37.800, longitud: -72.710, tipo: "Centro Cumplimiento Penitenciario", capacidad: 350, nivel_seguridad: "media" },
    { id: 36, nombre: "CP Villarrica", region: "Región de La Araucanía", latitud: -39.280, longitud: -72.227, tipo: "Centro Detención Preventiva", capacidad: 200, nivel_seguridad: "baja" },
    { id: 37, nombre: "CP Osorno", region: "Región de Los Lagos", latitud: -40.574, longitud: -73.134, tipo: "Centro Cumplimiento Penitenciario", capacidad: 500, nivel_seguridad: "media" },
    { id: 38, nombre: "CP Castro", region: "Región de Los Lagos", latitud: -42.482, longitud: -73.764, tipo: "Centro Detención Preventiva", capacidad: 200, nivel_seguridad: "baja" },
    { id: 39, nombre: "CP Coyhaique", region: "Región de Aysén", latitud: -45.571, longitud: -72.068, tipo: "Centro Cumplimiento Penitenciario", capacidad: 200, nivel_seguridad: "baja" },
    { id: 40, nombre: "CP Puerto Aysén", region: "Región de Aysén", latitud: -45.403, longitud: -72.692, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 41, nombre: "CP Porvenir", region: "Región de Magallanes", latitud: -53.296, longitud: -70.366, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 42, nombre: "CP Puerto Natales", region: "Región de Magallanes", latitud: -51.726, longitud: -72.506, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 43, nombre: "CP Tocopilla", region: "Región de Antofagasta", latitud: -22.092, longitud: -70.198, tipo: "Centro Detención Preventiva", capacidad: 200, nivel_seguridad: "baja" },
    { id: 44, nombre: "CP Taltal", region: "Región de Antofagasta", latitud: -25.407, longitud: -70.485, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 45, nombre: "CP Chañaral", region: "Región de Atacama", latitud: -26.345, longitud: -70.622, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 46, nombre: "CP Vallenar", region: "Región de Atacama", latitud: -28.576, longitud: -70.759, tipo: "Centro Detención Preventiva", capacidad: 200, nivel_seguridad: "baja" },
    { id: 47, nombre: "CP Ovalle", region: "Región de Coquimbo", latitud: -30.601, longitud: -71.200, tipo: "Centro Detención Preventiva", capacidad: 250, nivel_seguridad: "baja" },
    { id: 48, nombre: "CP Illapel", region: "Región de Coquimbo", latitud: -31.633, longitud: -71.170, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 49, nombre: "CP La Ligua", region: "Región de Valparaíso", latitud: -32.452, longitud: -71.231, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 50, nombre: "CP Petorca", region: "Región de Valparaíso", latitud: -32.252, longitud: -70.931, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 51, nombre: "CP Rengo", region: "Región del Libertador B. O'Higgins", latitud: -34.410, longitud: -70.858, tipo: "Centro Detención Preventiva", capacidad: 200, nivel_seguridad: "baja" },
    { id: 52, nombre: "CP Pichilemu", region: "Región del Libertador B. O'Higgins", latitud: -34.387, longitud: -72.005, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 53, nombre: "CP Constitución", region: "Región del Maule", latitud: -35.333, longitud: -72.417, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 54, nombre: "CP Parral", region: "Región del Maule", latitud: -36.140, longitud: -71.826, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 55, nombre: "CP Cañete", region: "Región del Biobío", latitud: -37.801, longitud: -73.396, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 56, nombre: "CP Lebu", region: "Región del Biobío", latitud: -37.608, longitud: -73.654, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 57, nombre: "CP Arauco", region: "Región del Biobío", latitud: -37.246, longitud: -73.317, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 58, nombre: "CP Victoria", region: "Región de La Araucanía", latitud: -38.233, longitud: -72.333, tipo: "Centro Detención Preventiva", capacidad: 200, nivel_seguridad: "baja" },
    { id: 59, nombre: "CP Lautaro", region: "Región de La Araucanía", latitud: -38.531, longitud: -72.436, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 60, nombre: "CP Nueva Imperial", region: "Región de La Araucanía", latitud: -38.744, longitud: -72.950, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 61, nombre: "CP Pucón", region: "Región de La Araucanía", latitud: -39.282, longitud: -71.954, tipo: "Centro Detención Preventiva", capacidad: 80, nivel_seguridad: "baja" },
    { id: 62, nombre: "CP La Unión", region: "Región de Los Ríos", latitud: -40.293, longitud: -73.082, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 63, nombre: "CP Río Bueno", region: "Región de Los Ríos", latitud: -40.335, longitud: -72.956, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 64, nombre: "CP Ancud", region: "Región de Los Lagos", latitud: -41.869, longitud: -73.828, tipo: "Centro Detención Preventiva", capacidad: 150, nivel_seguridad: "baja" },
    { id: 65, nombre: "CP Quellón", region: "Región de Los Lagos", latitud: -43.118, longitud: -73.617, tipo: "Centro Detención Preventiva", capacidad: 100, nivel_seguridad: "baja" },
    { id: 66, nombre: "CP Chile Chico", region: "Región de Aysén", latitud: -46.541, longitud: -71.724, tipo: "Centro Detención Preventiva", capacidad: 50, nivel_seguridad: "baja" }
  ];
  return recintos.map(r => ({
    ...r,
    activo: true,
    poblacion_actual: Math.floor(r.capacidad * (0.7 + Math.random() * 0.3))
  }));
}

// Generar datos simulados completos
function generarDatosSimulados() {
  const gendarmes = [];
  const dispositivos = [];
  const drones = [];
  const alertas = [];
  let alertaId = 0;

  const nombresGendarmes = [
    "Carlos Muñoz", "María González", "José Rodríguez", "Ana Martínez", "Luis Pérez",
    "Patricia Soto", "Miguel Ángel Ruiz", "Claudia López", "Francisco Vargas", "Rosa Silva",
    "Andrés Torres", "Carolina Flores", "Pedro Sánchez", "Daniela Rojas", "Jorge Castro",
    "Valentina Morales", "Ricardo Ortiz", "Camila Herrera", "Fernando Díaz", "Gabriela Reyes",
    "Sebastián Peña", "Francisca Medina", "Pablo Guerrero", "Isabel Campos", "Diego Fuentes",
    "Javiera Vega", "Cristián Carrasco", "Constanza Pizarro", "Rodrigo Espinoza", "Antonia Navarro"
  ];

  const fabricantes = ['Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Apple', 'LG', 'Nokia', 'Sony'];
  const modelos = ['Galaxy A54', 'Redmi Note 12', 'Moto G84', 'P60 Pro', 'iPhone 14', 'K62', 'G22', 'Xperia 10'];

  // Generar gendarmes (3-5 por recinto)
  DATOS_SIMULADOS.recintos.forEach((recinto, ri) => {
    const numGendarmes = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numGendarmes; i++) {
      const idx = gendarmes.length % nombresGendarmes.length;
      const activo = Math.random() > 0.15;
      gendarmes.push({
        id: `gendarme_${ri}_${i}`,
        nombre: nombresGendarmes[idx],
        rut: `${Math.floor(10000000 + Math.random() * 20000000)}-${Math.floor(Math.random() * 9)}`,
        recinto_id: recinto.id,
        recinto_nombre: recinto.nombre,
        estado: activo ? 'activo' : 'inactivo',
        latitud: recinto.latitud + (Math.random() - 0.5) * 0.003,
        longitud: recinto.longitud + (Math.random() - 0.5) * 0.003,
        ultimo_heartbeat: new Date(Date.now() - Math.random() * 60000).toISOString(),
        bateria: Math.floor(30 + Math.random() * 70),
        activo: true
      });
    }

    // Generar dispositivos (1-3 por recinto)
    const numDispositivos = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numDispositivos; i++) {
      const autorizado = Math.random() > 0.3;
      dispositivos.push({
        id: `disp_${ri}_${i}`,
        imei: `${Math.random() > 0.5 ? '35' : '86'}${Array(13).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`,
        mac_address: Array(6).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':'),
        fabricante: fabricantes[Math.floor(Math.random() * fabricantes.length)],
        modelo: modelos[Math.floor(Math.random() * modelos.length)],
        intensidad_senal: Math.floor(20 + Math.random() * 80),
        recinto_id: recinto.id,
        recinto_nombre: recinto.nombre,
        latitud: recinto.latitud + (Math.random() - 0.5) * 0.002,
        longitud: recinto.longitud + (Math.random() - 0.5) * 0.002,
        autorizado,
        bateria: Math.floor(20 + Math.random() * 80),
        activo: true
      });

      // Generar alerta si no autorizado
      if (!autorizado) {
        alertaId++;
        alertas.push({
          id: alertaId,
          recinto_id: recinto.id,
          recinto_nombre: recinto.nombre,
          tipo: '📱 Celular no autorizado',
          nivel: Math.random() > 0.5 ? 'alta' : 'media',
          descripcion: `${dispositivos[dispositivos.length - 1].fabricante} ${dispositivos[dispositivos.length - 1].modelo} detectado en ${recinto.nombre}`,
          zona: `Zona ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
          latitud: recinto.latitud + (Math.random() - 0.5) * 0.002,
          longitud: recinto.longitud + (Math.random() - 0.5) * 0.002,
          fecha: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          resuelta: Math.random() > 0.6
        });
      }
    }

    // Generar drones (1-2 por recinto grande)
    if (ri < 20) {
      const numDrones = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numDrones; i++) {
        const estados = ['en_tierra', 'en_vuelo', 'patrullando'];
        const estado = estados[Math.floor(Math.random() * estados.length)];
        drones.push({
          id: `dron_${ri}_${i}`,
          nombre: `Dron ${recinto.nombre.split(' ').pop()}-${i + 1}`,
          recinto_id: recinto.id,
          recinto_nombre: recinto.nombre,
          estado,
          latitud: recinto.latitud + (Math.random() - 0.5) * 0.005,
          longitud: recinto.longitud + (Math.random() - 0.5) * 0.005,
          altitud: estado === 'en_tierra' ? 0 : 20 + Math.floor(Math.random() * 80),
          velocidad: estado === 'en_tierra' ? 0 : 5 + Math.floor(Math.random() * 15),
          bateria: Math.floor(30 + Math.random() * 70),
          modelo: 'DJI Matrice 30T',
          activo: true
        });
      }
    }
  });

  // Generar alertas adicionales
  const tiposAlerta = ['🔔 Intento de fuga', '⚠️ Movimiento sospechoso', '🔴 Pelea entre internos', '📱 Celular no autorizado', '🚁 Dron en zona restringida'];
  for (let i = 0; i < 15; i++) {
    alertaId++;
    const recinto = DATOS_SIMULADOS.recintos[Math.floor(Math.random() * DATOS_SIMULADOS.recintos.length)];
    const nivel = Math.random() > 0.6 ? 'alta' : Math.random() > 0.3 ? 'media' : 'baja';
    alertas.push({
      id: alertaId + 100,
      recinto_id: recinto.id,
      recinto_nombre: recinto.nombre,
      tipo: tiposAlerta[Math.floor(Math.random() * tiposAlerta.length)],
      nivel,
      descripcion: `Evento reportado en ${recinto.nombre}`,
      zona: `Zona ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
      latitud: recinto.latitud + (Math.random() - 0.5) * 0.002,
      longitud: recinto.longitud + (Math.random() - 0.5) * 0.002,
      fecha: new Date(Date.now() - Math.random() * 7200000).toISOString(),
      resuelta: Math.random() > 0.5
    });
  }

  // Ordenar alertas por fecha descendente
  alertas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  DATOS_SIMULADOS.gendarmes = gendarmes;
  DATOS_SIMULADOS.dispositivos = dispositivos;
  DATOS_SIMULADOS.drones = drones;
  DATOS_SIMULADOS.alertas = alertas;
}

// Generar datos al cargar
generarDatosSimulados();
console.log(`📦 Datos simulados generados: ${DATOS_SIMULADOS.recintos.length} recintos, ${DATOS_SIMULADOS.gendarmes.length} gendarmes, ${DATOS_SIMULADOS.dispositivos.length} dispositivos, ${DATOS_SIMULADOS.drones.length} drones, ${DATOS_SIMULADOS.alertas.length} alertas`);
