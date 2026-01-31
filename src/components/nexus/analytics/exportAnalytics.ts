import { AnalyticsData } from "./AnalyticsTypes";

export function exportToCSV(data: AnalyticsData) {
  const lines: string[] = [];
  
  // Header
  lines.push("REPORTE ANALÍTICO - " + new Date().toLocaleDateString("es-ES"));
  lines.push("");
  
  // Performance Metrics
  lines.push("=== MÉTRICAS DE RENDIMIENTO ===");
  lines.push(`Tasa de Resolución,${data.resolutionRate.toFixed(1)}%`);
  lines.push(`Total Resueltas,${data.totalResolved}`);
  lines.push(`Total Pendientes,${data.totalPending}`);
  lines.push(`Tiempo Promedio Respuesta (horas),${data.avgResponseTime.toFixed(2)}`);
  lines.push(`Respuestas por Solicitud,${data.avgResponsesPerRequest.toFixed(2)}`);
  lines.push(`Tasa Mejor Respuesta,${data.bestAnswerRate.toFixed(1)}%`);
  lines.push("");
  
  // Categories
  lines.push("=== TEMÁTICAS MÁS DEMANDADAS ===");
  lines.push("Categoría,Cantidad");
  data.categoryCounts.forEach(c => lines.push(`${c.name},${c.value}`));
  lines.push("");
  
  // Countries
  lines.push("=== SOLICITUDES POR PAÍS ===");
  lines.push("País,Cantidad");
  data.countryCounts.forEach(c => lines.push(`${c.name},${c.value}`));
  lines.push("");
  
  // Journals
  lines.push("=== EDITORIALES/REVISTAS ===");
  lines.push("Editorial,Cantidad");
  data.journalCounts.forEach(c => lines.push(`${c.name},${c.value}`));
  lines.push("");
  
  // User Levels
  lines.push("=== DISTRIBUCIÓN POR NIVEL ===");
  lines.push("Nivel,Cantidad");
  data.levelDistribution.forEach(c => lines.push(`${c.name},${c.value}`));
  lines.push("");
  
  // Top Users
  lines.push("=== USUARIOS MÁS ACTIVOS ===");
  lines.push("Usuario,Solicitudes,Respuestas,Total");
  data.topActiveUsers.forEach(u => lines.push(`${u.name},${u.requests},${u.responses},${u.total}`));
  lines.push("");
  
  // Institutions
  lines.push("=== DISTRIBUCIÓN POR INSTITUCIÓN ===");
  lines.push("Institución,Usuarios");
  data.institutionDistribution.forEach(c => lines.push(`${c.name},${c.value}`));
  lines.push("");
  
  // Points Economy
  lines.push("=== ECONOMÍA DE PUNTOS ===");
  lines.push(`Puntos Totales Distribuidos,${data.totalPointsDistributed}`);
  lines.push(`Promedio por Usuario,${data.avgPointsPerUser.toFixed(0)}`);
  lines.push("");
  lines.push("Mes,Ganados,Gastados");
  data.pointsFlow.forEach(p => lines.push(`${p.month},${p.earned},${p.spent}`));
  lines.push("");
  
  // Monthly Trend
  lines.push("=== TENDENCIA MENSUAL ===");
  lines.push("Mes,Solicitudes");
  data.monthlyTrend.forEach(m => lines.push(`${m.month},${m.count}`));
  lines.push("");
  
  // User Growth
  lines.push("=== CRECIMIENTO DE USUARIOS ===");
  lines.push("Mes,Nuevos Usuarios");
  data.userGrowth.forEach(m => lines.push(`${m.month},${m.count}`));
  lines.push("");
  
  // Hourly Distribution
  lines.push("=== ACTIVIDAD POR HORA ===");
  lines.push("Hora,Solicitudes");
  data.hourlyDistribution.forEach(h => lines.push(`${h.hour},${h.count}`));
  lines.push("");
  
  // Daily Distribution
  lines.push("=== ACTIVIDAD POR DÍA ===");
  lines.push("Día,Solicitudes");
  data.dailyDistribution.forEach(d => lines.push(`${d.day},${d.count}`));
  lines.push("");
  
  // Extra Analysis
  lines.push("=== ANÁLISIS ADICIONAL ===");
  lines.push(`Solicitudes Urgentes,${data.urgentAnalysis.urgentCount}`);
  lines.push(`Solicitudes Normales,${data.urgentAnalysis.normalCount}`);
  lines.push(`Tasa Resolución Urgentes,${data.urgentAnalysis.urgentResolutionRate.toFixed(1)}%`);
  lines.push(`Tasa Resolución Normales,${data.urgentAnalysis.normalResolutionRate.toFixed(1)}%`);
  lines.push(`Con DOI,${data.doiAnalysis.withDoi}`);
  lines.push(`Sin DOI,${data.doiAnalysis.withoutDoi}`);
  lines.push(`Comentarios Promedio por Solicitud,${data.avgCommentsPerRequest.toFixed(2)}`);
  
  const csvContent = lines.join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `reporte-analitico-${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: AnalyticsData) {
  // Create a printable HTML document
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor permite las ventanas emergentes para exportar a PDF");
    return;
  }

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} días`;
  };

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Analítico - ${new Date().toLocaleDateString("es-ES")}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        h1 { 
          font-size: 24px; 
          margin-bottom: 8px;
          color: #0f172a;
        }
        h2 { 
          font-size: 16px; 
          margin: 24px 0 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #3b82f6;
          color: #3b82f6;
        }
        .date { 
          color: #64748b; 
          margin-bottom: 24px;
          font-size: 14px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .metric-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #3b82f6;
        }
        .metric-label {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 13px;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
          color: #475569;
        }
        tr:hover { background: #f8fafc; }
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .section { margin-bottom: 32px; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>📊 Reporte Analítico</h1>
      <p class="date">Generado el ${new Date().toLocaleDateString("es-ES", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}</p>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${data.resolutionRate.toFixed(1)}%</div>
          <div class="metric-label">Tasa de Resolución</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${formatTime(data.avgResponseTime)}</div>
          <div class="metric-label">Tiempo Promedio Respuesta</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.avgResponsesPerRequest.toFixed(1)}</div>
          <div class="metric-label">Respuestas/Solicitud</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.bestAnswerRate.toFixed(1)}%</div>
          <div class="metric-label">Tasa Mejor Respuesta</div>
        </div>
      </div>

      <div class="two-col">
        <div class="section">
          <h2>📚 Temáticas Más Demandadas</h2>
          <table>
            <thead><tr><th>Categoría</th><th>Cantidad</th></tr></thead>
            <tbody>
              ${data.categoryCounts.map(c => `<tr><td>${c.name}</td><td>${c.value}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>🌍 Solicitudes por País</h2>
          <table>
            <thead><tr><th>País</th><th>Cantidad</th></tr></thead>
            <tbody>
              ${data.countryCounts.map(c => `<tr><td>${c.name}</td><td>${c.value}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>

      ${data.journalCounts.length > 0 ? `
        <div class="section">
          <h2>📖 Editoriales/Revistas Más Solicitadas</h2>
          <table>
            <thead><tr><th>Editorial</th><th>Solicitudes</th></tr></thead>
            <tbody>
              ${data.journalCounts.map(c => `<tr><td>${c.name}</td><td>${c.value}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}

      <div class="section">
        <h2>👥 Usuarios Más Activos (Top 10)</h2>
        <table>
          <thead><tr><th>Usuario</th><th>Solicitudes</th><th>Respuestas</th><th>Total</th></tr></thead>
          <tbody>
            ${data.topActiveUsers.map(u => `
              <tr>
                <td>${u.name}</td>
                <td>${u.requests}</td>
                <td>${u.responses}</td>
                <td><strong>${u.total}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="two-col">
        <div class="section">
          <h2>🎖️ Distribución por Nivel</h2>
          <table>
            <thead><tr><th>Nivel</th><th>Usuarios</th></tr></thead>
            <tbody>
              ${data.levelDistribution.map(l => `<tr><td>${l.name}</td><td>${l.value}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>💰 Economía de Puntos</h2>
          <table>
            <thead><tr><th>Métrica</th><th>Valor</th></tr></thead>
            <tbody>
              <tr><td>Puntos Totales</td><td><strong>${data.totalPointsDistributed.toLocaleString()}</strong></td></tr>
              <tr><td>Promedio/Usuario</td><td>${data.avgPointsPerUser.toFixed(0)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="two-col">
        <div class="section">
          <h2>📈 Tendencia Mensual</h2>
          <table>
            <thead><tr><th>Mes</th><th>Solicitudes</th><th>Nuevos Usuarios</th></tr></thead>
            <tbody>
              ${data.monthlyTrend.map((m, i) => `
                <tr>
                  <td>${m.month}</td>
                  <td>${m.count}</td>
                  <td>${data.userGrowth[i]?.count || 0}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>⚡ Análisis Adicional</h2>
          <table>
            <thead><tr><th>Métrica</th><th>Valor</th></tr></thead>
            <tbody>
              <tr><td>Solicitudes Urgentes</td><td>${data.urgentAnalysis.urgentCount} (${data.urgentAnalysis.urgentResolutionRate.toFixed(0)}% resueltas)</td></tr>
              <tr><td>Solicitudes Normales</td><td>${data.urgentAnalysis.normalCount} (${data.urgentAnalysis.normalResolutionRate.toFixed(0)}% resueltas)</td></tr>
              <tr><td>Con DOI</td><td>${data.doiAnalysis.withDoi}</td></tr>
              <tr><td>Sin DOI</td><td>${data.doiAnalysis.withoutDoi}</td></tr>
              <tr><td>Comentarios/Solicitud</td><td>${data.avgCommentsPerRequest.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      ${data.institutionDistribution.length > 0 ? `
        <div class="section">
          <h2>🏛️ Distribución por Institución</h2>
          <table>
            <thead><tr><th>Institución</th><th>Usuarios</th></tr></thead>
            <tbody>
              ${data.institutionDistribution.map(i => `<tr><td>${i.name}</td><td>${i.value}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}

      <div class="footer">
        <p>Reporte generado automáticamente por el Sistema de Analíticas</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
