// ============================================
// SISGEN - Paneles Laterales
// ============================================

// ========== GENDARMES ==========
function actualizarGendarmes() {
  const container = document.getElementById('gendarmes-list');
  if (!container) return;
  container.innerHTML = generarListaGendarmesHTML();
  document.getElementById('gendarmes-count').textContent = STATE.gendarmes.length;
}

function generarListaGendarmesHTML() {
  if (!STATE.gendarmes.length) return '<div class="loading">Sin datos</div>';
  const filtrados = STATE.recintoActual
    ? STATE.gendarmes.filter(g => g.recinto_id == STATE.recintoActual.id)
    : STATE.gendarmes;

  return filtrados.map(g => {
    const activo = g.estado === 'activo';
    const recinto = STATE.recintos.find(r => r.id == g.recinto_id);
    const ultimoHeartbeat = g.ultimo_heartbeat ? new Date(g.ultimo_heartbeat).toLocaleTimeString() : 'N/A';
    return `<div class="panel-item" onclick="centrarMapa(${g.latitud}, ${g.longitud})">
      <span class="item-icon">👮</span>
      <div class="item-info">
        <div class="item-name">${g.nombre}</div>
        <div class="item-detail">${recinto ? recinto.nombre : '—'} · 📡 ${ultimoHeartbeat}</div>
      </div>
      <span class="item-status ${activo ? 'status-activo' : 'status-inactivo'}">${activo ? '🟢' : '🔴'}</span>
    </div>`;
  }).join('');
}

// ========== DISPOSITIVOS ==========
function actualizarDispositivos() {
  const container = document.getElementById('dispositivos-list');
  if (!container) return;
  container.innerHTML = generarListaDispositivosHTML();
  document.getElementById('dispositivos-count').textContent = STATE.dispositivos.length;
}

function generarListaDispositivosHTML() {
  if (!STATE.dispositivos.length) return '<div class="loading">Sin datos</div>';
  const filtrados = STATE.recintoActual
    ? STATE.dispositivos.filter(d => d.recinto_id == STATE.recintoActual.id)
    : STATE.dispositivos;

  // Ordenar: no autorizados primero
  const ordenados = [...filtrados].sort((a, b) => (a.autorizado === b.autorizado ? 0 : a.autorizado ? 1 : -1));

  return ordenados.map(d => {
    const autorizado = d.autorizado;
    const recinto = STATE.recintos.find(r => r.id == d.recinto_id);
    return `<div class="panel-item ${!autorizado ? 'alta' : ''}" onclick="centrarMapa(${d.latitud}, ${d.longitud})">
      <span class="item-icon">📱</span>
      <div class="item-info">
        <div class="item-name">${d.imei || 'IMEI: ' + d.id}</div>
        <div class="item-detail">${recinto ? recinto.nombre : '—'} · 📶 ${d.intensidad_senal || 0}% · 🔋 ${d.bateria || 0}%</div>
      </div>
      <span class="item-status ${autorizado ? 'status-activo' : 'status-inactivo'}">${autorizado ? '✅' : '🚫'}</span>
    </div>`;
  }).join('');
}

