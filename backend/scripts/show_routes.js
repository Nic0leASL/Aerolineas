import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
    user: 'sa',
    password: 'SuperSecretSQL1!',
    server: '127.0.0.1',
    database: 'AerolineasDB',
    port: 1433,
    options: { trustServerCertificate: true }
};

async function showRoutes() {
    try {
        const pool = await sql.connect(config);

        console.log("\n=== RUTAS ÚNICAS DISPONIBLES (1 registro por par Origen-Destino) ===\n");
        const routes = await pool.request().query(`
            SELECT 
                Origin, 
                Destination, 
                COUNT(*) AS TotalVuelos,
                MIN(CAST(DepartureTime AS DATE)) AS PrimeraFecha,
                MAX(CAST(DepartureTime AS DATE)) AS UltimaFecha,
                MIN(EconomyPrice) AS PrecioMinEco,
                MIN(FirstClassPrice) AS PrecioMinFirst
            FROM Flights 
            GROUP BY Origin, Destination 
            ORDER BY Origin, Destination
        `);
        console.table(routes.recordset);

        console.log("\n=== AEROPUERTOS ÚNICOS EN EL SISTEMA ===\n");
        const airports = await pool.request().query(`
            SELECT DISTINCT Origin AS Aeropuerto FROM Flights
            UNION
            SELECT DISTINCT Destination AS Aeropuerto FROM Flights
            ORDER BY Aeropuerto
        `);
        console.table(airports.recordset);

        console.log("\n=== POSIBLES ESCALAS (rutas de 1 escala) ===\n");
        const hops = await pool.request().query(`
            SELECT DISTINCT A.Origin AS Origen, A.Destination AS Escala, B.Destination AS Destino
            FROM Flights A
            JOIN Flights B ON A.Destination = B.Origin
            WHERE A.Origin <> B.Destination
            ORDER BY A.Origin, A.Destination, B.Destination
        `);
        console.log(`Total rutas con 1 escala posibles: ${hops.recordset.length}`);
        console.table(hops.recordset.slice(0, 30)); // mostrar primeras 30

        console.log("\n=== TOTAL DE REGISTROS EN LA BASE ===\n");
        const count = await pool.request().query(`SELECT COUNT(*) AS TotalFlights FROM Flights`);
        console.table(count.recordset);

        process.exit();
    } catch(err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}
showRoutes();
