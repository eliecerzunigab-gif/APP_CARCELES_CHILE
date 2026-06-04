// ===== PANEL DE GENDARMES =====
function cargarGendarmes() {
  fetch(`${CONFIG.API_URL}/gendarmes?activo=1`)
    .then(res => res.json())
    .then(gendarmes => {
      STATE.gendarmes = gendarmes;
      renderizarGendarmes();
    })
    .catch(err => console.error('Error cargando gendarmes:', err));
}

function renderizarGendarmes() {
  const container = document.getElementById('gendarmes-list');
  const count = document.getElementById('gendarmes-count');
  
  if (!STATE.gendarmes.length) {
    container.innerHTML = '<div class="loading">Sin gendarmes registrados</div>';
    count.textContent = '0';
    return;
  }

  count.textContent = STATE.gendarmes.length;
  
  container.innerHTML = STATE.gendarmes.map(g => {
    const enLinea = g.ultimo_heartbeat && 
      (new Date() - new Date(g.ultimo_heartbeat)) < CONFIG.GENDARME_INACTIVO_MINUTOS * 60 * 1000;
    
    return `
      <div class="list-item" onclick="centrarMapa(${g.ultima_ubicacion_lat || 0}, ${g.ultima_ubicacion_lng || 0})">
        <div class="avatar ${enLinea ? 'online' : 'offline'}">👮</div>
        <div class="info">
          <div class="name">${g.nombre} ${g.apellido}</div>
          <div class="detail">${g.cargo || 'Gendarme'} · ${g.zona_nombre || 'Sin ubicación'}</div>
        </div>
        <span class="status-dot ${enLinea ? 'online' : 'offline'}"></span>
      </div>
    `;
  }).join('');
}

// ===== PANEL DE DISPOSITIVOS =====
function cargarDispositivos() {
  fetch(`${CONFIG.API_URL}/dispositivos?activo=1`)
    .then(res => res.json())
    .then(dispositivos => {
      STATE.dispositivos = dispositivos;
      renderizarDispositivos();
    })
    .catch(err => console.error('Error cargando dispositivos:', err));
}

function renderizarDispositivos() {
  const container = document.getElementById('dispositivos-list');
  const count = document.getElementById('dispositivos-count');
  
  const noAutorizados = STATE.dispositivos.filter(d => !d.es_autorizado);
  
  if (!STATE.dispositivos.length) {
    container.innerHTML = '<div class="loading">Sin dispositivos detectados</div>';
    count.textContent = '0';
    return;
  }

  count.textContent = noAutorizados.length;
  
  container.innerHTML = STATE.dispositivos.map(d => {
    const peligroso = !d.es_autorizado;
    return `
      <div class="list-item" onclick="centrarMapa(${d.latitud || 0}, ${d.longitud || 0})">
        <div class="avatar ${peligroso ? 'danger' : 'info'}">📱</div>
        <div class="info">
          <div class="name">${d.fabricante || 'Desconocido'} ${d.modelo || ''}</div>
          <div class="detail">
            ${d.tipo_dispositivo || 'celular'} · ${d.senial_db || '-'}dB 
            ${peligroso ? '· ❌ No autorizado' : '· ✅ Autorizado'}
          </div>
        </div>
        <span class="status-dot ${peligroso ? 'offline' : 'online'}"></span>
      </div>
    `;
  }).join('');
}

// ===== PANEL DE DRONES =====
function cargarDrones() {
  fetch(`${CONFIG.API_URL}/drones`)
    .then(res => res.json())
    .then(drones => {
      STATE.drones = drones;
      renderizarDrones();
      actualizarSelectorDrones();
    })
    .catch(err => console.error('Error cargando drones:', err));
}

function renderizarDrones() {
  const container = document.getElementById('drones-list');
  const count = document.getElementById('drones-count');
  
  if (!STATE.drones.length) {
    container.innerHTML = '<div class="loading">Sin drones registrados</div>';
    count.textContent = '0';
    return;
  }

  count.textContent = STATE.drones.length;
  
  container.innerHTML = STATE.drones.map(d => {
    const estadoClass = getEstadoDronClass(d.estado);
    return `
      <div class="list-item" onclick="seleccionarDron('${d.id}')">
        <div class="avatar ${estadoClass}">🚁</div>
        <div class="info">
          <div class="name">${d.nombre}</div>
          <div class="detail">
            ${getEstadoDronIcon(d.estado)} ${d.estado} · 🔋${Math.round(d.bateria || 0)}%
          </div>
        </div>
        <span class="status-dot ${estadoClass}"></span>
      </div>
    `;
  }).join('');
}

