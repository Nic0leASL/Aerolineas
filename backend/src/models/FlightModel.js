import mongoose from 'mongoose';

const flightSchema = new mongoose.Schema({
  flightId: { type: String, required: true, unique: true },
  flight_date: { type: String, required: true },
  flight_time: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  aircraft_id: { type: Number, required: true },
  status: { type: String, required: true },
  gate: { type: String, default: 'UNKNOWN' },
  route: { type: String },
  hasReturnRoute: { type: Boolean },
  returnRouteFlights: { type: Number },
  originAirport: {
    city: String,
    country: String,
    name: String
  },
  destinationAirport: {
    city: String,
    country: String,
    name: String
  }
}, {
  timestamps: true // adds createdAt, updatedAt
});

export const Flight = mongoose.model('Flight', flightSchema);
export default Flight;
