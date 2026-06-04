// ============================================
// SISGEN - Mapa (Leaflet)
// ============================================

let map, markerCluster;
const layers = {
  gendarmes: L.layerGroup(),
  dispositivos: L.layerGroup(),
  drones: L.layerGroup(),
  alertas: L.layerGroup(),
  zonas: L.layerGroup(),
  heatmap: L.layerGroup()
};

// ========== INICIALIZAR MAPA ==========
function initMap() {
  console.log('🗺️ Inicializando mapa...');
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('❌ Contenedor #map no encontrado');
    return;
  }
  
  map = L.map('map', {
    center: CONFIG.CENTRO_CHILE,
    zoom: CONFIG.ZOOM_NACIONAL,
    zoomControl: true,
    attributionControl: false
  });

  // Capa base oscura
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  // Agregar capas
  Object.values(layers).forEach(l => l.addTo(map));

  // Marker cluster
  markerCluster = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      let color = '#3b82f6';
      if (count > 10) color = '#eab308';
      if (count > 25) color = '#ef4444';
      return L.divIcon({
        html: `<div style="background:${color};color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(0,0,0,0.3)">${count}</div>`,
        className: '',
        iconSize: [36, 36]
      });
    }
  });
  map.addLayer(markerCluster);

  // Evento de zoom
  map.on('zoomend', () => {
    if (map.getZoom() >= 14 && STATE.recintoActual) {
      mostrarZonasRecinto(STATE.recintoActual);
    }
  });

  // Forzar resize
  setTimeout(() => map.invalidateSize(), 500);
  console.log('🗺️ Mapa inicializado correctamente');
}

// Inicializar el mapa - se llama explícitamente desde app.js
function inicializarMapa() {
  return new Promise((resolve) => {
    if (map) {
      resolve(map);
      return;
    }
    const checkExist = setInterval(() => {
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        clearInterval(checkExist);
        initMap();
        // Esperar a que el mapa termine de inicializarse
        setTimeout(() => resolve(map), 300);
      }
    }, 50);
    // Timeout de seguridad
    setTimeout(() => {
      clearInterval(checkExist);
      if (!map) initMap();
      resolve(map);
    }, 3000);
  });
}

// ========== ACTUALIZAR MAPA ==========
function actualizarMapa() {
  // Inicializar el mapa si no existe
  if (!map) {
    initMap();
    // Si después de initMap sigue sin existir, hay un error grave
    if (!map) {
      console.error('❌ El mapa no se pudo inicializar');
      return;
    }
  }
  
  limpiarCapas();
  
  // Leer estado de toggles (por defecto true si no existen)
  const mostrarGendarmes = document.getElementById('toggle-gendarmes')?.checked ?? true;
  const mostrarDispositivos = document.getElementById('toggle-dispositivos')?.checked ?? true;
  const mostrarDrones = document.getElementById('toggle-drones')?.checked ?? true;
  const mostrarAlertas = document.getElementById('toggle-alertas')?.checked ?? true;
  const mostrarZonas = document.getElementById('toggle-zonas')?.checked ?? true;

  if (STATE.recintoActual) {
    const r = STATE.recintoActual;
    
    // Verificar que el recinto tenga coordenadas válidas
    if (!r.latitud || !r.longitud) {
      console.error('❌ Recinto sin coordenadas:', r);
      return;
    }
    
    // Mostrar marcadores del recinto PRIMERO
    if (mostrarZonas) mostrarZonasRecinto(r);
    if (mostrarGendarmes) mostrarGendarmesRecinto(r);
    if (mostrarDispositivos) mostrarDispositivosRecinto(r);
    if (mostrarDrones) mostrarDronesRecinto(r);
    if (mostrarAlertas) mostrarAlertasRecinto(r);
    
    // Navegar al recinto con animación suave (flyTo en vez de setView)
    map.flyTo([r.latitud, r.longitud], CONFIG.ZOOM_RECINTO, {
      duration: 1.5,
      easeLinearity: 0.25
    });
    
  } else {
    // Vista nacional - mostrar todo primero
    if (mostrarGendarmes) mostrarGendarmesNacional();
    if (mostrarDispositivos) mostrarDispositivosNacional();
    if (mostrarDrones) mostrarDronesNacional();
    if (mostrarAlertas) mostrarAlertasNacional();
    if (mostrarZonas) mostrarRecintosNacional();
    
    // Zoom out con animación suave
    map.flyTo(CONFIG.CENTRO_CHILE, CONFIG.ZOOM_NACIONAL, {
      duration: 1.0,
      easeLinearity: 0.25
    });
  }
}