function actualizarSelectorDrones() {
  const select = document.getElementById('dron-select');
  const currentValue = select.value;
  select.innerHTML = '<option value="">Seleccionar dron...</option>';
  
  STATE.drones.forEach(d => {
    const option = document.createElement('option');
    option.value = d.id;
    option.textContent = `${d.nombre} (${d.estado})`;
    select.appendChild(option);
  });
  
  if (currentValue) select.value = currentValue;
}

// ===== PANEL DE ALERTAS =====
function cargarAlertas() {
  fetch(`${CONFIG.API_URL}/alertas?resuelta=0&limit=20`)
    .then(res => res.json())
    .then(alertas => {
      STATE.alertas = alertas;
      renderizarAlertas();
    })
    .catch(err => console.error('Error cargando alertas:', err));
}

function renderizarAlertas() {
  const container = document.getElementById('alertas-list');
  const count = document.getElementById('alertas-count');
  
  if (!STATE.alertas.length) {
    container.innerHTML = '<div class="loading">Sin alertas activas ✅</div>';
    count.textContent = '0';
    return;
  }

  count.textContent = STATE.alertas.length;
  
  container.innerHTML = STATE.alertas.map(a => `
    <div class="alerta-item ${getSeveridadClass(a.severidad)}" 
         onclick="abrirModalAlerta('${a.id}')">
      <span class="alerta-icon">${getTipoAlertaIcon(a.tipo)}</span>
      <div class="alerta-content">
        <div class="alerta-titulo">${a.titulo}</div>
        <div class="alerta-desc">${a.descripcion || ''}</div>
        <div class="alerta-time">${formatDate(a.created_at)} · ${a.zona_nombre || ''}</div>
      </div>
    </div>
  `).join('');
}

function abrirModalAlerta(alertaId) {
  const alerta = STATE.alertas.find(a => a.id === alertaId);
  if (!alerta) return;

  const contenido = `
    <div style="margin-bottom:12px;">
      <span style="font-size:32px;">${getTipoAlertaIcon(alerta.tipo)}</span>
      <span class="badge badge-danger" style="float:right;">${alerta.severidad.toUpperCase()}</span>
    </div>
    <p><strong>${alerta.titulo}</strong></p>
    <p style="color:var(--text-secondary);">${alerta.descripcion || 'Sin descripción'}</p>
    <hr style="border-color:var(--border);margin:12px 0;">
    <div style="font-size:13px;color:var(--text-secondary);">
      <div>📍 Zona: ${alerta.zona_nombre || 'Desconocida'}</div>
      <div>⏱️ ${new Date(alerta.created_at).toLocaleString('es-CL')}</div>
      ${alerta.dispositivo_info ? `<div>📱 Dispositivo: ${alerta.dispositivo_info}</div>` : ''}
      ${alerta.gendarme_nombre ? `<div>👮 Gendarme: ${alerta.gendarme_nombre}</div>` : ''}
      ${alerta.dron_nombre ? `<div>🚁 Dron: ${alerta.dron_nombre}</div>` : ''}
    </div>
  `;

  abrirModal(alerta.titulo, contenido, alertaId);
}

// ===== FUNCIONES AUXILIARES =====
function centrarMapa(lat, lng) {
  if (lat && lng && STATE.map) {
    STATE.map.setView([lat, lng], 18);
  }
}

function actualizarHeaderStats() {
  document.getElementById('stat-recinto').querySelector('.stat-value').textContent = STATE.recintos.length;
  
  // Estos se actualizan con el dashboard
  cargarDashboardResumen();
}

// ===== INICIALIZAR PANELES =====
function initPaneles() {
  cargarGendarmes();
  cargarDispositivos();
  cargarDrones();
  cargarAlertas();
  
  // Refrescar periódicamente
  setInterval(() => {
    cargarGendarmes();
    cargarDispositivos();
    cargarDrones();
    cargarAlertas();
  }, CONFIG.REFRESH_INTERVAL);
}
