import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { InventoryManager } from './components/inventory/InventoryManager';
import { SalesHistory } from './components/sales/SalesHistory';
import { VendorManager } from './components/vendors/VendorManager';
import { MarketAnalytics } from './components/analytics/MarketAnalytics';
import { PayrollManager } from './components/payroll/PayrollManager';
import { SystemSettings } from './components/settings/SystemSettings';
import { AuditLogView } from './components/audit/AuditLogView';
import { SalesRegisterModal } from './components/sales/SalesRegisterModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/auth/LoginView';
import { FinancialAccounting } from './components/accounting/FinancialAccounting';

const MainLayout: React.FC = () => {
  const { currentUser, activeRole } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);

  React.useEffect(() => {
    if (activeRole === 'vendedor' && (activeTab === 'vendors' || activeTab === 'payroll' || activeTab === 'accounting' || activeTab === 'settings' || activeTab === 'audit')) {
      setActiveTab('dashboard');
    }
    if (activeRole === 'admin' && (activeTab === 'settings' || activeTab === 'audit')) {
      setActiveTab('dashboard');
    }
  }, [activeRole, activeTab]);

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-colors">
      {/* Header */}
      <Header onOpenNewSale={() => setIsNewSaleModalOpen(true)} />

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              onOpenNewSale={() => setIsNewSaleModalOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'inventory' && <InventoryManager />}
          {activeTab === 'sales' && (
            <SalesHistory onOpenNewSale={() => setIsNewSaleModalOpen(true)} />
          )}
          {activeTab === 'vendors' && <VendorManager />}
          {activeTab === 'analytics' && <MarketAnalytics />}
          {activeTab === 'payroll' && <PayrollManager />}
          {activeTab === 'accounting' && <FinancialAccounting />}
          {activeTab === 'audit' && <AuditLogView />}
          {activeTab === 'settings' && <SystemSettings />}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-3.5 px-6 text-center text-xs text-slate-500 bg-white">
        <p>
          TechInventario © 2026 — Sistema Web de Gestión de Inventario y Ventas (Telecom)
        </p>
      </footer>

      {/* Sales Register Modal */}
      <SalesRegisterModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
