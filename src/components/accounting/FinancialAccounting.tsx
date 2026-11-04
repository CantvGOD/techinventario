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
import type { ExpenseCategory, PaymentMethod } from '../../types';
import {
  DollarSign,
  TrendingUp,
  Printer,
  Plus,
  Trash2,
  Receipt,
  ShoppingBag,
  Award,
  ShieldAlert,
  Building2,
  Boxes
} from 'lucide-react';

export type ReportCategory = 'gerenciales' | 'operativos' | 'supervision' | 'gastos';
export type ReportType =
  // 3 Gerenciales
  | 'balance_general'
  | 'estado_resultados'
  | 'flujo_caja'
  // 3 Operativos
  | 'rotacion_inventario'
  | 'rentabilidad_modelo'
  | 'compras_lotes'
  // 3 Supervisión
  | 'cierre_caja'
  | 'metas_vendedores'
  | 'auditoria_control';

export const FinancialAccounting: React.FC = () => {
  const {
    activeRole,
    currentUser,
    sales,
    phones,
    expenses,
    purchases,
    users,
    payrolls,
    auditLogs,
    registerExpense,
    deleteExpense,
    exchangeRates,
    getIncomeStatement,
    getBalanceSheet,
    getDailyCashClose
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<ReportCategory>('gerenciales');
  const [activeReport, setActiveReport] = useState<ReportType>('balance_general');
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
      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
          🔒
        </div>
        <h2 className="text-lg font-black text-slate-900">Módulo Contable y Reportes Restringido</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          El acceso a los Estados Financieros, Balance General, Reportes Gerenciales y Cierres de Turno está reservado exclusivamente para la Dirección General y Administradores de TechInventario (IUJO).
        </p>
      </div>
    );
  }

  // Cálculos de reportes principales
  const incomeStatement = getIncomeStatement();
  const balanceSheet = getBalanceSheet();
  const dailyCashClose = getDailyCashClose(selectedCloseDate);

  // 1. Reporte Gerencial: Flujo de Caja y Liquidez Multimoneda
  const cashFlowInflowsBs = sales.reduce((acc, s) => acc + s.totalBs, 0);
  const cashFlowInflowsUSD = sales.reduce((acc, s) => acc + s.totalUSD, 0);
  const purchasesOutflowUSD = purchases.reduce((acc, p) => acc + p.totalCostUSD, 0);
  const purchasesOutflowBs = purchases.reduce((acc, p) => acc + (p.totalCostBs || p.totalCostUSD * exchangeRates.bcvUSD), 0);
  const expensesOutflowUSD = expenses.reduce((acc, e) => acc + e.amountUSD, 0);
  const expensesOutflowBs = expenses.reduce((acc, e) => acc + e.amountBs, 0);
  const paidCommissionsBs = payrolls.filter(p => p.status === 'Pagado').reduce((acc, p) => acc + p.finalPayoutBs, 0);
  const paidCommissionsUSD = payrolls.filter(p => p.status === 'Pagado').reduce((acc, p) => acc + p.finalPayoutUSD, 0);
  const totalOutflowsBs = purchasesOutflowBs + expensesOutflowBs + paidCommissionsBs;
  const totalOutflowsUSD = purchasesOutflowUSD + expensesOutflowUSD + paidCommissionsUSD;
  const netCashFlowBs = cashFlowInflowsBs - totalOutflowsBs;
  const netCashFlowUSD = cashFlowInflowsUSD - totalOutflowsUSD;
  const immediateCashBs = balanceSheet.cashBs + balanceSheet.banksBs;
  const immediateCashUSD = balanceSheet.cashUSD_raw + balanceSheet.banksUSD_raw;

  // 2. Reporte Operativo: Rotación de Inventario
  const inventoryTurnoverList = phones.map((phone) => {
    const phoneSales = sales.filter((s) => s.phoneId === phone.id);
    const unitsSold = phoneSales.reduce((acc, s) => acc + s.quantity, 0);
    const currentStock = phone.stock;
    const turnoverRatio = Number((unitsSold / Math.max(1, currentStock)).toFixed(2));
    const daysOfInventory = unitsSold > 0 ? Math.round((currentStock / unitsSold) * 30) : (currentStock > 0 ? 120 : 0);
    let status: 'alta' | 'moderada' | 'baja';
    if (turnoverRatio >= 0.7 || unitsSold >= 5) status = 'alta';
    else if (turnoverRatio >= 0.25 || unitsSold >= 2) status = 'moderada';
    else status = 'baja';
    const needsReorder = currentStock <= phone.minStock;

    return {
      phone,
      unitsSold,
      currentStock,
      turnoverRatio,
      daysOfInventory,
      status,
      needsReorder
    };
  }).sort((a, b) => b.unitsSold - a.unitsSold);

  // 3. Reporte Operativo: Rentabilidad por Producto
  const productProfitabilityList = phones.map((phone) => {
    const phoneSales = sales.filter((s) => s.phoneId === phone.id);
    const unitsSold = phoneSales.reduce((acc, s) => acc + s.quantity, 0);
    const priceBs = phone.priceBs;
    const priceUSD = Number((priceBs / exchangeRates.bcvUSD).toFixed(2));
    const costUSD = phone.costUSD || Number((phone.costBs / exchangeRates.bcvUSD).toFixed(2)) || 100;
    const costBs = Number((costUSD * exchangeRates.bcvUSD).toFixed(2));
    const unitProfitUSD = Number((priceUSD - costUSD).toFixed(2));
    const unitProfitBs = Number((priceBs - costBs).toFixed(2));
    const marginPct = costUSD > 0 ? Number((((priceUSD - costUSD) / costUSD) * 100).toFixed(1)) : 30;
    const totalProfitUSD = Number((unitProfitUSD * unitsSold).toFixed(2));

    return {
      phone,
      unitsSold,
      priceBs,
      priceUSD,
      costUSD,
      costBs,
      unitProfitUSD,
      unitProfitBs,
      marginPct,
      totalProfitUSD
    };
  }).sort((a, b) => b.marginPct - a.marginPct);

  // 4. Reporte Supervisión: Metas de Vendedores
  const vendorSupervisionList = users
    .filter((u) => u.role === 'vendedor')
    .map((vendor) => {
      const vendorSales = sales.filter((s) => s.vendorId === vendor.id);
      const totalSoldBs = vendorSales.reduce((acc, s) => acc + s.totalBs, 0);
      const totalSoldUSD = vendorSales.reduce((acc, s) => acc + s.totalUSD, 0);
      const unitsSold = vendorSales.reduce((acc, s) => acc + s.quantity, 0);
      const targetBs = vendor.monthlyTargetBs || 200000;
      const targetUSD = Number((targetBs / exchangeRates.bcvUSD).toFixed(2));
      const completionPct = Number(((totalSoldBs / targetBs) * 100).toFixed(1));
      const commissionBs = Number((totalSoldBs * 0.10).toFixed(2));
      const commissionUSD = Number((commissionBs / exchangeRates.bcvUSD).toFixed(2));
      const payroll = payrolls.find((p) => p.vendorId === vendor.id);

      return {
        vendor,
        targetBs,
        targetUSD,
        totalSoldBs,
        totalSoldUSD,
        unitsSold,
        completionPct,
        commissionBs,
        commissionUSD,
        payrollStatus: payroll?.status || 'Pendiente'
      };
    }).sort((a, b) => b.totalSoldBs - a.totalSoldBs);

  // 5. Reporte Supervisión: Auditoría de Control y Discrepancias
  const criticalAuditLogs = auditLogs.filter((log) => {
    const a = (log.action || '').toLowerCase();
    const d = (log.details || '').toLowerCase();
    return (
      a.includes('elimin') ||
      a.includes('salida') ||
      a.includes('modific') ||
      a.includes('aprob') ||
      a.includes('rechaz') ||
      a.includes('ajuste') ||
      d.includes('solicitud') ||
      log.severity === 'warning' ||
      log.severity === 'danger'
    );
  });

  // Datos para gráficas Recharts
  const incomeChartData = [
    { name: 'Ventas Netas', montoUSD: incomeStatement.salesRevenueUSD, fill: '#3b82f6' },
    { name: 'Costo (CMV)', montoUSD: incomeStatement.costOfGoodsSoldUSD, fill: '#ef4444' },
    { name: 'Gastos Operat.', montoUSD: incomeStatement.totalExpensesUSD, fill: '#f59e0b' },
    { name: 'Utilidad Neta', montoUSD: Math.max(0, incomeStatement.netIncomeUSD), fill: '#10b981' }
  ];

  const expensesChartData = Object.entries(
    expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amountUSD;
      return acc;
    }, {} as { [cat: string]: number })
  ).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  }));

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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

  const switchCategory = (cat: ReportCategory) => {
    setActiveCategory(cat);
    if (cat === 'gerenciales') setActiveReport('balance_general');
    else if (cat === 'operativos') setActiveReport('rotacion_inventario');
    else if (cat === 'supervision') setActiveReport('cierre_caja');
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Header with Title and Print Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-blue-600" />
            Centro de Reportes y Módulo Contable (IUJO)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistema integral de reportería contable, operativa y de supervisión con soporte multimoneda y cálculo de impuestos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeCategory === 'gastos' && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Gasto</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* Primary Category Selector Tabs (3 Categorías + Gastos) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-1.5 print:hidden">
        <button
          onClick={() => switchCategory('gerenciales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeCategory === 'gerenciales'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>👔 Reportes Gerenciales (3)</span>
        </button>

        <button
          onClick={() => switchCategory('operativos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeCategory === 'operativos'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>⚙️ Reportes Operativos (3)</span>
        </button>

        <button
          onClick={() => switchCategory('supervision')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeCategory === 'supervision'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>🛡️ Reportes de Supervisión (3)</span>
        </button>

        <button
          onClick={() => {
            setActiveCategory('gastos');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeCategory === 'gastos'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>🧾 Gastos Operativos ({expenses.length})</span>
        </button>
      </div>

      {/* Sub-selector for Specific Reports */}
      {activeCategory !== 'gastos' && (
        <div className="flex flex-wrap gap-2 items-center print:hidden bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Seleccionar Reporte:</span>
          
          {activeCategory === 'gerenciales' && (
            <>
              <button
                onClick={() => setActiveReport('balance_general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'balance_general' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                1. Balance General (Situación Financiera)
              </button>
              <button
                onClick={() => setActiveReport('estado_resultados')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'estado_resultados' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                2. Estado de Resultados Integral
              </button>
              <button
                onClick={() => setActiveReport('flujo_caja')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'flujo_caja' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                3. Flujo de Caja y Posición de Liquidez
              </button>
            </>
          )}

          {activeCategory === 'operativos' && (
            <>
              <button
                onClick={() => setActiveReport('rotacion_inventario')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'rotacion_inventario' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                1. Rotación y Eficiencia de Inventario
              </button>
              <button
                onClick={() => setActiveReport('rentabilidad_modelo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'rentabilidad_modelo' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                2. Rentabilidad por Modelo / Margen Unitario
              </button>
              <button
                onClick={() => setActiveReport('compras_lotes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'compras_lotes' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                3. Compras y Reposición de Lotes (Mayoristas)
              </button>
            </>
          )}

          {activeCategory === 'supervision' && (
            <>
              <button
                onClick={() => setActiveReport('cierre_caja')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'cierre_caja' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                1. Cierre Diario y Arqueo de Turno (Corte Z)
              </button>
              <button
                onClick={() => setActiveReport('metas_vendedores')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'metas_vendedores' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                2. Supervisión de Metas y Comisiones
              </button>
              <button
                onClick={() => setActiveReport('auditoria_control')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReport === 'auditoria_control' ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                3. Auditoría de Control y Discrepancias
              </button>
            </>
          )}
        </div>
      )}

      {/* Institutional Document Header (Visible always, optimized for print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
        <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Instituto Universitario Jesús Obrero (IUJO) • Cátedra de Contabilidad
        </h2>
        <h1 className="text-lg font-black text-slate-950">
          TechInventario C.A. — Sistema Integrado de Gestión Financiera y Telecom
        </h1>
        <p className="text-[11px] text-slate-600">
          RIF: J-40198273-0 • Barquisimeto, Estado Lara • Período Fiscal 2026 • Tasa Oficial BCV: Bs. {exchangeRates.bcvUSD.toFixed(2)}/USD
        </p>
      </div>

      {/* ============================================================== */}
      {/* 👔 1. REPORTES GERENCIALES */}
      {/* ============================================================== */}

      {/* GERENCIAL 1: BALANCE GENERAL */}
      {activeCategory === 'gerenciales' && activeReport === 'balance_general' && (
        <div className="space-y-4">
          {/* Quick Balance Equation Alert */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verificación de Ecuación Contable Fundamental</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black text-slate-900">
                  Activo (${balanceSheet.totalAssetsUSD.toLocaleString('en-US')}) = Pasivo (${balanceSheet.totalLiabilitiesUSD.toLocaleString('en-US')}) + Patrimonio (${balanceSheet.totalEquityUSD.toLocaleString('en-US')})
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Balance Cuadrado
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-bold">
              <div>
                <span className="text-slate-400 block text-[10px]">Ratio Solvencia:</span>
                <span className="text-blue-700 text-sm">
                  {balanceSheet.totalLiabilitiesUSD > 0 ? (balanceSheet.totalAssetsUSD / balanceSheet.totalLiabilitiesUSD).toFixed(2) : 'Excelente (Sin Deuda)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tasa de Cambio:</span>
                <span className="text-slate-700 text-sm">Bs. {exchangeRates.bcvUSD.toFixed(2)}/USD</span>
              </div>
            </div>
          </div>

          {/* Balance Sheet Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">ACTIVO CIRCULANTE</h3>
                  <p className="text-[10px] text-slate-400">Recursos y derechos líquidos disponibles</p>
                </div>
                <span className="text-base font-black text-emerald-700">
                  ${balanceSheet.totalAssetsUSD.toLocaleString('en-US')} USD
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900">Caja Chica y Efectivo en Bolívares</p>
                    <p className="text-[10px] text-slate-400">Efectivo recaudado en mostrador</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">Bs. {balanceSheet.cashBs.toLocaleString('es-VE')}</p>
                    <p className="text-[10px] text-slate-500">${(balanceSheet.cashBs / exchangeRates.bcvUSD).toFixed(2)} USD</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900">Caja Divisas en Efectivo (USD)</p>
                    <p className="text-[10px] text-slate-400">Dólares físicos en custodia de caja</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">${balanceSheet.cashUSD_raw.toLocaleString('en-US')} USD</p>
                    <p className="text-[10px] text-slate-500">Bs. {balanceSheet.cashUSD_convertedBs.toLocaleString('es-VE')}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900">Bancos e Instrumentos Digitales</p>
                    <p className="text-[10px] text-slate-400">Pago Móvil, Transferencias y Zelle</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${(balanceSheet.banksUSD_raw + balanceSheet.banksBs / exchangeRates.bcvUSD).toFixed(2)} USD</p>
                    <p className="text-[10px] text-slate-500">Bs. {(balanceSheet.banksBs + balanceSheet.banksUSD_convertedBs).toLocaleString('es-VE')}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900">Inventario de Mercancía (Almacén)</p>
                    <p className="text-[10px] text-slate-400">Valuado a costo de reposición unitario</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700">${balanceSheet.inventoryCostUSD.toLocaleString('en-US')} USD</p>
                    <p className="text-[10px] text-slate-500">Bs. {balanceSheet.inventoryCostBs.toLocaleString('es-VE')}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300 flex justify-between items-center font-black text-xs text-emerald-800">
                  <span>TOTAL ACTIVOS</span>
                  <span>Bs. {balanceSheet.totalAssetsBs.toLocaleString('es-VE')}</span>
                </div>
              </div>
            </div>

            {/* Pasivos y Patrimonio */}
            <div className="space-y-4">
              {/* Pasivos */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">PASIVO CIRCULANTE</h3>
                    <p className="text-[10px] text-slate-400">Obligaciones a corto plazo</p>
                  </div>
                  <span className="text-base font-black text-rose-700">
                    ${balanceSheet.totalLiabilitiesUSD.toLocaleString('en-US')} USD
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Comisiones por Pagar a Vendedores</p>
                      <p className="text-[10px] text-slate-400">10% devengado por ventas del personal</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${balanceSheet.commissionsPayableUSD.toLocaleString('en-US')} USD</p>
                      <p className="text-[10px] text-slate-500">Bs. {balanceSheet.commissionsPayableBs.toLocaleString('es-VE')}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Tributos Fiscales por Enterar (SENIAT)</p>
                      <p className="text-[10px] text-slate-400">IVA devengado (16%) e IGTF divisas (3%)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${balanceSheet.taxPayableUSD.toLocaleString('en-US')} USD</p>
                      <p className="text-[10px] text-slate-500">Bs. {balanceSheet.taxPayableBs.toLocaleString('es-VE')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-xs text-rose-800">
                    <span>TOTAL PASIVOS</span>
                    <span>Bs. {balanceSheet.totalLiabilitiesBs.toLocaleString('es-VE')}</span>
                  </div>
                </div>
              </div>

              {/* Patrimonio */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">PATRIMONIO (CAPITAL CONTABLE)</h3>
                    <p className="text-[10px] text-slate-400">Aportes y resultados acumulados</p>
                  </div>
                  <span className="text-base font-black text-blue-700">
                    ${balanceSheet.totalEquityUSD.toLocaleString('en-US')} USD
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Capital Social Suscrito y Pagado</p>
                      <p className="text-[10px] text-slate-400">Aporte inicial de accionistas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${balanceSheet.shareCapitalUSD.toLocaleString('en-US')} USD</p>
                      <p className="text-[10px] text-slate-500">Bs. {balanceSheet.shareCapitalBs.toLocaleString('es-VE')}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Utilidad Acumulada del Ejercicio</p>
                      <p className="text-[10px] text-slate-400">Superávit generado en operaciones</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-700">${balanceSheet.retainedEarningsUSD.toLocaleString('en-US')} USD</p>
                      <p className="text-[10px] text-slate-500">Bs. {balanceSheet.retainedEarningsBs.toLocaleString('es-VE')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center font-black text-xs text-slate-900">
                    <span>TOTAL PASIVOS + PATRIMONIO</span>
                    <span>${(balanceSheet.totalLiabilitiesUSD + balanceSheet.totalEquityUSD).toLocaleString('en-US')} USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GERENCIAL 2: ESTADO DE RESULTADOS */}
      {activeCategory === 'gerenciales' && activeReport === 'estado_resultados' && (
        <div className="space-y-4">
          {/* Quick Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 print:hidden">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Ventas Netas</span>
              <p className="text-lg font-black text-slate-900 mt-1">
                ${incomeStatement.salesRevenueUSD.toLocaleString('en-US')} USD
              </p>
              <p className="text-[10px] text-slate-500">Bs. {incomeStatement.salesRevenueBs.toLocaleString('es-VE')}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Costo Ventas (CMV)</span>
              <p className="text-lg font-black text-rose-700 mt-1">
                -${incomeStatement.costOfGoodsSoldUSD.toLocaleString('en-US')} USD
              </p>
              <p className="text-[10px] text-slate-500">Reposición de inventario</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Utilidad Bruta</span>
              <p className="text-lg font-black text-emerald-700 mt-1">
                ${incomeStatement.grossProfitUSD.toLocaleString('en-US')} USD
              </p>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                Margen Bruto: {incomeStatement.salesRevenueUSD > 0 ? ((incomeStatement.grossProfitUSD / incomeStatement.salesRevenueUSD) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Utilidad Neta Real</span>
              <p className={`text-lg font-black mt-1 ${incomeStatement.netIncomeUSD >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                ${incomeStatement.netIncomeUSD.toLocaleString('en-US')} USD
              </p>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${incomeStatement.netIncomeUSD >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                Margen Neto: {incomeStatement.profitMarginPercentage}%
              </span>
            </div>
          </div>

          {/* Gráfica Comparativa Estado de Resultados */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs print:hidden space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span>📊 Comparativa Visual: Ingresos vs Costos vs Gastos y Utilidad Neta</span>
              <span className="text-[10px] text-slate-500 font-semibold">Cifras en USD ($)</span>
            </h3>
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString('en-US')} USD`, 'Monto']} />
                  <Bar dataKey="montoUSD" radius={[6, 6, 0, 0]}>
                    {incomeChartData.map((entry, index) => (
                      <Cell key={`cell-inc-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Formal Income Statement Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  ESTADO DE RESULTADOS (ESTADO DE GANANCIAS Y PÉRDIDAS)
                </h2>
                <p className="text-xs text-slate-500">
                  Al {new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })} — Expresado en Bolívares (Bs.) y Dólares (USD)
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 font-bold border-b border-slate-200">
                <span>INGRESOS OPERACIONALES (Ventas Netas)</span>
                <div className="text-right">
                  <span className="text-slate-900 mr-4">Bs. {incomeStatement.salesRevenueBs.toLocaleString('es-VE')}</span>
                  <span className="text-blue-700">${incomeStatement.salesRevenueUSD.toLocaleString('en-US')} USD</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1.5 text-rose-700 font-semibold border-b border-slate-100">
                <span>MENOS: Costo de Mercancía Vendida (Reposición CMV)</span>
                <div className="text-right">
                  <span className="mr-4">-Bs. {incomeStatement.costOfGoodsSoldBs.toLocaleString('es-VE')}</span>
                  <span>-${incomeStatement.costOfGoodsSoldUSD.toLocaleString('en-US')} USD</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 bg-emerald-50 px-3 rounded-lg font-black text-emerald-900">
                <span>(=) UTILIDAD BRUTA EN VENTAS</span>
                <div className="text-right">
                  <span className="mr-4">Bs. {incomeStatement.grossProfitBs.toLocaleString('es-VE')}</span>
                  <span>${incomeStatement.grossProfitUSD.toLocaleString('en-US')} USD</span>
                </div>
              </div>

              <div className="pt-2 font-bold text-slate-500 uppercase text-[11px]">Gastos de Operación y Administración:</div>

              {expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center py-1 pl-3 border-b border-slate-100 text-slate-600">
                  <span>• {exp.category} — {exp.description}</span>
                  <div className="text-right">
                    <span className="mr-4">Bs. {exp.amountBs.toLocaleString('es-VE')}</span>
                    <span className="font-medium">${exp.amountUSD.toFixed(2)} USD</span>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center py-1 pl-3 border-b border-slate-100 text-slate-600">
                <span>• Comisiones por Ventas Devengadas al Personal (10%)</span>
                <div className="text-right">
                  <span className="mr-4">Bs. {incomeStatement.commissionExpensesBs.toLocaleString('es-VE')}</span>
                  <span className="font-medium">${incomeStatement.commissionExpensesUSD.toLocaleString('en-US')} USD</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1.5 font-bold text-rose-800 border-b border-slate-200">
                <span>TOTAL GASTOS DE OPERACIÓN</span>
                <div className="text-right">
                  <span className="mr-4">-Bs. {incomeStatement.totalExpensesBs.toLocaleString('es-VE')}</span>
                  <span>-${incomeStatement.totalExpensesUSD.toLocaleString('en-US')} USD</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 bg-blue-50 px-3 rounded-xl font-black text-sm text-blue-950">
                <span>(=) UTILIDAD NETA DEL EJERCICIO</span>
                <div className="text-right">
                  <span className="mr-4">Bs. {incomeStatement.netIncomeBs.toLocaleString('es-VE')}</span>
                  <span className="text-emerald-700">${incomeStatement.netIncomeUSD.toLocaleString('en-US')} USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GERENCIAL 3: FLUJO DE CAJA Y LIQUIDEZ */}
      {activeCategory === 'gerenciales' && activeReport === 'flujo_caja' && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Cobros Efectivos (Entradas)</span>
              <p className="text-xl font-black text-emerald-700 mt-1">${cashFlowInflowsUSD.toLocaleString('en-US')} USD</p>
              <p className="text-[10px] text-slate-500">Bs. {cashFlowInflowsBs.toLocaleString('es-VE')}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Desembolsos Totales (Salidas)</span>
              <p className="text-xl font-black text-rose-700 mt-1">-${totalOutflowsUSD.toLocaleString('en-US')} USD</p>
              <p className="text-[10px] text-slate-500">Compras lotes + gastos + comisiones</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Flujo Neto del Período</span>
              <p className={`text-xl font-black mt-1 ${netCashFlowUSD >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {netCashFlowUSD >= 0 ? '+' : ''}${netCashFlowUSD.toLocaleString('en-US')} USD
              </p>
              <p className="text-[10px] text-slate-500">Bs. {netCashFlowBs.toLocaleString('es-VE')}</p>
            </div>
          </div>

          {/* Cash Flow Details Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  ESTADO DE FLUJO DE EFECTIVO Y POSICIÓN DE LIQUIDEZ MULTIMONEDA
                </h2>
                <p className="text-xs text-slate-500">Movimientos de entradas y salidas de tesorería en Caja y Cuentas Bancarias.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Disponibilidad Inmediata: ${immediateCashUSD.toFixed(2)} USD
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-1.5">
                <span className="font-black text-emerald-950 uppercase text-[11px]">1. Entradas Operacionales de Efectivo (+)</span>
                <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                  <span>Recaudación por Ventas en Tienda y Canales Digitales</span>
                  <span className="font-bold text-emerald-900">${cashFlowInflowsUSD.toLocaleString('en-US')} USD / Bs. {cashFlowInflowsBs.toLocaleString('es-VE')}</span>
                </div>
              </div>

              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 space-y-1.5">
                <span className="font-black text-rose-950 uppercase text-[11px]">2. Salidas Operacionales de Efectivo (-)</span>
                <div className="flex justify-between items-center py-1 border-b border-rose-100">
                  <span>Pagos a Proveedores Mayoristas por Lotes de Teléfonos</span>
                  <span className="font-bold text-rose-900">-${purchasesOutflowUSD.toLocaleString('en-US')} USD</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-rose-100">
                  <span>Gastos Operativos Pagados (Servicios, Alquiler, Papelería)</span>
                  <span className="font-bold text-rose-900">-${expensesOutflowUSD.toLocaleString('en-US')} USD</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Liquidaciones y Comisiones Pagadas a Vendedores</span>
                  <span className="font-bold text-rose-900">-${paidCommissionsUSD.toLocaleString('en-US')} USD</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-900 uppercase text-[11px]">3. Posición de Liquidez en Tesorería</span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">DISPONIBLE EN BOLÍVARES</span>
                    <span className="text-sm font-black text-slate-900">Bs. {immediateCashBs.toLocaleString('es-VE')}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">DISPONIBLE EN DÓLARES USD</span>
                    <span className="text-sm font-black text-emerald-700">${immediateCashUSD.toLocaleString('en-US')} USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ⚙️ 2. REPORTES OPERATIVOS */}
      {/* ============================================================== */}

      {/* OPERATIVO 1: ROTACIÓN DE INVENTARIO */}
      {activeCategory === 'operativos' && activeReport === 'rotacion_inventario' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                Reporte de Rotación y Eficiencia de Inventario
              </h2>
              <p className="text-xs text-slate-500">
                Índice de rotación, días de inventario en almacén y alertas de obsolescencia por modelo.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Total Equipos: {phones.reduce((a, b) => a + b.stock, 0)} unids
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3">Equipo / Marca</th>
                    <th className="p-3">Gama</th>
                    <th className="p-3 text-center">Stock Actual</th>
                    <th className="p-3 text-center">Unids Vendidas</th>
                    <th className="p-3 text-center">Índice Rotación</th>
                    <th className="p-3 text-center">Días de Stock</th>
                    <th className="p-3 text-center">Semáforo Operativo</th>
                    <th className="p-3 text-center">Reorden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {inventoryTurnoverList.map(({ phone, unitsSold, currentStock, turnoverRatio, daysOfInventory, status, needsReorder }) => (
                    <tr key={phone.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{phone.brand} {phone.model}</span>
                        <span className="text-[10px] text-slate-400">{phone.specs.ram} / {phone.specs.storage}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{phone.category}</td>
                      <td className="p-3 text-center font-bold">{currentStock} unids</td>
                      <td className="p-3 text-center font-bold text-blue-700">{unitsSold} unids</td>
                      <td className="p-3 text-center font-mono font-bold">{turnoverRatio}x</td>
                      <td className="p-3 text-center font-bold text-slate-700">{daysOfInventory} días</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          status === 'alta'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : status === 'moderada'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {status === 'alta' ? '🟢 Alta Rotación' : status === 'moderada' ? '🟡 Equilibrada' : '🔴 Lenta / Riesgo'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {needsReorder ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                            ⚠️ Pedir Lote
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OPERATIVO 2: RENTABILIDAD POR PRODUCTO */}
      {activeCategory === 'operativos' && activeReport === 'rentabilidad_modelo' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Reporte de Rentabilidad por Modelo / Margen Unitario
              </h2>
              <p className="text-xs text-slate-500">
                Comparativa de precio de venta vs costo de reposición unitario y margen de contribución.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
              Regla de Negocio: Margen Positivo
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3">Modelo</th>
                    <th className="p-3">Gama</th>
                    <th className="p-3 text-right">Costo Reposición</th>
                    <th className="p-3 text-right">Precio Venta</th>
                    <th className="p-3 text-right">Ganancia Unitaria</th>
                    <th className="p-3 text-center">Margen %</th>
                    <th className="p-3 text-center">Unids Vendidas</th>
                    <th className="p-3 text-right">Ganancia Acumulada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {productProfitabilityList.map(({ phone, unitsSold, priceBs, priceUSD, costUSD, costBs, unitProfitUSD, marginPct, totalProfitUSD }) => (
                    <tr key={phone.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{phone.brand} {phone.model}</span>
                        <span className="text-[10px] text-slate-400">{phone.specs.color}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{phone.category}</td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-slate-800 block">${costUSD.toFixed(2)} USD</span>
                        <span className="text-[10px] text-slate-400">Bs. {costBs.toLocaleString('es-VE')}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-blue-700 block">${priceUSD.toFixed(2)} USD</span>
                        <span className="text-[10px] text-slate-400">Bs. {priceBs.toLocaleString('es-VE')}</span>
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">
                        +${unitProfitUSD.toFixed(2)} USD
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          marginPct >= 35
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : marginPct >= 25
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          +{marginPct}%
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">{unitsSold} unids</td>
                      <td className="p-3 text-right font-black text-slate-900">
                        ${totalProfitUSD.toLocaleString('en-US')} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OPERATIVO 3: COMPRAS Y REPOSICIÓN DE LOTES */}
      {activeCategory === 'operativos' && activeReport === 'compras_lotes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Reporte de Compras y Reposición de Lotes por Proveedor
              </h2>
              <p className="text-xs text-slate-500">
                Historial de recepción de lotes de importación, métodos de costeo y variación de costos.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              {purchases.length} Lotes Registrados
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3">Código / Fecha</th>
                    <th className="p-3">Proveedor Mayorista</th>
                    <th className="p-3">Factura</th>
                    <th className="p-3">Teléfono / Lote</th>
                    <th className="p-3 text-center">Cantidad</th>
                    <th className="p-3 text-right">Costo Unitario USD</th>
                    <th className="p-3 text-right">Total Compra USD</th>
                    <th className="p-3 text-center">Método Costeo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-blue-700 block">{pur.code}</span>
                        <span className="text-[10px] text-slate-400">{pur.date.split('T')[0]}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{pur.supplier}</td>
                      <td className="p-3 font-mono text-slate-600">{pur.invoiceNumber}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{pur.brand} {pur.phoneName}</span>
                      </td>
                      <td className="p-3 text-center font-black">{pur.quantity} unids</td>
                      <td className="p-3 text-right font-bold text-slate-900">${pur.unitCostUSD.toFixed(2)} USD</td>
                      <td className="p-3 text-right font-black text-emerald-700">${pur.totalCostUSD.toFixed(2)} USD</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {pur.costMethodApplied === 'promedio_ponderado' ? 'Promedio Ponderado' : 'Último Costo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🛡️ 3. REPORTES DE SUPERVISIÓN */}
      {/* ============================================================== */}

      {/* SUPERVISIÓN 1: CIERRE DIARIO CORTE Z */}
      {activeCategory === 'supervision' && activeReport === 'cierre_caja' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Cierre Diario de Caja y Arqueo de Turno (Corte Z)
              </h2>
              <p className="text-xs text-slate-500">
                Auditoría fiscal de cobros, discriminación por método de pago e impuestos SENIAT (IVA 16% / IGTF 3%).
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <span className="text-xs font-bold text-slate-500">Fecha del Cierre:</span>
              <input
                type="date"
                value={selectedCloseDate}
                onChange={(e) => setSelectedCloseDate(e.target.value)}
                className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Arqueo Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Efectivo Bolívares (Gaveta)</span>
              <p className="text-base font-black text-slate-900 mt-1">Bs. {dailyCashClose.cashBsCollected.toLocaleString('es-VE')}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Efectivo Divisas ($ USD)</span>
              <p className="text-base font-black text-emerald-700 mt-1">${dailyCashClose.cashUSDCollected.toFixed(2)} USD</p>
              <p className="text-[10px] text-slate-400">Sujeto a IGTF 3%</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Canales Digitales (Banco)</span>
              <p className="text-base font-black text-blue-700 mt-1">
                Bs. {(dailyCashClose.pagoMovilCollected + dailyCashClose.transferenciasCollected).toLocaleString('es-VE')}
              </p>
              <p className="text-[10px] text-slate-400">Pago Móvil + Transferencias</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Impuestos SENIAT del Turno</span>
              <p className="text-base font-black text-rose-700 mt-1">
                Bs. {(dailyCashClose.ivaCollectedBs + dailyCashClose.igtfCollectedBs).toLocaleString('es-VE')}
              </p>
              <p className="text-[10px] text-slate-400">IVA 16% + IGTF 3%</p>
            </div>
          </div>

          {/* Arqueo Formal Sheet */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  ACTA DE ARQUEO Y CUADRE FISCAL DE CAJA — JORNADA {selectedCloseDate}
                </h3>
                <p className="text-[11px] text-slate-500">Transacciones cerradas: {dailyCashClose.totalSalesCount} operaciones facturadas</p>
              </div>
              <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Total Recaudado: ${dailyCashClose.totalCollectedUSD.toFixed(2)} USD
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                <span>(+) Cobros en Efectivo Bolívares</span>
                <span className="font-bold">Bs. {dailyCashClose.cashBsCollected.toLocaleString('es-VE')}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                <span>(+) Cobros en Efectivo Dólares (USD)</span>
                <span className="font-bold text-emerald-700">${dailyCashClose.cashUSDCollected.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                <span>(+) Cobros Electrónicos vía Pago Móvil</span>
                <span className="font-bold">Bs. {dailyCashClose.pagoMovilCollected.toLocaleString('es-VE')}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                <span>(+) Transferencias Bancarias Verificadas</span>
                <span className="font-bold">Bs. {dailyCashClose.transferenciasCollected.toLocaleString('es-VE')}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                <span>(+) Pagos Digitales Zelle (USD)</span>
                <span className="font-bold text-blue-700">${dailyCashClose.zelleCollected.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold text-rose-700">
                <span>(-) Egresos Menores Pagados por Caja en la Jornada</span>
                <span className="font-bold">-Bs. {dailyCashClose.cashExpensesBs.toLocaleString('es-VE')}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-emerald-50 px-3 rounded-xl font-black text-sm text-emerald-950">
                <span>(=) SALDO NETO FÍSICO EN GAVETA PARA ENTREGA</span>
                <div className="text-right">
                  <span className="mr-4">Bs. {dailyCashClose.netCashInDrawerBs.toLocaleString('es-VE')}</span>
                  <span className="text-emerald-700">+${dailyCashClose.netCashInDrawerUSD.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Firmas de Cuadre */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-300 pt-2 space-y-0.5">
                <p className="font-bold text-slate-800">{currentUser?.name || 'Cajero / Operativo'}</p>
                <p className="text-[10px] text-slate-400">Firma del Cajero Responsable</p>
              </div>
              <div className="border-t border-slate-300 pt-2 space-y-0.5">
                <p className="font-bold text-slate-800">Administrador / Gerente de Guardia</p>
                <p className="text-[10px] text-slate-400">Firma de Supervisión y Recepción</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPERVISIÓN 2: METAS Y RENDIMIENTO DE VENDEDORES */}
      {activeCategory === 'supervision' && activeReport === 'metas_vendedores' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                Supervisión de Cumplimiento de Metas y Comisiones
              </h2>
              <p className="text-xs text-slate-500">
                Control de cuotas mensuales de venta, liquidación del 10% de comisión y ranking de desempeño.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Comisión Estándar: 10%
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3">Vendedor</th>
                    <th className="p-3">Cédula / Contacto</th>
                    <th className="p-3 text-right">Meta Mensual</th>
                    <th className="p-3 text-right">Venta Facturada</th>
                    <th className="p-3 text-center">Unids</th>
                    <th className="p-3 text-center">% Cumplimiento</th>
                    <th className="p-3 text-right">Comisión (10%)</th>
                    <th className="p-3 text-center">Estado Nómina</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {vendorSupervisionList.map(({ vendor, targetBs, targetUSD, totalSoldBs, totalSoldUSD, unitsSold, completionPct, commissionBs, commissionUSD, payrollStatus }) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{vendor.name}</td>
                      <td className="p-3">
                        <span className="font-semibold block">{vendor.ci || 'V-00.000.000'}</span>
                        <span className="text-[10px] text-slate-400">{vendor.email}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-slate-700 block">${targetUSD.toFixed(2)} USD</span>
                        <span className="text-[10px] text-slate-400">Bs. {targetBs.toLocaleString('es-VE')}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-blue-700 block">${totalSoldUSD.toFixed(2)} USD</span>
                        <span className="text-[10px] text-slate-400">Bs. {totalSoldBs.toLocaleString('es-VE')}</span>
                      </td>
                      <td className="p-3 text-center font-black">{unitsSold} unids</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          completionPct >= 100
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : completionPct >= 70
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {completionPct}% {completionPct >= 100 ? '⭐ Superada' : ''}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">
                        +${commissionUSD.toFixed(2)} USD
                        <span className="text-[10px] text-slate-400 block font-normal">Bs. {commissionBs.toLocaleString('es-VE')}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          payrollStatus === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {payrollStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUPERVISIÓN 3: AUDITORÍA DE CONTROL Y DISCREPANCIAS */}
      {activeCategory === 'supervision' && activeReport === 'auditoria_control' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Auditoría de Control y Discrepancias / Aprobaciones
              </h2>
              <p className="text-xs text-slate-500">
                Supervisión estricta de cambios de precios, mermas de stock, eliminación de equipos y prevención de fraude.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              {criticalAuditLogs.length} Eventos Críticos Registrados
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Usuario y Rol</th>
                    <th className="p-3">Acción Crítica</th>
                    <th className="p-3">Detalles / Justificación Operativa</th>
                    <th className="p-3 text-center">Nivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {criticalAuditLogs.slice(0, 30).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp.replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{log.user}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{log.role}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{log.action}</td>
                      <td className="p-3 text-slate-600 text-[11px] leading-relaxed max-w-md">{log.details}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.severity === 'danger'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : log.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {log.severity?.toUpperCase() || 'INFO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🧾 4. GESTIÓN DE GASTOS OPERATIVOS */}
      {/* ============================================================== */}
      {activeCategory === 'gastos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-black text-slate-900">Registro y Control de Gastos Operativos</h2>
              <p className="text-xs text-slate-500">Egresos periódicos (alquiler, luz, agua, internet, fletes) que alimentan el Estado de Resultados.</p>
            </div>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs w-fit cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Gasto
            </button>
          </div>

          {/* Gráfica de Gastos por Categoría */}
          {expenses.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 print:hidden">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                <span>🍩 Distribución de Gastos Operativos por Categoría</span>
                <span className="text-[10px] text-slate-500 font-semibold">Total Egresos: ${expenses.reduce((a, b) => a + b.amountUSD, 0).toFixed(2)} USD</span>
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={3}
                      label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {expensesChartData.map((_, index) => (
                        <Cell key={`cell-exp-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`$${Number(val).toFixed(2)} USD`, 'Gasto']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Referencia</th>
                    <th className="p-3 text-right">Monto Bs.</th>
                    <th className="p-3 text-right">Monto USD ($)</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No hay egresos registrados aún. Haz clic en "Registrar Gasto" para incorporar uno.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono text-slate-500">{exp.date}</td>
                        <td className="p-3 font-bold text-slate-800">{exp.category}</td>
                        <td className="p-3 text-slate-600">{exp.description}</td>
                        <td className="p-3 font-mono text-slate-500">{exp.referenceNumber || 'N/A'}</td>
                        <td className="p-3 text-right font-bold text-slate-900">Bs. {exp.amountBs.toLocaleString('es-VE')}</td>
                        <td className="p-3 text-right font-black text-rose-700">${exp.amountUSD.toFixed(2)} USD</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de anular el gasto "${exp.description}"?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal Registrar Gasto Operativo */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">🧾 Registrar Nuevo Gasto Operativo</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Categoría del Gasto:</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Alquiler">Alquiler / Arrendamiento</option>
                    <option value="Luz / Electricidad">Luz / Electricidad (Corpoelec)</option>
                    <option value="Agua">Agua potable y cisterna</option>
                    <option value="Internet y Comunicaciones">Internet y Telecomunicaciones</option>
                    <option value="Suministros de Oficina">Suministros y Papelería</option>
                    <option value="Mantenimiento">Mantenimiento y Reparaciones</option>
                    <option value="Transporte / Flete">Transporte y Flete de Mercancía</option>
                    <option value="Otros Gastos">Otros Gastos Varios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Fecha del Gasto:</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Descripción detallada:</label>
                <input
                  type="text"
                  placeholder="Ej: Pago mensual enlace fibra óptica NetUno"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Monto USD ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={expenseAmountUSD}
                    onChange={(e) => setExpenseAmountUSD(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold text-center outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Equivalente Bs:</label>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-center text-slate-800">
                    Bs. {(expenseAmountUSD * exchangeRates.bcvUSD).toLocaleString('es-VE')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Método de Pago:</label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Efectivo Divisas (USD)">Efectivo Divisas (USD)</option>
                    <option value="Efectivo Bolívares">Efectivo Bolívares</option>
                    <option value="Zelle">Zelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Nro. Referencia (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej: TRF-9021"
                    value={expenseReference}
                    onChange={(e) => setExpenseReference(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {expenseError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] font-bold">
                  ⚠️ {expenseError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {isSubmittingExpense ? 'Guardando...' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
