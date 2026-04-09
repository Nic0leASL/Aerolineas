import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectMongo } from '../config/mongoDb.js';
import { getConnection } from '../config/db.js';
import Flight from '../models/FlightModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedDatabase = async () => {
    try {
        console.log('🔄 Iniciando Script de Siembra y Limpieza...');

        // 1. Conectar a Mongo
        await connectMongo();
        
        // 2. Limpiar MongoDB (Drop Collections)
        console.log('🗑️ [MONGODB] Borrando todos los vuelos antiguos...');
        await Flight.deleteMany({});
        console.log('✓ [MONGODB] Base de datos limpia.');

        // 3. Conectar a SQL Server (Limpiar Tickets Antiguos)
        console.log('🗑️ [SQL SERVER] Borrando tickets antiguos...');
        try {
            const sqlPool = await getConnection();
            // Desactivar temporalmente restricciones si las hay, o usar DELETE general
            await sqlPool.request().query('DELETE FROM Tickets');
            // Nota: TRUNCATE TABLE Tickets reinicia la semilla IDENTITY
            // En Master-Master a veces DELETE sirve bien, intentamos TRUNCATE primero
            // await sqlPool.request().query('TRUNCATE TABLE Tickets'); 
            console.log('✓ [SQL SERVER] Base de datos limpia y lista para nuevas transacciones.');
        } catch (sqlErr) {
            console.warn('⚠️ [SQL SERVER] No se pudo limpiar SQL:' + sqlErr.message);
        }

        // 4. Leer archivo cleaned flights
        const filePath = path.join(__dirname, '../../flights_cleaned.json');
        if (!fs.existsSync(filePath)) {
            console.error(`✗ Archivo data no encontrado: ${filePath}`);
            console.log('Pista: Asegúrate de correr la lógica del FlightDataLoaderService primero si no existe.');
            process.exit(1);
        }

        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const parsedFile = JSON.parse(rawContent);
        const flightArray = parsedFile.data || [];

        console.log(`✈️  [MONGODB] Comenzando la inserción masiva de ${flightArray.length} vuelos...`);
        
        // Opcional: Insertar en lotes si son demasiados para evitar timeout de Mongoose
        const BATCH_SIZE = 500;
        let insertedRows = 0;
        for (let i = 0; i < flightArray.length; i += BATCH_SIZE) {
            const chunk = flightArray.slice(i, i + BATCH_SIZE);
            await Flight.insertMany(chunk, { ordered: false });
            insertedRows += chunk.length;
            process.stdout.write(`... Insertados ${insertedRows}/${flightArray.length}\r`);
        }
        
        console.log('\n✓ [MONGODB] Carga completada exitosamente.');

        console.log('✅ TODO LISTO. Ecosistema de bases de datos ha sido reseteado.');
        process.exit(0);
    } catch (error) {
        console.error('\n✗ Error general ejecutando el seed:', error);
        process.exit(1);
    }
};

seedDatabase();
