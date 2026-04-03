/**
 * Utility for generating PDF boarding passes
 * Ticket #29: PDF Ticket Generation
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateTicketPDF = (bookingData) => {
    const { flight, seat, user = 'Alexander S.' } = bookingData;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
    });

    // Premium Header
    doc.setFillColor(15, 23, 42); // hsl(222 47% 11%) - slate-900 approx
    doc.rect(0, 0, 148, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SKYNET v3', 10, 20);

    doc.setFontSize(10);
    doc.text('BOARDING PASS / PASE DE ABORDAR', 10, 30);
    doc.text(new Date().toLocaleString(), 100, 30);

    // Body Setup
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);

    // Flight Info Section
    doc.setFont('helvetica', 'bold');
    doc.text('FLIGHT INFORMATION', 10, 50);
    doc.line(10, 52, 138, 52);

    doc.autoTable({
        startY: 55,
        head: [['Flight', 'From', 'To', 'Date']],
        body: [[
            flight.flightNumber || flight.id,
            flight.origin,
            flight.destination,
            flight.departureTime ? new Date(flight.departureTime).toLocaleDateString() : 'N/A'
        ]],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        styles: { fontSize: 10 }
    });

    // Seat Info Section
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('PASSENGER & SEAT', 10, finalY);
    doc.line(10, finalY + 2, 138, finalY + 2);

    doc.autoTable({
        startY: finalY + 5,
        head: [['Passenger', 'Seat', 'Class', 'Price']],
        body: [[
            user,
            seat.seatNumber,
            seat.seatType,
            `$${seat.price}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }, // emerald-500
        styles: { fontSize: 10 }
    });

    // Footer / Barcode Simulation
    const footerY = 180;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Thank you for choosing SkyNet. Eventual consistency guaranteed.', 10, footerY);

    // Fake Barcode
    doc.setFillColor(0, 0, 0);
    for (let i = 0; i < 40; i++) {
        const width = Math.random() * 2 + 0.5;
        doc.rect(10 + (i * 3), footerY + 5, width, 10, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.text(flight.id, 70, footerY + 18, { align: 'center' });

    // Save
    doc.save(`Ticket_${flight.id}_${seat.seatNumber}.pdf`);
};
