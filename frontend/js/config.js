// ===== CONFIGURACIÓN =====
const CONFIG = {
  API_URL: window.location.origin + '/api',
  WS_URL: window.location.origin,
  RECINTO_DEFAULT: null, // null = todos
  REFRESH_INTERVAL: 15000, // 15 segundos
  // Vista Nacional de Chile
  MAP_CENTER: [-33.4489, -70.6693], // Santiago centro
  MAP_ZOOM: 6, // Zoom para ver todo Chile
  MAP_ZOOM_RECINTO: 16, // Zoom al seleccionar un recinto
  MAP_MAX_ZOOM: 19,
  MAP_MIN_ZOOM: 5,
  GENDARME_INACTIVO_MINUTOS: 5,
  // Límites de Chile continental
  CHILE_BOUNDS: {
    north: -17.5,
    south: -56.0,
    west: -76.0,
    east: -66.0
  }
};

// ===== ESTADO GLOBAL =====
const STATE = {
  socket: null,
  recintos: [],
  zonas: [],
  gendarmes: [],
  dispositivos: [],
  drones: [],
  alertas: [],
  markers: {
    gendarmes: {},
    dispositivos: {},
    drones: {},
    alertas: {},
    zonas: {},
    recintos: {}
  },
  layers: {
    gendarmes: null,
    dispositivos: null,
    drones: null,
    alertas: null,
    zonas: null,
    recintos: null,
    recintoPoligonos: null
  },
  map: null,
  currentAlertaId: null,
  dronSeleccionado: null,
  vistaActual: 'nacional', // 'nacional' | 'recinto'
  recintoActivo: null
};

// ===== UTILIDADES =====
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function getSeveridadClass(severidad) {
  const map = { critica: 'critica', alta: 'alta', media: 'media', baja: 'baja' };
  return map[severidad] || 'media';
}

function getEstadoDronClass(estado) {
  const map = {
    'en_base': 'online',
    'en_vuelo': 'online',
    'despegando': 'warning',
    'regresando': 'warning',
    'patrulla': 'online',
    'cargando': 'warning',
    'mantenimiento': 'offline',
    'perdido': 'offline'
  };
  return map[estado] || 'offline';
}

function getEstadoDronIcon(estado) {
  const map = {
    'en_base': '🅿️',
    'en_vuelo': '✈️',
    'despegando': '🛫',
    'regresando': '🛬',
    'patrulla': '🔄',
    'cargando': '🔋',
    'mantenimiento': '🔧',
    'perdido': '❌'
  };
  return map[estado] || '🚁';
}

function getTipoAlertaIcon(tipo) {
  const map = {
    'celular_no_autorizado': '📱',
    'celular_autorizado_zona_restringida': '📱⚠️',
    'gendarme_inactivo': '👮⚠️',
    'gendarme_fuera_zona': '👮🚶',
    'dron_detectado': '🚁',
    'movimiento_sospechoso': '👤',
    'puerta_abierta': '🚪',
    'alarma_general': '🔔',
    'dron_activo': '🚁✅',
    'dron_bateria_baja': '🔋⚠️',
    'dron_perdido': '🚁❌'
  };
  return map[tipo] || '🔔';
}

// ===== TOAST NOTIFICATIONS =====
function mostrarToast(mensaje, severidad = 'media') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${getSeveridadClass(severidad)}`;
  toast.innerHTML = mensaje;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ===== MODAL =====
function abrirModal(titulo, contenido, alertaId = null) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-body').innerHTML = contenido;
  document.getElementById('alerta-modal').classList.remove('hidden');
  STATE.currentAlertaId = alertaId;
}

function cerrarModal() {
  document.getElementById('alerta-modal').classList.add('hidden');
  STATE.currentAlertaId = null;
}

function resolverAlerta() {
  if (!STATE.currentAlertaId) return;
  
  if (STATE.socket && STATE.socket.connected) {
    STATE.socket.emit('resolver_alerta', {
      alerta_id: STATE.currentAlertaId,
      resuelta_por: 'Operador Dashboard'
    });
    mostrarToast('✅ Alerta resuelta', 'baja');
  } else {
    fetch(`${CONFIG.API_URL}/alertas/${STATE.currentAlertaId}/resolver`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resuelta_por: 'Operador Dashboard' })
    }).then(() => {
      mostrarToast('✅ Alerta resuelta', 'baja');
      cargarAlertas();
    }).catch(err => {
      mostrarToast('❌ Error al resolver alerta', 'critica');
    });
  }
  cerrarModal();
}

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModal();
});
