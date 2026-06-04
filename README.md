# 🔒 SISGEN - Sistema de Gestión de Seguridad Penitenciaria

**SISGEN** es una plataforma integral de monitoreo y seguridad para recintos penitenciarios de **Gendarmería de Chile**, diseñada para mejorar la vigilancia mediante tecnología IoT, geolocalización en tiempo real y drones de vigilancia.

## 🚀 Características Principales

### 👮 Monitoreo de Gendarmes
- Localización GPS en tiempo real de cada gendarme dentro del recinto
- Estado de conexión (activo/inactivo) con indicadores visuales
- Historial de heartbeat y última ubicación conocida
- Dashboard con estadísticas de personal operativo

### 📱 Detección de Celulares No Autorizados
- Identificación de dispositivos móviles dentro del perímetro
- Alertas inmediatas con ubicación exacta y zona del recinto
- Mapa de calor de densidad de dispositivos
- Clasificación por intensidad de señal y nivel de riesgo

### 🚁 Sistema de Drones de Vigilancia
- Monitoreo activo y bajo demanda
- Control remoto: despegar, aterrizar, patrullar, regresar a base
- Telemetría en vivo (altitud, velocidad, batería)
- Cono de visión simulado en el mapa
- Lanzamiento rápido en emergencias

### 🗺️ Mapa Interactivo
- Vista nacional con todos los recintos penitenciarios de Chile
- Zoom a nivel de recinto con zonas internas detalladas
- Clustering inteligente para vista nacional
- Capas toggleables (gendarmes, dispositivos, drones, alertas, zonas)
- Mapa de calor de dispositivos detectados
- Popups informativos con datos en tiempo real

### 🔔 Sistema de Alertas
- Alertas visuales con notificaciones toast
- Alertas sonoras para eventos críticos
- Clasificación por nivel (alta/media/baja)
- Modal con detalle completo de cada alerta
- Historial de alertas resueltas

### 📊 Dashboard y Estadísticas
- Gráfico doughnut de tipos de alertas (Chart.js)
- KPIs en tiempo real (gendarmes activos, dispositivos no autorizados, drones en vuelo)
- Estadísticas por recinto

### 📱 Diseño Responsive
- Interfaz adaptativa para PC, tablets y móviles
- Barra de navegación inferior en dispositivos móviles
- Paneles deslizables en versión mobile

## 🏗️ Arquitectura

```
APP_CARCELES/
├── backend/                    # Servidor Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── models/            # Modelos de base de datos SQLite
│   │   ├── routes/            # Rutas REST API
│   │   ├── services/          # WebSocket y simulación
│   │   └── server.js          # Punto de entrada
│   └── data/                  # Base de datos SQLite
├── frontend/                   # Cliente web
│   ├── index.html             # Página principal
│   ├── css/
│   │   └── styles.css         # Estilos modernos dark mode
│   ├── js/
│   │   ├── config.js          # Configuración global
│   │   ├── app.js             # Lógica principal y Socket.IO
│   │   ├── mapa.js            # Mapa Leaflet interactivo
│   │   ├── paneles.js         # Paneles laterales
│   │   └── dashboard.js       # Dashboard y Chart.js
│   └── assets/                # Recursos estáticos
└── README.md
```

## 🛠️ Tecnologías

### Backend
- **Node.js** + **Express** - Servidor web
- **Socket.IO** - Comunicación en tiempo real
- **SQLite** (better-sqlite3) - Base de datos embebida
- **UUID** - Generación de identificadores

### Frontend
- **Leaflet.js** - Mapas interactivos
- **Leaflet.markercluster** - Clustering de marcadores
- **Chart.js** - Gráficos estadísticos
- **Socket.IO Client** - Tiempo real
- **CSS3** - Diseño responsive con variables CSS

## 🚀 Instalación y Ejecución

### Requisitos
- Node.js 18+
- npm

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/eliecerzunigab-gif/APP_CARCELES_CHILE.git
cd APP_CARCELES_CHILE

# Instalar dependencias del backend
cd backend
npm install

# Iniciar servidor
npm start
```

### Acceso
- **Dashboard:** http://localhost:3000
- **API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health

## 📡 API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/recintos` | Listar recintos penitenciarios |
| GET | `/api/gendarmes` | Listar gendarmes |
| GET | `/api/dispositivos` | Listar dispositivos detectados |
| GET | `/api/drones` | Listar drones |
| GET | `/api/alertas` | Listar alertas |
| GET | `/api/dashboard` | Estadísticas del dashboard |
| POST | `/api/drones/:id/:comando` | Controlar dron |
| POST | `/api/drones/lanzar/:recinto_id` | Lanzar dron de emergencia |
| POST | `/api/alertas/:id/resolver` | Resolver alerta |

## 🌐 Despliegue

### GitHub Pages (Frontend)
El frontend puede desplegarse en GitHub Pages. Configurar en `config.js` la URL del backend en producción.

### Render (Backend)
El backend puede desplegarse en Render usando el archivo `render.yaml` incluido.

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es desarrollado para **Gendarmería de Chile** - Todos los derechos reservados.

---

**Desarrollado por:** Eliecer Zúñiga B.  
**Versión:** 2.0.0  
**Última actualización:** Junio 2026