function limpiarCapas() {
  Object.values(layers).forEach(l => l.clearLayers());
  markerCluster.clearLayers();
}

// ========== GENDARMES ==========
function mostrarGendarmesRecinto(recinto) {
  const gendarmes = STATE.gendarmes.filter(g => g.recinto_id == recinto.id);
  gendarmes.forEach(g => {
    const icon = crearIconoGendarme(g);
    const marker = L.marker([g.latitud, g.longitud], { icon });
    marker.bindPopup(crearPopupGendarme(g));
    marker.on('click', () => map.setView([g.latitud, g.longitud], 18));
    layers.gendarmes.addLayer(marker);
  });
}

function mostrarGendarmesNacional() {
  STATE.gendarmes.forEach(g => {
    const icon = crearIconoGendarme(g);
    const marker = L.marker([g.latitud, g.longitud], { icon });
    marker.bindPopup(crearPopupGendarme(g));
    markerCluster.addLayer(marker);
  });
}

function crearIconoGendarme(g) {
  const color = g.estado === 'activo' ? CONFIG.COLORS.GENDARME_ACTIVO : CONFIG.COLORS.GENDARME_INACTIVO;
  const size = STATE.recintoActual ? 28 : 22;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.5}px;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      ${g.estado === 'activo' ? 'animation:pulse 2s infinite;' : 'opacity:0.6;'}
    ">👮</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
}

function crearPopupGendarme(g) {
  const recinto = STATE.recintos.find(r => r.id == g.recinto_id);
  return `<div class="popup-content">
    <h4>👮 ${g.nombre}</h4>
    <p>📋 ID: ${g.rut || g.id}</p>
    <p>📍 ${recinto ? recinto.nombre : 'Desconocido'}</p>
    <p>📡 Última señal: ${g.ultimo_heartbeat ? new Date(g.ultimo_heartbeat).toLocaleTimeString() : 'N/A'}</p>
    <p>🔋 Batería: ${g.bateria || 0}%</p>
    <span class="popup-status ${g.estado === 'activo' ? 'status-activo' : 'status-inactivo'}">${g.estado === 'activo' ? '🟢 Activo' : '🔴 Inactivo'}</span>
  </div>`;
}

// ========== DISPOSITIVOS (CELULARES) ==========
function mostrarDispositivosRecinto(recinto) {
  const dispositivos = STATE.dispositivos.filter(d => d.recinto_id == recinto.id);
  dispositivos.forEach(d => {
    const icon = crearIconoDispositivo(d);
    const marker = L.marker([d.latitud, d.longitud], { icon });
    marker.bindPopup(crearPopupDispositivo(d));
    layers.dispositivos.addLayer(marker);
  });
}

function mostrarDispositivosNacional() {
  STATE.dispositivos.forEach(d => {
    const icon = crearIconoDispositivo(d);
    const marker = L.marker([d.latitud, d.longitud], { icon });
    marker.bindPopup(crearPopupDispositivo(d));
    markerCluster.addLayer(marker);
  });
}

function crearIconoDispositivo(d) {
  const peligro = !d.autorizado;
  const color = peligro ? CONFIG.COLORS.DISPOSITIVO_PELIGRO : CONFIG.COLORS.DISPOSITIVO;
  const size = STATE.recintoActual ? 26 : 20;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.5}px;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      ${peligro ? 'animation:blink 1s infinite;' : ''}
    ">📱</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
}

