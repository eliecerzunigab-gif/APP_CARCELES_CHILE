// ===== MAPA PRINCIPAL =====
function initMap() {
  STATE.map = L.map('map', {
    center: CONFIG.MAP_CENTER,
    zoom: CONFIG.MAP_ZOOM,
    maxZoom: CONFIG.MAP_MAX_ZOOM,
    minZoom: CONFIG.MAP_MIN_ZOOM,
    zoomControl: true,
    attributionControl: true
  });

  // Capa base - OpenStreetMap con estilo oscuro
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(STATE.map);

  // Crear grupos de capas
  STATE.layers.recintos = L.layerGroup().addTo(STATE.map);
  STATE.layers.recintoPoligonos = L.layerGroup().addTo(STATE.map);
  STATE.layers.zonas = L.layerGroup().addTo(STATE.map);
  STATE.layers.gendarmes = L.layerGroup().addTo(STATE.map);
  STATE.layers.dispositivos = L.layerGroup().addTo(STATE.map);
  STATE.layers.drones = L.layerGroup().addTo(STATE.map);
  STATE.layers.alertas = L.layerGroup().addTo(STATE.map);

  // Eventos de toggle
  document.getElementById('toggle-gendarmes').addEventListener('change', (e) => {
    if (e.target.checked) STATE.map.addLayer(STATE.layers.gendarmes);
    else STATE.map.removeLayer(STATE.layers.gendarmes);
  });
  document.getElementById('toggle-dispositivos').addEventListener('change', (e) => {
    if (e.target.checked) STATE.map.addLayer(STATE.layers.dispositivos);
    else STATE.map.removeLayer(STATE.layers.dispositivos);
  });
  document.getElementById('toggle-drones').addEventListener('change', (e) => {
    if (e.target.checked) STATE.map.addLayer(STATE.layers.drones);
    else STATE.map.removeLayer(STATE.layers.drones);
  });
  document.getElementById('toggle-alertas').addEventListener('change', (e) => {
    if (e.target.checked) STATE.map.addLayer(STATE.layers.alertas);
    else STATE.map.removeLayer(STATE.layers.alertas);
  });
  document.getElementById('toggle-zonas').addEventListener('change', (e) => {
    if (e.target.checked) STATE.map.addLayer(STATE.layers.zonas);
    else STATE.map.removeLayer(STATE.layers.zonas);
  });

  // Selector de recinto
  document.getElementById('recinto-select').addEventListener('change', (e) => {
    const recintoId = e.target.value;
    if (recintoId) {
      cambiarAVistaRecinto(recintoId);
    } else {
      cambiarAVistaNacional();
    }
  });

  // Botón de volver a vista nacional
  document.getElementById('btn-vista-nacional').addEventListener('click', () => {
    document.getElementById('recinto-select').value = '';
    cambiarAVistaNacional();
  });

  // Cargar datos iniciales
  cargarRecintos();
  cargarDatosMapa();
}

// ===== CAMBIO DE VISTA =====
function cambiarAVistaNacional() {
  STATE.vistaActual = 'nacional';
  STATE.recintoActivo = null;
  
  STATE.map.setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);
  
  // Mostrar capas de vista nacional
  STATE.layers.recintos.addTo(STATE.map);
  STATE.layers.recintoPoligonos.addTo(STATE.map);
  
  // Ocultar capas detalladas de recinto
  STATE.map.removeLayer(STATE.layers.zonas);
  STATE.map.removeLayer(STATE.layers.gendarmes);
  STATE.map.removeLayer(STATE.layers.dispositivos);
  STATE.map.removeLayer(STATE.layers.drones);
  STATE.map.removeLayer(STATE.layers.alertas);
  
  // Ocultar botón de volver
  document.getElementById('btn-vista-nacional').style.display = 'none';
  
  // Mostrar indicador de vista nacional
  document.getElementById('vista-indicator').textContent = '🇨🇱 Vista Nacional - Todos los recintos';
  document.getElementById('vista-indicator').className = 'vista-indicator nacional';
  
  // Cargar datos nacionales
  cargarDatosMapa();
}

