// ============================================
// SISGEN - Configuración Global
// ============================================

const CONFIG = {
  // API URL - auto detecta si está en producción o desarrollo
  get API_URL() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    // En producción (GitHub Pages, etc.), asume que el backend está en Render
    return 'https://app-carceles-chile.onrender.com';
  },

  // Socket URL
  get SOCKET_URL() {
    return this.API_URL;
  },

  // Intervalos de actualización (ms)
  REFRESH_INTERVAL: 5000,
  SIMULATION_INTERVAL: 3000,

  // Colores del mapa
  COLORS: {
    GENDARME_ACTIVO: '#22c55e',
    GENDARME_INACTIVO: '#ef4444',
    DISPOSITIVO: '#f97316',
    DISPOSITIVO_PELIGRO: '#ef4444',
    DRON_VUELO: '#3b82f6',
    DRON_TIERRA: '#6b7280',
    ALERTA_ALTA: '#ef4444',
    ALERTA_MEDIA: '#eab308',
    ALERTA_BAJA: '#3b82f6',
    RECINTO: '#1e40af',
    ZONA_SEGURA: '#22c55e',
    ZONA_RIESGO: '#ef4444',
    HEATMAP: ['rgba(59,130,246,0)', '#3b82f6', '#eab308', '#f97316', '#ef4444']
  },

  // Centro de Chile
  CENTRO_CHILE: [-33.4489, -70.6693],
  ZOOM_NACIONAL: 6,
  ZOOM_RECINTO: 16,

  // Límites de Chile
  BOUNDS_CHILE: {
    norte: [-17.5, -70],
    sur: [-56, -66],
    oeste: [-76, -80],
    este: [-34, -66]
  }
};