function crearPopupDispositivo(d) {
  const recinto = STATE.recintos.find(r => r.id == d.recinto_id);
  return `<div class="popup-content">
    <h4>📱 ${d.imei || d.id}</h4>
    <p>📍 ${recinto ? recinto.nombre : 'Desconocido'}</p>
    <p>📶 Señal: ${d.intensidad_senal || 0}%</p>
    <p>🔋 Batería: ${d.bateria || 0}%</p>
    <p>📱 Modelo: ${d.modelo || 'Desconocido'}</p>
    <span class="popup-status ${d.autorizado ? 'status-activo' : 'status-inactivo'}">${d.autorizado ? '✅ Autorizado' : '🚫 No Autorizado'}</span>
  </div>`;
}

// ========== DRONES ==========
function mostrarDronesRecinto(recinto) {
  const drones = STATE.drones.filter(d => d.recinto_id == recinto.id);
  drones.forEach(d => {
    const icon = crearIconoDron(d);
    const marker = L.marker([d.latitud, d.longitud], { icon });
    marker.bindPopup(crearPopupDron(d));
    layers.drones.addLayer(marker);

    // Mostrar cono de visión si está en vuelo
    if (d.estado === 'en_vuelo' || d.estado === 'patrullando') {
      const cono = L.circle([d.latitud, d.longitud], {
        radius: d.altitud * 2 || 50,
        color: '#3b82f6',
        fillColor: 'rgba(59,130,246,0.1)',
        fillOpacity: 0.3,
        weight: 1,
        dashArray: '5,5'
      });
      layers.drones.addLayer(cono);
    }
  });
}

function mostrarDronesNacional() {
  STATE.drones.forEach(d => {
    const icon = crearIconoDron(d);
    const marker = L.marker([d.latitud, d.longitud], { icon });
    marker.bindPopup(crearPopupDron(d));
    markerCluster.addLayer(marker);
  });
}

function crearIconoDron(d) {
  const enVuelo = d.estado === 'en_vuelo' || d.estado === 'patrullando';
  const color = enVuelo ? CONFIG.COLORS.DRON_VUELO : CONFIG.COLORS.DRON_TIERRA;
  const size = STATE.recintoActual ? 30 : 24;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.5}px;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      ${enVuelo ? 'animation:float 2s ease-in-out infinite;' : ''}
    ">🚁</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
}

function crearPopupDron(d) {
  const recinto = STATE.recintos.find(r => r.id == d.recinto_id);
  const enVuelo = d.estado === 'en_vuelo' || d.estado === 'patrullando';
  return `<div class="popup-content">
    <h4>🚁 ${d.nombre || 'Dron #' + d.id}</h4>
    <p>📍 ${recinto ? recinto.nombre : 'Desconocido'}</p>
    <p>📊 Estado: ${d.estado.replace(/_/g, ' ')}</p>
    <p>🔋 Batería: ${d.bateria || 0}%</p>
    <p>📏 Altitud: ${d.altitud || 0}m</p>
    <p>💨 Velocidad: ${d.velocidad || 0}km/h</p>
    <span class="popup-status ${enVuelo ? 'status-en_vuelo' : 'status-en_tierra'}">${enVuelo ? '🟢 En Vuelo' : '🔴 En Tierra'}</span>
  </div>`;
}