function cambiarAVistaRecinto(recintoId) {
  const recinto = STATE.recintos.find(r => r.id === recintoId);
  if (!recinto) return;
  
  STATE.vistaActual = 'recinto';
  STATE.recintoActivo = recinto;
  
  STATE.map.setView([recinto.latitud, recinto.longitud], CONFIG.MAP_ZOOM_RECINTO);
  
  // Mostrar todas las capas
  STATE.layers.recintos.addTo(STATE.map);
  STATE.layers.recintoPoligonos.addTo(STATE.map);
  STATE.layers.zonas.addTo(STATE.map);
  STATE.layers.gendarmes.addTo(STATE.map);
  STATE.layers.dispositivos.addTo(STATE.map);
  STATE.layers.drones.addTo(STATE.map);
  STATE.layers.alertas.addTo(STATE.map);
  
  // Mostrar botón de volver
  document.getElementById('btn-vista-nacional').style.display = 'inline-flex';
  
  // Mostrar indicador de vista recinto
  document.getElementById('vista-indicator').textContent = `🏛️ ${recinto.nombre}`;
  document.getElementById('vista-indicator').className = 'vista-indicator recinto';
  
  // Cargar datos del recinto
  cargarDatosMapa();
}

// ===== CARGAR RECINTOS =====
async function cargarRecintos() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/recintos`);
    STATE.recintos = await res.json();
    
    const select = document.getElementById('recinto-select');
    STATE.recintos.forEach(r => {
      const option = document.createElement('option');
      option.value = r.id;
      option.textContent = r.nombre;
      select.appendChild(option);
    });

    // Dibujar recintos en el mapa
    dibujarRecintos();
    actualizarHeaderStats();
  } catch (err) {
    console.error('Error cargando recintos:', err);
  }
}

// ===== DIBUJAR RECINTOS (Vista Nacional) =====
function dibujarRecintos() {
  STATE.layers.recintos.clearLayers();
  STATE.layers.recintoPoligonos.clearLayers();
  STATE.markers.recintos = {};

  STATE.recintos.forEach(recinto => {
    // Polígono del recinto (solo visible en zoom alto)
    if (recinto.poligono) {
      try {
        const coords = JSON.parse(recinto.poligono);
        const polygon = L.polygon(coords, {
          color: '#00bcd4',
          weight: 2,
          opacity: 0.8,
          fillColor: '#00bcd4',
          fillOpacity: 0.08
        }).addTo(STATE.layers.recintoPoligonos);
        polygon.bindPopup(`
          <div style="color:#000;font-family:sans-serif;min-width:200px;">
            <strong>🏛️ ${recinto.nombre}</strong><br>
            ${recinto.direccion || ''}<br>
            <span style="font-size:12px;color:#666;">
              👮 ${recinto.gendarmes_activos || 0} gendarmes · 
              📱 ${recinto.dispositivos_no_autorizados || 0} celulares · 
              🔔 ${recinto.alertas_activas || 0} alertas
            </span>
          </div>
        `);
      } catch (e) {}
    }

    // Marcador del recinto con indicador de estado
    const alertasCriticas = recinto.alertas_criticas || 0;
    const alertasActivas = recinto.alertas_activas || 0;
    
    let colorEstado = '#43a047'; // verde - normal
    let pulso = '';
    if (alertasCriticas > 0) {
      colorEstado = '#e53935'; // rojo - crítico
      pulso = 'animation: pulse 1.5s infinite;';
    } else if (alertasActivas > 0) {
      colorEstado = '#ffa726'; // naranjo - alertas
    }

    const icon = L.divIcon({
      html: `
        <div style="position:relative;">
          <div style="
            width: 48px; height: 48px;
            background: ${colorEstado};
            border: 3px solid #fff;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            ${pulso}
          ">🏛️</div>
          <div style="
            position:absolute; top:-4px; right:-4px;
            background: ${colorEstado};
            color: #fff;
            border-radius: 50%;
            width: 20px; height: 20px;
            display: flex; align-items: center; justify-content: center;
            font-size: 10px; font-weight: bold;
            border: 2px solid #fff;
          ">${alertasActivas}</div>
        </div>
      `,
      className: 'marker-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    const marker = L.marker([recinto.latitud, recinto.longitud], { icon })
      .addTo(STATE.layers.recintos)
      .bindPopup(`
        <div style="color:#000;font-family:sans-serif;min-width:250px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:28px;">🏛️</span>
            <div>
              <strong style="font-size:16px;">${recinto.nombre}</strong><br>
              <span style="font-size:11px;color:#666;">${recinto.direccion || ''}</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;">
            <div style="background:#e8f5e9;padding:6px;border-radius:4px;text-align:center;">
              <div style="font-size:18px;font-weight:bold;color:#2e7d32;">${recinto.gendarmes_activos || 0}</div>
              <div style="font-size:10px;color:#666;">👮 Gendarmes</div>
            </div>
            <div style="background:#ffebee;padding:6px;border-radius:4px;text-align:center;">
              <div style="font-size:18px;font-weight:bold;color:#c62828;">${recinto.dispositivos_no_autorizados || 0}</div>
              <div style="font-size:10px;color:#666;">📱 No autorizados</div>
            </div>
            <div style="background:#fff3e0;padding:6px;border-radius:4px;text-align:center;">
              <div style="font-size:18px;font-weight:bold;color:#e65100;">${recinto.alertas_activas || 0}</div>
              <div style="font-size:10px;color:#666;">🔔 Alertas</div>
            </div>
            <div style="background:#e3f2fd;padding:6px;border-radius:4px;text-align:center;">
              <div style="font-size:18px;font-weight:bold;color:#1565c0;">${recinto.drones_activos || 0}</div>
              <div style="font-size:10px;color:#666;">🚁 Drones</div>
            </div>
          </div>
          <button onclick="cambiarAVistaRecinto('${recinto.id}');document.getElementById('recinto-select').value='${recinto.id}';" 
            style="width:100%;margin-top:8px;padding:6px;background:#1a237e;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
            🔍 Ver detalle del recinto
          </button>
        </div>
      `);

    // Click en el marcador también cambia a vista recinto
    marker.on('click', () => {
      document.getElementById('recinto-select').value = recinto.id;
      cambiarAVistaRecinto(recinto.id);
    });

    STATE.markers.recintos[recinto.id] = marker;
  });
}

// ===== CARGAR DATOS DEL MAPA =====
async function cargarDatosMapa() {
  try {
    const recintoId = document.getElementById('recinto-select').value;
    const url = recintoId 
      ? `${CONFIG.API_URL}/dashboard/mapa?recinto_id=${recintoId}`
      : `${CONFIG.API_URL}/dashboard/mapa`;
    
    const res = await fetch(url);
    const data = await res.json();

    STATE.zonas = data.zonas || [];
    STATE.gendarmes = data.gendarmes || [];
    STATE.dispositivos = data.dispositivos || [];
    STATE.drones = data.drones || [];
    STATE.alertas = data.alertas || [];

    dibujarZonas();
    dibujarGendarmes();
    dibujarDispositivos();
    dibujarDrones();
    dibujarAlertas();
  } catch (err) {
    console.error('Error cargando datos del mapa:', err);
  }
}

// ===== DIBUJAR ZONAS =====
function dibujarZonas() {
  STATE.layers.zonas.clearLayers();
  STATE.markers.zonas = {};

  STATE.zonas.forEach(zona => {
    const colorMap = {
      'patio': '#43a047',
      'celda': '#e53935',
      'acceso': '#ffa726',
      'enfermeria': '#29b6f6',
      'taller': '#ab47bc',
      'visita': '#26c6da',
      'administracion': '#78909c',
      'perimetro': '#ff7043'
    };
    const color = colorMap[zona.tipo] || '#00bcd4';

    const circle = L.circle([zona.latitud, zona.longitud], {
      radius: zona.radio || 15,
      color: color,
      fillColor: color,
      fillOpacity: 0.1,
      weight: 1,
      opacity: 0.5
    }).addTo(STATE.layers.zonas);

    circle.bindTooltip(zona.nombre, { permanent: false, direction: 'center' });
    STATE.markers.zonas[zona.id] = circle;
  });
}

// ===== DIBUJAR GENDARMES =====
function dibujarGendarmes() {
  STATE.layers.gendarmes.clearLayers();
  STATE.markers.gendarmes = {};

  STATE.gendarmes.forEach(g => {
    if (!g.ultima_ubicacion_lat || !g.ultima_ubicacion_lng) return;

    const enLinea = g.en_linea === 1 || g.en_linea === true;
    const color = enLinea ? '#43a047' : '#e53935';
    const icon = L.divIcon({
      html: `<div style="
        width: 28px; height: 28px; 
        background: ${color}; 
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">👮</div>`,
      className: 'marker-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([g.ultima_ubicacion_lat, g.ultima_ubicacion_lng], { icon })
      .addTo(STATE.layers.gendarmes)
      .bindPopup(`
        <div style="color:#000;font-family:sans-serif;min-width:200px;">
          <strong>👮 ${g.nombre} ${g.apellido}</strong><br>
          <span style="font-size:12px;color:#666;">${g.cargo || 'Gendarme'} · ${g.rut || '-'}</span><br>
          <span style="font-size:12px;">📍 Zona: ${g.zona_nombre || 'Desconocida'}</span><br>
          <span style="font-size:12px;">⏱️ Último heartbeat: ${formatDate(g.ultimo_heartbeat)}</span><br>
          <span style="font-size:12px;color:${enLinea ? '#43a047' : '#e53935'};">
            ${enLinea ? '● En línea' : '○ Sin señal'}
          </span>
        </div>
      `);

    STATE.markers.gendarmes[g.id] = marker;
  });
}

