import mongoose from 'mongoose';
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://admin:MongoSecretPass1!@localhost:27017/AerolineasMongoDB?authSource=admin';

const config1 = { user: 'sa', password: 'SuperSecretSQL1!', server: '127.0.0.1', database: 'AerolineasDB', port: 1433, options: { trustServerCertificate: true } };
const config2 = { user: 'sa', password: 'SuperSecretSQL2!', server: '127.0.0.1', database: 'AerolineasDB', port: 1434, options: { trustServerCertificate: true } };

async function nukeAllData() {
    try {
        console.log("💣 Nuking todo...");

        // 1. Limpiar MongoDB
        await mongoose.connect(mongoUri);
        const flightSchema = new mongoose.Schema({}, { strict: false });
        const Flight = mongoose.models.Flight || mongoose.model('Flight', flightSchema);
        await Flight.deleteMany({});
        console.log("✅ MongoDB 'Flight' Collection: VACIADA AL 100%");
        await mongoose.disconnect();

        // 2. Limpiar SQL Server 1
        const pool1 = await sql.connect(config1);
        await pool1.request().query("DELETE FROM Tickets; DELETE FROM Flights; DELETE FROM Fleet; DELETE FROM AircraftModels;");
        console.log("✅ SQL Nodo 1 (Port 1433): TABLAS VACIADAS AL 100%");
        await pool1.close();

        // 3. Limpiar SQL Server 2
        const pool2 = await new sql.ConnectionPool(config2).connect();
        await pool2.request().query("DELETE FROM Tickets; DELETE FROM Flights; DELETE FROM Fleet; DELETE FROM AircraftModels;");
        console.log("✅ SQL Nodo 2 (Port 1434): TABLAS VACIADAS AL 100%");
        await pool2.close();

        console.log("🎉 DESTRUCCIÓN EXITOSA. CLÚSTER ESTÁ LIMPIO.");
        process.exit();
    } catch(err) {
        console.error("❌ Error", err.message);
        process.exit();
    }
}
nukeAllData();
