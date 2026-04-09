CREATE DATABASE AerolineasDB;
GO

USE AerolineasDB;
GO

-- Tabla de Boletos con salto de identidad (NODO 1: Impares)
CREATE TABLE Tickets (
    Id INT IDENTITY(1,2) PRIMARY KEY,
    FlightId VARCHAR(50) NOT NULL,
    SeatNumber VARCHAR(10) NOT NULL,
    PassengerId VARCHAR(50) NOT NULL,
    PassengerName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(30) NULL,
    TicketPrice DECIMAL(10, 2) NOT NULL,
    Status VARCHAR(20) NOT NULL,
    BookedAt DATETIME DEFAULT GETDATE()
);
GO

-- Crear índice para evitar overbooking dual (restricción única por vuelo y asiento si está ocupado)
CREATE UNIQUE INDEX UX_Flight_Seat ON Tickets(FlightId, SeatNumber) WHERE Status IN ('CONFIRMED', 'BOOKED');
GO
