import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';

// Components & Layouts
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { MenuManagement } from './pages/MenuManagement';
import { TableManagement } from './pages/TableManagement';
import { LiveOrders } from './pages/LiveOrders';
import { KitchenDisplay } from './pages/KitchenDisplay';
import { BillingInvoices } from './pages/BillingInvoices';
import { SuperAdmin } from './pages/SuperAdmin';
import { CustomerMenu } from './pages/CustomerMenu';
import { OrderStatus } from './pages/OrderStatus';

// Protected Route Guard
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'super_admin' | 'cafe_admin' | 'kitchen_staff'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to default home based on role
    if (user.role === 'super_admin') return <Navigate to="/superadmin" replace />;
    if (user.role === 'kitchen_staff') return <Navigate to="/kitchen" replace />;
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Admin Console Layout wrapper
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ flex: 1, paddingTop: '10px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <Router>
              <Routes>
                {/* Public Front facing routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/menu/:cafeId/:tableToken" element={<CustomerMenu />} />
                <Route path="/order/:orderId" element={<OrderStatus />} />

                {/* Cafe Admin console routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['cafe_admin']}>
                      <AdminLayout>
                        <AdminDashboard />
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/menu" 
                  element={
                    <ProtectedRoute allowedRoles={['cafe_admin']}>
                      <AdminLayout>
                        <MenuManagement />
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/tables" 
                  element={
                    <ProtectedRoute allowedRoles={['cafe_admin']}>
                      <AdminLayout>
                        <TableManagement />
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/orders" 
                  element={
                    <ProtectedRoute allowedRoles={['cafe_admin']}>
                      <AdminLayout>
                        <LiveOrders />
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/billing" 
                  element={
                    <ProtectedRoute allowedRoles={['cafe_admin']}>
                      <AdminLayout>
                        <BillingInvoices />
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />

                {/* Kitchen queue routes */}
                <Route 
                  path="/kitchen" 
                  element={
                    <ProtectedRoute allowedRoles={['cafe_admin', 'kitchen_staff']}>
                      <AdminLayout>
                        <KitchenDisplay />
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />

                {/* Super Admin console routes */}
                <Route 
                  path="/superadmin" 
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <AdminLayout>
                        <SuperAdmin />
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/superadmin/cafes" 
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <AdminLayout>
                        <SuperAdmin />
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
