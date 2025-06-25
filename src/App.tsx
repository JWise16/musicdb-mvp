// src/App.tsx or src/main.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Auth/login';
import Signup from './pages/Auth/signup';
import Landing from './pages/Landing';
import AboutPage from './pages/About';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Venues from './pages/Venues';
import VenueDetails from './pages/VenueDetails';
import EventDetails from './pages/EventDetails';
import AddEvent from './pages/AddEvent';
import AddVenue from './pages/AddVenue';
import Verification from './pages/Verification';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingProvider from './components/features/onboarding/OnboardingProvider';
import { VenueProvider } from './contexts/VenueContext';

function App() {
  const { user } = useAuth();

  // Test Supabase configuration
  console.log('App: Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('App: Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log('App: Current user:', user?.email);

  return (
    <BrowserRouter>
      <VenueProvider>
        <OnboardingProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <Events />
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
              path="/add-venue"
              element={
                <ProtectedRoute>
                  <AddVenue />
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
            <Route
              path="/venues"
              element={
                <ProtectedRoute>
                  <Venues />
                </ProtectedRoute>
              }
            />
          </Routes>
        </OnboardingProvider>
      </VenueProvider>
    </BrowserRouter>
  );
}

export default App
