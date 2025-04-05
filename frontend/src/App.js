import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Registration";
import GuestHome from "./pages/Guest/GuestHome";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import GuestDashboard from "./pages/Guest/GuestDashboard";

function App() {
 
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
          <Route path="/" element={<Home />} />
            <Route path="/registration" element={<Register />} />
            <Route path="/guest" element={<GuestHome />} />
            <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /></ProtectedRoute>} />
            <Route path="/guest-dashboard" element={<ProtectedRoute> <GuestDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
      </AuthProvider>
  );
}

export default App;
