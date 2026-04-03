/**
 * Concurrency Test Script
 * Ticket #30: Pruebas de concurrencia y evidencia final
 */

const API_URL = 'http://localhost:3001';
const FLIGHT_ID = 'ATLDFW_20260330_1733_7';
const SEAT_NUMBER = '10A';

async function simulateConcurrency() {
    console.log('🚀 Iniciando prueba de concurrencia en SkyNet v3...');
    console.log(`📍 Vuelo: ${FLIGHT_ID}, Asiento: ${SEAT_NUMBER}`);

    const payload1 = {
        flightId: FLIGHT_ID,
        seatNumber: SEAT_NUMBER,
        userId: 'User_Alpha',
        nodeId: 1, // Simular Nodo 1
        timestamp: new Date().toISOString()
    };

    const payload2 = {
        flightId: FLIGHT_ID,
        seatNumber: SEAT_NUMBER,
        userId: 'User_Beta',
        nodeId: 2, // Simular Nodo 2 (Conflictivo si llegan al mismo tiempo)
        timestamp: new Date().toISOString()
    };

    console.log('📡 Enviando peticiones simultáneas...');

    try {
        // Lanzar ambas peticiones casi al mismo tiempo
        const [res1, res2] = await Promise.all([
            fetch(`${API_URL}/reservar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload1)
            }),
            fetch(`${API_URL}/reservar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload2)
            })
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();

        console.log('\n--- RESULTADOS ---');
        console.log(`Petición 1 (User_Alpha): ${res1.status} - ${JSON.stringify(data1)}`);
        console.log(`Petición 2 (User_Beta): ${res2.status} - ${JSON.stringify(data2)}`);

        if (res1.ok && !res2.ok) {
            console.log('\n✅ ÉXITO: El sistema detectó el conflicto y rechazó la segunda reserva.');
        } else if (!res1.ok && res2.ok) {
            console.log('\n✅ ÉXITO: El sistema detectó el conflicto y rechazó la primera reserva.');
        } else if (res1.ok && res2.ok) {
            console.log('\n❌ ERROR: Se permitieron ambas reservas (Doble Reserva Detectada).');
        } else {
            console.log('\n⚠️ ADVERTENCIA: Ambas peticiones fallaron, posiblemente por estado previo.');
        }

    } catch (error) {
        console.error('❌ Error fatal en el test:', error);
    }
}

simulateConcurrency();
