// ============================================
// SISGEN - App Principal
// ============================================

// Estado global
const STATE = {
  socket: null,
  connected: false,
  recintos: [],
  gendarmes: [],
  dispositivos: [],
  drones: [],
  alertas: [],
  recintoActual: null,
  alertaActual: null,
  dronSeleccionado: null,
  chart: null,
  heatmapLayer: null,
  heatmapActive: false,
  sonidoActivo: true
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando SISGEN...');
  
  // 1. Inicializar el mapa primero (esperar a que esté listo)
  await inicializarMapa();
  console.log('🗺️ Mapa listo');
  
  // 2. Configurar eventos
  setupEventListeners();
  
  // 3. Cargar datos
  if (CONFIG.ES_GITHUB_PAGES) {
    // Modo GitHub Pages - usar datos simulados
    console.log('🌐 Modo GitHub Pages - usando datos simulados');
    updateConnectionStatus('connected', '● Datos simulados');
    cargarDatosSimulados();
  } else {
    // Modo normal con backend
    initSocket();
    cargarRecintos();
  }
});

// ========== SOCKET.IO ==========
function initSocket() {
  STATE.socket = io(CONFIG.SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity
  });

  STATE.socket.on('connect', () => {
    STATE.connected = true;
    updateConnectionStatus('connected', '● Conectado');
    console.log('✅ Conectado al servidor');
    cargarDatosIniciales();
  });

  STATE.socket.on('disconnect', () => {
    STATE.connected = false;
    updateConnectionStatus('disconnected', '● Desconectado');
    console.log('❌ Desconectado del servidor');
  });

  STATE.socket.on('connect_error', (err) => {
    updateConnectionStatus('connecting', '● Reconectando...');
    console.log('⚠️ Error de conexión:', err.message);
  });

  // Eventos de datos
  STATE.socket.on('datos_iniciales', (data) => {
    console.log('📦 Datos iniciales recibidos');
    if (data.recintos) STATE.recintos = data.recintos;
    if (data.gendarmes) STATE.gendarmes = data.gendarmes;
    if (data.dispositivos) STATE.dispositivos = data.dispositivos;
    if (data.drones) STATE.drones = data.drones;
    if (data.alertas) STATE.alertas = data.alertas;
    actualizarTodo();
  });

  STATE.socket.on('actualizacion_gendarmes', (data) => {
    STATE.gendarmes = data;
    actualizarGendarmes();
  });

  STATE.socket.on('actualizacion_dispositivos', (data) => {
    STATE.dispositivos = data;
    actualizarDispositivos();
  });

  STATE.socket.on('actualizacion_drones', (data) => {
    STATE.drones = data;
    actualizarDrones();
  });

  STATE.socket.on('nueva_alerta', (alerta) => {
    STATE.alertas.unshift(alerta);
    if (STATE.alertas.length > 100) STATE.alertas.pop();
    mostrarAlertaToast(alerta);
    actualizarAlertas();
    actualizarHeaderStats();
    actualizarDashboard();
    if (STATE.sonidoActivo && alerta.nivel === 'alta') {
      reproducirAlertaSonido();
    }
  });

  STATE.socket.on('alerta_resuelta', (id) => {
    const idx = STATE.alertas.findIndex(a => a.id === id);
    if (idx !== -1) {
      STATE.alertas[idx].resuelta = true;
      STATE.alertas[idx].fecha_resolucion = new Date().toISOString();
      actualizarAlertas();
      actualizarHeaderStats();
      actualizarDashboard();
    }
  });

  STATE.socket.on('comando_dron_respuesta', (resp) => {
    console.log('🚁 Respuesta dron:', resp);
    if (resp.error) {
      mostrarToast('⚠️ ' + resp.error, 'warning');
    } else {
      mostrarToast('✅ ' + resp.mensaje, 'success');
    }
  });
}

// ========== CARGA DE DATOS ==========
async function cargarDatosIniciales() {
  try {
    const [recintos, gendarmes, dispositivos, drones, alertas] = await Promise.all([
      fetchAPI('/api/recintos'),
      fetchAPI('/api/gendarmes'),
      fetchAPI('/api/dispositivos'),
      fetchAPI('/api/drones'),
      fetchAPI('/api/alertas')
    ]);
    if (recintos) STATE.recintos = recintos;
    if (gendarmes) STATE.gendarmes = gendarmes;
    if (dispositivos) STATE.dispositivos = dispositivos;
    if (drones) STATE.drones = drones;
    if (alertas) STATE.alertas = alertas;
    actualizarTodo();
  } catch (err) {
    console.error('Error cargando datos iniciales:', err);
  }
}

