import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { VendorPayroll } from '../../types';
import { validateReference } from '../../utils/validators';

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
    <div className="space-y-4 text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900">💵 Liquidación Mensual y Comisiones a Vendedores</h2>
          <p className="text-xs text-slate-600">
            Cálculo de sueldo base, 10% de comisiones por ventas y autorización de pagos bancarios (Jefe / Super Usuario).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-sm">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Total Liquidación del Mes</span>
          <p className="text-xl font-black text-blue-700 mt-1">Bs. {totalPayoutBs.toLocaleString('es-VE')}</p>
          <p className="text-emerald-700 font-bold mt-0.5">${totalPayoutUSD} USD</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-sm">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Comisión Aplicable</span>
          <p className="text-xl font-black text-slate-800 mt-1">10% sobre ventas</p>
          <p className="text-slate-500 mt-0.5">+ Sueldo Base Fijo</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-sm">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Tasa BCV Referencial</span>
          <p className="text-xl font-black text-slate-800 mt-1">Bs. {exchangeRates.bcvUSD.toFixed(2)} / USD</p>
          <p className="text-slate-500 mt-0.5">Tasa Oficial</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex gap-3 items-center text-xs">
        <input
          type="text"
          placeholder="Buscar vendedor por nombre o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg w-full md:w-80 outline-none focus:border-blue-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="p-3">Vendedor</th>
                <th className="p-3 text-center">Ventas</th>
                <th className="p-3">Monto Ventas (Bs)</th>
                <th className="p-3">Sueldo Base</th>
                <th className="p-3">Comisión (10%)</th>
                <th className="p-3">Pago Total (Bs)</th>
                <th className="p-3">Pago Total (USD)</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredPayrolls.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{p.vendorName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{p.vendorDoc}</p>
                  </td>
                  <td className="p-3 text-center font-bold">{p.totalSalesCount} unids</td>
                  <td className="p-3 font-bold">Bs. {p.totalSalesBs.toLocaleString('es-VE')}</td>
                  <td className="p-3 text-slate-600">Bs. {p.baseSalaryBs.toLocaleString('es-VE')}</td>
                  <td className="p-3 font-bold text-blue-700">Bs. {p.commissionAmountBs.toLocaleString('es-VE')}</td>
                  <td className="p-3 font-black text-slate-900 text-sm">Bs. {p.finalPayoutBs.toLocaleString('es-VE')}</td>
                  <td className="p-3 font-bold text-emerald-700">${p.finalPayoutUSD} USD</td>
                  <td className="p-3">
                    {p.status === 'Pagado' ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        ✓ Pagado ({p.paymentDate})
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        ⏳ Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {p.status === 'Pendiente' && activeRole === 'super_user' && (
                      <button
                        onClick={() => {
                          setSelectedApprovePayroll(p);
                          setPaymentRefInput(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
                          setRefError(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-md text-[11px] shadow-sm transition-colors"
                      >
                        Aprobar Pago
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="text-blue-600 hover:underline font-bold text-[11px]"
                    >
                      📄 Recibo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Approve with Verification */}
      {selectedApprovePayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white max-w-sm w-full rounded-xl p-5 border border-slate-300 shadow-2xl space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Aprobar Pago a Vendedor</h3>
              <button
                onClick={() => setSelectedApprovePayroll(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p><b>Vendedor:</b> {selectedApprovePayroll.vendorName}</p>
                <p><b>Cédula:</b> {selectedApprovePayroll.vendorDoc}</p>
                <p className="text-blue-900 font-bold">
                  <b>Monto Total a Liquidar:</b> Bs. {selectedApprovePayroll.finalPayoutBs.toLocaleString('es-VE')} (${selectedApprovePayroll.finalPayoutUSD} USD)
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Número de Referencia de Transferencia / Pago <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: REF-992019 o 0102123456"
                  value={paymentRefInput}
                  onChange={(e) => {
                    setPaymentRefInput(e.target.value);
                    if (refError) setRefError(null);
                  }}
                  className={`w-full p-2.5 border rounded-lg font-bold transition-colors ${
                    refError ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {refError && <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {refError}</p>}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedApprovePayroll(null)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white max-w-md w-full rounded-xl p-5 border border-slate-300 shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 print:hidden">
              <h3 className="font-extrabold text-sm text-slate-900">Recibo de Pago de Nómina / Comisiones</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-center border-b border-slate-200 pb-2">
                <h2 className="font-black text-base text-slate-900">Empresa de Tecnología C.A.</h2>
                <p className="text-slate-500 text-[11px]">Comprobante de Pago Mensual a Vendedor</p>
              </div>

              <div className="space-y-1">
                <p><b>Vendedor Beneficiario:</b> {selectedReceipt.vendorName} ({selectedReceipt.vendorDoc})</p>
                <p><b>Período:</b> {selectedReceipt.month}</p>
                <p><b>Estado del Pago:</b> {selectedReceipt.status}</p>
                {selectedReceipt.paymentRef && <p className="font-mono"><b>Referencia Bancaria:</b> {selectedReceipt.paymentRef}</p>}
              </div>

              <div className="border-t border-b border-slate-200 py-2 space-y-1">
                <p>Equipos vendidos en el período: <b>{selectedReceipt.totalSalesCount} unids</b></p>
                <p>Volumen de ventas generado: <b>Bs. {selectedReceipt.totalSalesBs.toLocaleString('es-VE')}</b></p>
                <p>Sueldo Base Asignado: <b>Bs. {selectedReceipt.baseSalaryBs.toLocaleString('es-VE')}</b></p>
                <p className="text-blue-700 font-bold">Comisión por Ventas (10%): <b>Bs. {selectedReceipt.commissionAmountBs.toLocaleString('es-VE')}</b></p>
              </div>

              <div className="text-right font-black text-sm">
                <p>Total Liquidado: <span className="text-blue-700">Bs. {selectedReceipt.finalPayoutBs.toLocaleString('es-VE')}</span></p>
                <p className="text-emerald-700 text-xs">${selectedReceipt.finalPayoutUSD} USD</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 print:hidden">
              <button
                onClick={handlePrintReceipt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors"
              >
                🖨️ Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
