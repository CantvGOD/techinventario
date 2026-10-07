import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { SaleTransaction } from '../../types';
import {
  ShoppingCart,
  Search,
  Filter,
  FileText,
  Printer,
  X,
  Plus
} from 'lucide-react';

interface SalesHistoryProps {
  onOpenNewSale: () => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ onOpenNewSale }) => {
  const { sales, users } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<SaleTransaction | null>(null);

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

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Historial de Ventas y Transacciones
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registro cronológico de todas las ventas efectuadas por vendedores.
          </p>
        </div>

        <button
          onClick={onOpenNewSale}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Transacciones Filtradas</span>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {filteredSales.length} <span className="text-xs text-slate-500 font-normal">ventas</span>
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Monto Total Bolívares</span>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            Bs. {totalSalesBs.toLocaleString('es-VE')}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Monto Total USD</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalSalesUSD.toLocaleString('en-US')} USD
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Todos los vendedores</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
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

      {/* Sales Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Vendedor</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Teléfono Vendido</th>
                <th className="py-3.5 px-4 text-center">Cant.</th>
                <th className="py-3.5 px-4">Total Bs.</th>
                <th className="py-3.5 px-4">Total USD</th>
                <th className="py-3.5 px-4">Pago</th>
                <th className="py-3.5 px-4 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-blue-600 dark:text-blue-400">{sale.code}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(sale.date).toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{sale.vendorName}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{sale.clientName}</p>
                    <p className="text-[10px] text-slate-400">{sale.clientDoc}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">{sale.phoneName}</td>
                  <td className="py-3.5 px-4 text-center font-bold">{sale.quantity}</td>
                  <td className="py-3.5 px-4 font-black">Bs. {sale.totalBs.toLocaleString('es-VE')}</td>
                  <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">${sale.totalUSD}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold block w-fit">
                      {sale.paymentMethod}
                    </span>
                    {sale.paymentReference && (
                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                        Ref: {sale.paymentReference}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(sale)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold flex items-center gap-1 ml-auto text-[11px]"
                    >
                      <FileText className="w-3.5 h-3.5" /> Recibo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Receipt Viewer */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Comprobante Digital de Venta
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Card */}
            <div className="py-6 space-y-4 text-xs">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-blue-600 dark:text-blue-400">TechInventario C.A.</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Comprobante de Transacción #{selectedReceipt.code}
                </p>
                <p className="text-slate-500">RIF: J-40198273-0 • Barquisimeto, Venezuela</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha:</span>
                  <span className="font-bold">{new Date(selectedReceipt.date).toLocaleString('es-VE')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendedor:</span>
                  <span className="font-bold">{selectedReceipt.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold">{selectedReceipt.clientName} ({selectedReceipt.clientDoc})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Método de Pago:</span>
                  <span className="font-bold text-blue-600">{selectedReceipt.paymentMethod}</span>
                </div>
                {selectedReceipt.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Referencia Bancaria:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedReceipt.paymentReference}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-b border-slate-200 dark:border-slate-800 py-3 space-y-2">
                <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
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
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Base Imponible:</span>
                      <span className="font-semibold">Bs. {taxBase.toLocaleString('es-VE')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>IVA Débito Fiscal (16%):</span>
                      <span className="font-semibold">Bs. {taxIva.toLocaleString('es-VE')}</span>
                    </div>
                    {taxIgtf > 0 && (
                      <div className="flex justify-between text-amber-800 dark:text-amber-400 font-bold">
                        <span>IGTF Percibido (3% Efectivo Divisas):</span>
                        <span>Bs. {taxIgtf.toLocaleString('es-VE')}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-1 text-right font-black text-sm">
                <div className="flex justify-between">
                  <span>Total Facturado:</span>
                  <span className="text-blue-600">Bs. {selectedReceipt.totalBs.toLocaleString('es-VE')}</span>
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
                <p className="text-[11px] italic text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  Nota: {selectedReceipt.notes}
                </p>
              )}
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 print:hidden">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
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