// ========== ALERTAS ==========
function mostrarAlertasRecinto(recinto) {
  const alertas = STATE.alertas.filter(a => a.recinto_id == recinto.id && !a.resuelta);
  alertas.forEach(a => {
    const marker = L.circleMarker([a.latitud || recinto.latitud, a.longitud || recinto.longitud], {
      radius: a.nivel === 'alta' ? 20 : a.nivel === 'media' ? 14 : 8,
      color: a.nivel === 'alta' ? CONFIG.COLORS.ALERTA_ALTA : a.nivel === 'media' ? CONFIG.COLORS.ALERTA_MEDIA : CONFIG.COLORS.ALERTA_BAJA,
      fillColor: a.nivel === 'alta' ? CONFIG.COLORS.ALERTA_ALTA : a.nivel === 'media' ? CONFIG.COLORS.ALERTA_MEDIA : CONFIG.COLORS.ALERTA_BAJA,
      fillOpacity: 0.3,
      weight: 2,
      dashArray: a.nivel === 'alta' ? '' : '4,4'
    });
    marker.bindPopup(crearPopupAlerta(a));
    layers.alertas.addLayer(marker);
  });
}

function mostrarAlertasNacional() {
  const alertas = STATE.alertas.filter(a => !a.resuelta);
  alertas.forEach(a => {
    const recinto = STATE.recintos.find(r => r.id == a.recinto_id);
    if (!recinto) return;
    const marker = L.circleMarker([a.latitud || recinto.latitud, a.longitud || recinto.longitud], {
      radius: a.nivel === 'alta' ? 16 : 10,
      color: a.nivel === 'alta' ? CONFIG.COLORS.ALERTA_ALTA : a.nivel === 'media' ? CONFIG.COLORS.ALERTA_MEDIA : CONFIG.COLORS.ALERTA_BAJA,
      fillColor: a.nivel === 'alta' ? CONFIG.COLORS.ALERTA_ALTA : a.nivel === 'media' ? CONFIG.COLORS.ALERTA_MEDIA : CONFIG.COLORS.ALERTA_BAJA,
      fillOpacity: 0.3,
      weight: 2
    });
    marker.bindPopup(crearPopupAlerta(a));
    markerCluster.addLayer(marker);
  });
}

function crearPopupAlerta(a) {
  const recinto = STATE.recintos.find(r => r.id == a.recinto_id);
  return `<div class="popup-content">
    <h4>${a.nivel === 'alta' ? '🚨' : a.nivel === 'media' ? '⚠️' : 'ℹ️'} ${a.tipo}</h4>
    <p>📍 ${recinto ? recinto.nombre : 'Desconocido'}${a.zona ? ' · Zona: ' + a.zona : ''}</p>
    <p>📝 ${a.descripcion || 'Sin descripción'}</p>
    <p>🕐 ${a.fecha ? new Date(a.fecha).toLocaleString() : 'N/A'}</p>
    <span class="popup-status ${a.nivel === 'alta' ? 'status-inactivo' : a.nivel === 'media' ? 'status-pendiente' : 'status-activo'}">${a.nivel.toUpperCase()}</span>
  </div>`;
}

// ========== ZONAS / RECINTOS ==========
function mostrarRecintosNacional() {
  STATE.recintos.forEach(r => {
    const marker = L.circleMarker([r.latitud, r.longitud], {
      radius: 8,
      color: CONFIG.COLORS.RECINTO,
      fillColor: CONFIG.COLORS.RECINTO,
      fillOpacity: 0.2,
      weight: 2
    });
    marker.bindPopup(`<div class="popup-content"><h4>🏘️ ${r.nombre}</h4><p>📍 ${r.region}</p><p>👮 ${STATE.gendarmes.filter(g => g.recinto_id == r.id).length} gendarmes</p><p>📱 ${STATE.dispositivos.filter(d => d.recinto_id == r.id).length} dispositivos</p></div>`);
    marker.on('click', () => {
      document.getElementById('recinto-select').value = r.id;
      document.getElementById('recinto-select').dispatchEvent(new Event('change'));
    });
    markerCluster.addLayer(marker);
  });
}

