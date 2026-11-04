import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { VendorPayroll } from '../../types';
import { validateReference } from '../../utils/validators';
import {
  Wallet,
  Search,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  Printer,
  X,
  FileText,
  AlertTriangle,
  Building2
} from 'lucide-react';

export const PayrollManager: React.FC = () => {
  const { payrolls, approvePayroll, activeRole, exchangeRates, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApprovePayroll, setSelectedApprovePayroll] = useState<VendorPayroll | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [refError, setRefError] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<VendorPayroll | null>(null);

  const filteredPayrolls = payrolls.filter((p) =>
    p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendorDoc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayoutBs = filteredPayrolls.reduce((acc, p) => acc + p.finalPayoutBs, 0);
  const totalPayoutUSD = filteredPayrolls.reduce((acc, p) => acc + p.finalPayoutUSD, 0);

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApprovePayroll) return;

    const refCheck = validateReference(paymentRefInput);
    if (!refCheck.isValid) {
      setRefError(refCheck.error || 'Referencia bancaria inválida.');
      addToast({
        type: 'error',
        title: 'Referencia Requerida',
        message: refCheck.error || 'Ingresa una referencia bancaria válida.'
      });
      return;
    }

    setRefError(null);
    approvePayroll(selectedApprovePayroll.id, paymentRefInput.trim().toUpperCase());
    setSelectedApprovePayroll(null);
    setPaymentRefInput('');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Unificado Moderno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-blue-600" />
            Liquidación Mensual y Comisiones a Vendedores
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Cálculo automatizado de sueldo base, 10% de comisiones por ventas y autorización bancaria.
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Liquidación del Mes</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2 font-mono">Bs. {totalPayoutBs.toLocaleString('es-VE')}</p>
          <p className="text-xs font-bold text-emerald-700 mt-0.5 font-mono">${totalPayoutUSD} USD</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comisión Aplicable</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">10% por venta</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">+ Sueldo Base Contractual</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa BCV Oficial</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">Bs. {exchangeRates.bcvUSD.toFixed(2)}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Por cada Dólar Americano</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex gap-3 items-center text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar vendedor por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                <th className="p-3.5">Vendedor</th>
                <th className="p-3.5 text-center">Ventas</th>
                <th className="p-3.5">Monto Ventas (Bs)</th>
                <th className="p-3.5">Sueldo Base</th>
                <th className="p-3.5">Comisión (10%)</th>
                <th className="p-3.5">Pago Total (Bs)</th>
                <th className="p-3.5">Pago Total (USD)</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayrolls.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900 text-sm">{p.vendorName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.vendorDoc}</p>
                  </td>
                  <td className="p-3.5 text-center font-bold">{p.totalSalesCount} unids</td>
                  <td className="p-3.5 font-bold font-mono">Bs. {p.totalSalesBs.toLocaleString('es-VE')}</td>
                  <td className="p-3.5 text-slate-600 font-mono">Bs. {p.baseSalaryBs.toLocaleString('es-VE')}</td>
                  <td className="p-3.5 font-bold text-blue-700 font-mono">Bs. {p.commissionAmountBs.toLocaleString('es-VE')}</td>
                  <td className="p-3.5 font-black text-slate-900 text-sm font-mono">Bs. {p.finalPayoutBs.toLocaleString('es-VE')}</td>
                  <td className="p-3.5 font-bold text-emerald-700 font-mono">${p.finalPayoutUSD}</td>
                  <td className="p-3.5">
                    {p.status === 'Pagado' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Pagado ({p.paymentDate})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === 'Pendiente' && activeRole === 'super_user' && (
                        <button
                          onClick={() => {
                            setSelectedApprovePayroll(p);
                            setPaymentRefInput(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
                            setRefError(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Aprobar Pago
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Recibo</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Approve with Verification */}
      {selectedApprovePayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Aprobar Pago a Vendedor
              </h3>
              <button
                onClick={() => setSelectedApprovePayroll(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <p><b>Vendedor:</b> {selectedApprovePayroll.vendorName}</p>
                <p><b>Cédula:</b> <span className="font-mono">{selectedApprovePayroll.vendorDoc}</span></p>
                <p className="text-blue-900 font-bold pt-1 border-t border-slate-200">
                  <b>Monto Total a Liquidar:</b> Bs. {selectedApprovePayroll.finalPayoutBs.toLocaleString('es-VE')} (${selectedApprovePayroll.finalPayoutUSD} USD)
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  Referencia Bancaria / Pago <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: REF-992019 o 0102123456"
                  value={paymentRefInput}
                  onChange={(e) => {
                    setPaymentRefInput(e.target.value);
                    if (refError) setRefError(null);
                  }}
                  className={`w-full p-2.5 border rounded-xl font-mono font-bold transition-colors ${
                    refError ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                  }`}
                />
                {refError && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 inline" /> {refError}
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApprovePayroll(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Liquidación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Receipt */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 print:hidden">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Recibo de Pago de Nómina / Comisiones
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="text-center border-b border-slate-100 pb-3">
                <h2 className="font-black text-lg text-slate-900">TechInventario C.A.</h2>
                <p className="text-slate-500 text-xs">Comprobante Oficial de Pago Mensual a Vendedor</p>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <p><b>Vendedor Beneficiario:</b> {selectedReceipt.vendorName} (<span className="font-mono">{selectedReceipt.vendorDoc}</span>)</p>
                <p><b>Período:</b> {selectedReceipt.month}</p>
                <p><b>Estado del Pago:</b> <span className="font-bold text-emerald-700">{selectedReceipt.status}</span></p>
                {selectedReceipt.paymentRef && (
                  <p><b>Referencia Bancaria:</b> <span className="font-mono font-bold text-slate-800">{selectedReceipt.paymentRef}</span></p>
                )}
              </div>

              <div className="border-t border-b border-slate-100 py-2.5 space-y-1.5 text-slate-700">
                <p className="flex justify-between">
                  <span>Equipos vendidos en el período:</span>
                  <b>{selectedReceipt.totalSalesCount} unids</b>
                </p>
                <p className="flex justify-between">
                  <span>Volumen de ventas generado:</span>
                  <b className="font-mono">Bs. {selectedReceipt.totalSalesBs.toLocaleString('es-VE')}</b>
                </p>
                <p className="flex justify-between">
                  <span>Sueldo Base Asignado:</span>
                  <b className="font-mono">Bs. {selectedReceipt.baseSalaryBs.toLocaleString('es-VE')}</b>
                </p>
                <p className="flex justify-between text-blue-700 font-bold">
                  <span>Comisión por Ventas (10%):</span>
                  <span className="font-mono">Bs. {selectedReceipt.commissionAmountBs.toLocaleString('es-VE')}</span>
                </p>
              </div>

              <div className="text-right font-black text-base pt-1">
                <p>Total Liquidado: <span className="text-blue-700 font-mono">Bs. {selectedReceipt.finalPayoutBs.toLocaleString('es-VE')}</span></p>
                <p className="text-emerald-700 text-xs font-mono">${selectedReceipt.finalPayoutUSD} USD</p>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 print:hidden">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
