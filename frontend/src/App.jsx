import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Agendamentos from './pages/Agendamentos';
import Users from './pages/Users';
import Settings from './pages/Settings';

function PrivateRoute({ children, roles }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/"               element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/leads"          element={<PrivateRoute><Leads /></PrivateRoute>} />
        <Route path="/agendamentos"   element={<PrivateRoute><Agendamentos /></PrivateRoute>} />
        <Route path="/usuarios"       element={<PrivateRoute roles={['admin','super_admin']}><Users /></PrivateRoute>} />
        <Route path="/configuracoes"  element={<PrivateRoute roles={['admin','super_admin']}><Settings /></PrivateRoute>} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
