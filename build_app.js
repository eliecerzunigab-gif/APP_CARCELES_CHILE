const fs = require('fs');

// ===== PARTE 1: HEAD + CSS + HTML hasta antes del script final =====
const parte1 = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>SISGEN - Sistema de Monitoreo Carcelario</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--primary:#0d1b5e;--bg-dark:#0a0e1a;--bg-card:#111827;--text:#e0e0e0;--text2:#9ca3af;--border:#2a3040;--accent:#00bcd4;--danger:#e53935;--warning:#ffa726;--success:#43a047;--info:#29b6f6;--gold:#ffd700}
html,body{height:100%;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg-dark);color:var(--text)}
.marker-icon{background:transparent!important;border:none!important}
@keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:0.7}100%{transform:scale(1);opacity:1}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes droneFly{0%{transform:translateY(0px)}50%{transform:translateY(-5px)}100%{transform:translateY(0px)}}
.top-bar{height:52px;background:linear-gradient(135deg,#0a0e1a,#1a237e);display:flex;align-items:center;padding:0 12px;gap:8px;border-bottom:2px solid var(--accent);flex-shrink:0;z-index:100}
.logo{display:flex;align-items:center;gap:8px}
.logo-icon{font-size:22px}
.logo-text h1{font-size:15px;color:#fff;letter-spacing:1px}
.logo-text .subtitle{font-size:8px;color:var(--accent);display:block;letter-spacing:2px;text-transform:uppercase}
.header-stats{display:flex;gap:4px;margin-left:auto}
.stat-item{display:flex;align-items:center;gap:3px;background:rgba(255,255,255,0.06);padding:3px 7px;border-radius:8px;font-size:9px;white-space:nowrap}
.stat-value{font-weight:700;color:var(--accent);font-size:10px}
.stat-label{color:var(--text2);font-size:8px}
.stat-alert{background:rgba(229,57,53,0.15)!important;border:1px solid rgba(229,57,53,0.3)}
.stat-alert .stat-value{color:var(--danger);animation:blink 1s infinite}
.main-container{display:flex;height:calc(100vh - 52px)}
.sidebar{width:300px;min-width:300px;background:var(--bg-card);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
.sidebar-left{border-right:1px solid var(--border)}
.sidebar-right{width:320px;min-width:320px;border-left:1px solid var(--border)}
.panel{flex:1;display:flex;flex-direction:column;overflow:hidden;border-bottom:1px solid var(--border)}
.panel:last-child{border-bottom:none}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:linear-gradient(135deg,#0d1b5e,#283593);flex-shrink:0;min-height:32px}
.panel-header h3{font-size:11px;color:#fff;display:flex;align-items:center;gap:5px}
.badge{background:var(--accent);color:#000;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700}
.badge-danger{background:var(--danger);color:#fff}
.badge-success{background:var(--success);color:#fff}
.badge-warning{background:var(--warning);color:#000}
.panel-body{flex:1;overflow-y:auto;padding:4px}
.panel-body::-webkit-scrollbar{width:3px}
.panel-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.loading{padding:12px;text-align:center;color:var(--text2);font-size:11px}
.list-item{display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:5px;cursor:pointer;transition:background .2s;margin-bottom:1px}
.list-item:hover{background:rgba(255,255,255,0.05)}
.list-item.active{background:rgba(0,188,212,0.1);border-left:2px solid var(--accent)}
.avatar{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.avatar.online{background:rgba(67,160,71,0.2)}
.avatar.offline{background:rgba(229,57,53,0.2)}
.avatar.info{background:rgba(41,182,246,0.2)}
.avatar.warning{background:rgba(255,167,38,0.2)}
.avatar.drone{background:rgba(255,215,0,0.2)}
.info{flex:1;min-width:0}
.name{font-size:10px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)}
.detail{font-size:8px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.status-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.status-dot.online{background:var(--success);box-shadow:0 0 4px var(--success)}
.status-dot.offline{background:var(--danger);box-shadow:0 0 4px var(--danger)}
.status-dot.warning{background:var(--warning)}
.status-dot.drone{background:var(--gold);box-shadow:0 0 6px var(--gold);animation:droneFly 2s infinite}
.map-container{flex:1;display:flex;flex-direction:column;min-width:0}
.map-toolbar{display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:var(--bg-card);border-bottom:1px solid var(--border);gap:4px;flex-wrap:wrap;flex-shrink:0;min-height:36px}
.toolbar-left{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.toolbar-right{display:flex;align-items:center;gap:3px;flex-wrap:wrap}
.btn{background:#283593;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;white-space:nowrap;display:inline-flex;align-items:center;gap:3px;transition:all .2s}
.btn:hover{background:var(--accent);color:#000}
.btn-danger{background:var(--danger)}
.btn-danger:hover{background:#c62828}
.btn-success{background:var(--success)}
.btn-success:hover{background:#2e7d32}
.btn-warning{background:var(--warning);color:#000}
.btn-warning:hover{background:#f57c00}
.btn-sm{padding:3px 6px;font-size:9px}
.form-select{background:#0a0e1a;color:var(--text);border:1px solid var(--border);padding:3px 6px;border-radius:4px;font-size:10px;max-width:160px;cursor:pointer}
.form-select:focus{outline:none;border-color:var(--accent)}
.vista-indicator{font-size:10px;padding:2px 6px;border-radius:3px;white-space:nowrap}
.vista-indicator.nacional{background:rgba(0,188,212,0.1);color:var(--accent)}
.vista-indicator.region{background:rgba(41,182,246,0.1);color:var(--info)}
.vista-indicator.recinto{background:rgba(67,160,71,0.1);color:var(--success)}
.toggle-label{display:flex;align-items:center;gap:2px;cursor:pointer;font-size:9px;color:var(--text2);padding:2px 4px;border-radius:3px;background:rgba(255,255,255,0.03);user-select:none}
.toggle-label input{accent-color:var(--accent);width:11px;height:11px}
#map{flex:1;z-index:1}
.stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px}
.stat-card{background:rgba(255,255,255,0.03);padding:5px;border-radius:5px;text-align:center}
.stat-card .stat-number{font-size:16px;font-weight:700;color:var(--accent)}
.stat-card .stat-desc{font-size:8px;color:var(--text2)}
.stat-card.stat-warning .stat-number{color:var(--warning)}
.stat-card.stat-danger .stat-number{color:var(--danger)}
.stat-card.stat-info .stat-number{color:var(--info)}
.stat-card.stat-success .stat-number{color:var(--success)}
.stat-card.stat-gold .stat-number{color:var(--gold)}
.modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(4px)}
.modal.hidden{display:none}
.modal-content{background:#1a1f2e;border:1px solid var(--border);border-radius:10px;max-width:520px;width:92%;max-height:85vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3)}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border)}
.modal-header h3{font-size:14px;color:#fff}
.btn-close{background:none;border:none;color:var(--text2);font-size:22px;cursor:pointer}
.btn-close:hover{color:#fff}
.modal-body{padding:14px;font-size:12px;color:var(--text2);line-height:1.5}
.modal-footer{display:flex;gap:6px;padding:10px 14px;border-top:1px solid var(--border);justify-content:flex-end;flex-wrap:wrap}
#toast-container{position:fixed;bottom:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:4px}
.toast{padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideIn .3s ease;max-width:300px}
.toast.critica,.toast.alta{background:var(--danger);color:#fff}
.toast.media{background:var(--warning);color:#000}
.toast.baja{background:var(--success);color:#fff}
.toast.info{background:var(--info);color:#000}
.toast.drone{background:var(--gold);color:#000}
.toast.fade-out{animation:fadeOut .3s ease forwards}
.mobile-bar{display:none;position:fixed;bottom:0;left:0;right:0;background:var(--bg-card);border-top:1px solid var(--border);z-index:999;padding:3px 0;justify-content:space-around}
.mobile-bar button{background:none;border:none;color:var(--text2);font-size:9px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;padding:3px 6px;border-radius:5px}
.mobile-bar button span{font-size:16px}
.mobile-bar button.active{color:var(--accent);background:rgba(0,188,212,0.1)}
.mobile-bar button .label{font-size:8px}
.mobile-overlay{display:none;position:fixed;top:52px;left:0;right:0;bottom:44px;background:var(--bg-card);z-index:998;overflow-y:auto;padding:6px}
.mobile-overlay.show{display:block}
.alert-banner{background:linear-gradient(90deg,var(--danger),#c62828);color:#fff;padding:4px 10px;font-size:10px;display:flex;align-items:center;gap:6px;animation:slideUp .3s ease;flex-shrink:0}
.alert-banner .alert-icon{font-size:14px;animation:blink 1s infinite}
.alert-banner .alert-close{background:none;border:none;color:#fff;font-size:14px;cursor:pointer;margin-left:auto}
.recinto-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0}
.recinto-info-item{background:rgba(255,255,255,0.03);padding:6px;border-radius:5px}
.recinto-info-item .label{font-size:8px;color:var(--text2)}
.recinto-info-item .value{font-size:11px;color:#fff;font-weight:600}
.alert-item{display:flex;align-items:flex-start;gap:6px;padding:5px;border-radius:5px;margin-bottom:3px;border-left:3px solid var(--danger);background:rgba(229,57,53,0.05)}
.alert-item.warning{border-left-color:var(--warning);background:rgba(255,167,38,0.05)}
.alert-item.info{border-left-color:var(--info);background:rgba(41,182,246,0.05)}
.alert-item .alert-time{font-size:8px;color:var(--text2);white-space:nowrap}
.alert-item .alert-msg{font-size:10px;color:var(--text)}
.alert-item .alert-loc{font-size:8px;color:var(--text2)}
@media(max-width:1200px){.sidebar{width:260px;min-width:260px}.sidebar-right{width:280px;min-width:280px}}
@media(max-width:992px){.sidebar-right{display:none}}
@media(max-width:768px){
.sidebar-left,.sidebar-right{display:none}
.mobile-bar{display:flex}
.header-stats{gap:2px}
.stat-item{padding:2px 5px;font-size:8px}
.stat-value{font-size:9px}
.stat-label{font-size:7px}
.top-bar{padding:0 6px;height:48px}
.logo-text .subtitle{display:none}
.main-container{height:calc(100vh - 48px)}
.mobile-overlay{top:48px;bottom:44px}
.map-toolbar{padding:3px 4px}
.form-select{font-size:9px;max-width:120px}
}
</style>
</head>
<body>
<header class="top-bar">
<div class="logo">
<span class="logo-icon">&#x1F6E1;&#xFE0F;</span>
<div class="logo-text"><h1>SISGEN</h1><span class="subtitle">Monitoreo Carcelario</span></div>
</div>
<div class="header-stats">
<div class="stat-item"><span class="stat-value" id="hdr-recintos">0</span><span class="stat-label">Recintos</span></div>
<div class="stat-item"><span class="stat-value" id="hdr-gendarmes">0</span><span class="stat-label">Gendarmes</span></div>
<div class="stat-item"><span class="stat-value" id="hdr-drones">0</span><span class="stat-label">Drones</span></div>
<div class="stat-item stat-alert"><span class="stat-value" id="hdr-alertas">0</span><span class="stat-label">Alertas</span></div>
</div>
</header>
<div id="alert-banner" class="alert-banner" style="display:none">
<span class="alert-icon">&#x26A0;&#xFE0F;</span>
<span id="alert-banner-msg">Alerta de seguridad activa</span>
<button class="alert-close" onclick="document.getElementById('alert-banner').style.display='none'">&times;</button>
</div>
<div class="main-container">
<aside class="sidebar sidebar-left">
<div class="panel">
<div class="panel-header"><h3>&#x1F5FA;&#xFE0F; Recintos</h3><span class="badge" id="reg-count">0</span></div>
<div class="panel-body" id="reg-list"><div class="loading">Cargando...</div></div>
</div>
<div class="panel" style="flex:0.8">
<div class="panel-header"><h3>&#x1F4E1; Gendarmes Activos</h3><span class="badge badge-success" id="gen-count">0</span></div>
<div class="panel-body" id="gen-list"><div class="loading">Esperando datos...</div></div>
</div>
<div class="panel" style="flex:0.6">
<div class="panel-header"><h3>&#x1F6F8; Drones</h3><span class="badge badge-warning" id="drone-count">0</span></div>
<div class="panel-body" id="drone-list"><div class="loading">Esperando datos...</div></div>
</div>
</aside>
<main class="map-container">
<div class="map-toolbar">
<div class="toolbar-left">
<button id="btn-volver" class="btn" style="display:none">&larr; Volver</button>
<select id="sel-recinto" class="form-select"><option value="">&#x1F1E8;&#x1F1F1; Todos los recintos</option></select>
<span id="vista-label" class="vista-indicator nacional">&#x1F1E8;&#x1F1F1; Nacional</span>
</div>
<div class="toolbar-right">
<label class="toggle-label"><input type="checkbox" id="tog-recintos" checked> &#x1F3DB;&#xFE0F;</label>
<label class="toggle-label"><input type="checkbox" id="tog-gendarmes" checked> &#x1F4E1;</label>
<label class="toggle-label"><input type="checkbox" id="tog-drones" checked> &#x1F6F8;</label>
<label class="toggle-label"><input type="checkbox" id="tog-seguridad" checked> &#x1F512;</label>
<label class="toggle-label"><input type="checkbox" id="tog-alertas" checked> &#x1F514;</label>
<button class="btn btn-sm" onclick="simularAlerta()">&#x1F514; Simular</button>
<button class="btn btn-sm btn-warning" onclick="lanzarDrone()">&#x1F6F8; Drone</button>
</div>
</div>
<div id="map"></div>
</main>
<aside class="sidebar sidebar-right">
<div class="panel" style="flex:0.7">
<div class="panel-header"><h3>&#x1F4CA; Dashboard</h3></div>
<div class="panel-body">
<div class="stats-grid">
<div class="stat-card"><div class="stat-number" id="st-total">0</div><div class="stat-desc">Recintos</div></div>
<div class="stat-card stat-info"><div class="stat-number" id="st-gendarmes">0</div><div class="stat-desc">Gendarmes</div></div>
<div class="stat-card stat-gold"><div class="stat-number" id="st-drones">0</div><div class="stat-desc">Drones</div></div>
<div class="stat-card stat-danger"><div class="stat-number" id="st-alertas">0</div><div class="stat-desc">Alertas</div></div>
<div class="stat-card stat-success"><div class="stat-number" id="st-capacidad">0</div><div class="stat-desc">Capacidad</div></div>
<div class="stat-card stat-warning"><div class="stat-number" id="st-ocupacion">0%</div><div class="stat-desc">Ocupaci&oacute;n</div></div>
</div>
</div>
</div>
<div class="panel" style="flex:0.5">
<div class="panel-header"><h3>&#x1F3DB;&#xFE0F; Recinto Actual</h3></div>
<div class="panel-body" id="detalle-panel"><div class="loading">Seleccione un recinto</div></div>
</div>
<div class="panel" style="flex:0.8">
<div class="panel-header"><h3>&#x1F514; &Uacute;ltimas Alertas</h3><span class="badge badge-danger" id="alert-count">0</span></div>
<div class="panel-body" id="alert-list"><div class="loading">Sin alertas</div></div>
</div>
</aside>
</div>
<div class="mobile-bar" id="mobile-bar">
<button onclick="mpanel('recintos')" class="active" id="mb-recintos"><span>&#x1F5FA;&#xFE0F;</span><span class="label">Recintos</span></button>
<button onclick="mpanel('gendarmes')" id="mb-gendarmes"><span>&#x1F4E1;</span><span class="label">Gendarmes</span></button>
<button onclick="mpanel('drones')" id="mb-drones"><span>&#x1F6F8;</span><span class="label">Drones</span></button>
<button onclick="mpanel('dashboard')" id="mb-dashboard"><span>&#x1F4CA;</span><span class="label">Dashboard</span></button>
<button onclick="mpanel('alertas')" id="mb-alertas"><span>&#x1F514;</span><span class="label">Alertas</span></button>
</div>
<div class="mobile-overlay" id="mobile-overlay"></div>
<div id="info-modal" class="modal hidden">
<div class="modal-content">
<div class="modal-header"><h3 id="modal-titulo">Informaci&oacute;n</h3><button class="btn-close" onclick="cm()">&times;</button></div>
<div class="modal-body" id="modal-body"></div>
<div class="modal-footer" id="modal-footer"></div>
</div>
</div>
<div id="toast-container"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
`;

// ===== PARTE 2: DATOS JSON (inline) =====
const datosJSON = JSON.stringify({
  metadata: { fuente: "GENCHI", total_recintos: 66, total_regiones: 16 },
  regiones: [
    { nombre: "Region de Arica y Parinacota", recintos: [{ nombre: "CDP Arica", direccion: "Av. Santa Maria 2345, Arica", latitud: -18.478, longitud: -70.321, capacidad: 600, seguridad: "media" }] },
    { nombre: "Region de Tarapaca", recintos: [{ nombre: "CDP Iquique", direccion: "Av. Arturo Prat 1234, Iquique", latitud: -20.214, longitud: -70.152, capacidad: 800, seguridad: "media" }, { nombre: "CDP Pozo Almonte", direccion: "Av. Comercio 567, Pozo Almonte", latitud: -20.256, longitud: -69.786, capacidad: 150, seguridad: "baja" }] },
    { nombre: "Region de Antofagasta", recintos: [{ nombre: "CDP Antofagasta", direccion: "Av. Argentina 2345, Antofagasta", latitud: -23.651, longitud: -70.398, capacidad: 900, seguridad: "media" }, { nombre: "CDP Calama", direccion: "Av. Granaderos 1234, Calama", latitud: -22.462, longitud: -68.928, capacidad: 500, seguridad: "media" }, { nombre: "CDP Tocopilla", direccion: "Av. 21 de Mayo 789, Tocopilla", latitud: -22.092, longitud: -70.198, capacidad: 200, seguridad: "baja" }] },
    { nombre: "Region de Atacama", recintos: [{ nombre: "CDP Copiapo", direccion: "Av. Juan Martinez 1234, Copiapo", latitud: -27.367, longitud: -70.332, capacidad: 500, seguridad: "media" }, { nombre: "CDP Vallenar", direccion: "Av. Ramirez 789, Vallenar", latitud: -28.575, longitud: -70.759, capacidad: 250, seguridad: "media" }, { nombre: "CDP Chanaral", direccion: "Av. Merino Jarpa 456, Chanaral", latitud: -26.345, longitud: -70.620, capacidad: 120, seguridad: "baja" }] },
    { nombre: "Region de Coquimbo", recintos: [{ nombre: "CDP La Serena", direccion: "Av. Francisco de Aguirre 2345, La Serena", latitud: -29.903, longitud: -71.250, capacidad: 600, seguridad: "media" }, { nombre: "CDP Coquimbo", direccion: "Av. Costanera 1234, Coquimbo", latitud: -29.953, longitud: -71.343, capacidad: 400, seguridad: "media" }, { nombre: "CDP Ovalle", direccion: "Av. Libertad 789, Ovalle", latitud: -30.598, longitud: -71.200, capacidad: 300, seguridad: "media" }, { nombre: "CDP Illapel", direccion: "Av. Constitucion 456, Illapel", latitud: -31.633, longitud: -71.170, capacidad: 150, seguridad: "baja" }] },
    { nombre: "Region de Valparaiso", recintos: [{ nombre: "CDP Valparaiso", direccion: "Av. Argentina 975, Cerro Cordillera, Valparaiso", latitud: -33.047, longitud: -71.617, capacidad: 800, seguridad: "media" }, { nombre: "CDP San Antonio", direccion: "Av. Barros Luco 2101, San Antonio", latitud: -33.593, longitud: -71.613, capacidad: 400, seguridad: "media" }, { nombre: "CDP Vina del Mar", direccion: "Av. Libertad 1234, Vina del Mar", latitud: -33.025, longitud: -71.552, capacidad: 350, seguridad: "media" }, { nombre: "CDP Los Andes", direccion: "Av. Argentina 456, Los Andes", latitud: -32.834, longitud: -70.598, capacidad: 200, seguridad: "media" }, { nombre: "CDP San Felipe", direccion: "Av. Yungay 789, San Felipe", latitud: -32.750, longitud: -70.725, capacidad: 180, seguridad: "media" }, { nombre: "CDP Quillota", direccion: "Av. Condell 567, Quillota", latitud: -32.880, longitud: -71.248, capacidad: 250, seguridad: "media" }, { nombre: "CDP Quilpue", direccion: "Av. Blanco Encalada 890, Quilpue", latitud: -33.048, longitud: -71.442, capacidad: 200, seguridad: "media" }, { nombre: "CDP La Ligua", direccion: "Av. Prat 456, La Ligua", latitud: -32.452, longitud: -71.231, capacidad: 120, seguridad: "baja" }] },
    { nombre: "Region Metropolitana", recintos: [{ nombre: "CDP Santiago Sur (Ex Penitenciaria)", direccion: "Av. Pedro Montt 1600, Santiago", latitud: -33.456, longitud: -70.648, capacidad: 5000, seguridad: "alta" }, { nombre: "CCP Colina I", direccion: "Ruta 5 Norte Km 25, Colina", latitud: -33.202, longitud: -70.675, capacidad: 1500, seguridad: "alta" }, { nombre: "CCP Colina II", direccion: "Ruta 5 Norte Km 28, Colina", latitud: -33.185, longitud: -70.680, capacidad: 1200, seguridad: "alta" }, { nombre: "CDP San Bernardo", direccion: "Av. Colon 1234, San Bernardo", latitud: -33.592, longitud: -70.700, capacidad: 600, seguridad: "media" }, { nombre: "CDP Puente Alto", direccion: "Av. Concha y Toro 2345, Puente Alto", latitud: -33.613, longitud: -70.575, capacidad: 500, seguridad: "media" }, { nombre: "CDP Talagante", direccion: "Av. Balmaceda 890, Talagante", latitud: -33.664, longitud: -70.930, capacidad: 300, seguridad: "media" }, { nombre: "CDP Melipilla", direccion: "Av. Vicuna Mackenna 567, Melipilla", latitud: -33.686, longitud: -71.215, capacidad: 250, seguridad: "media" }] },
    { nombre: "Region del Libertador B. O'Higgins", recintos: [{ nombre: "CDP Rancagua", direccion: "Av. Libertador O'Higgins 1234, Rancagua", latitud: -34.170, longitud: -70.745, capacidad: 700, seguridad: "media" }, { nombre: "CDP San Fernando", direccion: "Av. Manuel Rodriguez 789, San Fernando", latitud: -34.585, longitud: -70.988, capacidad: 350, seguridad: "media" }, { nombre: "CDP Santa Cruz", direccion: "Av. Errazuriz 456, Santa Cruz", latitud: -34.638, longitud: -71.365, capacidad: 200, seguridad: "media" }, { nombre: "CDP Rengo", direccion: "Av. Caupolican 567, Rengo", latitud: -34.410, longitud: -70.860, capacidad: 180, seguridad: "baja" }, { nombre: "CDP Pichilemu", direccion: "Av. Agustin Urrutia 234, Pichilemu", latitud: -34.387, longitud: -72.005, capacidad: 100, seguridad: "baja" }] },
    { nombre: "Region del Maule", recintos: [{ nombre: "CDP Talca", direccion: "Av. 2 Sur 1234, Talca", latitud: -35.427, longitud: -71.655, capacidad: 800, seguridad: "media" }, { nombre: "CDP Curico", direccion: "Av. Alessandri 789, Curico", latitud: -34.983, longitud: -71.239, capacidad: 500, seguridad: "media" }, { nombre: "CDP Linares", direccion: "Av. Independencia 567, Linares", latitud: -35.847, longitud: -71.593, capacidad: 400, seguridad: "media" }, { nombre: "CDP Constitucion", direccion: "Av. Costanera 345, Constitucion", latitud: -35.333, longitud: -72.417, capacidad: 150, seguridad: "baja" }, { nombre: "CDP Cauquenes", direccion: "Av. San Martin 456, Cauquenes", latitud: -35.967, longitud: -72.317, capacidad: 200, seguridad: "media" }, { nombre: "CDP Parral", direccion: "Av. Ignacio Carrera Pinto 234, Parral", latitud: -36.140, longitud: -71.830, capacidad: 150, seguridad: "baja" }] },
    { nombre: "Region de Nuble", recintos: [{ nombre: "CDP Chillan", direccion: "Av. O'Higgins 1234, Chillan", latitud: -36.607, longitud: -72.103, capacidad: 600, seguridad: "media" }, { nombre: "CDP San Carlos", direccion: "Av. Libertad 567, San Carlos", latitud: -36.425, longitud: -71.958, capacidad: 200, seguridad: "media" }] },
    { nombre: "Region del Biobio", recintos: [{ nombre: "CDP Concepcion (El Manzano)", direccion: "Camino a Penco s/n, Concepcion", latitud: -36.827, longitud: -73