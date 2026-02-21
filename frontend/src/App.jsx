import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import RouteTracking from './pages/RouteTracking';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveTracking from './pages/LiveTracking';
import BusSearch from './pages/BusSearch';
import StopsNearMe from './pages/StopsNearMe';
import CityBusSearch from './pages/CityBusSearch';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#0B1F3A',
                fontWeight: '600',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              },
              success: {
                iconTheme: {
                  primary: '#2ECC71',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#E74C3C',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/track" element={<LiveTracking />} />
            <Route path="/search" element={<BusSearch />} />
            <Route path="/stops" element={<StopsNearMe />} />
            <Route path="/city-bus" element={<CityBusSearch />} />
            <Route path="/route-track/:routeNumber" element={<RouteTracking />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
