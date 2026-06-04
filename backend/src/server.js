const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { getDatabase } = require('./models/database');
const recintosRoutes = require('./routes/recintos');
const gendarmesRoutes = require('./routes/gendarmes');
const dispositivosRoutes = require('./routes/dispositivos');
const alertasRoutes = require('./routes/alertas');
const dronesRoutes = require('./routes/drones');
const dashboardRoutes = require('./routes/dashboard');
const { setupWebSocket } = require('./services/websocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Inicializar base de datos y sembrar datos si está vacía
const db = getDatabase();
const recintoCount = db.prepare('SELECT COUNT(*) as count FROM recintos').get();
if (recintoCount.count === 0) {
  console.log('🌱 Base de datos vacía, ejecutando seed...');
  require('./seed_completo');
} else {
  console.log(`✅ Base de datos con ${recintoCount.count} recintos existentes`);
}

// Rutas API
app.use('/api/recintos', recintosRoutes);
app.use('/api/gendarmes', gendarmesRoutes);
app.use('/api/dispositivos', dispositivosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/drones', dronesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket
setupWebSocket(io);

// Iniciar servicios de simulación (para demo)
const { startSimulation } = require('./services/simulacion');
startSimulation(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor APP CÁRCELES corriendo en puerto ${PORT}`);
  console.log(`📡 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});
