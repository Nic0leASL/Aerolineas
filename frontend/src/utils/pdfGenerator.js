/**
 * Utility for generating PDF boarding passes
 * Ticket #29: PDF Ticket Generation
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateTicketPDF = async (bookingData) => {
    const { flight, seat, passenger } = bookingData;
    const passengerName = passenger?.passName || 'ALEXANDER S.';
    const actualSeatNumber = seat.seatNumber || seat.id || 'N/A';
    const isFirstClass = (seat.seatType && seat.seatType.includes('FIRST')) || 
                        actualSeatNumber.includes('A') || actualSeatNumber.includes('B');

    // Cargar Logo de Rafael Pabón de la carpeta pública
    const logoBase64 = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(null);
        img.src = "/logo.png";
    });
    
    // Formato horizontal (landscape) tipo Boarding Pass real (210 x 80 mm)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [210, 80]
    });

    // Fondo blanco base
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 80, 'F');

    // Banda Izquierda Indicadora de Clase (Dorada vs Azul)
    if (isFirstClass) {
        doc.setFillColor(212, 175, 55); // Oro
    } else {
        doc.setFillColor(28, 114, 212); // Azul
    }
    doc.rect(0, 0, 5, 80, 'F');

    // Renderizar Logo
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 12, 5, 20, 20);
    }

    // Cabecera Premium
    doc.setTextColor(24, 34, 48);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RAFAEL PABON AIRLINES', 35, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('BOARDING PASS / PASE DE ABORDAR', 35, 20);
    
    // Línea separadora Principal horizontal
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 26, 140, 26);

    // Línea punteada divisoria para el desprendible vertical
    doc.setLineDashPattern([2, 5], 0);
    doc.line(148, 0, 148, 80);
    doc.setLineDashPattern([], 0); // Reset

    // --- SECCIÓN IZQUIERDA (Cuerpo Principal) ---
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    
    // Pasajero
    doc.text('PASSENGER NAME', 15, 34);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(passengerName.toUpperCase(), 15, 39);
    
    // Ruta Origen a Destino
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('FROM', 15, 48);
    doc.text('TO', 55, 48);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(flight.origin || 'N/A', 15, 54);
    
    // Dibujo de un avioncito literal apuntando al destino
    doc.setFontSize(10);
    doc.text('✈', 38, 54);

    doc.setFontSize(14);
    doc.text(flight.destination || 'N/A', 55, 54);

    // Fecha y Hora simulada (+4 horas desde la compra actual)
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const d = new Date();
    d.setHours(d.getHours() + 4);
    
    doc.text('DATE', 90, 48);
    doc.text('TIME', 120, 48);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(d.toLocaleDateString(), 90, 54);
    doc.text(d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 120, 54);

    // Background Panel de Abordaje Inferior
    doc.setFillColor(245, 247, 250);
    doc.rect(10, 60, 133, 16, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, 60, 133, 16, 'S');

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('FLIGHT / VUELO', 15, 65);
    doc.text('GATE / PUERTA', 55, 65);
    doc.text('SEAT / ASIENTO', 90, 65);
    doc.text('ZONE', 125, 65);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(flight.flightNumber || flight.id.substring(0, 8), 15, 71);
    doc.text('A2B', 55, 71);
    doc.text(actualSeatNumber, 90, 71);
    doc.text(isFirstClass ? '1' : '3', 125, 71);

    // --- SECCIÓN DERECHA (Desprendible de seguridad) ---
    doc.setTextColor(24, 34, 48);
    doc.setFontSize(10);
    doc.text('BOARDING PASS', 155, 12);
    doc.setDrawColor(200, 200, 200);
    doc.line(155, 15, 205, 15);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('NAME', 155, 22);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(passengerName.toUpperCase().substring(0, 25), 155, 26);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('FROM', 155, 34);
    doc.text('TO', 185, 34);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(flight.origin || 'N/A', 155, 39);
    doc.text(flight.destination || 'N/A', 185, 39);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('FLIGHT', 155, 47);
    doc.text('SEAT', 185, 47);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(flight.flightNumber || flight.id.substring(0, 8), 155, 52);
    doc.text(actualSeatNumber, 185, 52);

    // Generar código de barras extremadamente detallado (fake barcode de alta resolución)
    doc.setFillColor(0, 0, 0);
    for (let i = 0; i < 48; i++) {
        const width = Math.random() * 0.7 + 0.1;
        doc.rect(155 + (i * 1.05), 60, width, 14, 'F');
    }

    doc.save(`RafaelPabon_Ticket_${flight.id}_${actualSeatNumber}.pdf`);
};
