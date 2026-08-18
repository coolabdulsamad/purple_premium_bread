import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import AdminPage from './pages/AdminPage';
import ProductManagementPage from './pages/ProductManagementPage';
import ProductionDashboard from './pages/ProductionDashboard';
import CustomersPage from './pages/CustomersPage';
import POSDashboard from './pages/POSDashboard';
import SalesHistoryPage from './pages/SalesHistoryPage';
import BranchesPage from './pages/BranchesPage';
import RecipeManagement from './pages/RecipeManagement';
import AlertsDashboard from './pages/AlertsDashboard';
import StaffManagement from './pages/StaffManagement';
import RawInventoryDashboard from './pages/RawInventoryDashboard';
import CreditDashboard from './pages/CreditDashboard';
import ReportDashboard from './pages/ReportDashboard';
import WasteStock from './pages/WasteStock'
import PermissionsPage from './pages/PermissionsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import MoneyPage from './pages/MoneyPage';
import LoanManagementPage from './pages/LoanManagementPage';
import ReturnsPage from './pages/ReturnsPage';
import WalletsPage from './pages/WalletsPage';
import AIChatPage from './pages/AIChatPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ProfilePage from './pages/ProfilePage';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SalesManagementDashboard from './pages/SalesManagementDashboard';
import ExchangeHistoryPage from './pages/ExchangeHistoryPage';
import OperatingExpensesPage from './pages/OperatingExpensesPage';
import SalaryManagementPage from './pages/SalaryManagementPage';
import Services from './pages/Services';
import RidersPage from './pages/RidersPage';
import RegisterRider from './pages/RegisterRider';
import EditRider from './pages/EditRider';
import RiderSalesPage from './pages/RiderSalesPage';
import AnalysisPage from './pages/AnalysisPage';
import usePermissions from './hooks/usePermissions';

// Route guard: shows the page only when the permission catalog (or the
// fallback role list) allows it. This keeps pages reachable only where the
// sidebar shows them, so hidden pages can't be opened by typing the URL.
const RequirePermission = ({ perm, roles, children }) => {
  const { can, loaded } = usePermissions();
  if (!loaded) return null;
  if (!perm || can(perm, roles)) return children;
  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <h2>Access restricted</h2>
      <p>You don't have permission to view this page. Please contact an administrator if you need access.</p>
    </div>
  );
};

