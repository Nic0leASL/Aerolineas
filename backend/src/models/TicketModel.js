import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  FlightId: { type: String, required: true },
  PersonId: { type: Number, required: true },
  SeatNumber: { type: String, required: true },
  SeatClass: { type: String, required: true },
  PricePaid: { type: Number, required: true },
  Status: { type: String, required: true },
  PurchaseNode: { type: String, required: true }
}, {
  timestamps: true // adds createdAt, updatedAt
});

export const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
export default TicketModel;
