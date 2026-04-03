import FlightGraphService from './src/services/FlightGraphService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n═══════════════════════════════════════════════════');
console.log('🚀 TICKET #12: Modelado de Grafo de Rutas Aéreas');
console.log('═══════════════════════════════════════════════════\n');

// Cargar datos limpios
const cleanedFilePath = path.join(__dirname, './flights_cleaned.json');
let flightsData = [];

try {
  const fileContent = fs.readFileSync(cleanedFilePath, 'utf-8');
  const parsed = JSON.parse(fileContent);
  flightsData = parsed.data;
  console.log(`✓ Cargados ${flightsData.length} vuelos desde flights_cleaned.json\n`);
} catch (error) {
  console.error(`✗ Error cargando flights_cleaned.json: ${error.message}`);
  process.exit(1);
}

// Crear servicio y ejecutar pipeline
const graphService = new FlightGraphService();
const result = graphService.executeFullPipeline(flightsData);

if (result.success) {
  console.log('📋 Análisis de Grafo:');
  console.log('═══════════════════════════════════════════════════\n');

  // Obtener estadísticas
  const stats = graphService.getStats();
  
  console.log(`📊 Estadísticas del Grafo:`);
  console.log(`  • Nodos: ${stats.totalNodes}`);
  console.log(`  • Aristas: ${stats.totalEdges}`);
  console.log(`  • Grado promedio (salida): ${stats.averageOutDegree}`);
  console.log(`  • Grado promedio (entrada): ${stats.averageInDegree}`);
  console.log(`  • Hub máximo: ${stats.maxOutDegree} conexiones\n`);

  console.log(`🏙️  Top 5 Hubs (aeropuertos más conectados):`);
  stats.hubNodes.slice(0, 5).forEach((hub, idx) => {
    console.log(`  ${idx + 1}. ${hub.airport}: ${hub.connections} conexiones`);
  });

  // Consultar vecinos de ejemplo
  console.log(`\n📍 Ejemplo: Vecinos de ATL`);
  const neighbors = graphService.getNeighbors('ATL');
  if (neighbors.success) {
    console.log(`  Destinos: ${neighbors.totalNeighbors}`);
    neighbors.neighbors.slice(0, 3).forEach(n => {
      console.log(`    → ${n.destination} (costo: $${n.cost.toFixed(2)}, freq: ${n.frequency})`);
    });
  }

  // Ejemplo: Dijkstra
  console.log(`\n🛤️  Ejemplo: Ruta más corta ATL → LAX`);
  const dijkstra = graphService.dijkstra('ATL', 'LAX');
  if (dijkstra.success) {
    console.log(`  Distancia: $${dijkstra.distance.toFixed(2)}`);
    console.log(`  Ruta: ${dijkstra.path.join(' → ')}`);
  }

  // Ejemplo: BFS
  console.log(`\n🔍 Ejemplo: Exploración desde ATL (profundidad 2)`);
  const bfs = graphService.bfs('ATL', 2);
  if (bfs.success) {
    console.log(`  Nodos alcanzables: ${bfs.reachableNodes}`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ TICKET #12 COMPLETADO EXITOSAMENTE');
  console.log('═══════════════════════════════════════════════════\n');

  process.exit(0);
} else {
  console.error('❌ Error:', result.error);
  process.exit(1);
}
