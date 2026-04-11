import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Leads        from './pages/Leads';
import Agendamentos from './pages/Agendamentos';
import Users        from './pages/Users';
import Settings     from './pages/Settings';
import AdminLogin      from './pages/admin/AdminLogin';
import AdminDashboard  from './pages/admin/AdminDashboard';
import AdminClientes   from './pages/admin/AdminClientes';

function PrivateRoute({ children, roles }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login"       element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Rotas do tenant */}
        <Route path="/"             element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/leads"        element={<PrivateRoute><Leads /></PrivateRoute>} />
        <Route path="/agendamentos" element={<PrivateRoute><Agendamentos /></PrivateRoute>} />
        <Route path="/usuarios"     element={<PrivateRoute roles={['admin','super_admin']}><Users /></PrivateRoute>} />
        <Route path="/configuracoes"element={<PrivateRoute roles={['admin','super_admin']}><Settings /></PrivateRoute>} />

        {/* Rotas super admin */}
        <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/clientes" element={<AdminRoute><AdminClientes /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
