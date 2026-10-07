import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ExpenseCategory, PaymentMethod } from '../../types';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Scale,
  Printer,
  Plus,
  Trash2,
  Receipt
} from 'lucide-react';

export const FinancialAccounting: React.FC = () => {
  const {
    activeRole,
    currentUser,
    sales,
    phones,
    expenses,
    registerExpense,
    deleteExpense,
    exchangeRates,
    getIncomeStatement,
    getBalanceSheet,
    getDailyCashClose
  } = useApp();

  const [activeTab, setActiveTab] = useState<'income' | 'balance' | 'expenses' | 'cash_close' | 'profitability'>('income');
  const [selectedCloseDate, setSelectedCloseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Modal para registrar nuevo gasto operativo
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Luz / Electricidad');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmountUSD, setExpenseAmountUSD] = useState<number>(50);
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('Transferencia');
  const [expenseReference, setExpenseReference] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // RBAC Access Guard
  if (activeRole !== 'admin' && activeRole !== 'super_user') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-lg font-black text-slate-900">Módulo Contable Restringido</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          El acceso a los Estados Financieros, Balance General, Gastos Operativos y Cierres de Caja está reservado para la Dirección General y Administradores de la Empresa (IUJO).
        </p>
      </div>
    );
  }

  const incomeStatement = getIncomeStatement();
  const balanceSheet = getBalanceSheet();
  const dailyCashClose = getDailyCashClose(selectedCloseDate);

  const handlePrint = () => {
    window.print();
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError(null);

    if (!expenseDescription.trim()) {
      setExpenseError('Ingresa una descripción clara del gasto.');
      return;
    }

    if (expenseAmountUSD <= 0) {
      setExpenseError('El monto del egreso debe ser mayor a 0 USD.');
      return;
    }

    setIsSubmittingExpense(true);
    const amountBs = Number((expenseAmountUSD * exchangeRates.bcvUSD).toFixed(2));
    const success = await registerExpense({
      category: expenseCategory,
      description: expenseDescription.trim(),
      amountBs,
      amountUSD: expenseAmountUSD,
      paymentMethod: expensePaymentMethod,
      referenceNumber: expenseReference.trim() || undefined,
      date: expenseDate || new Date().toISOString().split('T')[0]
    });
    setIsSubmittingExpense(false);

    if (success) {
      setIsExpenseModalOpen(false);
      setExpenseDescription('');
      setExpenseReference('');
      setExpenseAmountUSD(50);
    }
  };

  // Product profitability breakdown
  const productProfitability = phones.map((phone) => {
    const phoneSales = sales.filter((s) => s.phoneId === phone.id);
    const unitsSold = phoneSales.reduce((acc, s) => acc + s.quantity, 0);
    const revenueBs = phoneSales.reduce((acc, s) => acc + s.totalBs, 0);
    const revenueUSD = phoneSales.reduce((acc, s) => acc + s.totalUSD, 0);
    const costUnitUSD = phone.costUSD || (phone.costBs > 0 ? phone.costBs / exchangeRates.bcvUSD : 0);
    const costTotalUSD = unitsSold * costUnitUSD;
    const profitUSD = revenueUSD - costTotalUSD;
    const marginPct = revenueUSD > 0 ? (profitUSD / revenueUSD) * 100 : 0;

    return {
      phone,
      unitsSold,
      revenueBs,
      revenueUSD,
      costUnitUSD,
      costTotalUSD,
      profitUSD,
      marginPct
    };
  });

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Header with Title and Print Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-300 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            🏛️ Contabilidad, Finanzas y Cierre de Caja
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Módulo universitario integral (IUJO): Estado de Resultados, Balance General, Control de Egresos y Cortes Z.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-slate-200/70 p-1.5 rounded-xl text-xs font-bold print:hidden">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'income'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Estado de Resultados</span>
        </button>

        <button
          onClick={() => setActiveTab('balance')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'balance'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Balance General</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gastos Operativos ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cash_close')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'cash_close'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Cierre Diario (Corte Z)</span>
        </button>

        <button
          onClick={() => setActiveTab('profitability')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'profitability'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Rentabilidad por Producto</span>
        </button>
      </div>

      {/* Institutional Document Header (Visible always, optimized for print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
          Instituto Universitario Jesús Obrero (IUJO) • Cátedra de Contabilidad
        </h2>
        <h1 className="text-lg font-black text-slate-950">
          TechInventario C.A. — Sistema Integrado de Gestión Financiera
        </h1>
        <p className="text-[11px] text-slate-600">
          RIF: J-40198273-0 • Barquisimeto, Estado Lara • Período Fiscal 2026
        </p>
      </div>

      {/* TAB 1: ESTADO DE RESULTADOS */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          {/* Quick Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 print:hidden">
            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Ventas Netas</span>
              <p className="text-lg font-black text-slate-900 mt-1">
                ${incomeStatement.salesRevenueUSD.toLocaleString('en-US')} USD
              </p>
              <p className="text-[10px] text-slate-500">Bs. {incomeStatement.salesRevenueBs.toLocaleString('es-VE')}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Costo Ventas (CMV)</span>
              <p className="text-lg font-black text-rose-700 mt-1">
                -${incomeStatement.costOfGoodsSoldUSD.toLocaleString('en-US')} USD
              </p>
              <p className="text-[10px] text-slate-500">Costo reposición inventario</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Utilidad Bruta</span>
              <p className="text-lg font-black text-emerald-700 mt-1">
                ${incomeStatement.grossProfitUSD.toLocaleString('en-US')} USD
              </p>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                Bs. {incomeStatement.grossProfitBs.toLocaleString('es-VE')}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Utilidad Neta</span>
              <p className={`text-lg font-black mt-1 ${incomeStatement.netIncomeUSD >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                ${incomeStatement.netIncomeUSD.toLocaleString('en-US')} USD
              </p>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${incomeStatement.netIncomeUSD >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                Margen Neto: {incomeStatement.profitMarginPercentage}%
              </span>
            </div>
          </div>

          {/* Formal Income Statement Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  ESTADO DE RESULTADOS (ESTADO DE GANANCIAS Y PÉRDIDAS)
                </h2>
                <p className="text-xs text-slate-500">
                  Al {new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })} — Expresado en Bolívares (Bs.) y Dólares (USD)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Tasa BCV: Bs. {exchangeRates.bcvUSD.toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse font-medium">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="p-2.5 text-left">Cuenta Contable / Rubro</th>
                    <th className="p-2.5 text-right">Monto en Bolívares (Bs.)</th>
                    <th className="p-2.5 text-right">Equivalente USD ($)</th>
                    <th className="p-2.5 text-right">% s/ Ventas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  
                  {/* Ingresos Operacionales */}
                  <tr className="font-bold bg-slate-50/50">
                    <td className="p-2.5 text-slate-900">INGRESOS OPERACIONALES</td>
                    <td className="p-2.5 text-right"></td>
                    <td className="p-2.5 text-right"></td>
                    <td className="p-2.5 text-right"></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-700">Ventas Brutas de Equipos y Celulares</td>
                    <td className="p-2.5 text-right font-bold">Bs. {incomeStatement.salesRevenueBs.toLocaleString('es-VE')}</td>
                    <td className="p-2.5 text-right font-bold">${incomeStatement.salesRevenueUSD.toLocaleString('en-US')}</td>
                    <td className="p-2.5 text-right text-slate-500">100.0%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-500">(-) Devoluciones y Descuentos en Ventas</td>
                    <td className="p-2.5 text-right text-slate-400">Bs. 0.00</td>
                    <td className="p-2.5 text-right text-slate-400">$0.00</td>
                    <td className="p-2.5 text-right text-slate-400">0.0%</td>
                  </tr>
                  <tr className="font-bold bg-blue-50/50 border-t border-b border-blue-200">
                    <td className="p-2.5 pl-4 text-blue-900">(=) VENTAS NETAS OPERATIVAS</td>
                    <td className="p-2.5 text-right text-blue-900">Bs. {incomeStatement.salesRevenueBs.toLocaleString('es-VE')}</td>
                    <td className="p-2.5 text-right text-blue-900">${incomeStatement.salesRevenueUSD.toLocaleString('en-US')}</td>
                    <td className="p-2.5 text-right text-blue-900">100.0%</td>
                  </tr>

                  {/* Costo de Ventas */}
                  <tr className="font-bold bg-slate-50/50">
                    <td className="p-2.5 text-slate-900">COSTO DE VENTAS (CMV)</td>
                    <td className="p-2.5 text-right"></td>
                    <td className="p-2.5 text-right"></td>
                    <td className="p-2.5 text-right"></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-rose-700">
                      (-) Costo de Mercancía Vendida (Valuación Promedio / Reposición)
                    </td>
                    <td className="p-2.5 text-right font-bold text-rose-700">-Bs. {incomeStatement.costOfGoodsSoldBs.toLocaleString('es-VE')}</td>
                    <td className="p-2.5 text-right font-bold text-rose-700">-${incomeStatement.costOfGoodsSoldUSD.toLocaleString('en-US')}</td>
                    <td className="p-2.5 text-right text-rose-700">
                      {incomeStatement.salesRevenueUSD > 0 ? ((incomeStatement.costOfGoodsSoldUSD / incomeStatement.salesRevenueUSD) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="font-black bg-emerald-50/70 border-t-2 border-b-2 border-emerald-300">
                    <td className="p-2.5 pl-4 text-emerald-950">(=) UTILIDAD BRUTA EN VENTAS</td>
                    <td className="p-2.5 text-right text-emerald-900">Bs. {incomeStatement.grossProfitBs.toLocaleString('es-VE')}</td>
                    <td className="p-2.5 text-right text-emerald-900">${incomeStatement.grossProfitUSD.toLocaleString('en-US')}</td>
                    <td className="p-2.5 text-right text-emerald-900">
                      {incomeStatement.salesRevenueUSD > 0 ? ((incomeStatement.grossProfitUSD / incomeStatement.salesRevenueUSD) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  {/* Gastos de Operación */}
                  <tr className="font-bold bg-slate-50/50">
                    <td className="p-2.5 text-slate-900">GASTOS OPERACIONALES</td>
                    <td className="p-2.5 text-right"></td>
                    <td className="p-2.5 text-right"></td>
                    <td className="p-2.5 text-right"></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-700">Comisiones Pagadas a Vendedores (Nómina de Ventas)</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">Bs. {incomeStatement.commissionExpensesBs.toLocaleString('es-VE')}</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">${incomeStatement.commissionExpensesUSD.toLocaleString('en-US')}</td>
                    <td className="p-2.5 text-right text-slate-500">
                      {incomeStatement.salesRevenueUSD > 0 ? ((incomeStatement.commissionExpensesUSD / incomeStatement.salesRevenueUSD) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-700">Gastos Administrativos y de Servicios (Luz, Alquiler, etc.)</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">Bs. {incomeStatement.operatingExpensesBs.toLocaleString('es-VE')}</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">${incomeStatement.operatingExpensesUSD.toLocaleString('en-US')}</td>
                    <td className="p-2.5 text-right text-slate-500">
                      {incomeStatement.salesRevenueUSD > 0 ? ((incomeStatement.operatingExpensesUSD / incomeStatement.salesRevenueUSD) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="font-bold bg-amber-50/50 border-t border-b border-amber-200">
                    <td className="p-2.5 pl-4 text-amber-950">(=) TOTAL GASTOS OPERACIONALES</td>
                    <td className="p-2.5 text-right text-amber-900">Bs. {incomeStatement.totalExpensesBs.toLocaleString('es-VE')}</td>
                    <td className="p-2.5 text-right text-amber-900">${incomeStatement.totalExpensesUSD.toLocaleString('en-US')}</td>
                    <td className="p-2.5 text-right text-amber-900">
                      {incomeStatement.salesRevenueUSD > 0 ? ((incomeStatement.totalExpensesUSD / incomeStatement.salesRevenueUSD) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  {/* Utilidad Neta Final */}
                  <tr className={`font-black text-sm border-t-2 border-b-2 ${
                    incomeStatement.netIncomeUSD >= 0
                      ? 'bg-blue-100/70 border-blue-400 text-blue-950'
                      : 'bg-rose-100/70 border-rose-400 text-rose-950'
                  }`}>
                    <td className="p-3 pl-4">(=) UTILIDAD NETA DEL EJERCICIO (GANANCIA REAL)</td>
                    <td className="p-3 text-right">Bs. {incomeStatement.netIncomeBs.toLocaleString('es-VE')}</td>
                    <td className="p-3 text-right">${incomeStatement.netIncomeUSD.toLocaleString('en-US')} USD</td>
                    <td className="p-3 text-right">{incomeStatement.profitMarginPercentage}%</td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Note & Institutional Signature */}
            <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-4">
              <p className="italic">
                * Nota: El Costo de Mercancía Vendida (CMV) es calculado en tiempo real aplicando el método de costo promedio ponderado y último costo según la recepción de lotes de importación para garantizar la reposición continua del inventario.
              </p>

              <div className="grid grid-cols-2 gap-8 pt-8 text-center print:block">
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-900">{currentUser?.name || 'Administrador General'}</p>
                  <p className="text-[10px] text-slate-500">Firma del Contador / Auditor Responsable</p>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-900">Dirección Ejecutiva IUJO</p>
                  <p className="text-[10px] text-slate-500">Sello y Aprobación Institucional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BALANCE GENERAL */}
      {activeTab === 'balance' && (
        <div className="space-y-4">
          {/* Fundamental Equation Indicator */}
          <div className="p-4 rounded-xl border bg-white border-slate-300 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Ecuación Fundamental de la Contabilidad
                </h3>
                <p className="text-xs text-slate-500">
                  Activos = Pasivos + Patrimonio ({balanceSheet.isBalanced ? '✅ Cuadrada con éxito' : '⚠️ En proceso de ajuste'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                Activos: ${balanceSheet.totalAssetsUSD.toLocaleString('en-US')}
              </span>
              <span className="font-bold text-slate-400">=</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                Pasivos: ${balanceSheet.totalLiabilitiesUSD.toLocaleString('en-US')}
              </span>
              <span className="font-bold text-slate-400">+</span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
                Patrimonio: ${balanceSheet.totalEquityUSD.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Activos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-3">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                  <span>ACTIVOS</span>
                  <span className="text-emerald-700">${balanceSheet.totalAssetsUSD.toLocaleString('en-US')} USD</span>
                </h3>
                <p className="text-[10px] text-slate-500">Bienes y derechos propiedad de la empresa</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700 bg-slate-50 p-1.5 rounded">
                  Activo Circulante (Disponible y Realizable)
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900">Caja Chica en Efectivo (Bs. y Divisas)</p>
                    <p className="text-[10px] text-slate-400">Recaudación disponible en taquilla física</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${balanceSheet.cashUSD_raw.toLocaleString('en-US')}</p>
                    <p className="text-[10px] text-slate-500">Bs. {balanceSheet.cashBs.toLocaleString('es-VE')}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900">Cuentas Bancarias (Pago Móvil / Bancos / Zelle)</p>
                    <p className="text-[10px] text-slate-400">Saldos en cuentas corrientes corporativas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${balanceSheet.banksUSD_raw.toLocaleString('en-US')}</p>
                    <p className="text-[10px] text-slate-500">Bs. {balanceSheet.banksBs.toLocaleString('es-VE')}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900">Inventario de Mercancía en Almacén</p>
                    <p className="text-[10px] text-slate-400">Valoración total de teléfonos a costo de reposición</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${balanceSheet.inventoryCostUSD.toLocaleString('en-US')}</p>
                    <p className="text-[10px] text-slate-500">Bs. {balanceSheet.inventoryCostBs.toLocaleString('es-VE')}</p>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-slate-300 flex justify-between items-center font-black text-sm text-emerald-800">
                  <span>TOTAL ACTIVOS</span>
                  <span>${balanceSheet.totalAssetsUSD.toLocaleString('en-US')} USD</span>
                </div>
              </div>
            </div>

            {/* Pasivos y Patrimonio */}
            <div className="space-y-4">
              
              {/* Pasivos */}
              <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                    <span>PASIVOS</span>
                    <span className="text-amber-700">${balanceSheet.totalLiabilitiesUSD.toLocaleString('en-US')} USD</span>
                  </h3>
                  <p className="text-[10px] text-slate-500">Obligaciones y deudas contraídas</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-700 bg-slate-50 p-1.5 rounded">
                    Pasivo Circulante (Corto Plazo)
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Comisiones Pendientes a Vendedores</p>
                      <p className="text-[10px] text-slate-400">Nómina mensual acumulada con estatus pendiente</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${balanceSheet.commissionsPayableUSD.toLocaleString('en-US')}</p>
                      <p className="text-[10px] text-slate-500">Bs. {balanceSheet.commissionsPayableBs.toLocaleString('es-VE')}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Impuestos y Tributos por Pagar</p>
                      <p className="text-[10px] text-slate-400">IVA devengado e IGTF pendiente por enterar al SENIAT</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${balanceSheet.taxPayableUSD.toLocaleString('en-US')}</p>
                      <p className="text-[10px] text-slate-500">Bs. {balanceSheet.taxPayableBs.toLocaleString('es-VE')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center font-bold text-xs text-amber-800">
                    <span>TOTAL PASIVOS</span>
                    <span>${balanceSheet.totalLiabilitiesUSD.toLocaleString('en-US')} USD</span>
                  </div>
                </div>
              </div>

              {/* Patrimonio */}
              <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                    <span>PATRIMONIO (CAPITAL CONTABLE)</span>
                    <span className="text-blue-700">${balanceSheet.totalEquityUSD.toLocaleString('en-US')} USD</span>
                  </h3>
                  <p className="text-[10px] text-slate-500">Aportes y resultados de los accionistas</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Capital Social Suscrito y Pagado</p>
                      <p className="text-[10px] text-slate-400">Inversión inicial fundacional de socios</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${balanceSheet.shareCapitalUSD.toLocaleString('en-US')}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Utilidad Acumulada del Ejercicio</p>
                      <p className="text-[10px] text-slate-400">Ganancias netas generadas por la operación</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${balanceSheet.retainedEarningsUSD.toLocaleString('en-US')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center font-bold text-xs text-blue-800">
                    <span>TOTAL PATRIMONIO</span>
                    <span>${balanceSheet.totalEquityUSD.toLocaleString('en-US')} USD</span>
                  </div>

                  <div className="pt-3 border-t-2 border-slate-400 flex justify-between items-center font-black text-sm text-slate-950">
                    <span>TOTAL PASIVOS + PATRIMONIO</span>
                    <span>${(balanceSheet.totalLiabilitiesUSD + balanceSheet.totalEquityUSD).toLocaleString('en-US')} USD</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GASTOS OPERATIVOS (EGRESOS) */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-900">Registro de Gastos Operativos y Administrativos</h2>
              <p className="text-xs text-slate-500">Egresos periódicos (alquiler, luz, internet, fletes) que alimentan el Estado de Resultados.</p>
            </div>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs w-fit cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Gasto
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Referencia</th>
                    <th className="p-3 text-right">Monto Bs.</th>
                    <th className="p-3 text-right">Monto USD ($)</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No hay egresos registrados aún. Haz clic en "Registrar Gasto" para incorporar uno.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-600">{exp.date}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{exp.description}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">{exp.referenceNumber || 'S/R'}</td>
                        <td className="p-3 text-right font-black text-slate-900">Bs. {exp.amountBs.toLocaleString('es-VE')}</td>
                        <td className="p-3 text-right font-black text-rose-700">${exp.amountUSD.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar el gasto "${exp.description}"?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="text-rose-600 hover:text-rose-800 font-bold p-1 rounded hover:bg-rose-50 cursor-pointer"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CIERRE DIARIO DE CAJA (CORTE Z) */}
      {activeTab === 'cash_close' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-300 shadow-sm print:hidden">
            <div>
              <h2 className="text-sm font-black text-slate-900">Corte Z / Cierre Diario de Caja</h2>
              <p className="text-xs text-slate-500">Conciliación de ingresos por método de pago, desglose de impuestos y balance final en caja.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Fecha del Cierre:</span>
              <input
                type="date"
                value={selectedCloseDate}
                onChange={(e) => setSelectedCloseDate(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4 max-w-2xl mx-auto">
            {/* Header Ticket */}
            <div className="text-center border-b border-slate-200 pb-3 space-y-1">
              <h2 className="text-base font-black text-slate-900 uppercase">
                COMPROBANTE DE CIERRE DIARIO (CORTE Z FISCAL)
              </h2>
              <p className="text-xs font-bold text-slate-600">TechInventario C.A. • RIF J-40198273-0</p>
              <p className="text-[11px] text-slate-500">
                Fecha del Arqueo: <b className="text-slate-800">{selectedCloseDate}</b> | Generado: {new Date().toLocaleTimeString('es-VE')}
              </p>
            </div>

            {/* Total Operations */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500">Transacciones Totales del Día:</span>
                <p className="text-sm font-black text-slate-900">{dailyCashClose.totalSalesCount} ventas efectuadas</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Tasa Oficial BCV:</span>
                <p className="text-sm font-black text-blue-700">Bs. {exchangeRates.bcvUSD.toFixed(2)}</p>
              </div>
            </div>

            {/* Income Breakdown by Payment Method */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-800 border-b border-slate-200 pb-1 uppercase text-[11px]">
                Desglose de Ingresos por Medio de Pago
              </h4>

              <div className="space-y-1.5 divide-y divide-slate-100">
                <div className="flex justify-between items-center py-1 font-medium">
                  <span className="text-slate-700">💵 Efectivo Bolívares (En Gaveta):</span>
                  <span className="font-bold">Bs. {dailyCashClose.cashBsCollected.toLocaleString('es-VE')}</span>
                </div>

                <div className="flex justify-between items-center py-1 font-medium">
                  <span className="text-slate-700">💵 Efectivo Divisas USD (En Gaveta):</span>
                  <span className="font-bold text-emerald-700">${dailyCashClose.cashUSDCollected.toLocaleString('en-US')} USD</span>
                </div>

                <div className="flex justify-between items-center py-1 font-medium">
                  <span className="text-slate-700">📱 Pago Móvil Interbancario:</span>
                  <span className="font-bold">Bs. {dailyCashClose.pagoMovilCollected.toLocaleString('es-VE')}</span>
                </div>

                <div className="flex justify-between items-center py-1 font-medium">
                  <span className="text-slate-700">🏦 Transferencias Bancarias:</span>
                  <span className="font-bold">Bs. {dailyCashClose.transferenciasCollected.toLocaleString('es-VE')}</span>
                </div>

                <div className="flex justify-between items-center py-1 font-medium">
                  <span className="text-slate-700">🌐 Zelle (Divisas Electrónicas):</span>
                  <span className="font-bold text-indigo-700">${dailyCashClose.zelleCollected.toLocaleString('en-US')} USD</span>
                </div>
              </div>
            </div>

            {/* Fiscal Taxes Collected */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1 text-xs">
              <h4 className="font-black text-blue-950 uppercase text-[11px]">
                Recaudación de Impuestos del Día (SENIAT)
              </h4>
              <div className="flex justify-between text-blue-900">
                <span>IVA Débito Fiscal (16% Alícuota General):</span>
                <span className="font-bold">Bs. {dailyCashClose.ivaCollectedBs.toLocaleString('es-VE')}</span>
              </div>
              <div className="flex justify-between text-amber-900">
                <span>IGTF Percibido (3% Pagos en Efectivo Divisas):</span>
                <span className="font-bold">+Bs. {dailyCashClose.igtfCollectedBs.toLocaleString('es-VE')}</span>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-b-2 border-slate-300 py-3 space-y-1.5 font-black text-slate-900 text-xs">
              <div className="flex justify-between text-sm">
                <span>VENTAS TOTALES DEL DÍA (BS.):</span>
                <span className="text-blue-900">Bs. {dailyCashClose.totalCollectedBs.toLocaleString('es-VE')}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>TOTAL EQUIVALENTE EN DIVISAS:</span>
                <span>${dailyCashClose.totalCollectedUSD.toLocaleString('en-US')} USD</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-900">{currentUser?.name || 'Cajero de Turno'}</p>
                <p className="text-[10px] text-slate-500">Cajero / Operador Responsable</p>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-900">Supervisor / Administrador</p>
                <p className="text-[10px] text-slate-500">Auditoría y Arqueo Conforme</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RENTABILIDAD POR PRODUCTO */}
      {activeTab === 'profitability' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
            <h2 className="text-sm font-black text-slate-900">Informe de Rentabilidad y Margen Real por Teléfono</h2>
            <p className="text-xs text-slate-500">Contraste entre el costo de reposición invertido y los ingresos netos generados por modelo.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="p-3">Teléfono / Modelo</th>
                    <th className="p-3 text-center">Unidades Vendidas</th>
                    <th className="p-3 text-right">Costo Unitario USD</th>
                    <th className="p-3 text-right">Inversión CMV USD</th>
                    <th className="p-3 text-right">Ingreso Bruto USD</th>
                    <th className="p-3 text-right">Utilidad Neta USD</th>
                    <th className="p-3 text-center">Margen Real %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {productProfitability.map((item) => {
                    const isHigh = item.marginPct >= 30;
                    const isPositive = item.profitUSD > 0;

                    return (
                      <tr key={item.phone.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{item.phone.brand} {item.phone.model}</p>
                          <span className="text-[10px] text-slate-400">{item.phone.category}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{item.unitsSold}</td>
                        <td className="p-3 text-right text-slate-600">${item.costUnitUSD.toFixed(2)}</td>
                        <td className="p-3 text-right text-rose-700 font-semibold">${item.costTotalUSD.toFixed(2)}</td>
                        <td className="p-3 text-right font-black text-slate-900">${item.revenueUSD.toFixed(2)}</td>
                        <td className={`p-3 text-right font-black ${isPositive ? 'text-emerald-700' : 'text-slate-500'}`}>
                          ${item.profitUSD.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {item.unitsSold > 0 ? (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                              isHigh
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              +{item.marginPct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Sin ventas</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Gasto Operativo */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 border border-slate-300 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                💸 Registrar Gasto Operativo / Administrativo
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Categoría del Gasto</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold outline-none focus:border-blue-600"
                >
                  <option value="Alquiler">Alquiler de Local / Almacén</option>
                  <option value="Luz / Electricidad">Luz / Electricidad</option>
                  <option value="Agua">Agua Potable</option>
                  <option value="Internet y Comunicaciones">Internet y Comunicaciones</option>
                  <option value="Suministros de Oficina">Suministros de Oficina</option>
                  <option value="Mantenimiento">Mantenimiento de Infraestructura</option>
                  <option value="Transporte / Flete">Transporte y Flete de Mercancía</option>
                  <option value="Otros Gastos">Otros Gastos Administrativos</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Descripción Detallada <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago mensual de servicio eléctrico Corpoelec sede local"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Monto en USD ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={expenseAmountUSD}
                    onChange={(e) => setExpenseAmountUSD(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-black text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Equivalente en Bs.
                  </label>
                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-bold text-slate-800 text-center">
                    Bs. {(expenseAmountUSD * exchangeRates.bcvUSD).toLocaleString('es-VE')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Medio de Pago</label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-semibold outline-none focus:border-blue-600"
                  >
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Efectivo Bolívares">Efectivo Bolívares</option>
                    <option value="Efectivo Divisas (USD)">Efectivo Divisas (USD)</option>
                    <option value="Zelle">Zelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Nro. Referencia / Factura</label>
                  <input
                    type="text"
                    placeholder="Ej: REC-9021"
                    value={expenseReference}
                    onChange={(e) => setExpenseReference(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Fecha del Gasto</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-blue-600 font-semibold"
                />
              </div>

              {expenseError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold text-[11px]">
                  ⚠️ {expenseError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {isSubmittingExpense ? 'Guardando...' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default FinancialAccounting;
