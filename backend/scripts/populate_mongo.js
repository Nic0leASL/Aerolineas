import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Modelos
const flightSchema = new mongoose.Schema({
  flightId: { type: String, required: true, unique: true },
  flight_date: { type: String, required: true },
  flight_time: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  aircraft_id: { type: Number, required: true },
  status: { type: String, required: true },
  gate: { type: String, default: 'UNKNOWN' },
  originAirport: { city: String, country: String, name: String },
  destinationAirport: { city: String, country: String, name: String }
}, { timestamps: true });

const Flight = mongoose.models.Flight || mongoose.model('Flight', flightSchema);

const mongoUri = process.env.MONGO_URI || 'mongodb://admin:MongoSecretPass1!@localhost:27017/AerolineasMongoDB?authSource=admin';

async function syncFlightsFromCSV() {
    console.log("Iniciando parseo del archivo CSV (Dataset Flights) para volcar a MongoDB...");
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Conectado a MongoDB");

        const csvPath = path.resolve(__dirname, '../../02 - Practica 3 Dataset Flights.csv');
        let csvContent = "";
        
        if (fs.existsSync(csvPath)) {
             csvContent = fs.readFileSync(csvPath, 'utf8');
        }

        if (!csvContent) {
             throw new Error("No se encontró el Dataset CSV.");
        }

        const lines = csvContent.split('\n');
        const parsedFlights = [];

        // Parsear CSV manual rápido (Omitimos primera línea de cabecera)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(',');
            if(cols.length < 5) continue;
            
            // Format: flight_date, flight_time, origin, destination, aircraft_id, status, gate
            parsedFlights.push({
                flightId: `RF-${i}`,
                flight_date: cols[0],
                flight_time: cols[1],
                origin: cols[2],
                destination: cols[3],
                aircraft_id: parseInt(cols[4]),
                status: cols[5] || 'SCHEDULED',
                gate: cols[6] || `G-${Math.floor(Math.random() * 20)+1}`
            });
        }

        console.log(`✈ Extraídos ${parsedFlights.length} vuelos del CSV.`);

        let inserted = 0;
        let updated = 0;

        for (const f of parsedFlights) {
            const flightData = {
                flightId: f.flightId,
                flight_date: f.flight_date,
                flight_time: f.flight_time,
                origin: f.origin,
                destination: f.destination,
                aircraft_id: f.aircraft_id,
                status: f.status,
                gate: f.gate,
                originAirport: { city: f.origin, country: "Global", name: `Aeropuerto de ${f.origin}` },
                destinationAirport: { city: f.destination, country: "Global", name: `Aeropuerto de ${f.destination}` }
            };

            const dbRes = await Flight.findOneAndUpdate(
                { flightId: f.flightId },
                { $set: flightData },
                { upsert: true, rawResult: true }
            );

            if (dbRes && dbRes.lastErrorObject && !dbRes.lastErrorObject.updatedExisting) {
                inserted++;
            } else {
                updated++;
            }
            
            // Log cada 5000 vuelos para mostrar progreso en consola
            if ((inserted + updated) % 5000 === 0) {
                console.log(`⏳ Progreso: ${inserted + updated} vuelos guardados en Mongo...`);
            }
        }

        console.log(`🎉 Sincronización de CSV a MongoDB Completa! Insertados: ${inserted}, Actualizados: ${updated}`);

    } catch (error) {
        console.error("❌ Error durante la sincronización: ", error);
    } finally {
        await mongoose.disconnect();
        console.log("Cerrando conexiones Mongo...");
        process.exit(0);
    }
}

syncFlightsFromCSV();
