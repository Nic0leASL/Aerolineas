import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const flightsPath = path.join(__dirname, '../flights_cleaned.json');
const matricesPath = path.join(__dirname, '../src/data/matrices');

let economyPrices = {};
let firstClassPrices = {};
let flightTimes = {};
let flightsData = [];

try {
    economyPrices = JSON.parse(fs.readFileSync(path.join(matricesPath, 'economy_prices.json')));
    firstClassPrices = JSON.parse(fs.readFileSync(path.join(matricesPath, 'first_class_prices.json')));
    flightTimes = JSON.parse(fs.readFileSync(path.join(matricesPath, 'flight_times.json')));
    flightsData = JSON.parse(fs.readFileSync(flightsPath, 'utf-8')).data;
} catch(e) {
    console.error("Faltan archivos base para el seeder", e);
    process.exit(1);
}

// 1. Tipos de Aviones
const aircraftModels = [
    { Id: 1, Manufacturer: 'Airbus', Model: 'Airbus A380-800', FirstClassSeats: 10, EconomySeats: 439, fleetCount: 6 },
    { Id: 2, Manufacturer: 'Boeing', Model: 'Boeing 777-300ER', FirstClassSeats: 10, EconomySeats: 300, fleetCount: 18 },
    { Id: 3, Manufacturer: 'Airbus', Model: 'Airbus A350-900', FirstClassSeats: 12, EconomySeats: 250, fleetCount: 11 },
    { Id: 4, Manufacturer: 'Boeing', Model: 'Boeing 787-9 Dreamliner', FirstClassSeats: 8, EconomySeats: 220, fleetCount: 15 }
];

// Generar SQL
let sqlOutput = `USE AerolineasDB;\nGO\n\n`;

// Insertar Modelos
sqlOutput += `-- Aircraft Models\n`;
sqlOutput += `SET IDENTITY_INSERT AircraftModels ON;\n`;
for (const model of aircraftModels) {
    sqlOutput += `INSERT INTO AircraftModels (Id, Manufacturer, Model, FirstClassSeats, EconomySeats) VALUES (${model.Id}, '${model.Manufacturer}', '${model.Model}', ${model.FirstClassSeats}, ${model.EconomySeats});\n`;
}
sqlOutput += `SET IDENTITY_INSERT AircraftModels OFF;\nGO\n\n`;

// Insertar Flota (50 aviones)
sqlOutput += `-- Fleet\n`;
let currentAircraftId = 1;
const fleetMap = {}; // { aircraftId: {modelId, firstCount, economyCount} }

for (const model of aircraftModels) {
    for (let i = 0; i < model.fleetCount; i++) {
        sqlOutput += `INSERT INTO Fleet (AircraftId, ModelId) VALUES (${currentAircraftId}, ${model.Id});\n`;
        fleetMap[currentAircraftId] = {
            id: model.Id,
            first: model.FirstClassSeats,
            economy: model.EconomySeats
        };
        currentAircraftId++;
    }
}
sqlOutput += `GO\n\n`;

const validFlights = [];
for (const f of flightsData) {
    if (validFlights.length >= 300) break; // Reducido a 300 para no explotar la RAM del contenedor SQL
    
    if (economyPrices[f.origin] && economyPrices[f.origin][f.destination] !== null) {
        validFlights.push(f);
    }
}

sqlOutput += `-- Flights\n`;
const flightsCreated = [];

for (let i = 0; i < validFlights.length; i++) {
    const f = validFlights[i];
    const ePrice = economyPrices[f.origin][f.destination] || 500;
    const fClassPrice = firstClassPrices[f.origin][f.destination] || ePrice * 2.5;
    const durationHours = flightTimes[f.origin][f.destination] || 5;
    const duration = durationHours * 60;
    
    // Pick un avión random de la flota (1 al 50)
    const assignedAircraftId = Math.floor(Math.random() * 50) + 1;
    const flightId = f.flightId; // Ej: AA_1234_ABC
    // Forced schedules and perfect conditions
    const status = 'SCHEDULED';
    
    // Parse to UTC properly
    const flightDateObj = new Date(`${f.flight_date}T${f.flight_time}Z`); // UTC Base
    const departureStr = flightDateObj.toISOString();
    const arrivalDateObj = new Date(flightDateObj.getTime() + duration * 60000);
    const arrivalStr = arrivalDateObj.toISOString();
    
    sqlOutput += `INSERT INTO Flights (FlightId, AircraftId, Origin, Destination, DepartureTime, ArrivalTime, Duration, FirstClassPrice, EconomyPrice, Status) `;
    sqlOutput += `VALUES ('${flightId}', ${assignedAircraftId}, '${f.origin}', '${f.destination}', '${departureStr}', '${arrivalStr}', ${duration}, ${fClassPrice}, ${ePrice}, '${status}');\n`;
    
    flightsCreated.push({
        flightId: flightId,
        aircraftId: assignedAircraftId,
        ePrice: ePrice,
        fClassPrice: fClassPrice
    });
}
sqlOutput += `GO\n\n`;

