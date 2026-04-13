import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const config1 = {
    user: 'sa', password: 'SuperSecretSQL1!', server: '127.0.0.1', database: 'AerolineasDB', port: 1433, options: { trustServerCertificate: true }
};
const config2 = {
    user: 'sa', password: 'SuperSecretSQL2!', server: '127.0.0.1', database: 'AerolineasDB', port: 1434, options: { trustServerCertificate: true }
};

async function clean() {
    try {
        const pool1 = await sql.connect(config1);
        await pool1.request().query("DELETE FROM Flights WHERE FlightId LIKE 'FAKE-%'");
        console.log("Limpiados fakes de Nodo 1");

        const pool2 = await new sql.ConnectionPool(config2).connect();
        await pool2.request().query("DELETE FROM Flights WHERE FlightId LIKE 'FAKE-%'");
        console.log("Limpiados fakes de Nodo 2");
    } catch(e) {
        console.error("Ignorando error al limpiar fakes", e.message);
    }
    process.exit();
}
clean();
