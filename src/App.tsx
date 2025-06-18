// src/App.tsx or src/main.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { supabase } from './supabaseClient';
import Login from './pages/Auth/login';
import Signup from './pages/Auth/signup';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import VenueDetails from './pages/VenueDetails';
import EventDetails from './pages/EventDetails';
import AddEvent from './pages/AddEvent';
import Verification from './pages/Verification';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user } = useAuth();

  // Test Supabase configuration
  console.log('App: Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('App: Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log('App: Current user:', user?.email);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-event"
          element={
            <ProtectedRoute>
              <AddEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <Verification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venue/:id"
          element={
            <ProtectedRoute>
              <VenueDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event/:id"
          element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App