// ========== DRONES ==========
function actualizarDrones() {
  const container = document.getElementById('drones-list');
  if (!container) return;
  container.innerHTML = generarListaDronesHTML();
  document.getElementById('drones-count').textContent = STATE.drones.length;

  // Actualizar select de drones
  const select = document.getElementById('dron-select');
  if (select) {
    const actual = select.value;
    select.innerHTML = '<option value="">Seleccionar...</option>';
    STATE.drones.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${d.nombre || 'Dron #' + d.id} (${d.estado.replace(/_/g, ' ')})`;
      select.appendChild(opt);
    });
    if (actual) select.value = actual;
  }
}

function generarListaDronesHTML() {
  if (!STATE.drones.length) return '<div class="loading">Sin datos</div>';
  const filtrados = STATE.recintoActual
    ? STATE.drones.filter(d => d.recinto_id == STATE.recintoActual.id)
    : STATE.drones;

  return filtrados.map(d => {
    const enVuelo = d.estado === 'en_vuelo' || d.estado === 'patrullando';
    const recinto = STATE.recintos.find(r => r.id == d.recinto_id);
    return `<div class="panel-item" onclick="centrarMapa(${d.latitud}, ${d.longitud})">
      <span class="item-icon">🚁</span>
      <div class="item-info">
        <div class="item-name">${d.nombre || 'Dron #' + d.id}</div>
        <div class="item-detail">${recinto ? recinto.nombre : '—'} · 🔋 ${d.bateria || 0}% · 📏 ${d.altitud || 0}m</div>
      </div>
      <span class="item-status ${enVuelo ? 'status-en_vuelo' : 'status-en_tierra'}">${enVuelo ? '🟢' : '🔴'}</span>
    </div>`;
  }).join('');
}

// ========== ALERTAS ==========
function actualizarAlertas() {
  const container = document.getElementById('alertas-list');
  if (!container) return;
  container.innerHTML = generarListaAlertasHTML();
  const noResueltas = STATE.alertas.filter(a => !a.resuelta).length;
  document.getElementById('alertas-count').textContent = noResueltas;
}

function generarListaAlertasHTML() {
  if (!STATE.alertas.length) return '<div class="loading">Sin alertas</div>';
  const filtradas = STATE.recintoActual
    ? STATE.alertas.filter(a => a.recinto_id == STATE.recintoActual.id)
    : STATE.alertas;

  const noResueltas = filtradas.filter(a => !a.resuelta);
  const resueltas = filtradas.filter(a => a.resuelta);

  return [...noResueltas, ...resueltas].slice(0, 50).map(a => {
    const recinto = STATE.recintos.find(r => r.id == a.recinto_id);
    const nivel = a.nivel || 'media';
    const claseNivel = nivel === 'alta' ? 'alta' : nivel === 'media' ? 'media' : 'baja';
    const icono = nivel === 'alta' ? '🚨' : nivel === 'media' ? '⚠️' : 'ℹ️';
    return `<div class="panel-item ${claseNivel} ${!a.resuelta && nivel === 'alta' ? 'alerta-destacada' : ''}" onclick="mostrarDetalleAlerta('${a.id}')">
      <span class="item-icon">${icono}</span>
      <div class="item-info">
        <div class="item-name">${a.tipo}</div>
        <div class="item-detail">${recinto ? recinto.nombre : '—'}${a.zona ? ' · ' + a.zona : ''} · ${a.fecha ? new Date(a.fecha).toLocaleTimeString() : ''}</div>
      </div>
      <span class="item-status ${a.resuelta ? 'status-activo' : nivel === 'alta' ? 'status-inactivo' : 'status-pendiente'}">${a.resuelta ? '✅' : nivel === 'alta' ? '🔴' : '🟡'}</span>
    </div>`;
  }).join('');
}

function mostrarDetalleAlerta(id) {
  const alerta = STATE.alertas.find(a => a.id == id);
  if (!alerta) return;
  STATE.alertaActual = alerta;
  const recinto = STATE.recintos.find(r => r.id == alerta.recinto_id);
  const nivel = alerta.nivel || 'media';
  const icono = nivel === 'alta' ? '🚨' : nivel === 'media' ? '⚠️' : 'ℹ️';
  const contenido = `
    <p><strong>${icono} ${alerta.tipo}</strong></p>
    <p>📍 <strong>Ubicación:</strong> ${recinto ? recinto.nombre : 'Desconocido'}${alerta.zona ? ' · Zona: ' + alerta.zona : ''}</p>
    <p>📝 <strong>Descripción:</strong> ${alerta.descripcion || 'Sin descripción'}</p>
    <p>🕐 <strong>Fecha:</strong> ${alerta.fecha ? new Date(alerta.fecha).toLocaleString() : 'N/A'}</p>
    <p>⚠️ <strong>Nivel:</strong> <span style="color:${nivel === 'alta' ? '#ef4444' : nivel === 'media' ? '#eab308' : '#3b82f6'}">${nivel.toUpperCase()}</span></p>
    ${alerta.resuelta ? '<p>✅ <strong>Resuelta</strong></p>' : ''}
  `;
  mostrarModal(`🔔 Alerta #${alerta.id}`, contenido);
}

// ========== CENTRAR MAPA ==========
function centrarMapa(lat, lng) {
  if (map) {
    map.setView([lat, lng], 17);
  }
}
