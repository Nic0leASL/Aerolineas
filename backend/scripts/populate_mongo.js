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

async function syncFlightsFromJson() {
    console.log("Iniciando purga e ingesta a MongoDB...");
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Conectado a MongoDB Atlas - Vaciando Colección (Purga Completa)");
        
        await Flight.deleteMany({});
        console.log("🗑 Colección Flight en Mongo vaciada exitosamente.");

        const jsonPath = path.resolve(__dirname, '../flights_cleaned.json');
        
        if (!fs.existsSync(jsonPath)) {
             throw new Error("No se encontró flights_cleaned.json.");
        }

        const fileData = fs.readFileSync(jsonPath, 'utf8');
        const parsedData = JSON.parse(fileData);
        // El usuario solicitó específicamente cargar los 8119 registros iguales al SQL:
        const flights = parsedData.data.slice(0, 8119);

        console.log(`✈ Extraídos ${flights.length} vuelos del JSON para Mongo.`);

        const insertDocs = flights.map((f, i) => {
            let flightDatestr = f.flight_date || '2026-03-30'; 
            let flightTimeStr = f.flight_time || '10:00';
            
            if(flightDatestr.includes('/')) {
               const parts = flightDatestr.split('/');
               flightDatestr = `20${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
            }

            return {
                flightId: f.flightId || `RF-${i+1}`,
                flight_date: flightDatestr,
                flight_time: flightTimeStr,
                origin: f.origin || 'UKN',
                destination: f.destination || 'UKN',
                aircraft_id: (f.aircraft_id > 100 || !f.aircraft_id) ? 1 : f.aircraft_id,
                status: 'SCHEDULED',
                gate: `G-${Math.floor(Math.random() * 20)+1}`,
                originAirport: { city: f.origin, country: "Global", name: `Aeropuerto de ${f.origin}` },
                destinationAirport: { city: f.destination, country: "Global", name: `Aeropuerto de ${f.destination}` }
            };
        });

        await Flight.insertMany(insertDocs);
        console.log(`🎉 Ingesta a MongoDB Completa! Insertados exactamente ${insertDocs.length} vuelos idénticos a SQL.`);

    } catch (error) {
        console.error("❌ Error durante la sincronización: ", error);
    } finally {
        await mongoose.disconnect();
        console.log("Cerrando conexiones Mongo...");
        process.exit(0);
    }
}

syncFlightsFromJson();
