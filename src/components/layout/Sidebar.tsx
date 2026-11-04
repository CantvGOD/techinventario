import React from 'react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';
import {
  LayoutDashboard,
  Smartphone,
  ShoppingCart,
  Users,
  TrendingUp,
  Wallet,
  Scale,
  ShieldCheck,
  Settings
} from 'lucide-react';

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
    icon: React.ComponentType<{ className?: string }>;
    roles: UserRole[];
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Inicio / Dashboard',
      icon: LayoutDashboard,
      roles: ['vendedor', 'admin', 'super_user'],
      badge: (activeRole === 'admin' || activeRole === 'super_user') && pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pend.` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300'
    },
    {
      id: 'inventory',
      label: 'Inventario de Teléfonos',
      icon: Smartphone,
      roles: ['vendedor', 'admin', 'super_user'],
      badge: lowStockCount > 0 ? `${lowStockCount} Bajo Stock` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300'
    },
    {
      id: 'sales',
      label: 'Registro de Ventas',
      icon: ShoppingCart,
      roles: ['vendedor', 'admin', 'super_user']
    },
    {
      id: 'vendors',
      label: 'Personal & Vendedores',
      icon: Users,
      roles: ['admin', 'super_user']
    },
    {
      id: 'analytics',
      label: 'Estadísticas Mercado',
      icon: TrendingUp,
      roles: ['vendedor', 'admin', 'super_user']
    },
    {
      id: 'payroll',
      label: 'Pagos & Comisiones',
      icon: Wallet,
      roles: ['admin', 'super_user'],
      badge: pendingCount > 0 ? `${pendingCount} Pend.` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'accounting',
      label: 'Contabilidad y Reportes',
      icon: Scale,
      roles: ['admin', 'super_user'],
      badge: '9 Reportes',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-black'
    },
    {
      id: 'audit',
      label: 'Auditoría del Sistema',
      icon: ShieldCheck,
      roles: ['super_user'],
      badge: auditLogs.length > 0 ? `${auditLogs.length}` : undefined
    },
    {
      id: 'settings',
      label: 'Configuración / Tasas',
      icon: Settings,
      roles: ['super_user']
    }
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(activeRole));

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-4 space-y-4 shrink-0">
      
      {/* Current Active Role Badge */}
      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Rol Activo:</span>
        <span className="font-extrabold text-blue-700 block mt-1">
          {activeRole === 'super_user' ? 'Super Usuario (Jefe)' : activeRole === 'admin' ? 'Persona Empresa (Admin)' : 'Vendedor (Persona Natural)'}
        </span>
      </div>

      {/* Navigation Buttons */}
      <nav className="space-y-1.5">
        {filteredItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </span>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-blue-800 text-white' : (item.badgeColor || 'bg-slate-100 text-slate-700')
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
