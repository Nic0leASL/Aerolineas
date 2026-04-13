import mongoose from 'mongoose';
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const flightSchema = new mongoose.Schema({
  flightId: String,
  flight_date: String,
  flight_time: String,
  origin: String,
  destination: String,
  aircraft_id: Number,
  status: String,
  gate: String
}, { strict: false });

const Flight = mongoose.models.Flight || mongoose.model('Flight', flightSchema);

const sqlConfig = {
    user: process.env.SQL_USER || 'sa',
    password: process.env.SQL_PASSWORD_NODE1 || 'SqlServerPass1!',
    database: process.env.SQL_DATABASE || 'AerolineasDB',
    server: process.env.SQL_SERVER || 'localhost',
    port: parseInt(process.env.SQL_PORT_NODE1 || 1433),
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: false, trustServerCertificate: true }
};

async function syncToSQL() {
    console.log("✈ Iniciando sincronización de Mongo Atlas -> SQL Server Node 1");
    let sqlPool;
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado a MongoDB Atlas");

        sqlPool = await sql.connect(sqlConfig);
        console.log("✅ Conectado a SQL Server Node 1");

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
        
        // 2. Generar 100 aviones en Fleet para que la llave foránea no falle
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

        console.log("📦 Catálogos de Vuelo Asegurados. Leyendo de Mongo...");
        
        const flights = await Flight.find({});
        console.log(`⬇ Encontrados ${flights.length} vuelos en MongoDB Atlas. Volcando a SQL...`);

        let inserted = 0;
        let errors = 0;

        for (const f of flights) {
            try {
                // Parse date mapping
                let flightDatestr = f.flight_date || '2026-03-30'; 
                let flightTimeStr = f.flight_time || '10:00';
                
                // Normaliza formato si es mm/dd/yy (del CSV original)
                if(flightDatestr.includes('/')) {
                   const parts = flightDatestr.split('/');
                   flightDatestr = `20${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
                }

                let departureTime = `${flightDatestr} ${flightTimeStr}:00`;
                let arrivalTime = `${flightDatestr} 23:59:00`; 
                
                // Hack para corregir si hay fechas mal formateadas
                if (isNaN(new Date(departureTime).getTime())) departureTime = '2026-01-01 10:00:00';
                if (isNaN(new Date(arrivalTime).getTime())) arrivalTime = '2026-01-01 23:59:00';

                const aircraftId = (f.aircraft_id > 100 || !f.aircraft_id) ? 1 : f.aircraft_id;

                await sqlPool.request()
                    .input('flightId', sql.VarChar, f.flightId)
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
                if (inserted % 1000 === 0) console.log(`⏳ Progreso: ${inserted} vuelos insertados en SQL...`);
            } catch(e) {
                errors++;
            }
        }

        console.log(`🎉 ¡Sincronizado! Insertados en SQL: ${inserted} | Omitidos/Errores: ${errors}`);

    } catch (err) {
        console.error("Error catastrófico: ", err);
    } finally {
        await mongoose.disconnect();
        if(sqlPool) await sqlPool.close();
        process.exit();
    }
}
syncToSQL();
