CREATE DATABASE AerolineasDB;
GO

USE AerolineasDB;
GO

-- 1. Tipos de Aviones
CREATE TABLE AircraftModels (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Manufacturer VARCHAR(100) NOT NULL,
    Model VARCHAR(100) NOT NULL,
    FirstClassSeats INT NOT NULL,
    EconomySeats INT NOT NULL
);
GO

-- 2. Flota
CREATE TABLE Fleet (
    AircraftId INT PRIMARY KEY,
    ModelId INT NOT NULL FOREIGN KEY REFERENCES AircraftModels(Id)
);
GO

-- 3. Vuelos
CREATE TABLE Flights (
    FlightId VARCHAR(100) PRIMARY KEY,
    AircraftId INT NOT NULL FOREIGN KEY REFERENCES Fleet(AircraftId),
    Origin VARCHAR(10) NOT NULL,
    Destination VARCHAR(10) NOT NULL,
    DepartureTime DATETIME NOT NULL,
    ArrivalTime DATETIME NOT NULL,
    Duration INT NOT NULL, -- Minutos
    FirstClassPrice DECIMAL(10,2) NOT NULL,
    EconomyPrice DECIMAL(10,2) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
);
GO

-- 4. Personas
-- Nodo 2 Inicia en 100,000
CREATE TABLE Persons (
    PersonId INT IDENTITY(100000,1) PRIMARY KEY,
    PassportNumber VARCHAR(50) UNIQUE NOT NULL,
    FullName VARCHAR(150) NOT NULL,
    Email VARCHAR(150) NOT NULL
);
GO

-- 5. Boletos / Asientos (Tickets)
-- Nodo 2 Generará Ids iniciando en 100000
CREATE TABLE Tickets (
    TicketId INT IDENTITY(100000,1) PRIMARY KEY,
    FlightId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Flights(FlightId),
    PersonId INT NOT NULL FOREIGN KEY REFERENCES Persons(PersonId),
    SeatNumber VARCHAR(10) NOT NULL,
    SeatClass VARCHAR(20) NOT NULL, -- FIRST o ECONOMY
    PricePaid DECIMAL(10,2) NOT NULL,
    Status VARCHAR(20) NOT NULL, -- BOOKED, RESERVED, CANCELLED
    BookedAt DATETIME DEFAULT GETDATE(),
    PurchaseNode VARCHAR(50) DEFAULT 'EUROPE', -- Desde qué portal/nodo se vendió
    -- Requisito Práctica: Reloj Vector y Lamport fields (opcional log)
    LamportMark INT NULL,
    VectorClock VARCHAR(100) NULL
);
GO

-- Índice Único Filtrado para evitar Overbooking simultáneo (Prioridad Consistencia en SQL Server)
CREATE UNIQUE INDEX UX_Flight_Seat ON Tickets(FlightId, SeatNumber) 
WHERE Status IN ('CONFIRMED', 'BOOKED', 'RESERVED');
GO
