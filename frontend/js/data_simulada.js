// ============================================
// SISGEN - Simulación Completa de Seguridad Penitenciaria
// ============================================
// Simula en tiempo real:
// - Monitoreo de gendarmes con movimiento dentro de cada recinto
// - Detección de celulares activos con alertas de ubicación exacta
// - Drones con monitoreo activo y bajo demanda (lanzables)
// - Alertas con ubicación dentro del recinto y zona específica

const DATOS_SIMULADOS = {
  recintos: [],
  gendarmes: [],
  dispositivos: [],
  drones: [],
  alertas: [],
  zonas: []
};

// Zonas típicas de un recinto penitenciario
const ZONAS_RECINTOS = [
  { codigo: 'A', nombre: 'Módulo A - Alta Seguridad', riesgo: 'alto', offset_lat: 0.0012, offset_lng: 0.0012 },
  { codigo: 'B', nombre: 'Módulo B - Media Seguridad', riesgo: 'medio', offset_lat: -0.0012, offset_lng: 0.0012 },
  { codigo: 'C', nombre: 'Módulo C - Baja Seguridad', riesgo: 'bajo', offset_lat: 0.0012, offset_lng: -0.0012 },
  { codigo: 'D', nombre: 'Patio Central', riesgo: 'medio', offset_lat: -0.0012, offset_lng: -0.0012 },
  { codigo: 'E', nombre: 'Enfermería', riesgo: 'bajo', offset_lat: 0.0024, offset_lng: 0 },
  { codigo: 'F', nombre: 'Sala de Visitas', riesgo: 'bajo', offset_lat: -0.0024, offset_lng: 0 },
  { codigo: 'G', nombre: 'Talleres y Rehabilitación', riesgo: 'medio', offset_lat: 0, offset_lng: 0.0024 },
  { codigo: 'H', nombre: 'Acceso Principal y Control', riesgo: 'alto', offset_lat: 0, offset_lng: -0.0024 }
];

const NOMBRES_GENDARMES = [
  "Carlos Muñoz","María González","José Rodríguez","Ana Martínez","Luis Pérez",
  "Patricia Soto","Miguel Ruiz","Claudia López","Francisco Vargas","Rosa Silva",
  "Andrés Torres","Carolina Flores","Pedro Sánchez","Daniela Rojas","Jorge Castro",
  "Valentina Morales","Ricardo Ortiz","Camila Herrera","Fernando Díaz","Gabriela Reyes",
  "Sebastián Peña","Francisca Medina","Pablo Guerrero","Isabel Campos","Diego Fuentes",
  "Javiera Vega","Cristián Carrasco","Constanza Pizarro","Rodrigo Espinoza","Antonia Navarro",
  "Mauricio Soto","Katherine Rivas","Héctor Muñoz","Tamara Cárdenas","Óscar Sepúlveda",
  "Bárbara Contreras","Cristóbal Vargas","Macarena Castillo","Felipe Rojas","Daniela Muñoz"
];

const DISPOSITIVOS_CATALOGO = [
  { fabricante: 'Samsung', modelo: 'Galaxy A54', bandas: '4G/5G' },
  { fabricante: 'Samsung', modelo: 'Galaxy S23', bandas: '5G' },
  { fabricante: 'Xiaomi', modelo: 'Redmi Note 12', bandas: '4G/5G' },
  { fabricante: 'Xiaomi', modelo: 'Poco X5', bandas: '5G' },
  { fabricante: 'Motorola', modelo: 'Moto G84', bandas: '4G/5G' },
  { fabricante: 'Motorola', modelo: 'Edge 40', bandas: '5G' },
  { fabricante: 'Huawei', modelo: 'P60 Pro', bandas: '4G/5G' },
  { fabricante: 'Huawei', modelo: 'Nova 11', bandas: '4G' },
  { fabricante: 'Apple', modelo: 'iPhone 14', bandas: '5G' },
  { fabricante: 'Apple', modelo: 'iPhone 13', bandas: '5G' },
  { fabricante: 'LG', modelo: 'K62', bandas: '4G' },
  { fabricante: 'Nokia', modelo: 'G22', bandas: '4G' },
  { fabricante: 'Sony', modelo: 'Xperia 10 V', bandas: '5G' },
  { fabricante: 'OnePlus', modelo: 'Nord 3', bandas: '5G' },
  { fabricante: 'Google', modelo: 'Pixel 7', bandas: '5G' }
];