const firstNames = ["Juan", "María", "Jürgen", "Satoshi", "Yūki", "Aarav", "Priya", "Mohammad", "Fātima", "Wei 伟", "Alexei Алексей", "Elena Елена", "Björn", "Chloé", "Li 李", "Ahmed أحمد", "José"];
const lastNames = ["García", "Smith", "Suzuki", "Tanaka", "Patel", "Singh", "Khan", "Wang 王", "Ivanov Иванов", "Müller", "Dubois", "Okafor", "González", "Silva", "Nguyễn", "Kim 김", "Tremblay"];
const locales = ["AMERICA", "EUROPE", "ASIA"];

// Generando Pool de Personas Independiente (Para que una persona tenga múltiples vuelos)
sqlOutput += `-- Persons Pool\n`;
sqlOutput += `SET IDENTITY_INSERT Persons ON;\nGO\n`;
const TOTAL_PERSONS = 5000;
for (let i = 1; i <= TOTAL_PERSONS; i++) {
    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const pName = `${randomFirst} ${randomLast}`;
    
    // Normalizar email
    const emailBase = randomFirst.split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const pEmail = `${emailBase}${i}@ejemplo.com`;
    const passport = `PAS-${Math.floor(Math.random()*90000)+10000}-${i}`;
    
    sqlOutput += `INSERT INTO Persons (PersonId, PassportNumber, FullName, Email) VALUES (${i}, '${passport}', '${pName}', '${pEmail}');\n`;
}
sqlOutput += `SET IDENTITY_INSERT Persons OFF;\nGO\n\n`;

// Personas & Tickets (Simulación del 73% ocupación)
sqlOutput += `-- Tickets Simulation\n`;
sqlOutput += `SET IDENTITY_INSERT Tickets ON;\nGO\n`;
let globalTicketId = 1;

for (const flight of flightsCreated) {
    const aircraftInfo = fleetMap[flight.aircraftId];
    
    const generateSeats = (type, price, maxCap) => {
        let sqlTick = '';
        
        let targetOccupied = Math.floor(maxCap * 0.73);
        let reservedAmount = Math.floor(maxCap * 0.03); 
        let bookedAmount = targetOccupied - reservedAmount;
        
        for (let i = 1; i <= targetOccupied; i++) {
            const row = String.fromCharCode(65 + (i % 6)); 
            const prefix = type === 'FIRST' ? 1 : 16;
            const seatNumber = `${Math.floor(i / 6) + prefix}${row}`;
            
            const status = i <= bookedAmount ? 'BOOKED' : 'RESERVED';
            const randomPersonId = Math.floor(Math.random() * TOTAL_PERSONS) + 1; // Reutilizando personas!
            const purchaseNode = locales[Math.floor(Math.random() * locales.length)]; // Desde dónde compró
            
            sqlTick += `INSERT INTO Tickets (TicketId, FlightId, PersonId, SeatNumber, SeatClass, PricePaid, Status, PurchaseNode) `;
            sqlTick += `VALUES (${globalTicketId}, '${flight.flightId}', ${randomPersonId}, '${seatNumber}', '${type}', ${price}, '${status}', '${purchaseNode}');\n`;
            
            globalTicketId++;
        }
        return sqlTick;
    };

    sqlOutput += generateSeats('FIRST', flight.fClassPrice, aircraftInfo.first);
    sqlOutput += generateSeats('ECONOMY', flight.ePrice, aircraftInfo.economy);
    sqlOutput += `GO\n`; // Batching para no causar OutOfMemoryError 701 en SQL Server
}

sqlOutput += `SET IDENTITY_INSERT Tickets OFF;\nGO\n`;

sqlOutput += `GO\n`;

const outputPath = path.join(__dirname, 'seed.sql');
fs.writeFileSync(outputPath, sqlOutput);

console.log(`✅ ¡Script de poblamiento generado en ${outputPath}!`);
console.log(`Personas/Tickets generados para ${flightsCreated.length} vuelos.`);