async function cargarRecintos() {
  try {
    const data = await fetchAPI('/api/recintos');
    if (data) {
      STATE.recintos = data;
      llenarSelectRecintos();
    }
  } catch (err) {
    console.error('Error cargando recintos:', err);
  }
}

async function fetchAPI(path) {
  try {
    const res = await fetch(`${CONFIG.API_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error en ${path}:`, err);
    return null;
  }
}

// ========== ACTUALIZACIONES ==========
function actualizarTodo() {
  llenarSelectRecintos();
  actualizarGendarmes();
  actualizarDispositivos();
  actualizarDrones();
  actualizarAlertas();
  actualizarHeaderStats();
  actualizarDashboard();
  actualizarMapa();
}

function actualizarHeaderStats() {
  document.getElementById('stat-recinto').querySelector('.stat-value').textContent = STATE.recintos.length;
  document.getElementById('stat-gendarmes').querySelector('.stat-value').textContent = STATE.gendarmes.length;
  document.getElementById('stat-dispositivos').querySelector('.stat-value').textContent = STATE.dispositivos.length;
  document.getElementById('stat-alertas').querySelector('.stat-value').textContent = STATE.alertas.filter(a => !a.resuelta).length;
  document.getElementById('stat-drones').querySelector('.stat-value').textContent = STATE.drones.length;
}

function llenarSelectDrones() {
  const select = document.getElementById('dron-select');
  if (!select) return;
  const actual = select.value;
  select.innerHTML = '<option value="">Seleccionar dron...</option>';
  STATE.drones.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    const icono = d.estado === 'en_vuelo' || d.estado === 'patrullando' ? '🛸' : '🚁';
    opt.textContent = `${icono} ${d.nombre} - ${d.recinto_nombre}`;
    select.appendChild(opt);
  });
  if (actual) select.value = actual;
}

