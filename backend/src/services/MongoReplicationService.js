/**
 * MongoReplicationService.js
 * Servicio de replicación de datos a MongoDB (Nodo 3 - América)
 * 
 * Garantiza que MongoDB tenga copia espejo de todos los datos 
 * transaccionales de los SQL Servers (Nodo 1 y 2).
 * Las 2 SQL deben estar en espejo y MongoDB debe tener todos los datos.
 */

import { connectMongo } from '../config/mongoDb.js';
import Ticket from '../models/TicketModel.js';
import FlightModel from '../models/FlightModel.js';
import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

class MongoReplicationService {
    constructor(nodeId) {
        this.nodeId = nodeId;
        this.isConnected = false;
        this.replicationLog = [];
        this.pendingReplications = [];
    }

    /**
     * Inicializar conexión a MongoDB
     */
    async initialize() {
        try {
            await connectMongo();
            this.isConnected = true;
            logger.info('✅ MongoReplicationService inicializado correctamente');
            return true;
        } catch (error) {
            logger.warn('⚠ MongoDB no disponible, replicaciones se encolarán', { error: error.message });
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Replicar una compra/reserva a MongoDB
     * @param {Object} ticketData - Datos del ticket
     */
    async replicateTicket(ticketData) {
        const replicationEntry = {
            action: 'REPLICATE_TICKET',
            data: ticketData,
            timestamp: new Date().toISOString(),
            sourceNode: this.nodeId
        };

        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            // Upsert: insertarlo o actualizarlo si ya existe
            await Ticket.findOneAndUpdate(
                { flightId: ticketData.flightId, seatNumber: ticketData.seatNumber },
                {
                    ...ticketData,
                    sourceNode: this.nodeId,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );

            replicationEntry.status = 'SUCCESS';
            logger.info('✅ Ticket replicado a MongoDB', { 
                flightId: ticketData.flightId, 
                seatNumber: ticketData.seatNumber,
                status: ticketData.status 
            });

        } catch (error) {
            replicationEntry.status = 'FAILED';
            replicationEntry.error = error.message;
            this.pendingReplications.push(replicationEntry);
            logger.warn('⚠ Fallo replicación a MongoDB', { error: error.message });
        }

        this.replicationLog.push(replicationEntry);
    }

    /**
     * Replicar una cancelación a MongoDB
     * @param {string} flightId 
     * @param {string} seatNumber 
     */
    async replicateCancellation(flightId, seatNumber) {
        try {
            if (!this.isConnected) await this.initialize();

            await Ticket.findOneAndUpdate(
                { flightId, seatNumber },
                { status: 'CANCELLED', cancelledAt: new Date() },
                { new: true }
            );

            logger.info('✅ Cancelación replicada a MongoDB', { flightId, seatNumber });
        } catch (error) {
            logger.warn('⚠ Fallo replicación cancelación a MongoDB', { error: error.message });
        }
    }

    /**
     * Obtener todos los tickets de MongoDB (para dashboard global)
     */
    async getAllTickets(filters = {}) {
        try {
            if (!this.isConnected) await this.initialize();

            const query = {};
            if (filters.status) query.status = filters.status;
            if (filters.flightId) query.flightId = filters.flightId;
            if (filters.seatType) query.seatType = filters.seatType;

            const tickets = await Ticket.find(query).sort({ bookedAt: -1 }).limit(filters.limit || 1000);
            return { success: true, tickets, count: tickets.length };
        } catch (error) {
            logger.warn('⚠ Error consultando tickets en MongoDB', { error: error.message });
            return { success: false, tickets: [], error: error.message };
        }
    }

    /**
     * Obtener estadísticas globales desde MongoDB
     */
    async getGlobalStats() {
        try {
            if (!this.isConnected) await this.initialize();

            const [totalBooked, totalReserved, totalCancelled] = await Promise.all([
                Ticket.countDocuments({ status: 'BOOKED' }),
                Ticket.countDocuments({ status: 'RESERVED' }),
                Ticket.countDocuments({ status: 'CANCELLED' })
            ]);

            // Ingresos por clase
            const revenueByClass = await Ticket.aggregate([
                { $match: { status: 'BOOKED' } },
                { $group: { 
                    _id: '$seatType', 
                    totalRevenue: { $sum: '$price' },
                    count: { $sum: 1 }
                }}
            ]);

            const totalRevenue = revenueByClass.reduce((sum, r) => sum + r.totalRevenue, 0);

            return {
                success: true,
                stats: {
                    totalBooked,
                    totalReserved,
                    totalCancelled,
                    totalTickets: totalBooked + totalReserved + totalCancelled,
                    totalRevenue,
                    revenueByClass: revenueByClass.reduce((acc, r) => {
                        acc[r._id] = { revenue: r.totalRevenue, count: r.count };
                        return acc;
                    }, {}),
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.warn('⚠ Error obteniendo stats de MongoDB', { error: error.message });
            return { success: false, stats: null, error: error.message };
        }
    }

    /**
     * Reintentar replicaciones pendientes
     */
    async retryPending() {
        if (this.pendingReplications.length === 0) return { retried: 0 };

        let succeeded = 0;
        const stillPending = [];

        for (const entry of this.pendingReplications) {
            try {
                await this.replicateTicket(entry.data);
                succeeded++;
            } catch {
                stillPending.push(entry);
            }
        }

        this.pendingReplications = stillPending;
        return { retried: succeeded, stillPending: stillPending.length };
    }

    /**
     * Obtener estado de replicación
     */
    getReplicationStatus() {
        return {
            nodeId: this.nodeId,
            isConnected: this.isConnected,
            totalReplications: this.replicationLog.length,
            successfulReplications: this.replicationLog.filter(r => r.status === 'SUCCESS').length,
            failedReplications: this.replicationLog.filter(r => r.status === 'FAILED').length,
            pendingReplications: this.pendingReplications.length
        };
    }
}

export default MongoReplicationService;