const P = ({ perm, roles, children }) => (
  <Layout>
    <RequirePermission perm={perm} roles={roles}>{children}</RequirePermission>
  </Layout>
);

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<P perm="dashboard.view" roles={['admin', 'manager', 'accountant']}><Dashboard /></P>} />
        <Route path="/pos" element={<P perm="sales.view" roles={['admin', 'sales', 'manager']}><POSDashboard /></P>} />
        <Route path="/admin" element={<P perm="users.view" roles={['admin']}><AdminPage /></P>} />
        <Route path="/production" element={<P perm="production.view" roles={['admin', 'baker', 'manager']}><ProductionDashboard /></P>} />
        <Route path="/products" element={<P perm="products.view" roles={['admin', 'manager', 'accountant']}><ProductManagementPage /></P>} />
        <Route path="/customers" element={<P perm="customers.view" roles={['admin', 'sales', 'manager', 'accountant']}><CustomersPage /></P>} />
        <Route path="/sales-history" element={<P perm="sales.view" roles={['admin', 'sales', 'manager', 'accountant']}><SalesHistoryPage /></P>} />
        <Route path="/branches" element={<P perm="branches.view" roles={['admin', 'manager']}><BranchesPage /></P>} />
        <Route path="/recipes" element={<P perm="recipes.view" roles={['admin', 'manager', 'accountant']}><RecipeManagement /></P>} />
        <Route path="/payments" element={<P perm="payments.view" roles={['admin', 'manager', 'sales', 'accountant']}><CreditDashboard /></P>} />
        <Route path="/alerts" element={<P perm="inventory.view" roles={['admin', 'manager', 'sales', 'accountant']}><AlertsDashboard /></P>} />
        <Route path="/staff" element={<P perm="staff.view" roles={['admin', 'accountant', 'manager']}><StaffManagement /></P>} />
        <Route path="/operating-expenses" element={<P perm="expenses.view" roles={['admin', 'manager', 'accountant']}><OperatingExpensesPage /></P>} />
        <Route path="/reports" element={<P perm="reports.view" roles={['admin', 'manager', 'accountant']}><ReportDashboard /></P>} />
        <Route path="/raw_materials_inventory" element={<P perm="raw_materials.view" roles={['admin', 'manager', 'accountant']}><RawInventoryDashboard /></P>} />
        <Route path='/wastestock' element={<P perm="inventory.view" roles={['admin', 'sales', 'manager', 'accountant']}><WasteStock /></P>} />
        <Route path='/sales_management' element={<P perm="sales.approve" roles={['admin', 'manager']}><SalesManagementDashboard /></P>} />
        <Route path="/riders" element={<P perm="riders.view" roles={['admin', 'manager', 'accountant']}><RidersPage /></P>} />
        <Route path="/riders/register" element={<P perm="riders.create" roles={['admin', 'manager']}><RegisterRider /></P>} />
        <Route path="/exchanges-history" element={<P perm="exchanges.view" roles={['admin', 'sales', 'manager', 'accountant']}><ExchangeHistoryPage /></P>} />
        <Route path="/salary-management" element={<P perm="salaries.view" roles={['admin', 'accountant']}><SalaryManagementPage /></P>} />
        <Route path="/services" element={<P perm="services.view" roles={['admin', 'manager', 'accountant']}><Services /></P>} />
        <Route path="/riders/edit/:id" element={<P perm="riders.edit" roles={['admin', 'manager']}><EditRider /></P>} />
        <Route path="/riders/sales/:riderId" element={<P perm="riders.view" roles={['admin', 'manager', 'accountant']}><RiderSalesPage /></P>} />
        <Route path="/analysis" element={<P perm="analysis.view" roles={['admin', 'manager', 'accountant']}><AnalysisPage /></P>} />
        <Route path="/permissions" element={<P perm="settings.view" roles={['admin']}><PermissionsPage /></P>} />
        <Route path="/approvals" element={<P perm="approvals.view" roles={['admin', 'manager', 'accountant']}><ApprovalsPage /></P>} />
        <Route path="/money" element={<P perm="money.view" roles={['admin', 'manager', 'accountant']}><MoneyPage /></P>} />
        <Route path="/loans" element={<P perm="debts.view" roles={['admin', 'accountant', 'manager']}><LoanManagementPage /></P>} />
        <Route path="/returns" element={<P perm="returns.view" roles={['admin', 'sales', 'manager', 'accountant']}><ReturnsPage /></P>} />
        <Route path="/wallets" element={<P perm="wallets.view" roles={['admin', 'manager', 'accountant']}><WalletsPage /></P>} />
        <Route path="/team-chat" element={<P perm="chat.view" roles={['admin', 'manager', 'sales', 'baker', 'accountant']}><ChatPage /></P>} />
        <Route path="/ai-assistant" element={<P perm="ai_assistant.view" roles={['admin', 'manager', 'accountant']}><AIChatPage /></P>} />
        <Route path="/settings" element={<P perm="settings.view" roles={['admin']}><SettingsPage /></P>} />
        <Route path="/audit-logs" element={<P perm="audit_logs.view" roles={['admin', 'manager']}><AuditLogsPage /></P>} />
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        <Route path="*" element={<Layout><h2>404 - Page Not Found</h2></Layout>} />
      </Routes>

      {/* ✅ Global Toast Container (always mounted) */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        icon={false}
      />
    </>
  );
}

export default App;
