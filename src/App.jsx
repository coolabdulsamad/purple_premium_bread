import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout'; 
import PosPage from './pages/PosPage';
import ProductionPage from './pages/ProductionLogForm';
import AdminPage from './pages/AdminPage';
import ProductManagementPage from './pages/ProductManagementPage';
import ProductionDashboard from './pages/ProductionDashboard'; 
import CustomersPage from './pages/CustomersPage'; 
import POSDashboard from './pages/POSDashboard'; 
import EditCustomerPage from './pages/EditCustomerPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import BranchesPage from './pages/BranchesPage';
import RawMaterialManagement from './pages/RawMaterialManagement';
import RecipeManagement from './pages/RecipeManagement'; 
import MaterialTransactions from './pages/MaterialTransactions'; 
import CustomerCreditManagement from './pages/CustomerCreditManagement'; 
import AllPayments from './pages/AllPayments'; 
import AlertsDashboard from './pages/AlertsDashboard'; 
import StaffManagement from './pages/StaffManagement'; 
import ReportsPage from './pages/ReportsPage'; 
import AnalysisPage from './pages/AnalysisPage'; 
import RawInventoryDashboard from './pages/RawInventoryDashboard';
import CreditDashboard from './pages/CreditDashboard';
import ReportDashboard from './pages/ReportDashboard';
import WasteStock from './pages/WasteStock'

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={
            <Layout>
              <Dashboard />
            </Layout>
          } 
        />
        <Route path="/pos" element={<Layout><POSDashboard /></Layout>} />
        <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
        <Route path="/production" element={<Layout><ProductionDashboard /></Layout>} />
        <Route path="/products" element={<Layout><ProductManagementPage /></Layout>} />
        <Route path="/customers" element={<Layout><CustomersPage /></Layout>} />
        <Route path="/sales-history" element={<Layout><SalesHistoryPage /></Layout>} />
        <Route path="/branches" element={<Layout><BranchesPage /></Layout>} />
        <Route path="/recipes" element={<Layout><RecipeManagement /></Layout>} />
        <Route path="/payments" element={<Layout><CreditDashboard /></Layout>} />
        <Route path="/alerts" element={<Layout><AlertsDashboard /></Layout>} />
        <Route path="/staff" element={<Layout><StaffManagement /></Layout>} />
        <Route path="/reports" element={<Layout><ReportDashboard /></Layout>} />
        <Route path="/raw_materials_inventory" element={<Layout><RawInventoryDashboard /></Layout>} />
        <Route path='/wastestock' element={<Layout><WasteStock /></Layout>} />
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