// ========== GENERAR RECINTOS ==========
function generarRecintos() {
  return [
    { id:1,nombre:"Complejo Penitenciario Santiago",region:"Región Metropolitana",latitud:-33.456,longitud:-70.648,tipo:"Complejo Penitenciario",capacidad:5000,nivel_seguridad:"alta" },
    { id:2,nombre:"CDP Santiago Sur",region:"Región Metropolitana",latitud:-33.512,longitud:-70.672,tipo:"Centro Detención Preventiva",capacidad:2000,nivel_seguridad:"alta" },
    { id:3,nombre:"Penal de Alta Seguridad",region:"Región Metropolitana",latitud:-33.478,longitud:-70.625,tipo:"Penal Alta Seguridad",capacidad:1500,nivel_seguridad:"máxima" },
    { id:4,nombre:"CCP Colina I",region:"Región Metropolitana",latitud:-33.202,longitud:-70.675,tipo:"Centro Cumplimiento Penitenciario",capacidad:3000,nivel_seguridad:"alta" },
    { id:5,nombre:"CCP Colina II",region:"Región Metropolitana",latitud:-33.195,longitud:-70.668,tipo:"Centro Cumplimiento Penitenciario",capacidad:2500,nivel_seguridad:"media" },
    { id:6,nombre:"CP Valparaíso",region:"Región de Valparaíso",latitud:-33.047,longitud:-71.621,tipo:"Complejo Penitenciario",capacidad:2000,nivel_seguridad:"alta" },
    { id:7,nombre:"CP Concepción",region:"Región del Biobío",latitud:-36.827,longitud:-73.050,tipo:"Complejo Penitenciario",capacidad:2500,nivel_seguridad:"alta" },
    { id:8,nombre:"CP Rancagua",region:"Región del Libertador B. O'Higgins",latitud:-34.171,longitud:-70.741,tipo:"Complejo Penitenciario",capacidad:1500,nivel_seguridad:"media" },
    { id:9,nombre:"CP Talca",region:"Región del Maule",latitud:-35.427,longitud:-71.655,tipo:"Complejo Penitenciario",capacidad:1800,nivel_seguridad:"media" },
    { id:10,nombre:"CP Temuco",region:"Región de La Araucanía",latitud:-38.735,longitud:-72.590,tipo:"Complejo Penitenciario",capacidad:1600,nivel_seguridad:"alta" },
    { id:11,nombre:"CP Antofagasta",region:"Región de Antofagasta",latitud:-23.651,longitud:-70.395,tipo:"Complejo Penitenciario",capacidad:1200,nivel_seguridad:"alta" },
    { id:12,nombre:"CP Iquique",region:"Región de Tarapacá",latitud:-20.214,longitud:-70.152,tipo:"Complejo Penitenciario",capacidad:1000,nivel_seguridad:"media" },
    { id:13,nombre:"CP La Serena",region:"Región de Coquimbo",latitud:-29.903,longitud:-71.249,tipo:"Complejo Penitenciario",capacidad:1100,nivel_seguridad:"media" },
    { id:14,nombre:"CP Puerto Montt",region:"Región de Los Lagos",latitud:-41.469,longitud:-72.942,tipo:"Complejo Penitenciario",capacidad:900,nivel_seguridad:"media" },
    { id:15,nombre:"CP Punta Arenas",region:"Región de Magallanes",latitud:-53.164,longitud:-70.917,tipo:"Complejo Penitenciario",capacidad:600,nivel_seguridad:"media" },
    { id:16,nombre:"CP Copiapó",region:"Región de Atacama",latitud:-27.366,longitud:-70.332,tipo:"Complejo Penitenciario",capacidad:800,nivel_seguridad:"media" },
    { id:17,nombre:"CP Los Ángeles",region:"Región del Biobío",latitud:-37.470,longitud:-72.352,tipo:"Centro Cumplimiento Penitenciario",capacidad:700,nivel_seguridad:"media" },
    { id:18,nombre:"CP Valdivia",region:"Región de Los Ríos",latitud:-39.814,longitud:-73.246,tipo:"Complejo Penitenciario",capacidad:800,nivel_seguridad:"media" },
    { id:19,nombre:"CP Coquimbo",region:"Región de Coquimbo",latitud:-29.953,longitud:-71.339,tipo:"Centro Cumplimiento Penitenciario",capacidad:600,nivel_seguridad:"baja" },
    { id:20,nombre:"CP Arica",region:"Región de Arica y Parinacota",latitud:-18.479,longitud:-70.307,tipo:"Complejo Penitenciario",capacidad:700,nivel_seguridad:"media" },
    { id:21,nombre:"CP Calama",region:"Región de Antofagasta",latitud:-22.462,longitud:-68.927,tipo:"Centro Cumplimiento Penitenciario",capacidad:500,nivel_seguridad:"media" },
    { id:22,nombre:"CP San Felipe",region:"Región de Valparaíso",latitud:-32.750,longitud:-70.726,tipo:"Centro Detención Preventiva",capacidad:400,nivel_seguridad:"baja" },
    { id:23,nombre:"CP Quillota",region:"Región de Valparaíso",latitud:-32.880,longitud:-71.248,tipo:"Centro Cumplimiento Penitenciario",capacidad:500,nivel_seguridad:"media" },
    { id:24,nombre:"CP San Antonio",region:"Región de Valparaíso",latitud:-33.593,longitud:-71.614,tipo:"Centro Detención Preventiva",capacidad:350,nivel_seguridad:"baja" },
    { id:25,nombre:"CP Melipilla",region:"Región Metropolitana",latitud:-33.685,longitud:-71.215,tipo:"Centro Cumplimiento Penitenciario",capacidad:400,nivel_seguridad:"media" },
    { id:26,nombre:"CP Talagante",region:"Región Metropolitana",latitud:-33.664,longitud:-70.931,tipo:"Centro Detención Preventiva",capacidad:300,nivel_seguridad:"baja" },
    { id:27,nombre:"CP Puente Alto",region:"Región Metropolitana",latitud:-33.613,longitud:-70.575,tipo:"Centro Cumplimiento Penitenciario",capacidad:600,nivel_seguridad:"media" },
    { id:28,nombre:"CP San Bernardo",region:"Región Metropolitana",latitud:-33.592,longitud:-70.700,tipo:"Centro Detención Preventiva",capacidad:500,nivel_seguridad:"media" },
    { id:29,nombre:"CP Curicó",region:"Región del Maule",latitud:-34.983,longitud:-71.239,tipo:"Centro Cumplimiento Penitenciario",capacidad:500,nivel_seguridad:"media" },
    { id:30,nombre:"CP Linares",region:"Región del Maule",latitud:-35.847,longitud:-71.593,tipo:"Centro Cumplimiento Penitenciario",capacidad:400,nivel_seguridad:"baja" },
    { id:31,nombre:"CP Chillán",region:"Región de Ñuble",latitud:-36.607,longitud:-72.103,tipo:"Complejo Penitenciario",capacidad:800,nivel_seguridad:"media" },
    { id:32,nombre:"CP Los Andes",region:"Región de Valparaíso",latitud:-32.834,longitud:-70.598,tipo:"Centro Detención Preventiva",capacidad:300,nivel_seguridad:"baja" },
    { id:33,nombre:"CP San Fernando",region:"Región del Libertador B. O'Higgins",latitud:-34.584,longitud:-70.988,tipo:"Centro Cumplimiento Penitenciario",capacidad:400,nivel_seguridad:"media" },
    { id:34,nombre:"CP Santa Cruz",region:"Región del Libertador B. O'Higgins",latitud:-34.638,longitud:-71.365,tipo:"Centro Detención Preventiva",capacidad:250,nivel_seguridad:"baja" },
    { id:35,nombre:"CP Angol",region:"Región de La Araucanía",latitud:-37.800,longitud:-72.710,tipo:"Centro Cumplimiento Penitenciario",capacidad:350,nivel_seguridad:"media" },
    { id:36,nombre:"CP Villarrica",region:"Región de La Araucanía",latitud:-39.280,longitud:-72.227,tipo:"Centro Detención Preventiva",capacidad:200,nivel_seguridad:"baja" },
    { id:37,nombre:"CP Osorno",region:"Región de Los Lagos",latitud:-40.574,longitud:-73.134,tipo:"Centro Cumplimiento Penitenciario",capacidad:500,nivel_seguridad:"media" },
    { id:38,nombre:"CP Castro",region:"Región de Los Lagos",latitud:-42.482,longitud:-73.764,tipo:"Centro Detención Preventiva",capacidad:200,nivel_seguridad:"baja" },
    { id:39,nombre:"CP Coyhaique",region:"Región de Aysén",latitud:-45.571,longitud:-72.068,tipo:"Centro Cumplimiento Penitenciario",capacidad:200,nivel_seguridad:"baja" },
    { id:40,nombre:"CP Puerto Aysén",region:"Región de Aysén",latitud:-45.403,longitud:-72.692,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:41,nombre:"CP Porvenir",region:"Región de Magallanes",latitud:-53.296,longitud:-70.366,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:42,nombre:"CP Puerto Natales",region:"Región de Magallanes",latitud:-51.726,longitud:-72.506,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:43,nombre:"CP Tocopilla",region:"Región de Antofagasta",latitud:-22.092,longitud:-70.198,tipo:"Centro Detención Preventiva",capacidad:200,nivel_seguridad:"baja" },
    { id:44,nombre:"CP Taltal",region:"Región de Antofagasta",latitud:-25.407,longitud:-70.485,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:45,nombre:"CP Chañaral",region:"Región de Atacama",latitud:-26.345,longitud:-70.622,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:46,nombre:"CP Vallenar",region:"Región de Atacama",latitud:-28.576,longitud:-70.759,tipo:"Centro Detención Preventiva",capacidad:200,nivel_seguridad:"baja" },
    { id:47,nombre:"CP Ovalle",region:"Región de Coquimbo",latitud:-30.601,longitud:-71.200,tipo:"Centro Detención Preventiva",capacidad:250,nivel_seguridad:"baja" },
    { id:48,nombre:"CP Illapel",region:"Región de Coquimbo",latitud:-31.633,longitud:-71.170,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:49,nombre:"CP La Ligua",region:"Región de Valparaíso",latitud:-32.452,longitud:-71.231,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:50,nombre:"CP Petorca",region:"Región de Valparaíso",latitud:-32.252,longitud:-70.931,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:51,nombre:"CP Rengo",region:"Región del Libertador B. O'Higgins",latitud:-34.410,longitud:-70.858,tipo:"Centro Detención Preventiva",capacidad:200,nivel_seguridad:"baja" },
    { id:52,nombre:"CP Pichilemu",region:"Región del Libertador B. O'Higgins",latitud:-34.387,longitud:-72.005,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:53,nombre:"CP Constitución",region:"Región del Maule",latitud:-35.333,longitud:-72.417,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:54,nombre:"CP Parral",region:"Región del Maule",latitud:-36.140,longitud:-71.826,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:55,nombre:"CP Cañete",region:"Región del Biobío",latitud:-37.801,longitud:-73.396,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:56,nombre:"CP Lebu",region:"Región del Biobío",latitud:-37.608,longitud:-73.654,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:57,nombre:"CP Arauco",region:"Región del Biobío",latitud:-37.246,longitud:-73.317,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:58,nombre:"CP Victoria",region:"Región de La Araucanía",latitud:-38.233,longitud:-72.333,tipo:"Centro Detención Preventiva",capacidad:200,nivel_seguridad:"baja" },
    { id:59,nombre:"CP Lautaro",region:"Región de La Araucanía",latitud:-38.531,longitud:-72.436,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:60,nombre:"CP Nueva Imperial",region:"Región de La Araucanía",latitud:-38.744,longitud:-72.950,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:61,nombre:"CP Pucón",region:"Región de La Araucanía",latitud:-39.282,longitud:-71.954,tipo:"Centro Detención Preventiva",capacidad:80,nivel_seguridad:"baja" },
    { id:62,nombre:"CP La Unión",region:"Región de Los Ríos",latitud:-40.293,longitud:-73.082,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:63,nombre:"CP Río Bueno",region:"Región de Los Ríos",latitud:-40.335,longitud:-72.956,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:64,nombre:"CP Ancud",region:"Región de Los Lagos",latitud:-41.869,longitud:-73.828,tipo:"Centro Detención Preventiva",capacidad:150,nivel_seguridad:"baja" },
    { id:65,nombre:"CP Quellón",region:"Región de Los Lagos",latitud:-43.118,longitud:-73.617,tipo:"Centro Detención Preventiva",capacidad:100,nivel_seguridad:"baja" },
    { id:66,nombre:"CP Chile Chico",region:"Región de Aysén",latitud:-46.541,longitud:-71.724,tipo:"Centro Detención Preventiva",capacidad:50,nivel_seguridad:"baja" }
  ].map(r => ({ ...r, activo: true, poblacion_actual: Math.floor(r.capacidad * (0.7 + Math.random() * 0.3)) }));
}

