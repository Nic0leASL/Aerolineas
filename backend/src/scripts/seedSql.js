import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import dotenv from 'dotenv';
import PriceMatrixService from '../services/PriceMatrixService.js';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Función para sembrar la base de datos SQL de forma robusta
 */
export const seedDatabase = async (nodeId = '1', sampleSize = 3000) => {
    const isNode2 = nodeId === '2';
    const port = isNode2 ? parseInt(process.env.SQL_PORT_NODE2 || '1434') : parseInt(process.env.SQL_PORT_NODE1 || '1433');
    const password = isNode2 ? process.env.SQL_PASSWORD_NODE2 : process.env.SQL_PASSWORD_NODE1;

    const dbConfig = {
        user: process.env.SQL_USER || 'sa',
        password: password || 'SuperSecretSQL1!',
        server: process.env.SQL_SERVER || 'localhost',
        database: process.env.SQL_DATABASE || 'AerolineasDB',
        port: port,
        options: { encrypt: false, trustServerCertificate: true },
        connectionTimeout: 30000,
        requestTimeout: 60000
    };

    let pool;
    try {
        console.log(`\n🚀 INICIANDO SIEMBRA PERSISTENTE Y REINICIO DE IDENTIDADES - Nodo ${nodeId}...`);
        pool = await sql.connect(dbConfig);
        
        // 1. Limpiar datos y REINICIAR IDENTIDADES (Crucial para que los IDs coincidan con el loop)
        console.log('🧹 Limpiando tablas y reseteando IDs...');
        await pool.request().query(`
            DELETE FROM Tickets;
            DELETE FROM Flights;
            DELETE FROM Persons;
            DBCC CHECKIDENT ('Persons', RESEED, 0);
            DBCC CHECKIDENT ('Tickets', RESEED, 0);
        `);

        // 2. Insertar Personas dummy (Para que los tickets tengan dueños reales)
        console.log('👥 Insertando pasajeros de prueba con nombres globales...');
        const globalNames = [
            'Rafael Pabón', 'Gabriel García Márquez', 'Marie Curie', 'Albert Einstein', 'Ada Lovelace',
            'Nelson Mandela', 'Frida Kahlo', 'Leonardo da Vinci', 'Isaac Newton', 'Nikola Tesla',
            'Cleopatra VII', 'Mahatma Gandhi', 'Rosa Parks', 'Simón Bolívar', 'Juana de Arco',
            'Wolfgang Amadeus Mozart', 'Grace Hopper', 'Steve Jobs', 'Bill Gates', 'Alan Turing',
            'Katherine Johnson', 'Hedy Lamarr', 'Rosalind Franklin', 'Charles Darwin', 'Alexander von Humboldt',
            'Pablo Neruda', 'Jorge Luis Borges', 'Isabel Allende', 'Mario Vargas Llosa', 'Julio Cortázar',
            'Rigoberta Menchú', 'Emiliano Zapata', 'Pancho Villa', 'José de San Martín', "Bernardo O'Higgins",
            'Antonio José de Sucre', 'Francisco de Miranda', 'Eloy Alfaro', 'Lázaro Cárdenas', 'Eva Perón',
            'Che Guevara', 'Fidel Castro', 'Salvador Allende', 'Augusto César Sandino', 'Farabundo Martí',
            'Túpac Amaru II', 'Caupolicán', 'Lautaro', 'Moctezuma II', 'Atahualpa', 'Hernán Cortés',
            'Francisco Pizarro', 'Christopher Columbus', 'Marco Polo', 'Ibn Battuta', 'Zheng He',
            'Vasco da Gama', 'Ferdinand Magellan', 'Roald Amundsen', 'Ernest Shackleton', 'Edmund Hillary',
            'Neil Armstrong', 'Yuri Gagarin', 'Valentina Tereshkova', 'Sally Ride', 'Carl Sagan',
            'Stephen Hawking', 'Richard Feynman', 'Jane Goodall', 'Dian Fossey', 'David Attenborough',
            'Greta Thunberg', 'Malala Yousafzai', 'Dalai Lama', 'Mikhail Gorbachev', 'Lech Walesa'
        ];

        for (let i = 1; i <= 200; i++) {
            const name = globalNames[i % globalNames.length] + ' ' + (Math.floor(i / globalNames.length) + 1);
            await pool.request().query(`
                INSERT INTO Persons (FullName, Email, PassportNumber)
                VALUES ('${name.replace(/'/g, "''")}', 'user${i}@global-air.com', 'PASS-${i}')
            `);
        }

        // 3. Asegurar Modelos y Flota
        console.log('🏗️ Asegurando infraestructura (Fleet)...');
        for (let i = 1; i <= 30; i++) {
            await pool.request().query(`
                IF NOT EXISTS (SELECT 1 FROM AircraftModels WHERE Id = ${i})
                BEGIN
                    SET IDENTITY_INSERT AircraftModels ON;
                    INSERT INTO AircraftModels (Id, Manufacturer, Model, FirstClassSeats, EconomySeats)
                    VALUES (${i}, 'PabonAir-Tech', 'Model-${i}', 10, 180);
                    SET IDENTITY_INSERT AircraftModels OFF;
                END
                IF NOT EXISTS (SELECT 1 FROM Fleet WHERE AircraftId = ${i})
                    INSERT INTO Fleet (AircraftId, ModelId) VALUES (${i}, ${i});
            `);
        }

        // 4. Leer Vuelos
        const filePath = path.join(__dirname, '../../flights_cleaned.json');
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const allFlights = JSON.parse(rawContent).data || [];
        const flights = allFlights.slice(0, sampleSize);

        console.log(`✈️  Sembrando ${flights.length} vuelos y tickets persistentes (73%)...`);

        // 5. Inserción de Vuelos y Tickets
        for (const f of flights) {
            const economyPrice = PriceMatrixService.getPrice(f.origin, f.destination, 'ECONOMY') || 750;
            const firstClassPrice = PriceMatrixService.getPrice(f.origin, f.destination, 'FIRST') || 1350;
            const depTime = `${f.flight_date} ${f.flight_time}`;

            await pool.request().query(`
                INSERT INTO Flights (FlightId, AircraftId, Origin, Destination, DepartureTime, ArrivalTime, Duration, FirstClassPrice, EconomyPrice, Status)
                VALUES ('${f.flightId}', ${(f.aircraft_id % 30) + 1}, '${f.origin}', '${f.destination}', '${depTime}', '${depTime}', 120, ${firstClassPrice}, ${economyPrice}, 'SCHEDULED')
            `);

            // SIEMBRA DE TICKETS (73% ocupación) - Primeros 40 vuelos
            if (flights.indexOf(f) < 40) {
                // Ahora como los IDs de Persons son 1-200, este query no fallará por FK
                for (let j = 0; j < 140; j++) { // aprox 73%
                    const personId = Math.floor(Math.random() * 200) + 1;
                    const seatBase = j < 10 ? '1' : j < 40 ? '4' : '10';
                    const seatClass = j < 10 ? 'FIRST' : 'ECONOMY';
                    const seatLetter = String.fromCharCode(65 + (j % 6));
                    const seatNum = `${Math.floor(j/6) + parseInt(seatBase)}${seatLetter}`;
                    const price = seatClass === 'FIRST' ? firstClassPrice : economyPrice;
                    
                    try {
                        await pool.request().query(`
                            INSERT INTO Tickets (PersonId, FlightId, SeatNumber, SeatClass, PricePaid, Status, PurchaseNode)
                            VALUES (${personId}, '${f.flightId}', '${seatNum}', '${seatClass}', ${price}, 'BOOKED', '${nodeId}')
                        `);
                    } catch (e) { /* ignore duplicates */ }
                }
            }
        }

        console.log(`✅ Siembra PERSISTENTE con IDs corregidos completada.`);
        return true;
    } catch (err) {
        console.error(`❌ Error sembrando Nodo ${nodeId}:`, err.message);
        return false;
    } finally {
        if (pool) await pool.close();
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedDatabase(process.env.NODE_ID || '1');
}
