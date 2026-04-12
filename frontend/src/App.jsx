/**
 * App.jsx
 * Main entry point for Ticket #19
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import FlightSearch from './pages/FlightSearch';
import Booking from './pages/Booking';
import FlightDashboard from './pages/FlightDashboard';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flights" element={<FlightSearch />} />
          <Route path="/booking/:flightId" element={<Booking />} />
          <Route path="/dashboard/:flightId" element={<FlightDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