// ========== GENERAR ZONAS ==========
function generarZonas(recinto) {
  return ZONAS_RECINTOS.map(z => ({
    id: `${recinto.id}_${z.codigo}`,
    codigo: z.codigo,
    nombre: z.nombre,
    riesgo: z.riesgo,
    recinto_id: recinto.id,
    recinto_nombre: recinto.nombre,
    latitud: recinto.latitud + z.offset_lat,
    longitud: recinto.longitud + z.offset_lng
  }));
}

// ========== GENERAR DATOS COMPLETOS ==========
function generarDatosSimulados() {
  const gendarmes = [];
  const dispositivos = [];
  const drones = [];
  const alertas = [];
  const zonas = [];
  let alertaId = 0;

  DATOS_SIMULADOS.recintos = generarRecintos();

  // Generar zonas
  DATOS_SIMULADOS.recintos.forEach(r => zonas.push(...generarZonas(r)));

  // Generar gendarmes, dispositivos, drones por recinto
  DATOS_SIMULADOS.recintos.forEach((recinto, ri) => {
    const zRecinto = zonas.filter(z => z.recinto_id === recinto.id);

    // GENDARMES (4-8 por recinto)
    const numG = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numG; i++) {
      const idx = (ri * 3 + i) % NOMBRES_GENDARMES.length;
      const zona = zRecinto[i % zRecinto.length];
      gendarmes.push({
        id: `g_${ri}_${i}`,
        nombre: NOMBRES_GENDARMES[idx],
        rut: `${Math.floor(15000000 + Math.random() * 10000000)}-${Math.floor(Math.random() * 9)}`,
        recinto_id: recinto.id,
        recinto_nombre: recinto.nombre,
        estado: Math.random() > 0.1 ? 'activo' : 'inactivo',
        latitud: zona.latitud + (Math.random() - 0.5) * 0.0008,
        longitud: zona.longitud + (Math.random() - 0.5) * 0.0008,
        zona_id: zona.codigo,
        zona_nombre: zona.nombre,
        ultimo_heartbeat: new Date(Date.now() - Math.random() * 30000).toISOString(),
        bateria: Math.floor(40 + Math.random() * 60),
        activo: true
      });
    }

    // DISPOSITIVOS MÓVILES (2-5 por recinto)
    const numD = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numD; i++) {
      const zona = zRecinto[Math.floor(Math.random() * zRecinto.length)];
      const d = DISPOSITIVOS_CATALOGO[Math.floor(Math.random() * DISPOSITIVOS_CATALOGO.length)];
      const autorizado = Math.random() > 0.35;
      const senialDb = -90 + Math.floor(Math.random() * 40);
      dispositivos.push({
        id: `d_${ri}_${i}`,
        imei: `${Math.random() > 0.5 ? '35' : '86'}${Array(13).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`,
        mac_address: Array(6).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':'),
        fabricante: d.fabricante,
        modelo: d.modelo,
        bandas: d.bandas,
        intensidad_senal: Math.min(100, Math.max(10, (senialDb + 90) * 2.5)),
        senial_db: senialDb,
        frecuencia_mhz: d.bandas.includes('5G') ? 3500 : 1800,
        recinto_id: recinto.id,
        recinto_nombre: recinto.nombre,
        zona_id: zona.codigo,
        zona_nombre: zona.nombre,
        latitud: zona.latitud + (Math.random() - 0.5) * 0.0005,
        longitud: zona.longitud + (Math.random() - 0.5) * 0.0005,
        autorizado,
        bateria: Math.floor(15 + Math.random() * 85),
        activo: true,
        ultima_deteccion: new Date(Date.now() - Math.random() * 600000).toISOString()
      });

      // Alerta si NO autorizado
      if (!autorizado) {
        alertaId++;
        alertas.push({
          id: `al_${alertaId}`,
          recinto_id: recinto.id,
          recinto_nombre: recinto.nombre,
          tipo: '📱 Celular no autorizado',
          nivel: 'alta',
          severidad: 'critica',
          descripcion: `${d.fabricante} ${d.modelo} en ${zona.nombre} - Señal: ${senialDb}dB`,
          zona: zona.codigo,
          zona_nombre: zona.nombre,
          dispositivo_id: `d_${ri}_${i}`,
          latitud: zona.latitud + (Math.random() - 0.5) * 0.0005,
          longitud: zona.longitud + (Math.random() - 0.5) * 0.0005,
          fecha: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          resuelta: Math.random() > 0.7
        });
      }
    }

    // DRONES (1-2 en recintos grandes o alta seguridad)
    if (ri < 25 || recinto.nivel_seguridad === 'alta' || recinto.nivel_seguridad === 'máxima') {
      const numDr = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numDr; i++) {
        const estados = ['en_tierra', 'en_vuelo', 'patrullando'];
        const estado = estados[Math.floor(Math.random() * estados.length)];
        drones.push({
          id: `dr_${ri}_${i}`,
          nombre: `${recinto.nombre.split(' ').pop()}-DR${i + 1}`,
          recinto_id: recinto.id,
          recinto_nombre: recinto.nombre,
          estado,
          latitud: recinto.latitud + (Math.random() - 0.5) * 0.003,
          longitud: recinto.longitud + (Math.random() - 0.5) * 0.003,
          altitud: estado === 'en_tierra' ? 0 : 15 + Math.floor(Math.random() * 85),
          velocidad: estado === 'en_tierra' ? 0 : 3 + Math.floor(Math.random() * 12),
          bateria: Math.floor(40 + Math.random() * 60),
          modelo: 'DJI Matrice 30T',
          activo: true
        });
      }
    }
  });

  // ALERTAS ADICIONALES
  const tiposAlerta = [
    { tipo: '🔔 Intento de fuga', nivel: 'alta' },
    { tipo: '⚠️ Movimiento sospechoso', nivel: 'media' },
    { tipo: '🔴 Pelea entre internos', nivel: 'alta' },
    { tipo: '🚁 Dron en zona restringida', nivel: 'alta' },
    { tipo: '🔊 Ruido excesivo', nivel: 'baja' },
    { tipo: '🚪 Puerta de seguridad abierta', nivel: 'alta' },
    { tipo: '💡 Corte de energía', nivel: 'media' }
  ];

  for (let i = 0; i < 20; i++) {
    alertaId++;
    const recinto = DATOS_SIMULADOS.recintos[Math.floor(Math.random() * DATOS_SIMULADOS.recintos.length)];
    const zRecinto = zonas.filter(z => z.recinto_id === recinto.id);
    const zona = zRecinto[Math.floor(Math.random() * zRecinto.length)];
    const at = tiposAlerta[Math.floor(Math.random() * tiposAlerta.length)];
    alertas.push({
      id: `al_${alertaId + 100}`,
      recinto_id: recinto.id,
      recinto_nombre: recinto.nombre,
      tipo: at.tipo,
      nivel: at.nivel,
      severidad: at.nivel === 'alta' ? 'critica' : at.nivel,
      descripcion: `${at.tipo} en ${zona.nombre} - ${recinto.nombre}`,
      zona: zona.codigo,
      zona_nombre: zona.nombre,
      latitud: zona.latitud + (Math.random() - 0.5) * 0.0005,
      longitud: zona.longitud + (Math.random() - 0.5) * 0.0005,
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
  DATOS_SIMULADOS.zonas = zonas;

  console.log(`📦 Simulación generada:`);
  console.log(`   🏘️ ${DATOS_SIMULADOS.recintos.length} recintos`);
  console.log(`   👮 ${DATOS_SIMULADOS.gendarmes.length} gendarmes`);
  console.log(`   📱 ${DATOS_SIMULADOS.dispositivos.length} dispositivos (${DATOS_SIMULADOS.dispositivos.filter(d => !d.autorizado).length} no autorizados)`);
  console.log(`   🚁 ${DATOS_SIMULADOS.drones.length} drones`);
  console.log(`   🔔 ${DATOS_SIMULADOS.alertas.length} alertas`);
  console.log(`   🏘️ ${DATOS_SIMULADOS.zonas.length} zonas`);
}

// Generar datos al cargar
generarDatosSimulados();
