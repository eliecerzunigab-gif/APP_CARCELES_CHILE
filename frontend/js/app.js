// ============================================================
// app.js - Aplicación principal del mapa de cárceles de Chile
// ============================================================

let DATA = null;
let recintosPlano = [];
let map = null;
let markers = { recintos: {}, regiones: {} };
let layers = { recintos: null, regiones: null, seguridad: null };
let vistaActual = 'nacional';
let recintoActivo = null;

// ===== CARGA DE DATOS =====
async function cargarDatos() {
  try {
    const res = await fetch('backend/data/carceles_chile.json');
    DATA = await res.json();
    recintosPlano = [];
    DATA.regiones.forEach(r => {
      r.recintos.forEach(rec => {
        recintosPlano.push({ ...rec, region: r.nombre });
      });
    });
    actualizarUI();
    initMap();
    return true;
  } catch (err) {
    console.error('Error cargando datos:', err);
    document.getElementById('regiones-list').innerHTML = '<div class="loading" style="color:var(--danger)">Error al cargar datos</div>';
    return false;
  }
}

function escapar(s) {
  return s.replace(/'/g, "\\'");
}

// ===== ACTUALIZAR UI =====
function actualizarUI() {
  document.querySelector('#stat-recinto .stat-value').textContent = recintosPlano.length;
  document.querySelector('#stat-regiones .stat-value').textContent = DATA.regiones.length;
  const capTotal = recintosPlano.reduce((s, r) => s + (r.capacidad || 0), 0);
  document.querySelector('#stat-capacidad .stat-value').textContent = capTotal.toLocaleString('es-CL');
  document.getElementById('stat-total-recintos').textContent = recintosPlano.length;
  document.getElementById('stat-total-regiones').textContent = DATA.regiones.length;
  document.getElementById('stat-capacidad-total').textContent = capTotal.toLocaleString('es-CL');
  document.getElementById('stat-alta-seguridad').textContent = recintosPlano.filter(r => r.seguridad === 'alta').length;
  document.getElementById('stat-media-seguridad').textContent = recintosPlano.filter(r => r.seguridad === 'media').length;
  document.getElementById('stat-baja-seguridad').textContent = recintosPlano.filter(r => r.seguridad === 'baja').length;

  // Regiones list
  const regionesList = document.getElementById('regiones-list');
  document.getElementById('regiones-count').textContent = DATA.regiones.length;
  regionesList.innerHTML = DATA.regiones.map(r => {
    const capRegion = r.recintos.reduce((s, rec) => s + (rec.capacidad || 0), 0);
    return '<div class="list-item" onclick="enfocarRegion(\'' + escapar(r.nombre) + '\')">' +
      '<div class="avatar info">\uD83D\uDDFA\uFE0F</div>' +
      '<div class="info"><div class="name">' + r.nombre + '</div><div class="detail">' + r.recintos.length + ' recintos \u00B7 ' + capRegion.toLocaleString('es-CL') + ' plazas</div></div>' +
      '<span class="status-dot online"></span></div>';
  }).join('');

  // Recintos list
  const recintosList = document.getElementById('recintos-list');
  document.getElementById('recintos-count').textContent = recintosPlano.length;
  recintosList.innerHTML = recintosPlano.map(r => {
    const colorSeg = r.seguridad === 'alta' ? 'var(--danger)' : r.seguridad === 'media' ? 'var(--warning)' : 'var(--success)';
    const dotClass = r.seguridad === 'alta' ? 'offline' : r.seguridad === 'media' ? 'warning' : 'online';
    return '<div class="list-item" onclick="enfocarRecinto(\'' + escapar(r.nombre) + '\')">' +
      '<div class="avatar" style="border-color:' + colorSeg + '">\uD83C\uDFDB\uFE0F</div>' +
      '<div class="info"><div class="name">' + r.nombre + '</div><div class="detail">' + r.region + ' \u00B7 ' + r.capacidad + ' plazas \u00B7 ' + r.seguridad + '</div></div>' +
      '<span class="status-dot ' + dotClass + '"></span></div>';
  }).join('');

  // Select
  const select = document.getElementById('recinto-select');
  recintosPlano.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.nombre;
    opt.textContent = r.nombre;
    select.appendChild(opt);
  });
}

