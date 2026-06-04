// ===== DASHBOARD PRINCIPAL =====
// Punto de entrada principal que orquesta todo

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔒 APP CÁRCELES - Sistema de Monitoreo');
  console.log('Inicializando...');
  
  // Inicializar componentes
  initMap();
  initPaneles();
  initWebSocket();
  cargarDashboardResumen();
  
  // Refrescar dashboard periódicamente
  setInterval(cargarDashboardResumen, CONFIG.REFRESH_INTERVAL);
});

// ===== WEBSOCKET =====
function initWebSocket() {
  const statusEl = document.getElementById('connection-status');
  
  try {
    STATE.socket = io(CONFIG.WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity
    });

    STATE.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      statusEl.textContent = '● Conectado';
      statusEl.className = 'connection-status connected';
      
      // Unirse a todos los recintos
      STATE.recintos.forEach(r => {
        STATE.socket.emit('join_recinto', r.id);
      });
    });

    STATE.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      statusEl.textContent = '● Desconectado';
      statusEl.className = 'connection-status disconnected';
    });

    STATE.socket.on('connect_error', (err) => {
      console.error('Error WebSocket:', err.message);
      statusEl.textContent = '● Reconectando...';
      statusEl.className = 'connection-status connecting';
    });

    // Eventos en tiempo real
    STATE.socket.on('gendarme_ubicacion', (data) => {
      actualizarMarcadorGendarme(data);
      actualizarListaGendarme(data);
    });

    STATE.socket.on('dispositivo_actualizado', (data) => {
      cargarDispositivos(); // Recargar lista
      cargarDatosMapa(); // Actualizar mapa
    });

    STATE.socket.on('dron_ubicacion', (data) => {
      actualizarMarcadorDron(data);
      actualizarInfoDron(data);
    });

    STATE.socket.on('nueva_alerta', (data) => {
      console.log('🔔 Nueva alerta:', data.titulo);
      agregarAlertaMapa(data);
      cargarAlertas();
      cargarDashboardResumen();
      
      // Mostrar notificación toast
      const severidad = data.severidad || 'critica';
      mostrarToast(`
        <strong>${getTipoAlertaIcon(data.tipo)} ${data.titulo}</strong><br>
        <span style="font-size:12px;">${data.descripcion || ''}</span>
      `, severidad);
    });

    STATE.socket.on('alerta_resuelta', (data) => {
      eliminarAlertaMapa(data);
      cargarAlertas();
      cargarDashboardResumen();
    });

    STATE.socket.on('dron_comando_recibido', (data) => {
      mostrarToast(`🚁 Comando '${data.comando}' ejecutado en dron`, 'media');
      cargarDrones();
      cargarDatosMapa();
    });

  } catch (err) {
    console.error('Error inicializando WebSocket:', err);
    statusEl.textContent = '● No disponible';
    statusEl.className = 'connection-status disconnected';
  }
}

