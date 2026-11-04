import React from 'react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';
import {
  Smartphone,
  RefreshCw,
  Bell,
  Plus,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  onOpenNewSale: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewSale }) => {
  const {
    currentUser,
    logout,
    activeRole,
    setActiveRole,
    exchangeRates,
    fetchLiveExchangeRates,
    updateExchangeRates,
    approvals
  } = useApp();

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pendiente').length;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveRole(e.target.value as UserRole);
  };

  return (
    <header className="w-full bg-slate-900 text-white border-b border-slate-800 p-3.5 sm:px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2.5 rounded-2xl border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Smartphone className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-tight text-white flex items-center gap-2">
              TechInventario
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v2.5 Enterprise
              </span>
            </h1>
            <p className="text-xs text-slate-400">Sistema Web de Gestión de Inventario, Ventas y Módulos Contables</p>
          </div>
        </div>

        {/* Currency Ticker */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-2xl border border-slate-700/80 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Tasa Oficial BCV:</span>
          <button
            onClick={() => updateExchangeRates({ activeRateType: 'bcvUSD' })}
            className={`px-3 py-1 rounded-xl font-bold font-mono transition-all cursor-pointer ${
              exchangeRates.activeRateType === 'bcvUSD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            USD: Bs. {exchangeRates.bcvUSD.toFixed(2)}
          </button>
          <button
            onClick={() => updateExchangeRates({ activeRateType: 'bcvEUR' })}
            className={`px-3 py-1 rounded-xl font-bold font-mono transition-all cursor-pointer ${
              exchangeRates.activeRateType === 'bcvEUR' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            EUR: Bs. {exchangeRates.bcvEUR.toFixed(2)}
          </button>
          <button
            onClick={fetchLiveExchangeRates}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold text-[11px] ml-1 cursor-pointer"
            title="Sincronizar tasa BCV oficial"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* User Info & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {(activeRole === 'admin' || activeRole === 'super_user') && pendingApprovalsCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse">
              <Bell className="w-3.5 h-3.5" />
              <span>{pendingApprovalsCount} {pendingApprovalsCount === 1 ? 'decisión' : 'decisiones'}</span>
            </div>
          )}

          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>

          {/* Logged in User Badge & Role Selector */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              {currentUser ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div>
              <p className="font-bold text-white leading-none text-xs">{currentUser?.name || 'Usuario'}</p>
              <p className="text-[10px] text-slate-400 font-medium">
                {activeRole === 'super_user' ? 'Super Usuario' : activeRole === 'admin' ? 'Administrador' : 'Vendedor'}
              </p>
            </div>

            <select
              value={activeRole}
              onChange={handleRoleChange}
              className="bg-slate-950 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg outline-none cursor-pointer border border-slate-700 hover:border-slate-500 ml-1"
              title="Cambiar vista de rol"
            >
              <option value="super_user">Super Usuario</option>
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>

        </div>

      </div>
    </header>
  );
};
