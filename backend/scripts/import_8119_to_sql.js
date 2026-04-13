import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const sqlConfig1 = {
    user: process.env.SQL_USER || 'sa',
    password: process.env.SQL_PASSWORD_NODE1 || 'SqlServerPass1!',
    database: process.env.SQL_DATABASE || 'AerolineasDB',
    server: process.env.SQL_SERVER === 'localhost' ? '127.0.0.1' : (process.env.SQL_SERVER || '127.0.0.1'),
    port: parseInt(process.env.SQL_PORT_NODE1 || 1433),
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: false, trustServerCertificate: true }
};

const sqlConfig2 = {
    user: process.env.SQL_USER || 'sa',
    password: process.env.SQL_PASSWORD_NODE2 || 'SqlServerPass2!',
    database: process.env.SQL_DATABASE || 'AerolineasDB',
    server: process.env.SQL_SERVER2 === 'localhost' ? '127.0.0.1' : (process.env.SQL_SERVER2 || '127.0.0.1'),
    // Si corre en host será 1434, pero internamente en docker la env sobrescribe a 1433
    port: parseInt(process.env.SQL_PORT_NODE2 || 1434),
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: false, trustServerCertificate: true }
};

async function createSchemaAndFleet(sqlPool, nodeName) {
    // 0. Crear Tablas si no existen
    await sqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AircraftModels' and xtype='U')
        BEGIN
            CREATE TABLE AircraftModels (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Manufacturer VARCHAR(50),
                Model VARCHAR(50),
                FirstClassSeats INT,
                EconomySeats INT
            );
        END

        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Fleet' and xtype='U')
        BEGIN
            CREATE TABLE Fleet (
                AircraftId INT PRIMARY KEY,
                ModelId INT FOREIGN KEY REFERENCES AircraftModels(Id)
            );
        END

        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Flights' and xtype='U')
        BEGIN
            CREATE TABLE Flights (
                FlightId VARCHAR(50) PRIMARY KEY,
                AircraftId INT FOREIGN KEY REFERENCES Fleet(AircraftId),
                Origin VARCHAR(10),
                Destination VARCHAR(10),
                DepartureTime DATETIME,
                ArrivalTime DATETIME,
                Duration INT,
                FirstClassPrice DECIMAL(10,2),
                EconomyPrice DECIMAL(10,2),
                Status VARCHAR(20)
            );
        END
    `);

    // PURGA COMPLETA: Limpiar todo para empezar desde cero si el usuario lo solicita
    await sqlPool.request().query(`
        DELETE FROM Flights;
        DELETE FROM Fleet;
        DELETE FROM AircraftModels;
    `);
    console.log(`🗑 Tablas de Base de Datos limpiadas en ${nodeName} para reinserción.`);

    // 1. Asegurar modelos de aviones
    await sqlPool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM AircraftModels WHERE Id = 1)
        BEGIN
            SET IDENTITY_INSERT AircraftModels ON;
            INSERT INTO AircraftModels (Id, Manufacturer, Model, FirstClassSeats, EconomySeats) VALUES 
            (1, 'Boeing', '777-300ER', 12, 138),
            (2, 'Airbus', 'A380-800', 14, 136);
            SET IDENTITY_INSERT AircraftModels OFF;
        END
    `);
    
    // 2. Generar 100 aviones en Fleet
    await sqlPool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM Fleet WHERE AircraftId = 1)
        BEGIN
            DECLARE @i INT = 1;
            WHILE @i <= 100
            BEGIN
                INSERT INTO Fleet (AircraftId, ModelId) VALUES (@i, IIF(@i % 2 = 0, 1, 2));
                SET @i = @i + 1;
            END
        END
    `);
    console.log(`📦 Catálogos de Vuelo asegurados en ${nodeName}`);
}

async function insertFlightsToNode(sqlPool, flights, nodeName) {
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < flights.length; i++) {
        const f = flights[i];
        try {
            let flightDatestr = f.flight_date || '2026-03-30'; 
            let flightTimeStr = f.flight_time || '10:00';
            
            if(flightDatestr.includes('/')) {
               const parts = flightDatestr.split('/');
               flightDatestr = `20${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
            }

            let departureTime = `${flightDatestr} ${flightTimeStr}:00`;
            let arrivalTime = `${flightDatestr} 23:59:00`; 
            
            if (isNaN(new Date(departureTime).getTime())) departureTime = '2026-01-01 10:00:00';
            if (isNaN(new Date(arrivalTime).getTime())) arrivalTime = '2026-01-01 23:59:00';

            const aircraftId = (f.aircraft_id > 100 || !f.aircraft_id) ? 1 : f.aircraft_id;
            const flightIdStr = f.flightId || `RF-${i+1}`;

            await sqlPool.request()
                .input('flightId', sql.VarChar, flightIdStr)
                .input('aircraftId', sql.Int, aircraftId)
                .input('origin', sql.VarChar, f.origin || 'UKN')
                .input('dest', sql.VarChar, f.destination || 'UKN')
                .input('dep', sql.DateTime, new Date(departureTime))
                .input('arr', sql.DateTime, new Date(arrivalTime))
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM Flights WHERE FlightId = @flightId)
                    BEGIN
                        INSERT INTO Flights (FlightId, AircraftId, Origin, Destination, DepartureTime, ArrivalTime, Duration, FirstClassPrice, EconomyPrice, Status)
                        VALUES (@flightId, @aircraftId, @origin, @dest, @dep, @arr, 120, 2100.00, 850.00, 'SCHEDULED')
                    END
                `);
            inserted++;
            if (inserted % 2000 === 0) console.log(`⏳ Progreso [${nodeName}]: ${inserted} vuelos insertados...`);
        } catch(e) {
            errors++;
        }
    }
    console.log(`🎉 [${nodeName}] ¡Completado! Insertados: ${inserted} | Errores: ${errors}`);
}

async function syncToSQL() {
    console.log("✈ Iniciando ingesta en ESPEJO a los nodos SQL Server");
    let pool1, pool2;

    try {
        // Leer directamente desde el json limpio
        const jsonPath = path.resolve(__dirname, '../flights_cleaned.json');
        if(!fs.existsSync(jsonPath)) {
            console.error("No se encontró el archivo flights_cleaned.json");
            process.exit(1);
        }
        
        const fileData = fs.readFileSync(jsonPath, 'utf8');
        const parsedData = JSON.parse(fileData);
        const flights = parsedData.data.slice(0, 8119);

        console.log(`⬇ Extraídos ${flights.length} vuelos. Preparando inyección DUAL...`);

        // Connect Node 1
        pool1 = await sql.connect(sqlConfig1);
        console.log("✅ Conectado a SQL Server Node 1");
        await createSchemaAndFleet(pool1, "Node 1");

        // Connect Node 2
        pool2 = await new sql.ConnectionPool(sqlConfig2).connect();
        console.log("✅ Conectado a SQL Server Node 2");
        await createSchemaAndFleet(pool2, "Node 2");

        // Inserción en paralelo en ambos nodos
        await Promise.all([
            insertFlightsToNode(pool1, flights, "Node 1"),
            insertFlightsToNode(pool2, flights, "Node 2")
        ]);

        console.log("✈✈ INGESTA DUAL EXITOSA. El sistema está ahora sincronizado como espejo.");

    } catch (err) {
        console.error("❌ Error catastrófico en la ingesta: ", err);
    } finally {
        if(pool1) await pool1.close();
        if(pool2) await pool2.close();
        process.exit();
    }
}
syncToSQL();
