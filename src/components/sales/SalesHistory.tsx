import React, { useState } from 'react';
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
import type { SaleTransaction } from '../../types';
import {
  ShoppingCart,
  Search,
  Filter,
  FileText,
  Printer,
  X,
  Plus,
  BarChart2,
  Calendar,
  User,
  Smartphone,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard
} from 'lucide-react';

interface SalesHistoryProps {
  onOpenNewSale: () => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ onOpenNewSale }) => {
  const { sales, users, exchangeRates } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<SaleTransaction | null>(null);
  const [showCharts, setShowCharts] = useState(true);

  const vendors = users.filter((u) => u.role === 'vendedor');

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.phoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.paymentReference && sale.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesVendor = selectedVendor === 'all' || sale.vendorId === selectedVendor;
    const matchesPayment = selectedPayment === 'all' || sale.paymentMethod === selectedPayment;
    return matchesSearch && matchesVendor && matchesPayment;
  });

  const totalSalesBs = filteredSales.reduce((acc, s) => acc + s.totalBs, 0);
  const totalSalesUSD = filteredSales.reduce((acc, s) => acc + s.totalUSD, 0);
  const totalUnits = filteredSales.reduce((acc, s) => acc + s.quantity, 0);
  const avgTicketUSD = filteredSales.length > 0 ? (totalSalesUSD / filteredSales.length).toFixed(1) : '0';

  // Estadísticas para gráficas
  const paymentMethodStats = Object.entries(
    filteredSales.reduce((acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.totalBs;
      return acc;
    }, {} as { [k: string]: number })
  ).map(([name, value]) => ({
    name,
    value,
    usd: Number((value / exchangeRates.bcvUSD).toFixed(2))
  }));

  const vendorStats = Object.entries(
    filteredSales.reduce((acc, s) => {
      acc[s.vendorName] = (acc[s.vendorName] || 0) + s.quantity;
      return acc;
    }, {} as { [k: string]: number })
  ).map(([name, units]) => ({
    name: name.split(' ')[0],
    fullName: name,
    units
  }));

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Registro y Control de Ventas
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Historial cronológico de facturación, emisión de comprobantes fiscales y auditoría de recaudación multimoneda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 transition-all shadow-xs cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>{showCharts ? 'Ocultar Gráficas' : 'Ver Estadísticas'}</span>
          </button>
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Transacciones */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transacciones</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{filteredSales.length}</h3>
            <p className="text-[11px] text-blue-600 font-bold mt-1">
              {totalUnits} {totalUnits === 1 ? 'teléfono facturado' : 'teléfonos facturados'}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Monto Bolívares */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recaudación Bs.</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Bs. {totalSalesBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Total neto con IVA e IGTF</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Monto USD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total en Divisas</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              ${totalSalesUSD.toLocaleString('en-US')} USD
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Tasa BCV: Bs. {exchangeRates.bcvUSD.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Ticket Promedio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Promedio</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${avgTicketUSD} USD</h3>
            <p className="text-[11px] text-amber-600 font-bold mt-1">Promedio por operación</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Strip (Recharts) */}
      {showCharts && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              Métricas y Estadísticas de Facturación
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Actualizado en tiempo real</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gráfica 1: Recaudación por Método de Pago */}
            <div className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Recaudación por Método de Pago
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Filtro activo</span>
              </div>

              <div className="h-44 w-full">
                {paymentMethodStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodStats}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {paymentMethodStats.map((_, index) => (
                          <Cell key={`cell-pm-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`Bs. ${Number(val).toLocaleString('es-VE')}`, 'Monto']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Sin ventas registradas
                  </div>
                )}
              </div>

              {/* Leyenda limpia de métodos de pago */}
              {paymentMethodStats.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-200/60 mt-2">
                  {paymentMethodStats.map((stat, idx) => {
                    const pct = totalSalesBs > 0 ? ((stat.value / totalSalesBs) * 100).toFixed(0) : '0';
                    return (
                      <span
                        key={stat.name}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-2xs"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        ></span>
                        {stat.name}: {pct}%
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gráfica 2: Unidades vendidas por vendedor */}
            <div className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Desempeño: Unidades por Vendedor
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Equipos facturados</span>
              </div>

              <div className="h-44 w-full">
                {vendorStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendorStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                      <Tooltip
                        formatter={(val: any, _name: any, item: any) => [`${val} unidades`, item.payload.fullName]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="units" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                        {vendorStats.map((_, index) => (
                          <Cell key={`bar-v-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Sin datos de vendedores
                  </div>
                )}
              </div>

              {/* Leyenda de total unidades */}
              <div className="pt-2 border-t border-slate-200/60 mt-2 text-center text-[11px] text-slate-500 font-medium">
                Total de equipos colocados: <strong className="text-slate-800">{totalUnits} unidades</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar Unificada */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por código, cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs text-slate-800 font-medium placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600 hidden sm:inline">Filtrar:</span>
          </div>

          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:border-blue-500 font-semibold text-slate-700 outline-none text-xs transition-colors cursor-pointer"
          >
            <option value="all">Todos los vendedores</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:border-blue-500 font-semibold text-slate-700 outline-none text-xs transition-colors cursor-pointer"
          >
            <option value="all">Todos los métodos de pago</option>
            <option value="Pago Móvil">Pago Móvil</option>
            <option value="Transferencia">Transferencia Bancaria</option>
            <option value="Zelle">Zelle (USD)</option>
            <option value="Efectivo Divisas (USD)">Efectivo Divisas (USD)</option>
            <option value="Efectivo Bolívares">Efectivo Bolívares</option>
          </select>
        </div>
      </div>

      {/* Sales Table Unificada */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Vendedor</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Dispositivo</th>
                <th className="py-3.5 px-4 text-center">Cant.</th>
                <th className="py-3.5 px-4">Total (Bs.)</th>
                <th className="py-3.5 px-4">Total (USD)</th>
                <th className="py-3.5 px-4">Método de Pago</th>
                <th className="py-3.5 px-4 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-sm text-slate-600">No se encontraron ventas registradas</p>
                    <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los filtros o registra una nueva venta</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50/60 px-2 py-0.5 rounded-md border border-blue-100 text-[11px]">
                        {sale.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(sale.date).toLocaleDateString('es-VE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-5">
                        {new Date(sale.date).toLocaleTimeString('es-VE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sale.vendorName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{sale.clientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sale.clientDoc}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{sale.phoneName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-xs">
                        {sale.quantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm whitespace-nowrap">
                      Bs. {sale.totalBs.toLocaleString('es-VE')}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm whitespace-nowrap">
                      ${sale.totalUSD} USD
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        sale.paymentMethod === 'Pago Móvil'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : sale.paymentMethod === 'Zelle'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          : sale.paymentMethod.includes('Divisas')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                      {sale.paymentReference && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-1">
                          Ref: {sale.paymentReference}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(sale)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors border border-blue-200/60 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Recibo</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Receipt Viewer */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200/80 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Comprobante Digital de Venta</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Factura transaccional #{selectedReceipt.code}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Card */}
            <div className="py-2 space-y-4 text-xs">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-blue-600">TechInventario C.A.</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Comprobante de Transacción #{selectedReceipt.code}
                </p>
                <p className="text-slate-500 text-[11px]">RIF: J-40198273-0 • Barquisimeto, Venezuela</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Fecha:</span>
                  <span className="font-bold text-slate-800">{new Date(selectedReceipt.date).toLocaleString('es-VE')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Vendedor:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cliente:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.clientName} ({selectedReceipt.clientDoc})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Método de Pago:</span>
                  <span className="font-bold text-blue-600">{selectedReceipt.paymentMethod}</span>
                </div>
                {selectedReceipt.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Referencia Bancaria:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedReceipt.paymentReference}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-b border-slate-200/80 py-3 space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{selectedReceipt.quantity}x {selectedReceipt.phoneName}</span>
                  <span>Bs. {selectedReceipt.totalBs.toLocaleString('es-VE')}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Precio unitario: Bs. {selectedReceipt.unitPriceBs.toLocaleString('es-VE')}</span>
                  <span>Tasa USD Oficial BCV: Bs. {selectedReceipt.exchangeRateUsed.toFixed(2)}</span>
                </div>
              </div>

              {/* Fiscal Breakdown */}
              {(() => {
                const taxBase = selectedReceipt.taxBaseBs || Number((selectedReceipt.totalBs / 1.16).toFixed(2));
                const taxIva = selectedReceipt.ivaBs || Number((selectedReceipt.totalBs - taxBase).toFixed(2));
                const taxIgtf = selectedReceipt.igtfBs || 0;
                return (
                  <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200/80 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Imponible:</span>
                      <span className="font-semibold text-slate-900">Bs. {taxBase.toLocaleString('es-VE')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IVA Débito Fiscal (16%):</span>
                      <span className="font-semibold text-slate-900">Bs. {taxIva.toLocaleString('es-VE')}</span>
                    </div>
                    {taxIgtf > 0 && (
                      <div className="flex justify-between text-amber-900 font-bold">
                        <span>IGTF Percibido (3% Efectivo Divisas):</span>
                        <span>Bs. {taxIgtf.toLocaleString('es-VE')}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-1.5 text-right font-black text-sm pt-2">
                <div className="flex justify-between text-slate-900">
                  <span>Total Facturado:</span>
                  <span className="text-base text-blue-600">Bs. {selectedReceipt.totalBs.toLocaleString('es-VE')}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>Total USD ($):</span>
                  <span>${selectedReceipt.totalUSD} USD</span>
                </div>
                <div className="flex justify-between text-xs text-indigo-600 font-bold">
                  <span>Total EUR (€):</span>
                  <span>€{selectedReceipt.totalEUR} EUR</span>
                </div>
              </div>

              {selectedReceipt.notes && (
                <p className="text-[11px] italic text-slate-400 pt-2 border-t border-slate-100">
                  Nota: {selectedReceipt.notes}
                </p>
              )}
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};