function mostrarZonasRecinto(recinto) {
  // Simular zonas dentro del recinto
  const zonas = [
    { nombre: 'Pabellón A', lat: recinto.latitud + 0.001, lng: recinto.longitud - 0.001, riesgo: 'bajo' },
    { nombre: 'Pabellón B', lat: recinto.latitud - 0.0005, lng: recinto.longitud + 0.0015, riesgo: 'medio' },
    { nombre: 'Pabellón C', lat: recinto.latitud + 0.0015, lng: recinto.longitud + 0.001, riesgo: 'alto' },
    { nombre: 'Área Común', lat: recinto.latitud - 0.001, lng: recinto.longitud - 0.001, riesgo: 'bajo' },
    { nombre: 'Acceso Principal', lat: recinto.latitud + 0.0005, lng: recinto.longitud - 0.0005, riesgo: 'medio' }
  ];

  zonas.forEach(z => {
    const color = z.riesgo === 'alto' ? CONFIG.COLORS.ZONA_RIESGO : z.riesgo === 'medio' ? CONFIG.COLORS.ALERTA_MEDIA : CONFIG.COLORS.ZONA_SEGURA;
    const rect = L.rectangle([
      [z.lat - 0.0008, z.lng - 0.0008],
      [z.lat + 0.0008, z.lng + 0.0008]
    ], {
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.1,
      dashArray: '4,4'
    });
    rect.bindPopup(`<div class="popup-content"><h4>🏘️ ${z.nombre}</h4><p>⚠️ Riesgo: ${z.riesgo.toUpperCase()}</p></div>`);
    layers.zonas.addLayer(rect);

    // Label
    const label = L.marker([z.lat, z.lng], {
      icon: L.divIcon({
        html: `<div style="color:${color};font-size:10px;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:nowrap">${z.nombre}</div>`,
        className: '',
        iconSize: [100, 16],
        iconAnchor: [50, 8]
      })
    });
    layers.zonas.addLayer(label);
  });

  // Perímetro del recinto
  const perimetro = L.circle([recinto.latitud, recinto.longitud], {
    radius: 200,
    color: '#3b82f6',
    fillColor: 'rgba(59,130,246,0.05)',
    fillOpacity: 0.3,
    weight: 2,
    dashArray: '8,8'
  });
  perimetro.bindPopup(`<div class="popup-content"><h4>🏘️ ${recinto.nombre}</h4><p>📍 ${recinto.region}</p><p>📐 Perímetro de seguridad</p></div>`);
  layers.zonas.addLayer(perimetro);
}

// ========== HEATMAP ==========
function toggleHeatmap() {
  if (STATE.heatmapActive) {
    activarHeatmap();
  } else {
    desactivarHeatmap();
  }
}

function activarHeatmap() {
  layers.heatmap.clearLayers();
  const puntos = STATE.dispositivos.map(d => [d.latitud, d.longitud, d.intensidad_senal || 50]);
  if (puntos.length === 0) return;

  // Heatmap simplificado con círculos
  puntos.forEach(([lat, lng, intensidad]) => {
    const radius = 30 + (intensidad / 100) * 50;
    const opacity = 0.1 + (intensidad / 100) * 0.4;
    const circle = L.circle([lat, lng], {
      radius,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: opacity,
      weight: 0
    });
    layers.heatmap.addLayer(circle);
  });

  // Leyenda
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'heatmap-legend');
    div.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px">🔥 Densidad Celulares</div>
      <div class="gradient" style="background:linear-gradient(to right, rgba(59,130,246,0.2), #3b82f6, #eab308, #f97316, #ef4444)"></div>
      <div class="labels"><span>Baja</span><span>Alta</span></div>
    `;
    return div;
  };
  legend.addTo(map);
  STATE.heatmapLegend = legend;
}

function desactivarHeatmap() {
  layers.heatmap.clearLayers();
  if (STATE.heatmapLegend) {
    STATE.heatmapLegend.remove();
    STATE.heatmapLegend = null;
  }
}

// ========== INYECTAR ESTILOS ANIMACIÓN ==========
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
`;
document.head.appendChild(styleSheet);