// ===== DIBUJAR DISPOSITIVOS =====
function dibujarDispositivos() {
  STATE.layers.dispositivos.clearLayers();
  STATE.markers.dispositivos = {};

  STATE.dispositivos.forEach(d => {
    if (!d.latitud || !d.longitud) return;

    const color = d.es_autorizado ? '#43a047' : '#e53935';
    const icon = L.divIcon({
      html: `<div style="
        width: 24px; height: 24px; 
        background: ${color}; 
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${!d.es_autorizado ? 'animation: pulse 1.5s infinite;' : ''}
      ">📱</div>`,
      className: 'marker-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([d.latitud, d.longitud], { icon })
      .addTo(STATE.layers.dispositivos)
      .bindPopup(`
        <div style="color:#000;font-family:sans-serif;min-width:200px;">
          <strong>📱 ${d.fabricante || 'Desconocido'} ${d.modelo || ''}</strong><br>
          <span style="font-size:12px;color:#666;">Tipo: ${d.tipo_dispositivo || 'celular'}</span><br>
          <span style="font-size:12px;">📶 Señal: ${d.senial_db || '-'} dB</span><br>
          <span style="font-size:12px;">📍 Zona: ${d.zona_nombre || 'Desconocida'}</span><br>
          <span style="font-size:12px;">⏱️ Detectado: ${formatDate(d.ultima_deteccion)}</span><br>
          <span style="font-size:12px;color:${d.es_autorizado ? '#43a047' : '#e53935'};">
            ${d.es_autorizado ? '✅ Autorizado' : '❌ No autorizado'}
          </span>
        </div>
      `);

    STATE.markers.dispositivos[d.id] = marker;
  });
}

// ===== DIBUJAR DRONES =====
function dibujarDrones() {
  STATE.layers.drones.clearLayers();
  STATE.markers.drones = {};

  STATE.drones.forEach(d => {
    if (!d.latitud || !d.longitud) return;

    const colorMap = {
      'en_base': '#78909c',
      'en_vuelo': '#43a047',
      'despegando': '#ffa726',
      'regresando': '#ffa726',
      'patrulla': '#29b6f6',
      'cargando': '#ffa726',
      'mantenimiento': '#e53935',
      'perdido': '#e53935'
    };
    const color = colorMap[d.estado] || '#78909c';

    const icon = L.divIcon({
      html: `<div style="
        width: 30px; height: 30px; 
        background: ${color}; 
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">🚁</div>`,
      className: 'marker-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([d.latitud, d.longitud], { icon })
      .addTo(STATE.layers.drones)
      .bindPopup(`
        <div style="color:#000;font-family:sans-serif;min-width:200px;">
          <strong>🚁 ${d.nombre}</strong><br>
          <span style="font-size:12px;color:#666;">${d.modelo || ''}</span><br>
          <span style="font-size:12px;">📊 Estado: ${d.estado}</span><br>
          <span style="font-size:12px;">🔋 Batería: ${Math.round(d.bateria || 0)}%</span><br>
          <span style="font-size:12px;">📏 Altitud: ${Math.round(d.altitud || 0)}m</span><br>
          <span style="font-size:12px;">💨 Velocidad: ${Math.round(d.velocidad || 0)} km/h</span><br>
          <span style="font-size:12px;">🎯 Modo: ${d.modo_vuelo || 'manual'}</span><br>
          <span style="font-size:12px;">📷 Cámara: ${d.camara_activa ? '✅ Activa' : '❌ Inactiva'}</span>
        </div>
      `);

    STATE.markers.drones[d.id] = marker;
  });
}

// ===== DIBUJAR ALERTAS =====
function dibujarAlertas() {
  STATE.layers.alertas.clearLayers();
  STATE.markers.alertas = {};

  STATE.alertas.forEach(a => {
    if (!a.latitud || !a.longitud) return;

    const colorMap = {
      'critica': '#e53935',
      'alta': '#ffa726',
      'media': '#29b6f6',
      'baja': '#43a047'
    };
    const color = colorMap[a.severidad] || '#ffa726';

    const icon = L.divIcon({
      html: `<div style="
        width: 32px; height: 32px; 
        background: ${color}; 
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
        box-shadow: 0 0 12px ${color};
        animation: pulse 1.5s infinite;
      ">${getTipoAlertaIcon(a.tipo)}</div>`,
      className: 'marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([a.latitud, a.longitud], { icon })
      .addTo(STATE.layers.alertas)
      .bindPopup(`
        <div style="color:#000;font-family:sans-serif;min-width:250px;">
          <strong style="color:${color};">${getTipoAlertaIcon(a.tipo)} ${a.titulo}</strong><br>
          <span style="font-size:12px;color:#666;">${a.descripcion || ''}</span><br>
          <span style="font-size:12px;">📍 Zona: ${a.zona_nombre || 'Desconocida'}</span><br>
          <span style="font-size:12px;">⏱️ ${formatDate(a.created_at)}</span><br>
          <span style="font-size:12px;font-weight:bold;color:${color};">${a.severidad.toUpperCase()}</span>
        </div>
      `);

    STATE.markers.alertas[a.id] = marker;
  });
}

// ===== ACTUALIZAR MARCADORES EN TIEMPO REAL =====
function actualizarMarcadorGendarme(data) {
  const g = STATE.gendarmes.find(gen => gen.id === data.gendarme_id);
  if (g) {
    g.ultima_ubicacion_lat = data.latitud;
    g.ultima_ubicacion_lng = data.longitud;
    g.ultimo_heartbeat = data.timestamp;
    g.en_linea = 1;
  }
  dibujarGendarmes();
}

function actualizarMarcadorDron(data) {
  const d = STATE.drones.find(dron => dron.id === data.dron_id);
  if (d) {
    d.latitud = data.latitud;
    d.longitud = data.longitud;
    d.altitud = data.altitud;
    d.velocidad = data.velocidad;
    d.bateria = data.bateria;
  }
  dibujarDrones();
}

function agregarAlertaMapa(data) {
  STATE.alertas.push(data);
  dibujarAlertas();
}

function eliminarAlertaMapa(data) {
  STATE.alertas = STATE.alertas.filter(a => a.id !== data.alerta_id);
  dibujarAlertas();
}

// ===== PULSACIÓN PARA ALERTAS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  .marker-icon {
    background: transparent !important;
    border: none !important;
  }
`;
document.head.appendChild(style);