// ===== MAPA =====
function initMap() {
  map = L.map('map', {
    center: [-33.4489, -70.6693],
    zoom: 5.5,
    maxZoom: 18,
    minZoom: 4,
    zoomControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  layers.regiones = L.layerGroup().addTo(map);
  layers.recintos = L.layerGroup().addTo(map);
  layers.seguridad = L.layerGroup().addTo(map);

  document.getElementById('toggle-regiones').addEventListener('change', (e) => {
    if (e.target.checked) map.addLayer(layers.regiones); else map.removeLayer(layers.regiones);
  });
  document.getElementById('toggle-recintos').addEventListener('change', (e) => {
    if (e.target.checked) map.addLayer(layers.recintos); else map.removeLayer(layers.recintos);
  });
  document.getElementById('toggle-seguridad').addEventListener('change', (e) => {
    if (e.target.checked) map.addLayer(layers.seguridad); else map.removeLayer(layers.seguridad);
  });

  document.getElementById('recinto-select').addEventListener('change', (e) => {
    if (e.target.value) enfocarRecinto(e.target.value); else vistaNacional();
  });
  document.getElementById('btn-vista-nacional').addEventListener('click', () => {
    document.getElementById('recinto-select').value = '';
    vistaNacional();
  });

  dibujarTodo();
}

function dibujarTodo() {
  dibujarRegiones();
  dibujarRecintos();
  dibujarSeguridad();
}

function dibujarRegiones() {
  layers.regiones.clearLayers();
  markers.regiones = {};
  DATA.regiones.forEach(region => {
    const latMedia = region.recintos.reduce((s, r) => s + r.latitud, 0) / region.recintos.length;
    const lngMedia = region.recintos.reduce((s, r) => s + r.longitud, 0) / region.recintos.length;
    const capRegion = region.recintos.reduce((s, r) => s + (r.capacidad || 0), 0);
    const icon = L.divIcon({
      html: '<div style="width:36px;height:36px;background:rgba(41,182,246,0.3);border:2px solid #29b6f6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.4);">\uD83D\uDDFA\uFE0F</div>',
      className: 'marker-icon', iconSize: [36, 36], iconAnchor: [18, 18]
    });
    const recintosHtml = region.recintos.map(r => '<span style="font-size:10px;background:#e3f2fd;padding:2px 6px;border-radius:4px;margin:2px;display:inline-block;">' + r.nombre + '</span>').join('');
    const marker = L.marker([latMedia, lngMedia], { icon })
      .addTo(layers.regiones)
      .bindPopup('<div style="color:#000;font-family:sans-serif;min-width:220px;">' +
        '<strong>\uD83D\uDDFA\uFE0F ' + region.nombre + '</strong><br>' +
        '<span style="font-size:12px;color:#666;">' + region.recintos.length + ' recintos \u00B7 ' + capRegion.toLocaleString('es-CL') + ' plazas</span>' +
        '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">' + recintosHtml + '</div>' +
        '<button onclick="enfocarRegion(\'' + escapar(region.nombre) + '\');" style="width:100%;margin-top:8px;padding:6px;background:#1a237e;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Ver regi\u00F3n</button></div>');
    markers.regiones[region.nombre] = marker;
  });
}

function dibujarRecintos() {
  layers.recintos.clearLayers();
  markers.recintos = {};
  recintosPlano.forEach(r => {
    const colorMap = { alta: '#e53935', media: '#ffa726', baja: '#43a047' };
    const color = colorMap[r.seguridad] || '#ffa726';
    const size = r.capacidad > 1000 ? 40 : r.capacidad > 500 ? 34 : r.capacidad > 200 ? 30 : 26;
    const fontSize = size > 30 ? 16 : 13;
    const icon = L.divIcon({
      html: '<div style="width:' + size + 'px;height:' + size + 'px;background:' + color + ';border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:' + fontSize + 'px;box-shadow:0 3px 10px rgba(0,0,0,0.5);">\uD83C\uDFDB\uFE0F</div>',
      className: 'marker-icon', iconSize: [size, size], iconAnchor: [size/2, size/2]
    });
    const marker = L.marker([r.latitud, r.longitud], { icon })
      .addTo(layers.recintos)
      .bindPopup('<div style="color:#000;font-family:sans-serif;min-width:280px;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
        '<span style="font-size:32px;">\uD83C\uDFDB\uFE0F</span>' +
        '<div><strong style="font-size:15px;">' + r.nombre + '</strong><br><span style="font-size:11px;color:#666;">' + (r.direccion || '') + '</span></div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
        '<div style="background:#e3f2fd;padding:8px;border-radius:6px;text-align:center;"><div style="font-size:18px;font-weight:bold;color:#1565c0;">' + (r.capacidad || '-') + '</div><div style="font-size:10px;color:#666;">Capacidad</div></div>' +
        '<div style="background:#fff3e0;padding:8px;border-radius:6px;text-align:center;"><div style="font-size:18px;font-weight:bold;color:' + color + ';text-transform:capitalize;">' + r.seguridad + '</div><div style="font-size:10px;color:#666;">Seguridad</div></div></div>' +
        '<div style="margin-top:8px;font-size:11px;color:#666;text-align:center;">\uD83D\uDCCD ' + r.region + '</div>' +
        '<button onclick="enfocarRecinto(\'' + escapar(r.nombre) + '\');document.getElementById(\'recinto-select\').value=\'' + escapar(r.nombre) + '\';" style="width:100%;margin-top:8px;padding:8px;background:#1a237e;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Ver detalle del recinto</button></div>');
    marker.on('click', () => {
      document.getElementById('recinto-select').value = r.nombre;
      enfocarRecinto(r.nombre);
    });
    markers.recintos[r.nombre] = marker;
  });
}

function dibujarSeguridad() {
  layers.seguridad.clearLayers();
  const colores = { alta: '#e53935', media: '#ffa726', baja: '#43a047' };
  Object.keys(colores).forEach(nivel => {
    const recintosNivel = recintosPlano.filter(r => r.seguridad === nivel);
    if (recintosNivel.length === 0) return;
    const latMedia = recintosNivel.reduce((s, r) => s + r.latitud, 0) / recintosNivel.length;
    const lngMedia = recintosNivel.reduce((s, r) => s + r.longitud, 0) / recintosNivel.length;
    const icon = L.divIcon({
      html: '<div style="width:24px;height:24px;background:' + colores[nivel] + ';border:2px solid #fff;border-radius:50%;opacity:0.7;box-shadow:0 0 8px ' + colores[nivel] + ';"></div>',
      className: 'marker-icon', iconSize: [24, 24], iconAnchor: [12, 12]
    });
    L.marker([latMedia, lngMedia], { icon })
      .addTo(layers.seguridad)
      .bindPopup('<div style="color:#000;font-family:sans-serif;text-align:center;">' +
        '<strong style="text-transform:capitalize;color:' + colores[nivel] + ';">\uD83D\uDD12 ' + nivel + ' Seguridad</strong><br>' +
        '<span style="font-size:12px;color:#666;">' + recintosNivel.length + ' recintos</span></div>');
  });
}

// ===== NAVEGACION =====
function enfocarRegion(nombreRegion) {
  const region = DATA.regiones.find(r => r.nombre === nombreRegion);
  if (!region) return;
  vistaActual = 'region';
  recintoActivo = null;
  const latMedia = region.recintos.reduce((s, r) => s + r.latitud, 0) / region.recintos.length;
  const lngMedia = region.recintos.reduce((s, r) => s + r.longitud, 0) / region.recintos.length;
  map.flyTo([latMedia, lngMedia], 8, { duration: 1 });
  document.getElementById('vista-indicator').textContent = '\uD83D\uDDFA\uFE0F ' + nombreRegion;
  document.getElementById('vista-indicator').className = 'vista-indicator region';
  document.getElementById('btn-vista-nacional').style.display = 'inline-flex';
  document.getElementById('recinto-select').value = '';
  mostrarInfoRegion(region);
}

function enfocarRecinto(nombreRecinto) {
  const recinto = recintosPlano.find(r => r.nombre === nombreRecinto);
  if (!recinto) return;
  vistaActual = 'recinto';
  recintoActivo = recinto;
  map.flyTo([recinto.latitud, recinto.longitud], 14, { duration: 1 });
  document.getElementById('vista-indicator').textContent = '\uD83C\uDFDB\uFE0F ' + recinto.nombre;
  document.getElementById('vista-indicator').className = 'vista-indicator recinto';
  document.getElementById('btn-vista-nacional').style.display = 'inline-flex';
  document.getElementById('recinto-select').value = recinto.nombre;
  mostrarInfoRecinto(recinto);
  if (markers.recintos[recinto.nombre]) {
    markers.recintos[recinto.nombre].openPopup();
  }
}

function vistaNacional() {
  vistaActual = 'nacional';
  recintoActivo = null;
  map.flyTo([-33.4489, -70.6693], 5.5, { duration: 1 });
  document.getElementById('vista-indicator').textContent = '\uD83C\uDDE8\uD83C\uDDF1 Vista Nacional - Todos los recintos';
  document.getElementById('vista-indicator').className = 'vista-indicator nacional';
  document.getElementById('btn-vista-nacional').style.display = 'none';
  document.getElementById('recinto-select').value = '';
  document.getElementById('info-panel').innerHTML = '<div class="loading">Seleccione un recinto en el mapa o en la lista</div>';
}

function mostrarInfoRegion(region) {
  const capRegion = region.recintos.reduce((s, r) => s + (r.capacidad || 0), 0);
  const alta = region.recintos.filter(r => r.seguridad === 'alta').length;
  const media = region.recintos.filter(r => r.seguridad === 'media').length;
  const baja = region.recintos.filter(r => r.seguridad === 'baja').length;
  document.getElementById('info-panel').innerHTML =
    '<div style="padding:8px;">' +
    '<h4 style="color:#fff;margin-bottom:8px;">\uD83D\uDDFA\uFE0F ' + region.nombre + '</h4>' +
    '<div class="stats-grid">' +
    '<div class="stat-card"><div class="stat-number">' + region.recintos.length + '</div><div class="stat-desc">Recintos</div></div>' +
    '<div class="stat-card stat-info"><div class="stat-number">' + capRegion.toLocaleString('es-CL') + '</div><div class="stat-desc">Plazas</div></div>' +
    '<div class="stat-card stat-danger"><div class="stat-number">' + alta + '</div><div class="stat-desc">Alta Seg.</div></div>' +
    '<div class="stat-card stat-warning"><div class="stat-number">' + media + '</div><div class="stat-desc">Media Seg.</div></div>' +
    '<div class="stat-card stat-success"><div class="stat-number">' + baja + '</div><div class="stat-desc">Baja Seg.</div></div>' +
    '</div>' +
    '<div style="margin-top:8px;">' +
    region.recintos.map(r => '<div class="list-item" onclick="enfocarRecinto(\'' + escapar(r.nombre) + '\')" style="padding:4px 6px;">' +
      '<div class="avatar" style="width:20px;height:20px;font-size:10px;border-color:' + (r.seguridad === 'alta' ? 'var(--danger)' : r.seguridad === 'media' ? 'var(--warning)' : 'var(--success)') + '">\uD83C\uDFDB\uFE0F</div>' +
      '<div class="info"><div class="name" style="font-size:11px;">' + r.nombre + '</div></div></div>').join('') +
    '</div></div>';
}

function mostrarInfoRecinto(recinto) {
  const colorMap = { alta: 'var(--danger)', media: 'var(--warning)', baja: 'var(--success)' };
  const color = colorMap[recinto.seguridad] || 'var(--warning)';
  document.getElementById('info-panel').innerHTML =
    '<div style="padding:8px;">' +
    '<h4 style="color:#fff;margin-bottom:8px;">\uD83C\uDFDB\uFE0F ' + recinto.nombre + '</h4>' +
    '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">\uD83D\uDCCD ' + recinto.direccion + '<br>\uD83D\uDDFA\uFE0F ' + recinto.region + '</div>' +
    '<div class="stats-grid">' +
    '<div class="stat-card"><div class="stat-number">' + (recinto.capacidad || '-') + '</div><div class="stat-desc">Capacidad</div></div>' +
    '<div class="stat-card" style="border-color:' + color + '"><div class="stat-number" style="color:' + color + ';text-transform:capitalize;">' + recinto.seguridad + '</div><div class="stat-desc">Seguridad</div></div>' +
    '</div>' +
    '<div style="margin-top:10px;font-size:11px;color:var(--text-secondary);">' +
    '<div>Latitud: ' + recinto.latitud.toFixed(4) + '</div>' +
    '<div>Longitud: ' + recinto.longitud.toFixed(4) + '</div>' +
    '</div></div>';
}

// ===== MODAL =====
function abrirModal(titulo, contenido) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-body').innerHTML = contenido;
  document.getElementById('info-modal').classList.remove('hidden');
}

function cerrarModal() {
  document.getElementById('info-modal').classList.add('hidden');
}

// ===== TOAST =====
function mostrarToast(mensaje, tipo) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (tipo || 'media');
  toast.textContent = mensaje;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== INICIO =====
document.addEventListener('DOMContentLoaded', () => {
  cargarDatos();
});
