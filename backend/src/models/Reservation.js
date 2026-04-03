/**
 * Modelo de Reserva
 */

export class Reservation {
  constructor(id, userId, resourceId, startTime, endTime, nodeId) {
    this.id = id;
    this.userId = userId;
    this.resourceId = resourceId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.nodeId = nodeId;
    this.status = 'pending';
    this.createdAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      resourceId: this.resourceId,
      startTime: this.startTime,
      endTime: this.endTime,
      nodeId: this.nodeId,
      status: this.status,
      createdAt: this.createdAt
    };
  }
}

export default Reservation;