// ========== SELECT RECINTOS ==========
function llenarSelectRecintos() {
  const select = document.getElementById('recinto-select');
  if (!select) return;
  const actual = select.value;
  select.innerHTML = '<option value="">🇨🇱 Todos</option>';
  STATE.recintos.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.nombre} (${r.region})`;
    select.appendChild(opt);
  });
  if (actual) select.value = actual;
}

// ========== EVENTOS ==========
function setupEventListeners() {
  document.getElementById('recinto-select')?.addEventListener('change', (e) => {
    const id = e.target.value;
    if (id) {
      STATE.recintoActual = STATE.recintos.find(r => r.id == id);
      if (!STATE.recintoActual) {
        console.error('Recinto no encontrado:', id);
        return;
      }
      document.getElementById('btn-vista-nacional').style.display = 'inline-block';
      document.getElementById('vista-indicator').textContent = `📍 ${STATE.recintoActual.nombre}`;
      document.getElementById('vista-indicator').className = 'vista-indicator recinto';
      // Mostrar toast con información del recinto
      const gendarmes = STATE.gendarmes.filter(g => g.recinto_id == id).length;
      const dispositivos = STATE.dispositivos.filter(d => d.recinto_id == id).length;
      const drones = STATE.drones.filter(d => d.recinto_id == id).length;
      const alertas = STATE.alertas.filter(a => a.recinto_id == id && !a.resuelta).length;
      mostrarToast(`📍 <strong>${STATE.recintoActual.nombre}</strong><br>👮 ${gendarmes} gendarmes · 📱 ${dispositivos} disp. · 🚁 ${drones} drones · 🔔 ${alertas} alertas`, 'info', 5000);
      // Actualizar paneles laterales con la info del recinto seleccionado
      actualizarGendarmes();
      actualizarDispositivos();
      actualizarDrones();
      actualizarAlertas();
    } else {
      STATE.recintoActual = null;
      document.getElementById('btn-vista-nacional').style.display = 'none';
      document.getElementById('vista-indicator').textContent = '🇨🇱 Vista Nacional';
      document.getElementById('vista-indicator').className = 'vista-indicator nacional';
      // Volver a mostrar todos los datos en los paneles
      actualizarGendarmes();
      actualizarDispositivos();
      actualizarDrones();
      actualizarAlertas();
    }
    actualizarMapa();
  });

  document.getElementById('btn-vista-nacional')?.addEventListener('click', () => {
    document.getElementById('recinto-select').value = '';
    document.getElementById('recinto-select').dispatchEvent(new Event('change'));
  });

  // Toggles
  ['gendarmes', 'dispositivos', 'drones', 'alertas', 'zonas', 'heatmap'].forEach(t => {
    document.getElementById(`toggle-${t}`)?.addEventListener('change', () => {
      if (t === 'heatmap') {
        STATE.heatmapActive = document.getElementById('toggle-heatmap').checked;
        toggleHeatmap();
      } else {
        actualizarMapa();
      }
    });
  });

  // Dron select
  document.getElementById('dron-select')?.addEventListener('change', (e) => {
    const id = e.target.value;
    STATE.dronSeleccionado = id ? STATE.drones.find(d => d.id == id) : null;
    actualizarControlDron();
  });
}

// ========== CONEXIÓN ==========
function updateConnectionStatus(className, text) {
  const el = document.getElementById('connection-status');
  if (el) {
    el.className = 'connection-status ' + className;
    el.textContent = text;
  }
}

// ========== TOAST ==========
function mostrarToast(mensaje, tipo = 'info', duracion = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  const iconos = { danger: '🔴', warning: '⚠️', info: 'ℹ️', success: '✅' };
  toast.innerHTML = `<span>${iconos[tipo] || 'ℹ️'}</span><span>${mensaje}</span>`;
  toast.onclick = () => toast.remove();
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duracion);
}

// ========== MODAL ==========
function mostrarModal(titulo, contenido) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-body').innerHTML = contenido;
  document.getElementById('alerta-modal').classList.remove('hidden');
}

function cerrarModal() {
  document.getElementById('alerta-modal').classList.add('hidden');
  STATE.alertaActual = null;
}

function resolverAlerta() {
  if (STATE.alertaActual) {
    fetchAPI(`/api/alertas/${STATE.alertaActual.id}/resolver`, { method: 'POST' });
    mostrarToast('✅ Alerta resuelta', 'success');
    cerrarModal();
  }
}

// ========== ALERTA SONIDO ==========
function reproducirAlertaSonido() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => {
      osc.frequency.value = 660;
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 200);
    }, 200);
  } catch (e) { /* silencio */ }
}

// ========== ALERTA TOAST ==========
function mostrarAlertaToast(alerta) {
  const nivel = alerta.nivel || 'media';
  const tipo = nivel === 'alta' ? 'danger' : nivel === 'media' ? 'warning' : 'info';
  const icono = nivel === 'alta' ? '🚨' : nivel === 'media' ? '⚠️' : 'ℹ️';
  const recinto = STATE.recintos.find(r => r.id == alerta.recinto_id);
  const ubicacion = alerta.ubicacion || (recinto ? recinto.nombre : 'Desconocida');
  const msg = `${icono} <strong>${alerta.tipo}</strong><br><small>${ubicacion}${alerta.zona ? ' · Zona: ' + alerta.zona : ''}</small>`;
  mostrarToast(msg, tipo, 8000);
}

// ========== DRON CONTROL ==========
function actualizarControlDron() {
  const dron = STATE.dronSeleccionado;
  const btns = document.querySelectorAll('.btn-dron');
  if (!dron) {
    document.getElementById('dron-estado').textContent = '-';
    document.getElementById('dron-bateria').textContent = '-';
    document.getElementById('dron-altitud').textContent = '-';
    document.getElementById('dron-velocidad').textContent = '-';
    btns.forEach(b => b.disabled = true);
    return;
  }
  document.getElementById('dron-estado').textContent = dron.estado.replace(/_/g, ' ');
  document.getElementById('dron-bateria').textContent = (dron.bateria || 0) + '%';
  document.getElementById('dron-altitud').textContent = (dron.altitud || 0) + 'm';
  document.getElementById('dron-velocidad').textContent = (dron.velocidad || 0) + 'km/h';

  const enVuelo = dron.estado === 'en_vuelo' || dron.estado === 'patrullando';
  document.querySelector('.btn-despegar').disabled = enVuelo;
  document.querySelector('.btn-aterrizar').disabled = !enVuelo;
  document.querySelector('.btn-patrulla').disabled = !enVuelo;
  document.querySelector('.btn-regresar').disabled = !enVuelo;
  document.querySelector('.btn-camara').disabled = false;
  document.querySelector('.btn-lanzar').disabled = false;
}

function comandoDron(comando) {
  if (!STATE.dronSeleccionado) {
    mostrarToast('⚠️ Selecciona un dron primero', 'warning');
    return;
  }
  const dron = STATE.dronSeleccionado;
  
  // Simular comando localmente
  switch(comando) {
    case 'despegar':
      if (dron.estado === 'en_tierra') {
        dron.estado = 'en_vuelo';
        dron.altitud = 20;
        dron.velocidad = 5;
        mostrarToast(`🚁 ${dron.nombre} despegando...`, 'success');
      }
      break;
    case 'aterrizar':
      if (dron.estado !== 'en_tierra') {
        dron.estado = 'en_tierra';
        dron.altitud = 0;
        dron.velocidad = 0;
        mostrarToast(`🛬 ${dron.nombre} aterrizando...`, 'info');
      }
      break;
    case 'iniciar_patrulla':
      if (dron.estado !== 'en_tierra') {
        dron.estado = 'patrullando';
        dron.velocidad = 8;
        mostrarToast(`🔄 ${dron.nombre} iniciando patrulla...`, 'info');
      }
      break;
    case 'regresar_base':
      if (dron.estado !== 'en_tierra') {
        dron.estado = 'en_vuelo';
        dron.velocidad = 12;
        // Volver al centro del recinto
        const recinto = STATE.recintos.find(r => r.id == dron.recinto_id);
        if (recinto) {
          dron.latitud = recinto.latitud;
          dron.longitud = recinto.longitud;
        }
        mostrarToast(`🏠 ${dron.nombre} regresando a base...`, 'info');
      }
      break;
    case 'activar_camara':
      mostrarToast(`📷 Cámara de ${dron.nombre} activada`, 'info');
      break;
  }
  actualizarControlDron();
  actualizarDrones();
  actualizarMapa();
}

function lanzarDronEmergencia() {
  if (!STATE.recintoActual) {
    mostrarToast('⚠️ Selecciona un recinto primero', 'warning');
    return;
  }
  // Crear un nuevo dron en el recinto actual
  const recinto = STATE.recintoActual;
  const numDrones = STATE.drones.filter(d => d.recinto_id == recinto.id).length;
  const nuevoDron = {
    id: `dr_emergencia_${Date.now()}`,
    nombre: `Emergencia-${numDrones + 1}`,
    recinto_id: recinto.id,
    recinto_nombre: recinto.nombre,
    estado: 'en_vuelo',
    latitud: recinto.latitud + (Math.random() - 0.5) * 0.002,
    longitud: recinto.longitud + (Math.random() - 0.5) * 0.002,
    altitud: 30,
    velocidad: 10,
    bateria: 100,
    modelo: 'DJI Matrice 30T',
    activo: true
  };
  STATE.drones.push(nuevoDron);
  mostrarToast(`🚀 Dron de emergencia lanzado en ${recinto.nombre}`, 'success');
  actualizarDrones();
  actualizarMapa();
  actualizarHeaderStats();
  llenarSelectDrones();
}

// ========== MOBILE ==========
function toggleMobilePanel(tipo) {
  const overlay = document.getElementById('mobile-panel');
  const btns = document.querySelectorAll('.mobile-bottom-bar button');
  btns.forEach(b => b.classList.remove('active'));
  document.getElementById(`mbtn-${tipo}`).classList.add('active');

  if (overlay.classList.contains('open') && overlay.dataset.tipo === tipo) {
    overlay.classList.remove('open');
    return;
  }

  overlay.dataset.tipo = tipo;
  overlay.innerHTML = '';
  overlay.classList.add('open');

  switch(tipo) {
    case 'gendarmes':
      overlay.innerHTML = generarListaGendarmesHTML();
      break;
    case 'dispositivos':
      overlay.innerHTML = generarListaDispositivosHTML();
      break;
    case 'drones':
      overlay.innerHTML = generarListaDronesHTML();
      break;
    case 'alertas':
      overlay.innerHTML = generarListaAlertasHTML();
      break;
    case 'stats':
      overlay.innerHTML = `<div class="stats-grid">
        <div class="stat-card"><div class="stat-number">${STATE.gendarmes.filter(g => g.estado === 'activo').length}</div><div class="stat-desc">Gendarmes Activos</div></div>
        <div class="stat-card stat-warning"><div class="stat-number">${STATE.gendarmes.filter(g => g.estado !== 'activo').length}</div><div class="stat-desc">Sin Señal</div></div>
        <div class="stat-card stat-danger"><div class="stat-number">${STATE.dispositivos.filter(d => !d.autorizado).length}</div><div class="stat-desc">No Autorizados</div></div>
        <div class="stat-card stat-info"><div class="stat-number">${STATE.drones.filter(d => d.estado === 'en_vuelo' || d.estado === 'patrullando').length}</div><div class="stat-desc">Drones en Vuelo</div></div>
      </div>`;
      break;
  }
}

// ========== DATOS SIMULADOS (GitHub Pages) ==========
// Simulación en tiempo real con movimiento realista
function cargarDatosSimulados() {
  STATE.recintos = DATOS_SIMULADOS.recintos;
  STATE.gendarmes = DATOS_SIMULADOS.gendarmes;
  STATE.dispositivos = DATOS_SIMULADOS.dispositivos;
  STATE.drones = DATOS_SIMULADOS.drones;
  STATE.alertas = DATOS_SIMULADOS.alertas;
  STATE.zonas = DATOS_SIMULADOS.zonas || [];
  actualizarTodo();
  llenarSelectDrones();
  console.log('✅ Datos simulados cargados');

  // ===== SIMULACIÓN DE GENDARMES (cada 4s) =====
  // Movimiento con destino: cada gendarme se mueve hacia un punto dentro de su recinto
  setInterval(() => {
    STATE.gendarmes.forEach(g => {
      if (g.estado !== 'activo') return;
      
      // Si no tiene destino o llegó, asignar nuevo destino aleatorio dentro del recinto
      if (!g._destino_lat || !g._destino_lng || 
          (Math.abs(g.latitud - g._destino_lat) < 0.0001 && 
           Math.abs(g.longitud - g._destino_lng) < 0.0001)) {
        const recinto = STATE.recintos.find(r => r.id == g.recinto_id);
        if (recinto) {
          g._destino_lat = recinto.latitud + (Math.random() - 0.5) * 0.004;
          g._destino_lng = recinto.longitud + (Math.random() - 0.5) * 0.004;
        }
      }
      
      // Moverse hacia el destino
      if (g._destino_lat && g._destino_lng) {
        const dx = g._destino_lat - g.latitud;
        const dy = g._destino_lng - g.longitud;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.0001) {
          const velocidad = 0.00015 + Math.random() * 0.0001;
          g.latitud += (dx / dist) * velocidad;
          g.longitud += (dy / dist) * velocidad;
        }
      }
      
      // Variar batería ligeramente
      g.bateria = Math.max(10, Math.min(100, g.bateria + (Math.random() - 0.5) * 2));
    });
    actualizarGendarmes();
    actualizarMapa();
  }, 4000);

  // ===== SIMULACIÓN DE DRONES (cada 2.5s) =====
  // Drones en patrulla vuelan en círculo alrededor del recinto
  setInterval(() => {
    STATE.drones.forEach(d => {
      if (d.estado === 'en_tierra') return;
      
      const recinto = STATE.recintos.find(r => r.id == d.recinto_id);
      if (!recinto) return;
      
      if (d.estado === 'patrullando') {
        // Vuelo circular alrededor del recinto
        d._patrulla_angulo = (d._patrulla_angulo || 0) + 0.05;
        const radio = 0.003;
        d.latitud = recinto.latitud + Math.sin(d._patrulla_angulo) * radio;
        d.longitud = recinto.longitud + Math.cos(d._patrulla_angulo) * radio;
        d.altitud = 25 + Math.sin(d._patrulla_angulo * 2) * 10;
        d.velocidad = 6 + Math.sin(d._patrulla_angulo * 3) * 2;
      } else if (d.estado === 'en_vuelo') {
        // Vuelo libre - movimiento aleatorio suave
        d.latitud += (Math.random() - 0.5) * 0.0008;
        d.longitud += (Math.random() - 0.5) * 0.0008;
        d.altitud = Math.max(5, d.altitud + (Math.random() - 0.5) * 5);
        d.velocidad = 4 + Math.random() * 4;
      }
      
      // Consumo de batería
      d.bateria = Math.max(0, d.bateria - 0.1 - Math.random() * 0.2);
      
      // Si batería baja, aterrizar automáticamente
      if (d.bateria < 5 && d.estado !== 'en_tierra') {
        d.estado = 'en_tierra';
        d.altitud = 0;
        d.velocidad = 0;
        mostrarToast(`🪫 ${d.nombre} aterrizó por batería baja`, 'warning');
      }
    });
    actualizarDrones();
    actualizarMapa();
    actualizarControlDron();
  }, 2500);

  // ===== SIMULACIÓN DE DISPOSITIVOS (cada 8s) =====
  // Dispositivos se mueven y cambian señal, algunos se detectan como nuevos
  setInterval(() => {
    STATE.dispositivos.forEach(d => {
      if (!d.activo) return;
      // Movimiento suave
      d.latitud += (Math.random() - 0.5) * 0.0003;
      d.longitud += (Math.random() - 0.5) * 0.0003;
      // Variar señal
      d.senial_db = Math.max(-100, Math.min(-40, d.senial_db + (Math.random() - 0.5) * 5));
      d.intensidad_senal = Math.min(100, Math.max(10, (d.senial_db + 90) * 2.5));
      d.ultima_deteccion = new Date().toISOString();
    });
    actualizarDispositivos();
    actualizarMapa();
  }, 8000);

  // ===== NUEVAS ALERTAS CADA 20-40s =====
  // Simula detección de celulares no autorizados con ubicación exacta
  function generarNuevaAlerta() {
    const recinto = STATE.recintos[Math.floor(Math.random() * STATE.recintos.length)];
    const zonas = STATE.zonas ? STATE.zonas.filter(z => z.recinto_id === recinto.id) : [];
    const zona = zonas.length > 0 ? zonas[Math.floor(Math.random() * zonas.length)] : null;
    
    const tiposAlerta = [
      { tipo: '📱 Celular no autorizado', nivel: 'alta', prob: 0.4 },
      { tipo: '⚠️ Movimiento sospechoso', nivel: 'media', prob: 0.25 },
      { tipo: '🔴 Intento de fuga', nivel: 'alta', prob: 0.1 },
      { tipo: '🔊 Ruido excesivo', nivel: 'baja', prob: 0.15 },
      { tipo: '🚪 Puerta de seguridad abierta', nivel: 'alta', prob: 0.1 }
    ];
    
    // Elegir tipo basado en probabilidad
    let r = Math.random();
    let tipoElegido = tiposAlerta[0];
    for (const t of tiposAlerta) {
      if (r < t.prob) { tipoElegido = t; break; }
      r -= t.prob;
    }
    
    const lat = zona ? zona.latitud + (Math.random() - 0.5) * 0.0005 : recinto.latitud + (Math.random() - 0.5) * 0.002;
    const lng = zona ? zona.longitud + (Math.random() - 0.5) * 0.0005 : recinto.longitud + (Math.random() - 0.5) * 0.002;
    
    const nuevaAlerta = {
      id: `al_sim_${Date.now()}`,
      recinto_id: recinto.id,
      recinto_nombre: recinto.nombre,
      tipo: tipoElegido.tipo,
      nivel: tipoElegido.nivel,
      severidad: tipoElegido.nivel === 'alta' ? 'critica' : tipoElegido.nivel,
      descripcion: `${tipoElegido.tipo} detectado en ${zona ? zona.nombre : recinto.nombre}`,
      zona: zona ? zona.codigo : '?',
      zona_nombre: zona ? zona.nombre : recinto.nombre,
      latitud: lat,
      longitud: lng,
      fecha: new Date().toISOString(),
      resuelta: false
    };
    
    STATE.alertas.unshift(nuevaAlerta);
    if (STATE.alertas.length > 150) STATE.alertas.pop();
    
    mostrarAlertaToast(nuevaAlerta);
    actualizarAlertas();
    actualizarHeaderStats();
    actualizarDashboard();
    
    if (STATE.sonidoActivo && tipoElegido.nivel === 'alta') {
      reproducirAlertaSonido();
    }
  }

  // Primera alerta a los 10s, luego cada 20-40s
  setTimeout(generarNuevaAlerta, 10000);
  setInterval(generarNuevaAlerta, 20000 + Math.random() * 20000);

  // ===== ACTUALIZAR SELECT DE DRONES CADA 5s =====
  setInterval(() => {
    llenarSelectDrones();
  }, 5000);
}

// ========== EXPORTAR FUNCIONES GLOBALES ==========
window.mostrarToast = mostrarToast;
window.mostrarModal = mostrarModal;
window.cerrarModal = cerrarModal;
window.resolverAlerta = resolverAlerta;
window.comandoDron = comandoDron;
window.lanzarDronEmergencia = lanzarDronEmergencia;
window.toggleMobilePanel = toggleMobilePanel;