// ===== DASHBOARD RESUMEN =====
async function cargarDashboardResumen() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/dashboard/resumen`);
    const data = await res.json();

    // Header stats
    document.querySelector('#stat-gendarmes .stat-value').textContent = data.gendarmes?.activos || 0;
    document.querySelector('#stat-dispositivos .stat-value').textContent = data.dispositivos?.activos || 0;
    document.querySelector('#stat-alertas .stat-value').textContent = data.alertas?.activas || 0;
    document.querySelector('#stat-drones .stat-value').textContent = (data.drones?.activos || 0) + (data.drones?.en_base || 0);

    // Stats cards
    document.getElementById('stat-gendarmes-activos').textContent = data.gendarmes?.activos || 0;
    document.getElementById('stat-gendarmes-inactivos').textContent = data.gendarmes?.inactivos || 0;
    document.getElementById('stat-dispositivos-no-autorizados').textContent = data.dispositivos?.no_autorizados || 0;
    document.getElementById('stat-drones-vuelo').textContent = data.drones?.activos || 0;

  } catch (err) {
    console.error('Error cargando dashboard resumen:', err);
  }
}

// ===== CONTROL DE DRONES =====
function seleccionarDron(dronId) {
  const select = document.getElementById('dron-select');
  select.value = dronId;
  actualizarInfoDronPorId(dronId);
}

document.getElementById('dron-select').addEventListener('change', (e) => {
  if (e.target.value) {
    actualizarInfoDronPorId(e.target.value);
  } else {
    deshabilitarBotonesDron();
  }
});

function actualizarInfoDronPorId(dronId) {
  const dron = STATE.drones.find(d => d.id === dronId);
  if (!dron) return;

  STATE.dronSeleccionado = dron;
  
  document.getElementById('dron-estado').textContent = `${getEstadoDronIcon(dron.estado)} ${dron.estado}`;
  document.getElementById('dron-bateria').textContent = `${Math.round(dron.bateria || 0)}%`;
  document.getElementById('dron-altitud').textContent = `${Math.round(dron.altitud || 0)}m`;
  document.getElementById('dron-velocidad').textContent = `${Math.round(dron.velocidad || 0)} km/h`;

  // Habilitar/deshabilitar botones según estado
  const btns = document.querySelectorAll('.btn-dron');
  btns.forEach(b => b.disabled = false);

  document.querySelector('.btn-despegar').disabled = dron.estado !== 'en_base';
  document.querySelector('.btn-aterrizar').disabled = !['en_vuelo', 'despegando', 'patrulla'].includes(dron.estado);
  document.querySelector('.btn-patrulla').disabled = dron.estado !== 'en_base';
  document.querySelector('.btn-regresar').disabled = !['en_vuelo', 'despegando', 'patrulla'].includes(dron.estado);
  document.querySelector('.btn-camara').disabled = !['en_vuelo', 'despegando', 'patrulla'].includes(dron.estado);

  // Centrar mapa en el dron
  if (dron.latitud && dron.longitud) {
    centrarMapa(dron.latitud, dron.longitud);
  }
}

function deshabilitarBotonesDron() {
  document.querySelectorAll('.btn-dron').forEach(b => b.disabled = true);
  document.getElementById('dron-estado').textContent = '-';
  document.getElementById('dron-bateria').textContent = '-';
  document.getElementById('dron-altitud').textContent = '-';
  document.getElementById('dron-velocidad').textContent = '-';
  STATE.dronSeleccionado = null;
}

function actualizarInfoDron(data) {
  if (STATE.dronSeleccionado && STATE.dronSeleccionado.id === data.dron_id) {
    STATE.dronSeleccionado.latitud = data.latitud;
    STATE.dronSeleccionado.longitud = data.longitud;
    STATE.dronSeleccionado.altitud = data.altitud;
    STATE.dronSeleccionado.velocidad = data.velocidad;
    STATE.dronSeleccionado.bateria = data.bateria;
    
    document.getElementById('dron-bateria').textContent = `${Math.round(data.bateria || 0)}%`;
    document.getElementById('dron-altitud').textContent = `${Math.round(data.altitud || 0)}m`;
    document.getElementById('dron-velocidad').textContent = `${Math.round(data.velocidad || 0)} km/h`;
  }
}

function actualizarListaGendarme(data) {
  // Actualizar gendarme en la lista si existe
  const items = document.querySelectorAll('#gendarmes-list .list-item');
  // No recargamos toda la lista para mantener rendimiento
  // La recarga periódica se encargará de actualizar
}

function comandoDron(comando) {
  if (!STATE.dronSeleccionado) {
    mostrarToast('❌ Seleccione un dron primero', 'alta');
    return;
  }

  const dronId = STATE.dronSeleccionado.id;
  const recintoId = STATE.dronSeleccionado.recinto_id;

  if (STATE.socket && STATE.socket.connected) {
    STATE.socket.emit('dron_comando', {
      dron_id: dronId,
      comando: comando,
      recinto_id: recintoId
    });
    mostrarToast(`🚁 Enviando comando '${comando}' al dron...`, 'media');
  } else {
    // Fallback a API REST
    fetch(`${CONFIG.API_URL}/drones/${dronId}/comando`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comando })
    })
    .then(res => res.json())
    .then(data => {
      mostrarToast(`✅ ${data.message}`, 'baja');
      cargarDrones();
      cargarDatosMapa();
    })
    .catch(err => {
      mostrarToast(`❌ Error: ${err.message}`, 'critica');
    });
  }
}
