/**
 * Utility for generating PDF boarding passes
 * Ticket #29: PDF Ticket Generation
 */
import { jsPDF } from 'jspdf';

/**
 * PDF Generator: Rafael Pabon Airlines Edition
 * Matches the requested minimalist pro design.
 */
export const generateTicketPDF = (bookingData) => {
    try {
        const { flight, seat, user = 'SAMUEL' } = bookingData;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [200, 80]
        });

        // Configuración de datos
        const passengerName = user.toUpperCase();
        const origin = (flight.origin || 'SIN').toUpperCase();
        const destination = (flight.destination || 'LON').toUpperCase();
        const flightId = (flight.flightNumber || flight.id || 'MULTI-SIN-LON').toUpperCase();
        const seatNumber = (seat.seatNumber || seat.id || '1E').toUpperCase();
        const dateStr = flight.departureTime ? new Date(flight.departureTime).toLocaleDateString() : '13/4/2026';
        const timeStr = flight.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '01:35';

        // 1. BARRA LATERAL AZUL (Izquierda)
        doc.setFillColor(0, 82, 204); // Azul Rafael Pabon
        doc.rect(0, 0, 6, 80, 'F');

        // 2. CABECERA (RAFAEL PABON AIRLINES)
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('RAFAEL PABON AIRLINES', 15, 18);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('BOARDING PASS / PASE DE ABORDAR', 15, 24);
        
        // Línea sutil debajo de cabecera
        doc.setDrawColor(230, 230, 230);
        doc.line(15, 30, 135, 30);

        // 3. CONTENIDO PRINCIPAL (Etiquetas y Datos)
        const labelGray = [150, 150, 150];
        const valueBlack = [0, 0, 0];

        // Passenger Name
        doc.setTextColor(...labelGray);
        doc.setFontSize(8);
        doc.text('PASSENGER NAME', 15, 40);
        doc.setTextColor(...valueBlack);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(passengerName, 15, 47);

        // From / To / Date / Time
        doc.setTextColor(...labelGray);
        doc.setFontSize(8);
        doc.text('FROM', 15, 57);
        doc.text('TO', 55, 57);
        doc.text('DATE', 90, 57);
        doc.text('TIME', 120, 57);

        doc.setTextColor(...valueBlack);
        doc.setFontSize(14);
        doc.text(origin, 15, 64);
        doc.text(destination, 55, 64);
        doc.text(dateStr, 90, 64);
        doc.text(timeStr, 120, 64);

        // 4. FRANJA GRIS INFERIOR (Technical Data)
        doc.setFillColor(243, 244, 246); // Gris claro #f3f4f6
        doc.rect(15, 68, 120, 8, 'F');
        
        doc.setTextColor(...labelGray);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('FLIGHT / VUELO', 20, 71);
        doc.text('GATE / PUERTA', 60, 71);
        doc.text('SEAT / ASIENTO', 95, 71);
        doc.text('ZONE', 125, 71);

        doc.setTextColor(...valueBlack);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(flightId, 20, 75);
        doc.text('A2B', 60, 75); // Gate ficticia pro
        doc.text(seatNumber, 95, 75);
        doc.text('3', 125, 75); // Zona ficticia pro

        // 5. DIVISOR PUNTEADO
        doc.setDrawColor(200, 200, 200);
        doc.setLineDash([1, 1]);
        doc.line(142, 5, 142, 75);
        doc.setLineDash([]); // Reset dash

        // 6. STUB (Derecha)
        doc.setTextColor(...valueBlack);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('BOARDING PASS', 150, 15);
        doc.setDrawColor(200, 200, 200);
        doc.line(150, 18, 195, 18);

        // Stub Details
        doc.setTextColor(...labelGray);
        doc.setFontSize(7);
        doc.text('NAME', 150, 25);
        doc.setTextColor(...valueBlack);
        doc.setFontSize(10);
        doc.text(passengerName, 150, 30);

        doc.setTextColor(...labelGray);
        doc.text('FROM', 150, 40);
        doc.text('TO', 180, 40);
        doc.setTextColor(...valueBlack);
        doc.setFontSize(10);
        doc.text(origin, 150, 45);
        doc.text(destination, 180, 45);

        doc.setTextColor(...labelGray);
        doc.text('FLIGHT', 150, 55);
        doc.text('SEAT', 180, 55);
        doc.setTextColor(...valueBlack);
        doc.setFontSize(10);
        doc.text(flightId.substring(0, 12), 150, 60);
        doc.text(seatNumber, 180, 60);

        // 7. CÓDIGO DE BARRAS HORIZONTAL (Stub)
        doc.setFillColor(0, 0, 0);
        const barX = 150;
        const barY = 65;
        for (let i = 0; i < 60; i++) {
            const w = Math.random() * 0.8 + 0.1;
            doc.rect(barX + (i * 0.7), barY, w, 12, 'F');
        }

        // Finalizar
        doc.save(`BoardingPass_${flightId}_${seatNumber}.pdf`);

    } catch (error) {
        console.error('Error en PDF Rafael Pabon:', error);
        alert(`Error al generar el PDF: ${error.message}`);
    }
};
