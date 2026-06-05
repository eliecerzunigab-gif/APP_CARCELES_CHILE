// ============================================
// SISGEN - Dashboard y Estadísticas
// ============================================

// ========== ACTUALIZAR DASHBOARD ==========
function actualizarDashboard() {
  actualizarStatsCards();
  actualizarGraficoAlertas();
}

function actualizarStatsCards() {
  // Filtrar por recinto seleccionado si corresponde
  const recintoId = STATE.recintoActual ? STATE.recintoActual.id : null;
  
  const gendarmes = recintoId ? STATE.gendarmes.filter(g => g.recinto_id == recintoId) : STATE.gendarmes;
  const dispositivos = recintoId ? STATE.dispositivos.filter(d => d.recinto_id == recintoId) : STATE.dispositivos;
  const drones = recintoId ? STATE.drones.filter(d => d.recinto_id == recintoId) : STATE.drones;
  
  const activos = gendarmes.filter(g => g.estado === 'activo').length;
  const inactivos = gendarmes.filter(g => g.estado !== 'activo').length;
  const noAutorizados = dispositivos.filter(d => !d.autorizado).length;
  const enVuelo = drones.filter(d => d.estado === 'en_vuelo' || d.estado === 'patrullando').length;

  document.getElementById('stat-gendarmes-activos').textContent = activos;
  document.getElementById('stat-gendarmes-inactivos').textContent = inactivos;
  document.getElementById('stat-dispositivos-no-autorizados').textContent = noAutorizados;
  document.getElementById('stat-drones-vuelo').textContent = enVuelo;
}

// ========== GRÁFICO DE ALERTAS ==========
function actualizarGraficoAlertas() {
  const canvas = document.getElementById('alertasChart');
  if (!canvas) return;

  // Filtrar por recinto seleccionado si corresponde
  const recintoId = STATE.recintoActual ? STATE.recintoActual.id : null;
  const alertas = recintoId ? STATE.alertas.filter(a => a.recinto_id == recintoId) : STATE.alertas;

  // Contar alertas por tipo
  const tipos = {};
  alertas.forEach(a => {
    const tipo = a.tipo || 'General';
    tipos[tipo] = (tipos[tipo] || 0) + 1;
  });

  const labels = Object.keys(tipos);
  const data = Object.values(tipos);
  const colors = generarColores(labels.length);

  if (STATE.chart) {
    STATE.chart.data.labels = labels;
    STATE.chart.data.datasets[0].data = data;
    STATE.chart.data.datasets[0].backgroundColor = colors;
    STATE.chart.update('none');
  } else {
    const ctx = canvas.getContext('2d');
    STATE.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#1a1f2e',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#8899b0',
              font: { size: 9 },
              padding: 6,
              boxWidth: 10
            }
          },
          tooltip: {
            backgroundColor: '#1a1f2e',
            titleColor: '#e8edf5',
            bodyColor: '#8899b0',
            borderColor: '#2a3040',
            borderWidth: 1,
            padding: 8,
            cornerRadius: 6
          }
        },
        cutout: '60%'
      }
    });
  }
}

function generarColores(n) {
  const colores = ['#ef4444', '#eab308', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];
  return Array.from({ length: n }, (_, i) => colores[i % colores.length]);
}

// ========== INICIALIZAR DASHBOARD ==========
document.addEventListener('DOMContentLoaded', () => {
  // Observar cambios para actualizar gráfico cuando el panel sea visible
  const observer = new MutationObserver(() => {
    if (STATE.chart) {
      setTimeout(() => STATE.chart.resize(), 100);
    }
  });
  const statsPanel = document.querySelector('.panel-stats .panel-body');
  if (statsPanel) {
    observer.observe(statsPanel, { childList: true, subtree: true });
  }
});
