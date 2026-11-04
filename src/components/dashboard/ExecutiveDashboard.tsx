import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useApp } from '../../context/AppContext';
import type { NavTab } from '../layout/Sidebar';

interface ExecutiveDashboardProps {
  onOpenNewSale: () => void;
  setActiveTab: (tab: NavTab) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onOpenNewSale,
  setActiveTab
}) => {
  const {
    currentUser,
    activeRole,
    phones,
    sales,
    payrolls,
    exchangeRates,
    fetchLiveExchangeRates,
    approvals
  } = useApp();

  const totalSalesBs = sales.reduce((acc, s) => acc + s.totalBs, 0);
  const totalSalesUSD = (totalSalesBs / exchangeRates.bcvUSD).toFixed(2);
  const totalSalesEUR = (totalSalesBs / exchangeRates.bcvEUR).toFixed(2);
  const totalUnitsSold = sales.reduce((acc, s) => acc + s.quantity, 0);

  const totalStockUnits = phones.reduce((acc, p) => acc + p.stock, 0);
  const lowStockPhones = phones.filter((p) => p.stock <= p.minStock);
  const pendingApprovals = approvals.filter((a) => a.status === 'pendiente');

  const topVendor = [...payrolls].sort((a, b) => b.totalSalesBs - a.totalSalesBs)[0];

  // Métodos de pago para gráfica
  const paymentMethodsData = Object.entries(
    sales.reduce((acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.totalBs;
      return acc;
    }, {} as { [k: string]: number })
  ).map(([name, value]) => ({
    name,
    value,
    usd: Number((value / exchangeRates.bcvUSD).toFixed(2))
  }));

  // Top teléfonos vendidos para gráfica
  const phoneSalesData = Object.entries(
    sales.reduce((acc, s) => {
      acc[s.phoneName] = (acc[s.phoneName] || 0) + s.quantity;
      return acc;
    }, {} as { [k: string]: number })
  )
    .map(([name, cantidad]) => ({
      name: name.length > 16 ? name.substring(0, 14) + '...' : name,
      fullName: name,
      cantidad
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Header Banner */}
      <div className="p-4 bg-white border border-slate-300 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>¡Bienvenido, {currentUser ? currentUser.name : 'Usuario'}!</span>
            <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {activeRole === 'super_user' ? 'Super Usuario' : activeRole === 'admin' ? 'Administrador' : 'Vendedor'}
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Resumen general de inventario, ventas registradas y liquidación de comisiones a vendedores.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(activeRole === 'admin' || activeRole === 'super_user') && pendingApprovals.length > 0 && (
            <button
              onClick={() => setActiveTab('inventory')}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-md shadow-sm transition-colors flex items-center gap-1.5 animate-pulse"
            >
              🔔 {pendingApprovals.length} {pendingApprovals.length === 1 ? 'Decisión Pendiente' : 'Decisiones Pendientes'}
            </button>
          )}

          <button
            onClick={onOpenNewSale}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-md shadow-sm transition-colors"
          >
            + Registrar Nueva Venta
          </button>
        </div>
      </div>

      {/* Alerta Gerencial si hay decisiones pendientes */}
      {(activeRole === 'admin' || activeRole === 'super_user') && pendingApprovals.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                Atención Gerencial Requerida ({pendingApprovals.length} {pendingApprovals.length === 1 ? 'solicitud' : 'solicitudes'})
              </h3>
              <p className="text-[11px] text-amber-800">
                Personal operativo ha solicitado ajustes críticos (cambio de precios, salidas o lotes). Se requiere revisión y firma del Administrador.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="whitespace-nowrap px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Revisar en Inventario →
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas Totales</span>
          <p className="text-2xl font-black text-blue-700">Bs. {totalSalesBs.toLocaleString('es-VE')}</p>
          <p className="text-xs text-slate-600 font-semibold">
            ${totalSalesUSD} USD | €{totalSalesEUR} EUR
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipos Vendidos</span>
          <p className="text-2xl font-black text-slate-800">{totalUnitsSold} <span className="text-xs font-bold text-slate-500">unidades</span></p>
          <p className="text-xs text-slate-600 font-semibold">{sales.length} transacciones registradas</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock en Almacén</span>
          <p className="text-2xl font-black text-slate-800">{totalStockUnits} <span className="text-xs font-bold text-slate-500">teléfonos</span></p>
          {lowStockPhones.length > 0 ? (
            <p className="text-xs text-amber-700 font-extrabold">⚠️ {lowStockPhones.length} modelos en stock mínimo</p>
          ) : (
            <p className="text-xs text-emerald-700 font-bold">✓ Stock suficiente</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Vendedor del Mes</span>
          <p className="text-base font-black text-slate-900 truncate">{topVendor ? topVendor.vendorName : 'Sin ventas'}</p>
          <p className="text-xs text-slate-600 font-semibold">
            Bs. {topVendor?.totalSalesBs.toLocaleString('es-VE')} (${topVendor?.totalSalesUSD} USD)
          </p>
        </div>
      </div>

      {/* Gráficas del Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfica 1: Top Teléfonos Vendidos */}
        <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm space-y-2">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>📊</span> Top Equipos Más Vendidos
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Unidades despachadas</span>
          </div>
          <div className="h-48 w-full pt-2">
            {phoneSalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phoneSalesData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(value: any, _name: any, item: any) => [`${value} unidades`, item.payload.fullName]} />
                  <Bar dataKey="cantidad" fill="#2563eb" radius={[6, 6, 0, 0]}>
                    {phoneSalesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Sin ventas registradas aún para graficar
              </div>
            )}
          </div>
        </div>

        {/* Gráfica 2: Métodos de Pago */}
        <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm space-y-2">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>🍩</span> Distribución por Método de Pago
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Monto recaudado</span>
          </div>
          <div className="h-48 w-full">
            {paymentMethodsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    paddingAngle={3}
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {paymentMethodsData.map((_, index) => (
                      <Cell key={`cell-pay-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`Bs. ${Number(val).toLocaleString('es-VE')}`, 'Recaudado']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Sin transacciones registradas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Phones & Currency Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Top Phones List */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-300 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <h3 className="font-bold text-sm text-slate-900">📱 Catálogo de Teléfonos Disponibles ({phones.length})</h3>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              Ver inventario completo →
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {phones.slice(0, 6).map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200 hover:bg-slate-100/80 transition-colors">
                <div>
                  <span className="font-bold text-slate-900">{idx + 1}. {p.brand} {p.model}</span>
                  <span className="text-slate-500 text-[11px] ml-2 font-medium">({p.specs.ram} RAM / {p.specs.storage})</span>
                  <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                    Stock: {p.stock}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-700">Bs. {p.priceBs.toLocaleString('es-VE')}</span>
                  <span className="text-slate-500 text-[11px] block font-semibold">
                    ${(p.priceBs / exchangeRates.bcvUSD).toFixed(2)} USD
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Currency Rates Box */}
        <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5 mb-3">
              <h3 className="font-bold text-sm text-slate-900">💱 Cotización de Cambio</h3>
              <button
                onClick={fetchLiveExchangeRates}
                className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
              >
                🔄 Actualizar
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
                <span className="font-bold text-blue-900">Dólar BCV (USD):</span>
                <span className="font-black text-blue-900 text-base">Bs. {exchangeRates.bcvUSD.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md flex justify-between items-center">
                <span className="font-bold text-indigo-900">Euro BCV (EUR):</span>
                <span className="font-black text-indigo-900 text-base">Bs. {exchangeRates.bcvEUR.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex justify-between items-center">
                <span className="font-bold text-slate-700">Dólar Paralelo:</span>
                <span className="font-black text-slate-800 text-base">Bs. {exchangeRates.paraleloUSD.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-600">
            Los precios en USD/EUR se actualizan automáticamente según la tasa BCV oficial.
          </div>
        </div>

      </div>

      {/* Recent Sales Table */}
      <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm text-slate-900">📋 Últimas Ventas Registradas</h3>
          <button
            onClick={() => setActiveTab('sales')}
            className="text-xs text-blue-600 hover:underline font-bold"
          >
            Ver historial completo ({sales.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="p-2.5">Código Venta</th>
                <th className="p-2.5">Vendedor (Persona Natural)</th>
                <th className="p-2.5">Teléfono Vendido</th>
                <th className="p-2.5 text-center">Cant.</th>
                <th className="p-2.5">Total Bs.</th>
                <th className="p-2.5">Total USD ($)</th>
                <th className="p-2.5">Método de Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {sales.slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-blue-700">{s.code}</td>
                  <td className="p-2.5 font-semibold text-slate-900">{s.vendorName}</td>
                  <td className="p-2.5 font-bold text-slate-800">{s.phoneName}</td>
                  <td className="p-2.5 text-center font-bold">{s.quantity}</td>
                  <td className="p-2.5 font-bold text-slate-900">Bs. {s.totalBs.toLocaleString('es-VE')}</td>
                  <td className="p-2.5 text-emerald-700 font-bold">${s.totalUSD}</td>
                  <td className="p-2.5"><span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">{s.paymentMethod}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
