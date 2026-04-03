/**
 * FlightDataLoaderService.js
 * Servicio para cargar, validar y limpiar dataset de vuelos desde CSV
 * 
 * Responsabilidades:
 * - Cargar CSV de vuelos
 * - Validar formato de datos
 * - Limpiar valores nulos/inconsistentes
 * - Normalizar códigos de aeropuertos
 * - Validar rutas ida/retorno
 * - Exportar datos limpios
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FlightDataLoaderService {
  
  constructor(csvPath = null) {
    // Si no se proporciona ruta, calcularla
    if (csvPath) {
      this.csvPath = csvPath;
    } else {
      // Desde services/ necesitamos ir 3 niveles arriba para salir de backend
      this.csvPath = path.join(__dirname, '../../../02 - Practica 3 Dataset Flights.csv');
    }
    this.rawData = [];
    this.cleanedData = [];
    this.validationStats = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      nullValuesFound: 0,
      inconsistenciesFixed: 0,
      errors: []
    };
  }

  /**
   * PASO 1: Cargar CSV
   */
  loadCSV() {
    try {
      if (!fs.existsSync(this.csvPath)) {
        throw new Error(`Archivo CSV no encontrado: ${this.csvPath}`);
      }

      const fileContent = fs.readFileSync(this.csvPath, 'utf-8');
      const lines = fileContent.trim().split('\n');

      // Saltar encabezado
      const headers = lines[0].split(',').map(h => h.trim());
      console.log(`✓ Headers detectados: ${headers.join(', ')}`);

      // Procesar filas
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Saltar líneas vacías

        const values = line.split(',').map(v => v.trim());
        
        const record = {
          flight_date: values[0],
          flight_time: values[1],
          origin: values[2],
          destination: values[3],
          aircraft_id: values[4],
          status: values[5],
          gate: values[6],
          lineNumber: i + 1
        };

        this.rawData.push(record);
      }

      this.validationStats.totalRows = this.rawData.length;
      console.log(`✓ Cargadas ${this.rawData.length} filas del CSV`);
      
      return {
        success: true,
        rowsLoaded: this.rawData.length,
        message: 'CSV cargado exitosamente'
      };

    } catch (error) {
      console.error(`✗ Error cargando CSV: ${error.message}`);
      this.validationStats.errors.push(`CSV Load Error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * PASO 2: Validar formato de datos
   */
  validateFormat() {
    console.log('\n📋 Validando formato...');
    const validStatuses = ['SCHEDULED', 'DELAYED', 'DEPARTED', 'CANCELLED', 'LANDED', 'IN_FLIGHT', 'BOARDING'];
    const airportCodeRegex = /^[A-Z]{3}$/;
    const timeRegex = /^\d{1,2}:\d{2}$/;

    for (const record of this.rawData) {
      const errors = [];

      // Validar fecha
      if (!this.isValidDate(record.flight_date)) {
        errors.push(`Fecha inválida: ${record.flight_date}`);
      }

      // Validar hora
      if (!timeRegex.test(record.flight_time)) {
        errors.push(`Hora inválida: ${record.flight_time}`);
      }

      // Validar códigos aeropuerto
      if (!airportCodeRegex.test(record.origin)) {
        errors.push(`Código origen inválido: ${record.origin}`);
      }
      if (!airportCodeRegex.test(record.destination)) {
        errors.push(`Código destino inválido: ${record.destination}`);
      }

      // Validar que origen ≠ destino
      if (record.origin === record.destination) {
        errors.push(`Origen y destino iguales: ${record.origin}`);
      }

      // Validar status
      if (!validStatuses.includes(record.status)) {
        errors.push(`Status inválido: ${record.status}`);
      }

      // Validar aircraft_id (debe ser número)
      if (isNaN(record.aircraft_id) || record.aircraft_id === '') {
        errors.push(`Aircraft ID inválido: ${record.aircraft_id}`);
      }

      // Validar gate
      if (!record.gate || record.gate === '') {
        errors.push(`Gate vacío o inválido`);
      }

      record.validationErrors = errors;
      if (errors.length === 0) {
        this.validationStats.validRows++;
      } else {
        this.validationStats.invalidRows++;
        this.validationStats.errors.push(`Línea ${record.lineNumber}: ${errors.join('; ')}`);
      }
    }

    console.log(`✓ Validación completada: ${this.validationStats.validRows} válidas, ${this.validationStats.invalidRows} inválidas`);
    
    return {
      validRows: this.validationStats.validRows,
      invalidRows: this.validationStats.invalidRows
    };
  }

  /**
   * PASO 3: Limpiar valores nulos/inconsistentes
   */
  cleanData() {
    console.log('\n🧹 Limpiando datos...');

    for (const record of this.rawData) {
      // Saltar registros con errores de validación
      if (record.validationErrors && record.validationErrors.length > 0) {
        continue;
      }

      let cleaned = { ...record };

      // Limpiar espacios en blanco extras
      Object.keys(cleaned).forEach(key => {
        if (typeof cleaned[key] === 'string') {
          cleaned[key] = cleaned[key].trim();
        }
      });

      // Normalizar mayúsculas en códigos aeropuerto
      cleaned.origin = cleaned.origin.toUpperCase();
      cleaned.destination = cleaned.destination.toUpperCase();
      cleaned.status = cleaned.status.toUpperCase();

      // Normalizar aircraft_id (asegurar que es número)
      cleaned.aircraft_id = parseInt(cleaned.aircraft_id);

      // Normalizar hora (asegurar formato HH:MM)
      cleaned.flight_time = this.normalizeTime(cleaned.flight_time);

      // Normalizar fecha (convertir a ISO format YYYY-MM-DD)
      cleaned.flight_date = this.normalizeDate(cleaned.flight_date);

      // Validar gate y normalizar
      if (!cleaned.gate || cleaned.gate === '') {
        cleaned.gate = 'UNKNOWN';
        this.validationStats.inconsistenciesFixed++;
      }

      // Detectar o crear ID único para vuelo
      cleaned.flightId = this.generateFlightId(cleaned);

      this.cleanedData.push(cleaned);
    }

    console.log(`✓ Limpieza completada: ${this.cleanedData.length} registros limpios`);
    
    return {
      cleanedRows: this.cleanedData.length
    };
  }

  /**
   * PASO 4: Normalizar nombres de aeropuertos
   */
  normalizeAirports() {
    console.log('\n✈️  Normalizando aeropuertos...');

    const airportMap = {
      'ATL': { city: 'Atlanta', country: 'USA', name: 'Hartsfield-Jackson Atlanta International' },
      'DFW': { city: 'Dallas-Fort Worth', country: 'USA', name: 'Dallas-Fort Worth International' },
      'SIN': { city: 'Singapore', country: 'Singapore', name: 'Singapore Changi' },
      'PEK': { city: 'Beijing', country: 'China', name: 'Beijing Capital International' },
      'LON': { city: 'London', country: 'UK', name: 'London Heathrow' },
      'DXB': { city: 'Dubai', country: 'UAE', name: 'Dubai International' },
      'TYO': { city: 'Tokyo', country: 'Japan', name: 'Tokyo Narita' },
      'PAR': { city: 'Paris', country: 'France', name: 'Paris Charles de Gaulle' },
      'LAX': { city: 'Los Angeles', country: 'USA', name: 'Los Angeles International' },
      'AMS': { city: 'Amsterdam', country: 'Netherlands', name: 'Amsterdam Airport Schiphol' },
      'IST': { city: 'Istanbul', country: 'Turkey', name: 'Istanbul International' },
      'FRA': { city: 'Frankfurt', country: 'Germany', name: 'Frankfurt am Main' },
      'SAO': { city: 'São Paulo', country: 'Brazil', name: 'São Paulo Guarulhos' },
      'CAN': { city: 'Guangzhou', country: 'China', name: 'Guangzhou Baiyun International' },
      'MAD': { city: 'Madrid', country: 'Spain', name: 'Adolfo Suárez Madrid Barajas' },
      'NYC': { city: 'New York', country: 'USA', name: 'New York JFK' },
      'JFK': { city: 'New York', country: 'USA', name: 'John F. Kennedy International' },
      'LHR': { city: 'London', country: 'UK', name: 'London Heathrow' },
      'CDG': { city: 'Paris', country: 'France', name: 'Paris Charles de Gaulle' }
    };

    for (const record of this.cleanedData) {
      if (airportMap[record.origin]) {
        record.originAirport = airportMap[record.origin];
      } else {
        record.originAirport = { city: record.origin, country: 'Unknown', name: record.origin };
      }

      if (airportMap[record.destination]) {
        record.destinationAirport = airportMap[record.destination];
      } else {
        record.destinationAirport = { city: record.destination, country: 'Unknown', name: record.destination };
      }
    }

    console.log(`✓ Aeropuertos normalizados`);
    
    return {
      normalizedAirports: this.cleanedData.length
    };
  }

  /**
   * PASO 5: Validar rutas ida/retorno
   */
  validateRoutes() {
    console.log('\n🛫 Validando rutas ida/retorno...');

    const routeMap = {};
    const roundTripRoutes = [];

    // Agrupar rutas
    for (const record of this.cleanedData) {
      const route = `${record.origin}-${record.destination}`;
      const reverseRoute = `${record.destination}-${record.origin}`;

      if (!routeMap[route]) {
        routeMap[route] = [];
      }
      routeMap[route].push(record);

      // Detectar rutas de retorno
      if (routeMap[reverseRoute]) {
        const key = [route, reverseRoute].sort().join('_');
        if (!roundTripRoutes.find(r => r.key === key)) {
          roundTripRoutes.push({
            key,
            outbound: route,
            return: reverseRoute,
            outboundFlights: routeMap[route].length,
            returnFlights: routeMap[reverseRoute].length
          });
        }
      }
    }

    // Enriquecer datos con información de ruta
    for (const record of this.cleanedData) {
      const route = `${record.origin}-${record.destination}`;
      const reverseRoute = `${record.destination}-${record.origin}`;
      
      record.route = route;
      record.hasReturnRoute = !!routeMap[reverseRoute];
      record.returnRouteFlights = routeMap[reverseRoute] ? routeMap[reverseRoute].length : 0;
    }

    console.log(`✓ Rutas validadas: ${Object.keys(routeMap).length} rutas únicas`);
    console.log(`✓ Rutas ida/retorno encontradas: ${roundTripRoutes.length}`);
    
    return {
      totalRoutes: Object.keys(routeMap).length,
      roundTripRoutes: roundTripRoutes.length,
      routeDetails: roundTripRoutes
    };
  }

  /**
   * PASO 6: Exportar datos limpios
   */
  exportCleanedData(outputPath = null) {
    console.log('\n💾 Exportando datos limpios...');

    const finalPath = outputPath || path.join(__dirname, '../../flights_cleaned.json');

    // Preparar estructura final
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalFlights: this.cleanedData.length,
        sourceFile: this.csvPath,
        validationStats: this.validationStats
      },
      data: this.cleanedData
    };

    try {
      fs.writeFileSync(finalPath, JSON.stringify(exportData, null, 2), 'utf-8');
      console.log(`✓ Datos exportados a: ${finalPath}`);
      console.log(`✓ Total de registros: ${this.cleanedData.length}`);
      
      return {
        success: true,
        filePath: finalPath,
        recordsExported: this.cleanedData.length
      };
    } catch (error) {
      console.error(`✗ Error exportando datos: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ejecutar pipeline completo de carga y limpieza
   */
  executeFullPipeline() {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🚀 INICIANDO PIPELINE DE CARGA Y LIMPIEZA DE VUELOS');
    console.log('═══════════════════════════════════════════════════\n');

    const startTime = Date.now();

    // Paso 1: Cargar
    const loadResult = this.loadCSV();
    if (!loadResult.success) {
      return { success: false, error: loadResult.error };
    }

    // Paso 2: Validar
    this.validateFormat();

    // Paso 3: Limpiar
    this.cleanData();

    // Paso 4: Normalizar aeropuertos
    this.normalizeAirports();

    // Paso 5: Validar rutas
    const routeValidation = this.validateRoutes();

    // Paso 6: Exportar
    const exportResult = this.exportCleanedData();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE PROCESAMIENTO');
    console.log('═══════════════════════════════════════════════════');
    console.log(`⏱️  Tiempo total: ${duration}ms`);
    console.log(`📄 Filas originales: ${this.validationStats.totalRows}`);
    console.log(`✅ Filas válidas: ${this.validationStats.validRows}`);
    console.log(`❌ Filas inválidas: ${this.validationStats.invalidRows}`);
    console.log(`🧹 Inconsistencias corregidas: ${this.validationStats.inconsistenciesFixed}`);
    console.log(`📦 Registros limpios exportados: ${this.cleanedData.length}`);
    console.log(`🛫 Rutas únicas: ${routeValidation.totalRoutes}`);
    console.log(`🔄 Rutas ida/retorno: ${routeValidation.roundTripRoutes}`);
    console.log('═══════════════════════════════════════════════════\n');

    return {
      success: true,
      stats: {
        totalRows: this.validationStats.totalRows,
        validRows: this.validationStats.validRows,
        invalidRows: this.validationStats.invalidRows,
        cleanedRows: this.cleanedData.length,
        totalRoutes: routeValidation.totalRoutes,
        roundTripRoutes: routeValidation.roundTripRoutes,
        duration
      },
      exportPath: exportResult.filePath
    };
  }

  /**
   * UTILIDADES
   */

  isValidDate(dateStr) {
    // Formato MM/DD/YY
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    const [month, day, year] = parts;
    return !isNaN(month) && !isNaN(day) && !isNaN(year);
  }

  normalizeTime(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return timeStr;
    const hour = parseInt(parts[0]).toString().padStart(2, '0');
    const minute = parseInt(parts[1]).toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }

  normalizeDate(dateStr) {
    // Convertir MM/DD/YY a YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    
    let [month, day, year] = parts;
    month = parseInt(month).toString().padStart(2, '0');
    day = parseInt(day).toString().padStart(2, '0');
    year = parseInt(year);
    
    // Asumir 2000s para años 2 dígitos
    if (year < 100) {
      year = year + 2000;
    }
    
    return `${year}-${month}-${day}`;
  }

  generateFlightId(record) {
    // Generar ID único basado en ruta, fecha, hora y aircraft
    const date = record.flight_date.replace(/-/g, '');
    const time = record.flight_time.replace(':', '');
    const route = `${record.origin}${record.destination}`;
    const aircraft = record.aircraft_id;
    
    return `${route}_${date}_${time}_${aircraft}`;
  }

  /**
   * Obtener estadísticas de validación
   */
  getValidationStats() {
    return {
      ...this.validationStats,
      cleanedDataRows: this.cleanedData.length
    };
  }

  /**
   * Obtener muestra de datos limpios
   */
  getSampleCleanedData(limit = 5) {
    return this.cleanedData.slice(0, limit);
  }
}

export default FlightDataLoaderService;
