import React from 'react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'inventory'
  | 'sales'
  | 'vendors'
  | 'analytics'
  | 'payroll'
  | 'accounting'
  | 'settings'
  | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { activeRole, phones, payrolls, auditLogs, approvals } = useApp();

  const lowStockCount = phones.filter((p) => p.stock <= p.minStock).length;
  const pendingCount = payrolls.filter((p) => p.status === 'Pendiente').length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pendiente').length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: string;
    roles: UserRole[];
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Inicio / Dashboard',
      icon: '📊',
      roles: ['vendedor', 'admin', 'super_user'],
      badge: (activeRole === 'admin' || activeRole === 'super_user') && pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pend.` : undefined
    },
    {
      id: 'inventory',
      label: 'Inventario de Teléfonos',
      icon: '📱',
      roles: ['vendedor', 'admin', 'super_user'],
      badge: lowStockCount > 0 ? `${lowStockCount} Bajo Stock` : undefined
    },
    {
      id: 'sales',
      label: 'Registro de Ventas',
      icon: '💰',
      roles: ['vendedor', 'admin', 'super_user']
    },
    {
      id: 'vendors',
      label: 'Personas (Vendedores / Admin)',
      icon: '👥',
      roles: ['admin', 'super_user']
    },
    {
      id: 'analytics',
      label: 'Estadísticas del Mercado',
      icon: '📈',
      roles: ['vendedor', 'admin', 'super_user']
    },
    {
      id: 'payroll',
      label: 'Pagos Mensuales Vendedores',
      icon: '💵',
      roles: ['admin', 'super_user'],
      badge: pendingCount > 0 ? `${pendingCount} Pendientes` : undefined
    },
    {
      id: 'accounting',
      label: 'Contabilidad y Finanzas',
      icon: '🏛️',
      roles: ['admin', 'super_user']
    },
    {
      id: 'audit',
      label: 'Auditoría del Sistema',
      icon: '🛡️',
      roles: ['super_user'],
      badge: auditLogs.length > 0 ? `${auditLogs.length}` : undefined
    },
    {
      id: 'settings',
      label: 'Configuración / Tasas',
      icon: '⚙️',
      roles: ['super_user']
    }
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(activeRole));

  return (
    <aside className="w-full md:w-60 bg-white border-r border-slate-200 p-3 space-y-4">
      
      <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs">
        <span className="text-slate-500 font-bold uppercase block text-[10px]">Rol Actual:</span>
        <span className="font-extrabold text-blue-700 block mt-0.5">
          {activeRole === 'super_user' ? 'Super Usuario (Jefe)' : activeRole === 'admin' ? 'Persona Empresa (Admin)' : 'Vendedor (Persona Natural)'}
        </span>
      </div>

      <nav className="space-y-1">
        {filteredItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

    </aside>
  );
};
