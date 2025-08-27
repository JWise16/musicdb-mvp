// src/App.tsx or src/main.tsx
import { useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuthTransition';
import Login from './pages/Auth/login';
import Signup from './pages/Auth/signup';
import Landing from './pages/Landing';
import AboutPage from './pages/About';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Venues from './pages/Venues';
import VenueDetails from './pages/VenueDetails';
import EventDetails from './pages/EventDetails';
import ArtistDetails from './pages/ArtistDetails';
import AddEvent from './pages/AddEvent';
import AddVenue from './pages/AddVenue';
import Verification from './pages/Verification';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import ArtistSearch from './pages/ArtistSearch';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/Admin';
import { VenueProvider } from './contexts/VenueContext';

function App() {
  const { user, loading } = useAuth();

  // Test Supabase configuration
  //console.log('App: Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  //console.log('App: Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  // Only log user changes, not every render
  const userRef = useRef<string | undefined>(undefined);
  if (userRef.current !== user?.email) {
    console.log('App: Current user changed:', user?.email);
    userRef.current = user?.email;
  }

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <VenueProvider>
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
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
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
            path="/artist/:id"
            element={
              <ProtectedRoute>
                <ArtistDetails />
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
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist-search"
            element={
              <ProtectedRoute>
                <ArtistSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </VenueProvider>
    </BrowserRouter>
  );
}

export default App
