import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n'; // Initialize i18n
import LoginPage from './components/LoginPage';
import PlayerPage from './components/PlayerPage';
import AdminPage from './components/AdminPage';
import ProfileSelectionPage from './components/ProfileSelectionPage';
import PassengerRegistration from './components/PassengerRegistration';
import PassengerTracking from './components/PassengerTracking';
import PassengerDashboard from './components/PassengerDashboard';
import NegotiationSimulator from './components/NegotiationSimulator';
import AnalyticsPage from './components/AnalyticsPage';

// Simple Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/" element={<LoginPage />} />

        {/* Profile Selection Route */}
        <Route
          path="/select-profile"
          element={
            <ProtectedRoute>
              <ProfileSelectionPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Player Route */}
        <Route
          path="/player"
          element={
            <ProtectedRoute>
              <PlayerPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage onBack={() => window.location.href = '/select-profile'} />
            </ProtectedRoute>
          }
        />

        {/* Passenger Registration Route */}
        <Route path="/register" element={<PassengerRegistration />} />

        {/* Passenger Tracking/Service Request Route */}
        <Route path="/tracking" element={<PassengerTracking />} />

        {/* Passenger Main Dashboard (Uber Style) */}
        <Route path="/dashboard" element={<PassengerDashboard />} />

        {/* Driver Simulator View */}
        <Route path="/simulator/driver" element={<NegotiationSimulator />} />

        {/* Analytics Dashboard */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;


