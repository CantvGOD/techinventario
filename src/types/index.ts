export type UserRole = 'super_user' | 'admin' | 'vendedor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  ci?: string;
  avatar?: string;
  joinDate: string;
  monthlyTargetBs?: number;
  password?: string;
}

export interface PhoneSpec {
  ram: string;
  storage: string;
  color: string;
  camera: string;
  screen: string;
}

export type CostMethod = 'promedio_ponderado' | 'ultimo_costo' | 'manual';

export interface PhoneItem {
  id: string;
  brand: string;
  model: string;
  specs: PhoneSpec;
  priceBs: number;
  costBs: number;
  costUSD: number;
  lastCostUSD: number;
  avgCostUSD: number;
  costMethod: CostMethod;
  profitMargin: number;
  stock: number;
  minStock: number;
  category: 'Gama Alta' | 'Gama Media' | 'Gama Entrada';
  releaseYear: number;
}

export interface ExchangeRates {
  bcvUSD: number;
  bcvEUR: number;
  paraleloUSD: number;
  activeRateType: 'bcvUSD' | 'bcvEUR' | 'paraleloUSD';
  lastUpdated: string;
  autoUpdate?: boolean;
}

export type PaymentMethod =
  | 'Efectivo Bolívares'
  | 'Efectivo Divisas (USD)'
  | 'Pago Móvil'
  | 'Transferencia'
  | 'Zelle'
  | 'Efectivo USD/Bs';

export interface SaleTransaction {
  id: string;
  code: string;
  date: string;
  vendorId: string;
  vendorName: string;
  phoneId: string;
  phoneName: string;
  brand: string;
  quantity: number;
  unitPriceBs: number;
  taxBaseBs: number;
  ivaBs: number;
  igtfBs: number;
  totalBs: number;
  totalUSD: number;
  totalEUR: number;
  exchangeRateUsed: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  costBs: number;
  clientName: string;
  clientDoc: string;
  notes?: string;
}

export interface PurchaseTransaction {
  id: string;
  code: string;
  date: string;
  phoneId: string;
  phoneName: string;
  brand: string;
  supplier: string;
  invoiceNumber: string;
  quantity: number;
  unitCostUSD: number;
  unitCostBs: number;
  totalCostUSD: number;
  totalCostBs: number;
  exchangeRateUsed: number;
  costMethodApplied: CostMethod;
  oldCostUSD: number;
  newCostUSD: number;
  oldPriceBs: number;
  newPriceBs: number;
  notes?: string;
}

export type ExpenseCategory =
  | 'Alquiler'
  | 'Luz / Electricidad'
  | 'Agua'
  | 'Internet y Comunicaciones'
  | 'Suministros de Oficina'
  | 'Mantenimiento'
  | 'Transporte / Flete'
  | 'Otros Gastos';

export interface OperatingExpense {
  id: string;
  code: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amountBs: number;
  amountUSD: number;
  exchangeRateUsed: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  registeredBy: string;
}

export interface VendorPayroll {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorDoc: string;
  month: string;
  totalSalesCount: number;
  totalSalesBs: number;
  totalSalesUSD: number;
  baseSalaryBs: number;
  commissionRate: number;
  commissionAmountBs: number;
  bonusBs: number;
  finalPayoutBs: number;
  finalPayoutUSD: number;
  status: 'Pendiente' | 'Pagado' | 'En Revisión';
  paymentDate?: string;
  paymentRef?: string;
}

export interface MarketStatItem {
  id: string;
  brand: string;
  model: string;
  marketSharePercentage: number;
  salesVolumeUnits: number;
  avgPriceUSD: number;
  trend: 'up' | 'down' | 'stable';
  isStoreStocked: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  details: string;
  category?: 'auth' | 'sale' | 'inventory' | 'purchase' | 'expense' | 'accounting' | 'payroll' | 'rates' | 'system' | 'navigation';
  severity?: 'info' | 'success' | 'warning' | 'danger';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}
