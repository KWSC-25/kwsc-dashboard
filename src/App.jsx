import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Selector from './pages/Selector'; // Import the new file

const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* The New Selector Page */}
        <Route path="/select" element={
            <PrivateRoute>
              <Selector />
            </PrivateRoute>
        } />

        <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;