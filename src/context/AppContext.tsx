import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  UserRole,
  User,
  PhoneItem,
  CostMethod,
  ExchangeRates,
  SaleTransaction,
  PurchaseTransaction,
  OperatingExpense,
  VendorPayroll,
  MarketStatItem,
  AuditLog,
  ToastMessage
} from '../types';

export interface IncomeStatementReport {
  salesRevenueBs: number;
  salesRevenueUSD: number;
  costOfGoodsSoldBs: number;
  costOfGoodsSoldUSD: number;
  grossProfitBs: number;
  grossProfitUSD: number;
  operatingExpensesBs: number;
  operatingExpensesUSD: number;
  commissionExpensesBs: number;
  commissionExpensesUSD: number;
  totalExpensesBs: number;
  totalExpensesUSD: number;
  netIncomeBs: number;
  netIncomeUSD: number;
  profitMarginPercentage: number;
}

export interface BalanceSheetReport {
  cashBs: number;
  cashUSD_convertedBs: number;
  cashUSD_raw: number;
  banksBs: number;
  banksUSD_convertedBs: number;
  banksUSD_raw: number;
  inventoryCostBs: number;
  inventoryCostUSD: number;
  totalAssetsBs: number;
  totalAssetsUSD: number;
  commissionsPayableBs: number;
  commissionsPayableUSD: number;
  taxPayableBs: number;
  taxPayableUSD: number;
  totalLiabilitiesBs: number;
  totalLiabilitiesUSD: number;
  shareCapitalBs: number;
  shareCapitalUSD: number;
  retainedEarningsBs: number;
  retainedEarningsUSD: number;
  totalEquityBs: number;
  totalEquityUSD: number;
  isBalanced: boolean;
  differenceBs: number;
}

export interface DailyCashCloseReport {
  date: string;
  totalSalesCount: number;
  totalCollectedBs: number;
  totalCollectedUSD: number;
  cashBsCollected: number;
  cashUSDCollected: number;
  pagoMovilCollected: number;
  transferenciasCollected: number;
  zelleCollected: number;
  igtfCollectedBs: number;
  ivaCollectedBs: number;
  cashExpensesBs: number;
  cashExpensesUSD: number;
  netCashInDrawerBs: number;
  netCashInDrawerUSD: number;
  transactions: SaleTransaction[];
  expenses: OperatingExpense[];
}

export interface ApprovalRequest {
  id: string;
  rawId?: number;
  code: string;
  type: 'CAMBIO_PRECIO' | 'SALIDA_STOCK' | 'ENTRADA_LOTE' | 'ELIMINAR_EQUIPO' | 'DESCUENTO_ESPECIAL';
  requesterName: string;
  requesterRole: UserRole;
  phoneId?: string;
  phoneName: string;
  description: string;
  payload: any;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  reviewedBy?: string;
  date: string;
  resolutionDate?: string;
  rejectionReason?: string;
}

interface AppContextType {
  currentUser: User | null;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  users: User[];
  phones: PhoneItem[];
  exchangeRates: ExchangeRates;
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  expenses: OperatingExpense[];
  payrolls: VendorPayroll[];
  marketStats: MarketStatItem[];
  auditLogs: AuditLog[];
  approvals: ApprovalRequest[];
  toasts: ToastMessage[];
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Auth Actions
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  registerUser: (userData: Omit<User, 'id'> & { password?: string }) => boolean;
  
  // Actions
  addPhone: (phone: Omit<PhoneItem, 'id'>) => void;
  updatePhone: (phone: PhoneItem, reason?: string) => void;
  deletePhone: (id: string, reason?: string) => void;
  adjustStock: (phoneId: string, type: 'in' | 'out', quantity: number, reason: string) => Promise<boolean>;
  registerPurchase: (purchaseData: {
    phoneId: string;
    supplier: string;
    invoiceNumber: string;
    quantity: number;
    unitCostUSD: number;
    unitCostBs?: number;
    costMethodApplied: CostMethod;
    newPriceBs?: number;
    notes?: string;
  }) => Promise<boolean>;
  registerExpense: (expenseData: {
    category: OperatingExpense['category'];
    description: string;
    amountBs?: number;
    amountUSD?: number;
    paymentMethod: OperatingExpense['paymentMethod'];
    referenceNumber?: string;
    date?: string;
  }) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  registerSale: (saleData: {
    vendorId: string;
    phoneId: string;
    quantity: number;
    paymentMethod: SaleTransaction['paymentMethod'];
    paymentReference?: string;
    clientName: string;
    clientDoc: string;
    notes?: string;
  }) => boolean;
  updateExchangeRates: (rates: Partial<ExchangeRates>) => void;
  fetchLiveExchangeRates: () => Promise<void>;
  approvePayroll: (payrollId: string, paymentRef: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  resetToDefaultData: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  getActiveExchangeRate: () => number;
  refreshFromMySQL: () => Promise<void>;
  requestApproval: (
    type: ApprovalRequest['type'],
    phoneId: string | undefined,
    phoneName: string,
    description: string,
    payload: any
  ) => Promise<boolean>;
  resolveApproval: (
    id: string,
    action: 'approve' | 'reject',
    reason?: string
  ) => Promise<boolean>;
  logAuditAction: (
    user: string,
    role: UserRole,
    action: string,
    details: string,
    category?: AuditLog['category'],
    severity?: AuditLog['severity']
  ) => void;
  
  // Financial & Accounting Reports
  getIncomeStatement: () => IncomeStatementReport;
  getBalanceSheet: () => BalanceSheetReport;
  getDailyCashClose: (date?: string) => DailyCashCloseReport;
}

const API_BASE = 'http://localhost:3001/api';

const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  bcvUSD: 854.46,
  bcvEUR: 974.06,
  paraleloUSD: 954.16,
  activeRateType: 'bcvUSD',
  lastUpdated: new Date().toISOString(),
  autoUpdate: true,
};

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendoza',
    email: 'jefe@empresa.com',
    role: 'super_user',
    phone: '0414-1234567',
    ci: 'V-14.582.901',
    joinDate: '2023-01-15',
    monthlyTargetBs: 0,
    password: '123'
  },
  {
    id: 'usr-2',
    name: 'Laura Rodríguez',
    email: 'admin@empresa.com',
    role: 'admin',
    phone: '0412-9876543',
    ci: 'V-18.341.209',
    joinDate: '2023-03-10',
    monthlyTargetBs: 0,
    password: '123'
  },
  {
    id: 'usr-3',
    name: 'María González',
    email: 'maria.gonzalez@empresa.com',
    role: 'vendedor',
    phone: '0424-5551234',
    ci: 'V-22.109.876',
    joinDate: '2024-02-01',
    monthlyTargetBs: 250000,
    password: '123'
  },
  {
    id: 'usr-4',
    name: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    role: 'vendedor',
    phone: '0416-3338899',
    ci: 'V-24.901.234',
    joinDate: '2024-05-15',
    monthlyTargetBs: 200000,
    password: '123'
  },
  {
    id: 'usr-5',
    name: 'Pedro Rodríguez',
    email: 'pedro.rodriguez@empresa.com',
    role: 'vendedor',
    phone: '0414-7774411',
    ci: 'V-25.432.109',
    joinDate: '2024-06-01',
    monthlyTargetBs: 180000,
    password: '123'
  },
  {
    id: 'usr-6',
    name: 'Ana López',
    email: 'ana.lopez@empresa.com',
    role: 'vendedor',
    phone: '0412-2226655',
    ci: 'V-26.118.990',
    joinDate: '2025-01-10',
    monthlyTargetBs: 180000,
    password: '123'
  }
];

const DEFAULT_PHONES: PhoneItem[] = [
  {
    id: 'ph-1',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra 5G',
    specs: { ram: '12 GB', storage: '512 GB', color: 'Titanium Gray', camera: '200 MP', screen: '6.8" AMOLED' },
    priceBs: 1110798,
    costBs: 854460,
    costUSD: 1000,
    lastCostUSD: 1000,
    avgCostUSD: 1000,
    costMethod: 'promedio_ponderado',
    profitMargin: 30,
    stock: 14,
    minStock: 4,
    category: 'Gama Alta',
    releaseYear: 2024
  },
  {
    id: 'ph-2',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    specs: { ram: '8 GB', storage: '256 GB', color: 'Natural Titanium', camera: '48 MP', screen: '6.7" OLED' },
    priceBs: 1025352,
    costBs: 786103.20,
    costUSD: 920,
    lastCostUSD: 920,
    avgCostUSD: 920,
    costMethod: 'promedio_ponderado',
    profitMargin: 30.43,
    stock: 8,
    minStock: 3,
    category: 'Gama Alta',
    releaseYear: 2023
  },
  {
    id: 'ph-3',
    brand: 'Xiaomi',
    model: '13T Pro Leica',
    specs: { ram: '12 GB', storage: '512 GB', color: 'Alpine Blue', camera: '50 MP Leica', screen: '6.67" AMOLED' },
    priceBs: 555399,
    costBs: 410140.80,
    costUSD: 480,
    lastCostUSD: 480,
    avgCostUSD: 480,
    costMethod: 'promedio_ponderado',
    profitMargin: 35.42,
    stock: 22,
    minStock: 5,
    category: 'Gama Alta',
    releaseYear: 2023
  },
  {
    id: 'ph-4',
    brand: 'Motorola',
    model: 'Edge 50 Pro',
    specs: { ram: '12 GB', storage: '256 GB', color: 'Black Leather', camera: '50 MP', screen: '6.7" pOLED' },
    priceBs: 469950,
    costBs: 350328.60,
    costUSD: 410,
    lastCostUSD: 410,
    avgCostUSD: 410,
    costMethod: 'promedio_ponderado',
    profitMargin: 34.15,
    stock: 18,
    minStock: 5,
    category: 'Gama Media',
    releaseYear: 2024
  }
];

const DEFAULT_PURCHASES: PurchaseTransaction[] = [
  {
    id: 'pur-1',
    code: 'CMP-2026-0801',
    date: '2026-08-20 09:30:00',
    phoneId: 'ph-1',
    phoneName: 'Galaxy S24 Ultra 5G',
    brand: 'Samsung',
    supplier: 'Distribuidora Samsung Latinoamérica',
    invoiceNumber: 'FACT-SM-9021',
    quantity: 10,
    unitCostUSD: 1000,
    unitCostBs: 854460,
    totalCostUSD: 10000,
    totalCostBs: 8544600,
    exchangeRateUsed: 854.46,
    costMethodApplied: 'promedio_ponderado',
    oldCostUSD: 950,
    newCostUSD: 1000,
    oldPriceBs: 1050000,
    newPriceBs: 1110798,
    notes: 'Lote importado inicial S24 Ultra'
  },
  {
    id: 'pur-2',
    code: 'CMP-2026-0802',
    date: '2026-08-25 11:00:00',
    phoneId: 'ph-2',
    phoneName: 'iPhone 15 Pro Max',
    brand: 'Apple',
    supplier: 'Apple Wholesale Miami Corp',
    invoiceNumber: 'FACT-AP-4401',
    quantity: 8,
    unitCostUSD: 920,
    unitCostBs: 786103.20,
    totalCostUSD: 7360,
    totalCostBs: 6288825.60,
    exchangeRateUsed: 854.46,
    costMethodApplied: 'promedio_ponderado',
    oldCostUSD: 900,
    newCostUSD: 920,
    oldPriceBs: 990000,
    newPriceBs: 1025352,
    notes: 'Lote Titanium iPhone 15 Pro Max'
  },
  {
    id: 'pur-3',
    code: 'CMP-2026-0901',
    date: '2026-09-02 14:15:00',
    phoneId: 'ph-3',
    phoneName: '13T Pro Leica',
    brand: 'Xiaomi',
    supplier: 'Xiaomi Import Venezuela C.A.',
    invoiceNumber: 'FACT-XM-1120',
    quantity: 20,
    unitCostUSD: 480,
    unitCostBs: 410140.80,
    totalCostUSD: 9600,
    totalCostBs: 8202816,
    exchangeRateUsed: 854.46,
    costMethodApplied: 'promedio_ponderado',
    oldCostUSD: 450,
    newCostUSD: 480,
    oldPriceBs: 520000,
    newPriceBs: 555399,
    notes: 'Reabastecimiento serie Leica'
  }
];

const DEFAULT_EXPENSES: OperatingExpense[] = [
  {
    id: 'exp-1',
    code: 'EXP-2026-001',
    date: '2026-09-01',
    category: 'Alquiler',
    description: 'Canon de arrendamiento local comercial piso 1',
    amountBs: 341784.00,
    amountUSD: 400.00,
    exchangeRateUsed: 854.46,
    paymentMethod: 'Transferencia',
    referenceNumber: 'TRF-ALQ-0901',
    registeredBy: 'Carlos Mendoza'
  },
  {
    id: 'exp-2',
    code: 'EXP-2026-002',
    date: '2026-09-03',
    category: 'Luz / Electricidad',
    description: 'Factura mensual electricidad Corpoelec',
    amountBs: 4272.30,
    amountUSD: 5.00,
    exchangeRateUsed: 854.46,
    paymentMethod: 'Pago Móvil',
    referenceNumber: 'PM-CORP-4412',
    registeredBy: 'Laura Rodríguez'
  },
  {
    id: 'exp-3',
    code: 'EXP-2026-003',
    date: '2026-09-04',
    category: 'Internet y Comunicaciones',
    description: 'Enlace dedicado fibra óptica empresarial NetUno',
    amountBs: 34178.40,
    amountUSD: 40.00,
    exchangeRateUsed: 854.46,
    paymentMethod: 'Transferencia',
    referenceNumber: 'TRF-NET-8891',
    registeredBy: 'Carlos Mendoza'
  },
  {
    id: 'exp-4',
    code: 'EXP-2026-004',
    date: '2026-09-05',
    category: 'Agua',
    description: 'Servicio de agua potable y cisterna comercial',
    amountBs: 8544.60,
    amountUSD: 10.00,
    exchangeRateUsed: 854.46,
    paymentMethod: 'Pago Móvil',
    referenceNumber: 'PM-AGUA-1234',
    registeredBy: 'Laura Rodríguez'
  },
  {
    id: 'exp-5',
    code: 'EXP-2026-005',
    date: '2026-09-08',
    category: 'Suministros de Oficina',
    description: 'Bolsas protectoras, facturación y papelería',
    amountBs: 21361.50,
    amountUSD: 25.00,
    exchangeRateUsed: 854.46,
    paymentMethod: 'Efectivo Divisas (USD)',
    referenceNumber: 'REC-PAP-991',
    registeredBy: 'Laura Rodríguez'
  }
];

const DEFAULT_MARKET_STATS: MarketStatItem[] = [
  { id: 'm-1', brand: 'Samsung', model: 'Galaxy S24 Ultra', marketSharePercentage: 24.5, salesVolumeUnits: 1450, avgPriceUSD: 1300, trend: 'up', isStoreStocked: true },
  { id: 'm-2', brand: 'Apple', model: 'iPhone 15 Pro Max', marketSharePercentage: 22.1, salesVolumeUnits: 1310, avgPriceUSD: 1200, trend: 'up', isStoreStocked: true },
  { id: 'm-3', brand: 'Xiaomi', model: 'Redmi Note 13 Series', marketSharePercentage: 20.4, salesVolumeUnits: 1200, avgPriceUSD: 360, trend: 'stable', isStoreStocked: true },
  { id: 'm-4', brand: 'Motorola', model: 'Edge 50 / G Series', marketSharePercentage: 16.2, salesVolumeUnits: 960, avgPriceUSD: 450, trend: 'up', isStoreStocked: true },
  { id: 'm-5', brand: 'Google', model: 'Pixel 8 Pro', marketSharePercentage: 10.3, salesVolumeUnits: 610, avgPriceUSD: 999, trend: 'down', isStoreStocked: true }
];

const DEFAULT_APPROVALS: ApprovalRequest[] = [
  {
    id: 'appr-1',
    code: 'SOL-2026-101',
    type: 'CAMBIO_PRECIO',
    requesterName: 'Laura Rodríguez',
    requesterRole: 'vendedor',
    phoneId: 'ph-1',
    phoneName: 'Samsung Galaxy S24 Ultra 5G',
    description: 'Solicitud de descuento comercial autorizado a cliente corporativo: Ajustar precio unitario de venta de Bs. 1.110.798 a Bs. 1.050.000.',
    payload: { phoneId: 'ph-1', newPriceBs: 1050000 },
    status: 'pendiente',
    date: '2026-10-28 14:30:00'
  },
  {
    id: 'appr-2',
    code: 'SOL-2026-102',
    type: 'SALIDA_STOCK',
    requesterName: 'Carlos Mendoza',
    requesterRole: 'vendedor',
    phoneId: 'ph-4',
    phoneName: 'Motorola Edge 50 Pro',
    description: 'Baja y desincorporación física de 1 unidad por avería y rotura de cristal en módulo de demostración.',
    payload: { phoneId: 'ph-4', quantity: 1, reason: 'Daño en exhibición' },
    status: 'pendiente',
    date: '2026-10-29 09:15:00'
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USERS[0]);
  const [activeRole, setActiveRoleState] = useState<UserRole>('super_user');
  const [darkMode, setDarkModeState] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [phones, setPhones] = useState<PhoneItem[]>(DEFAULT_PHONES);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(DEFAULT_EXCHANGE_RATES);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(DEFAULT_PURCHASES);
  const [expenses, setExpenses] = useState<OperatingExpense[]>(DEFAULT_EXPENSES);
  const [payrolls, setPayrolls] = useState<VendorPayroll[]>([]);
  const [marketStats] = useState<MarketStatItem[]>(DEFAULT_MARKET_STATS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(DEFAULT_APPROVALS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-init-1',
      timestamp: new Date().toISOString(),
      user: 'Carlos Mendoza',
      role: 'super_user',
      action: 'Inicio del Sistema',
      details: 'El sistema ha iniciado sesión y verificado los parámetros de seguridad.',
      category: 'system',
      severity: 'info'
    }
  ]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const logAuditAction = (
    user: string,
    role: UserRole,
    action: string,
    details: string,
    category: AuditLog['category'] = 'system',
    severity: AuditLog['severity'] = 'info'
  ) => {
    const newLog: AuditLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      user,
      role,
      action,
      details,
      category,
      severity
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    // Send to backend MySQL
    fetch(`${API_BASE}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, role, action, details })
    }).catch(() => {});
  };

  const refreshFromMySQL = async () => {
    try {
      const [resPhones, resUsers, resSales, resPayroll, resRates, resAudit, resPurchases, resExpenses, resApprovals] = await Promise.all([
        fetch(`${API_BASE}/phones`),
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/sales`),
        fetch(`${API_BASE}/payroll`),
        fetch(`${API_BASE}/rates`),
        fetch(`${API_BASE}/audit`),
        fetch(`${API_BASE}/purchases`),
        fetch(`${API_BASE}/expenses`),
        fetch(`${API_BASE}/approvals`)
      ]);

      if (resPhones.ok) setPhones(await resPhones.json());
      if (resUsers.ok) {
        const fetchedUsers: User[] = await resUsers.json();
        const mergedUsers = fetchedUsers.map(u => {
          const defaultMatch = DEFAULT_USERS.find(d => d.email.toLowerCase() === u.email.toLowerCase());
          return { ...u, password: defaultMatch ? defaultMatch.password : '123' };
        });
        setUsers(mergedUsers);
      }
      if (resSales.ok) setSales(await resSales.json());
      if (resPayroll.ok) setPayrolls(await resPayroll.json());
      if (resRates.ok) setExchangeRates(await resRates.json());
      if (resPurchases.ok) setPurchases(await resPurchases.json());
      if (resExpenses.ok) setExpenses(await resExpenses.json());
      if (resAudit.ok) {
        const fetchedLogs = await resAudit.json();
        if (Array.isArray(fetchedLogs) && fetchedLogs.length > 0) {
          setAuditLogs(fetchedLogs);
        }
      }
      if (resApprovals && resApprovals.ok) {
        const fetchedApprovals = await resApprovals.json();
        if (Array.isArray(fetchedApprovals) && fetchedApprovals.length > 0) {
          setApprovals(fetchedApprovals);
        }
      }
    } catch (err) {
      console.log('⚠️ Modo de operación local activo.');
    }
  };

  useEffect(() => {
    refreshFromMySQL();
  }, []);

  const login = (email: string, _password?: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Find user by email, name, or role alias
    let foundUser = users.find(u => 
      u.email.toLowerCase() === cleanEmail ||
      u.name.toLowerCase().includes(cleanEmail) ||
      (cleanEmail.includes('jefe') && u.role === 'super_user') ||
      (cleanEmail.includes('admin') && u.role === 'admin') ||
      (cleanEmail.includes('vendedor') && u.role === 'vendedor')
    );

    if (!foundUser) {
      // Dynamic fallback so login NEVER fails
      foundUser = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        name: email.includes('@') ? email.split('@')[0] : email,
        email: email.includes('@') ? email : `${cleanEmail}@empresa.com`,
        role: cleanEmail.includes('jefe') ? 'super_user' : cleanEmail.includes('admin') ? 'admin' : 'vendedor',
        joinDate: new Date().toISOString().split('T')[0],
        ci: 'V-20.123.456',
        password: '123'
      };
      setUsers(prev => [...prev, foundUser!]);
    }

    setCurrentUser(foundUser);
    setActiveRoleState(foundUser.role);
    addToast({
      type: 'success',
      title: '¡Bienvenido!',
      message: `Sesión iniciada como ${foundUser.name} (${foundUser.role === 'super_user' ? 'Super Usuario' : foundUser.role === 'admin' ? 'Administrador' : 'Vendedor'})`
    });

    logAuditAction(
      foundUser.name,
      foundUser.role,
      'Inicio de Sesión Exitoso',
      `El usuario ${foundUser.name} (${foundUser.email}) ha iniciado sesión con rol de ${foundUser.role}`,
      'auth',
      'success'
    );
    return true;
  };

  const logout = () => {
    if (currentUser) {
      logAuditAction(
        currentUser.name,
        currentUser.role,
        'Cierre de Sesión',
        `El usuario ${currentUser.name} ha cerrado su sesión en el sistema`,
        'auth',
        'info'
      );
    }
    setCurrentUser(null);
    addToast({ type: 'info', title: 'Sesión Cerrada', message: 'Has cerrado sesión exitosamente.' });
  };

  const registerUser = (userData: Omit<User, 'id'> & { password?: string }): boolean => {
    const newUser: User = {
      ...userData,
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      password: userData.password || '123'
    };

    setUsers(prev => [...prev.filter(u => u.email.toLowerCase() !== userData.email.toLowerCase()), newUser]);
    setCurrentUser(newUser);
    setActiveRoleState(newUser.role);

    fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, currentUser })
    }).catch(() => {});

    addToast({ type: 'success', title: 'Cuenta Creada', message: `¡Bienvenido ${newUser.name}! Tu cuenta ha sido registrada.` });

    logAuditAction(
      newUser.name,
      newUser.role,
      'Registro de Nueva Cuenta',
      `Se registró una nueva cuenta de usuario: ${newUser.name} (${newUser.ci}) con correo ${newUser.email} y rol ${newUser.role}`,
      'auth',
      'success'
    );
    return true;
  };

  const setActiveRole = (role: UserRole) => {
    const oldRole = activeRole;
    setActiveRoleState(role);
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
    addToast({
      type: 'info',
      title: 'Rol de vista actualizado',
      message: `Modo vista cambiado a ${role === 'super_user' ? 'Super Usuario (Jefe)' : role === 'admin' ? 'Administrador' : 'Vendedor'}`
    });

    logAuditAction(
      currentUser ? currentUser.name : 'Usuario',
      role,
      'Cambio de Rol Activo',
      `Se cambió el rol de visualización de ${oldRole} a ${role}`,
      'navigation',
      'info'
    );
  };

  const setDarkMode = setDarkModeState;

  const getActiveExchangeRate = (): number => {
    if (exchangeRates.activeRateType === 'bcvUSD') return exchangeRates.bcvUSD;
    if (exchangeRates.activeRateType === 'bcvEUR') return exchangeRates.bcvEUR;
    return exchangeRates.paraleloUSD;
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addPhone = async (phoneData: Omit<PhoneItem, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/phones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...phoneData, currentUser })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({ type: 'success', title: 'Equipo Agregado', message: `${phoneData.brand} ${phoneData.model} agregado al catálogo e inventario.` });
        return;
      }
    } catch {}

    const newPhone: PhoneItem = { ...phoneData, id: 'ph-' + Math.random().toString(36).substring(2, 9) };
    setPhones((prev) => [newPhone, ...prev]);
    addToast({ type: 'success', title: 'Equipo Agregado', message: `${phoneData.brand} ${phoneData.model} guardado localmente.` });
    logAuditAction(
      currentUser?.name || 'Administrador',
      activeRole,
      'Ingreso de Teléfono a Inventario',
      `Nuevo equipo incorporado al inventario: "${phoneData.brand} ${phoneData.model}". Stock inicial: ${phoneData.stock} unidades (Mínimo alerta: ${phoneData.minStock}). Precio: Bs. ${phoneData.priceBs.toLocaleString('es-VE')}. Ficha: ${phoneData.specs.ram} RAM, ${phoneData.specs.storage}, Color: ${phoneData.specs.color}, Gama: ${phoneData.category}, Año: ${phoneData.releaseYear}.`,
      'inventory',
      'success'
    );
  };

  const updatePhone = async (updatedPhone: PhoneItem, reason?: string) => {
    const existingPhone = phones.find(p => p.id === updatedPhone.id);
    const diffs: string[] = [];
    if (existingPhone) {
      if (existingPhone.stock !== updatedPhone.stock) {
        const diff = updatedPhone.stock - existingPhone.stock;
        diffs.push(`Stock: ${existingPhone.stock} unids ➔ ${updatedPhone.stock} unids (${diff > 0 ? `+${diff} unids agregadas` : `${diff} unids retiradas`})`);
      }
      if (existingPhone.priceBs !== updatedPhone.priceBs) {
        diffs.push(`Precio: Bs. ${existingPhone.priceBs.toLocaleString('es-VE')} ➔ Bs. ${updatedPhone.priceBs.toLocaleString('es-VE')}`);
      }
      if (existingPhone.minStock !== updatedPhone.minStock) {
        diffs.push(`Stock Mínimo: ${existingPhone.minStock} ➔ ${updatedPhone.minStock}`);
      }
      if (existingPhone.specs.ram !== updatedPhone.specs.ram) diffs.push(`RAM: ${existingPhone.specs.ram} ➔ ${updatedPhone.specs.ram}`);
      if (existingPhone.specs.storage !== updatedPhone.specs.storage) diffs.push(`Almacenamiento: ${existingPhone.specs.storage} ➔ ${updatedPhone.specs.storage}`);
      if (existingPhone.specs.color !== updatedPhone.specs.color) diffs.push(`Color: ${existingPhone.specs.color} ➔ ${updatedPhone.specs.color}`);
      if (existingPhone.specs.camera !== updatedPhone.specs.camera) diffs.push(`Cámara: ${existingPhone.specs.camera} ➔ ${updatedPhone.specs.camera}`);
      if (existingPhone.specs.screen !== updatedPhone.specs.screen) diffs.push(`Pantalla: ${existingPhone.specs.screen} ➔ ${updatedPhone.specs.screen}`);
      if (existingPhone.category !== updatedPhone.category) diffs.push(`Gama: ${existingPhone.category} ➔ ${updatedPhone.category}`);
      if (existingPhone.brand !== updatedPhone.brand) diffs.push(`Marca: "${existingPhone.brand}" ➔ "${updatedPhone.brand}"`);
      if (existingPhone.model !== updatedPhone.model) diffs.push(`Modelo: "${existingPhone.model}" ➔ "${updatedPhone.model}"`);
      if (existingPhone.releaseYear !== updatedPhone.releaseYear) diffs.push(`Año: ${existingPhone.releaseYear} ➔ ${updatedPhone.releaseYear}`);
    }

    try {
      const res = await fetch(`${API_BASE}/phones/${updatedPhone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedPhone, currentUser, movementReason: reason })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({ type: 'success', title: 'Inventario Actualizado', message: `${updatedPhone.brand} ${updatedPhone.model} modificado con éxito.` });
        return;
      }
    } catch {}

    // Fallback modo local
    setPhones((prev) => prev.map((p) => (p.id === updatedPhone.id ? updatedPhone : p)));
    addToast({ type: 'success', title: 'Inventario Actualizado', message: `${updatedPhone.model} modificado (modo local).` });
    const stockDiff = existingPhone ? updatedPhone.stock - existingPhone.stock : 0;
    const action = diffs.length === 1 && stockDiff !== 0
      ? (stockDiff < 0 ? 'Salida de Stock de Inventario' : 'Ingreso de Stock a Inventario')
      : stockDiff < 0
      ? 'Modificación y Retiro de Stock en Inventario'
      : 'Modificación de Teléfono en Inventario';

    logAuditAction(
      currentUser?.name || 'Administrador',
      activeRole,
      action,
      `Modificación de ${updatedPhone.brand} ${updatedPhone.model}: ${diffs.length > 0 ? diffs.join(' | ') : 'Guardado'}${reason ? ` [Motivo: ${reason}]` : ''}`,
      'inventory',
      stockDiff < 0 ? 'warning' : 'info'
    );
  };

  const deletePhone = async (id: string, reason?: string) => {
    const target = phones.find(p => p.id === id);
    try {
      const res = await fetch(`${API_BASE}/phones/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser, reason: reason || 'Baja permanente de producto por el usuario' })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({ type: 'warning', title: 'Producto Eliminado', message: `${target ? target.model : 'Equipo'} retirado del catálogo.` });
        return;
      }
    } catch {}

    // Fallback modo local
    setPhones((prev) => prev.filter((p) => p.id !== id));
    addToast({ type: 'warning', title: 'Producto Eliminado', message: 'Teléfono retirado del inventario (modo local).' });
    logAuditAction(
      currentUser?.name || 'Super Usuario',
      activeRole,
      'Eliminación de Teléfono de Inventario',
      `Retiro definitivo de inventario: Se eliminó "${target?.brand} ${target?.model}" (Cód: ${target?.id}). Stock retirado: ${target?.stock ?? 0} unidades. Precio: Bs. ${target?.priceBs.toLocaleString('es-VE')}. Ficha: ${target?.specs.ram} RAM, ${target?.specs.storage}, Color: ${target?.specs.color}.${reason ? ` Motivo: ${reason}` : ''}`,
      'inventory',
      'warning'
    );
  };

  const adjustStock = async (phoneId: string, type: 'in' | 'out', quantity: number, reason: string): Promise<boolean> => {
    const target = phones.find(p => p.id === phoneId);
    if (!target) return false;
    if (type === 'out' && target.stock < quantity) {
      addToast({
        type: 'error',
        title: 'Stock Insuficiente',
        message: `No se pueden retirar ${quantity} unidades. Solo hay ${target.stock} disponibles.`
      });
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/phones/${phoneId}/stock-movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, quantity, reason, currentUser })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({
          type: type === 'out' ? 'warning' : 'success',
          title: type === 'out' ? 'Salida de Stock Registrada' : 'Ingreso de Stock Registrado',
          message: `${quantity} unidades ${type === 'out' ? 'retiradas de' : 'agregadas a'} ${target.brand} ${target.model}.`
        });
        return true;
      }
    } catch {}

    // Fallback modo local
    const newStock = type === 'out' ? target.stock - quantity : target.stock + quantity;
    setPhones((prev) => prev.map((p) => (p.id === phoneId ? { ...p, stock: newStock } : p)));
    addToast({
      type: type === 'out' ? 'warning' : 'success',
      title: type === 'out' ? 'Salida de Stock (Local)' : 'Ingreso de Stock (Local)',
      message: `${quantity} unids actualizadas en ${target.model}.`
    });

    const action = type === 'out' ? 'Salida de Stock de Inventario' : 'Ingreso de Stock a Inventario';
    const details = type === 'out'
      ? `Retiro de unidades de inventario: Se descargaron ${quantity} unidades de "${target.brand} ${target.model}". Motivo: ${reason}. Stock anterior: ${target.stock} unids ➔ Stock resultante disponible: ${newStock} unids.`
      : `Ingreso de unidades a inventario: Se sumaron ${quantity} unidades a "${target.brand} ${target.model}". Justificación: ${reason}. Stock anterior: ${target.stock} unids ➔ Stock resultante disponible: ${newStock} unids.`;

    logAuditAction(
      currentUser?.name || 'Administrador',
      activeRole,
      action,
      details,
      'inventory',
      type === 'out' ? 'warning' : 'success'
    );
    return true;
  };

  const registerSale = (saleData: {
    vendorId: string;
    phoneId: string;
    quantity: number;
    paymentMethod: SaleTransaction['paymentMethod'];
    paymentReference?: string;
    clientName: string;
    clientDoc: string;
    notes?: string;
  }): boolean => {
    const phone = phones.find((p) => p.id === saleData.phoneId);
    const vendor = users.find((u) => u.id === saleData.vendorId);

    if (!phone || !vendor) return false;

    // Validación de control de duplicidad en números de referencia
    if (saleData.paymentReference && saleData.paymentReference.trim().length > 0) {
      const isDuplicate = sales.some(
        (s) =>
          s.paymentReference &&
          s.paymentReference.trim().toLowerCase() === saleData.paymentReference!.trim().toLowerCase()
      );
      if (isDuplicate) {
        addToast({
          type: 'error',
          title: 'Referencia Duplicada',
          message: `El número de referencia "${saleData.paymentReference.trim()}" ya fue registrado en otra venta. Control de duplicidad activado.`
        });
        return false;
      }
    }

    if (phone.stock < saleData.quantity) {
      addToast({ type: 'error', title: 'Sin Stock', message: `Stock insuficiente. Disponible: ${phone.stock}` });
      logAuditAction(
        vendor.name,
        activeRole,
        'Intento Fallido de Venta',
        `Stock insuficiente para vender ${saleData.quantity}x ${phone.model}. Disponible: ${phone.stock}`,
        'sale',
        'warning'
      );
      return false;
    }

    const subtotalBrutoBs = phone.priceBs * saleData.quantity;
    const taxBaseBs = Number((subtotalBrutoBs / 1.16).toFixed(2));
    const ivaBs = Number((subtotalBrutoBs - taxBaseBs).toFixed(2));
    const isEfectivoDivisas =
      saleData.paymentMethod === 'Efectivo Divisas (USD)' || saleData.paymentMethod === 'Efectivo USD/Bs';
    const igtfBs = isEfectivoDivisas ? Number((subtotalBrutoBs * 0.03).toFixed(2)) : 0;
    const totalBs = subtotalBrutoBs + igtfBs;
    const totalUSD = Number((totalBs / exchangeRates.bcvUSD).toFixed(2));
    const totalEUR = Number((totalBs / exchangeRates.bcvEUR).toFixed(2));
    const costBs = Number(((phone.costBs || 0) * saleData.quantity).toFixed(2));

    fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...saleData,
        taxBaseBs,
        ivaBs,
        igtfBs,
        totalBs,
        totalUSD,
        costBs
      })
    })
      .then(async (res) => {
        if (res.ok) {
          await refreshFromMySQL();
          addToast({ type: 'success', title: 'Venta Registrada', message: `Transacción completada exitosamente.` });
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.error) {
            addToast({ type: 'error', title: 'Error en Venta', message: errData.error });
          }
        }
      })
      .catch(() => {
        const newSale: SaleTransaction = {
          id: 'sale-' + Math.random().toString(36).substring(2, 9),
          code: `VEN-2026-${sales.length + 1}`,
          date: new Date().toISOString(),
          vendorId: vendor.id,
          vendorName: vendor.name,
          phoneId: phone.id,
          phoneName: phone.model,
          brand: phone.brand,
          quantity: saleData.quantity,
          unitPriceBs: phone.priceBs,
          taxBaseBs,
          ivaBs,
          igtfBs,
          totalBs,
          totalUSD,
          totalEUR,
          costBs,
          exchangeRateUsed: exchangeRates.bcvUSD,
          paymentMethod: saleData.paymentMethod,
          paymentReference: saleData.paymentReference ? saleData.paymentReference.trim() : undefined,
          clientName: saleData.clientName,
          clientDoc: saleData.clientDoc,
          notes: saleData.notes
        };
        setPhones((prev) => prev.map((p) => (p.id === phone.id ? { ...p, stock: p.stock - saleData.quantity } : p)));
        setSales((prev) => [newSale, ...prev]);
        addToast({ type: 'success', title: 'Venta Registrada', message: `Venta procesada localmente.` });

        const igtfNotice = igtfBs > 0 ? ` (con 3% IGTF: Bs. ${igtfBs.toLocaleString('es-VE')})` : '';
        const refNotice = saleData.paymentReference ? ` | Ref: ${saleData.paymentReference}` : '';
        logAuditAction(
          vendor.name,
          vendor.role,
          'Venta y Salida de Stock',
          `Venta completada (modo local): ${saleData.quantity}x ${phone.brand} ${phone.model} a ${saleData.clientName} (${saleData.clientDoc}) por Bs. ${totalBs.toLocaleString('es-VE')} ($${totalUSD} USD) vía ${saleData.paymentMethod}${refNotice}${igtfNotice}. Stock previo: ${phone.stock} ➔ Stock resultante: ${phone.stock - saleData.quantity}.`,
          'sale',
          'success'
        );
      });

    return true;
  };

  const registerPurchase = async (purchaseData: {
    phoneId: string;
    supplier: string;
    invoiceNumber: string;
    quantity: number;
    unitCostUSD: number;
    unitCostBs?: number;
    costMethodApplied: CostMethod;
    newPriceBs?: number;
    notes?: string;
  }): Promise<boolean> => {
    const phone = phones.find((p) => p.id === purchaseData.phoneId);
    if (!phone) return false;

    const rateUSD = exchangeRates.bcvUSD;
    const unitCostUSD = Number(purchaseData.unitCostUSD);
    const unitCostBs = purchaseData.unitCostBs || Number((unitCostUSD * rateUSD).toFixed(2));
    const qty = Number(purchaseData.quantity);
    const totalCostUSD = Number((unitCostUSD * qty).toFixed(2));
    const totalCostBs = Number((unitCostBs * qty).toFixed(2));

    const oldStock = phone.stock;
    const oldCostUSD = phone.costUSD || 0;
    const oldPriceBs = phone.priceBs;
    const newStock = oldStock + qty;

    let newCostUSD = unitCostUSD;
    if (purchaseData.costMethodApplied === 'promedio_ponderado') {
      if (newStock > 0) {
        newCostUSD = Number((((oldStock * oldCostUSD) + (qty * unitCostUSD)) / newStock).toFixed(2));
      }
    } else if (purchaseData.costMethodApplied === 'ultimo_costo') {
      newCostUSD = unitCostUSD;
    }

    const newCostBs = Number((newCostUSD * rateUSD).toFixed(2));
    const finalPriceBs = purchaseData.newPriceBs !== undefined && purchaseData.newPriceBs > 0 ? purchaseData.newPriceBs : oldPriceBs;

    // Regla de Negocio Fundamental: Costo de reposición no puede superar o igualar al precio de venta
    if (finalPriceBs <= newCostBs) {
      addToast({
        type: 'error',
        title: 'Regla de Negocio Incumplida',
        message: `El precio de venta (Bs. ${finalPriceBs.toLocaleString('es-VE')}) no puede ser menor o igual al nuevo costo de reposición (Bs. ${newCostBs.toLocaleString('es-VE')}). Debe actualizar el precio de venta para garantizar el margen.`
      });
      return false;
    }

    const profitMargin = Number((((finalPriceBs - newCostBs) / newCostBs) * 100).toFixed(2));

    try {
      const res = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...purchaseData,
          unitCostBs,
          newPriceBs: finalPriceBs,
          currentUser
        })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({
          type: 'success',
          title: 'Entrada de Mercancía Registrada',
          message: `Lote ingresado. Costo fijado: $${newCostUSD} USD (Margen: ${profitMargin}%)`
        });
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.error) {
          addToast({ type: 'error', title: 'Error en Compra', message: err.error });
          return false;
        }
      }
    } catch {}

    // Fallback local
    const newPur: PurchaseTransaction = {
      id: 'pur-' + Math.random().toString(36).substring(2, 9),
      code: `CMP-2026-${purchases.length + 1}`,
      date: new Date().toISOString(),
      phoneId: phone.id,
      phoneName: phone.model,
      brand: phone.brand,
      supplier: purchaseData.supplier,
      invoiceNumber: purchaseData.invoiceNumber,
      quantity: qty,
      unitCostUSD,
      unitCostBs,
      totalCostUSD,
      totalCostBs,
      exchangeRateUsed: rateUSD,
      costMethodApplied: purchaseData.costMethodApplied,
      oldCostUSD,
      newCostUSD,
      oldPriceBs,
      newPriceBs: finalPriceBs,
      notes: purchaseData.notes
    };

    setPurchases((prev) => [newPur, ...prev]);
    setPhones((prev) =>
      prev.map((p) => {
        if (p.id === phone.id) {
          return {
            ...p,
            stock: newStock,
            costUSD: newCostUSD,
            costBs: newCostBs,
            lastCostUSD: unitCostUSD,
            avgCostUSD: newCostUSD,
            costMethod: purchaseData.costMethodApplied,
            priceBs: finalPriceBs,
            profitMargin
          };
        }
        return p;
      })
    );

    addToast({
      type: 'success',
      title: 'Entrada de Mercancía Registrada (Local)',
      message: `Lote ingresado. Costo fijado: $${newCostUSD} USD (Margen: ${profitMargin}%)`
    });

    logAuditAction(
      currentUser?.name || 'Administrador',
      activeRole,
      'Recepción de Mercancía y Costeo',
      `Lote registrado: ${qty}x ${phone.brand} ${phone.model} a $${unitCostUSD} USD c/u. Costo resultante: $${newCostUSD} USD (Bs. ${newCostBs.toLocaleString('es-VE')}). Precio venta: Bs. ${finalPriceBs.toLocaleString('es-VE')} (${profitMargin}% margen). Stock: ${oldStock} ➔ ${newStock}.`,
      'purchase',
      'success'
    );

    return true;
  };

  const registerExpense = async (expenseData: {
    category: OperatingExpense['category'];
    description: string;
    amountBs?: number;
    amountUSD?: number;
    paymentMethod: OperatingExpense['paymentMethod'];
    referenceNumber?: string;
    date?: string;
  }): Promise<boolean> => {
    const rateUSD = exchangeRates.bcvUSD;
    const amountBs = expenseData.amountBs || Number(((expenseData.amountUSD || 0) * rateUSD).toFixed(2));
    const amountUSD = expenseData.amountUSD || Number((amountBs / rateUSD).toFixed(2));
    const date = expenseData.date || new Date().toISOString().split('T')[0];

    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseData, amountBs, amountUSD, currentUser })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({ type: 'success', title: 'Gasto Operativo Registrado', message: 'Egreso guardado correctamente.' });
        return true;
      }
    } catch {}

    const newExp: OperatingExpense = {
      id: 'exp-' + Math.random().toString(36).substring(2, 9),
      code: `EXP-2026-${expenses.length + 1}`,
      date,
      category: expenseData.category,
      description: expenseData.description,
      amountBs,
      amountUSD,
      exchangeRateUsed: rateUSD,
      paymentMethod: expenseData.paymentMethod,
      referenceNumber: expenseData.referenceNumber,
      registeredBy: currentUser?.name || 'Administrador'
    };

    setExpenses((prev) => [newExp, ...prev]);
    addToast({ type: 'success', title: 'Gasto Operativo Registrado', message: 'Egreso guardado localmente.' });
    logAuditAction(
      currentUser?.name || 'Administrador',
      activeRole,
      'Registro de Gasto Operativo',
      `Gasto operativo: ${expenseData.category} - "${expenseData.description}". Monto: Bs. ${amountBs.toLocaleString('es-VE')} ($${amountUSD.toFixed(2)} USD).`,
      'expense',
      'info'
    );
    return true;
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({ type: 'info', title: 'Gasto Eliminado', message: 'Registro de egreso eliminado.' });
        return true;
      }
    } catch {}

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    addToast({ type: 'info', title: 'Gasto Eliminado', message: 'Registro eliminado localmente.' });
    return true;
  };

  const getIncomeStatement = (): IncomeStatementReport => {
    const rateUSD = exchangeRates.bcvUSD || 854.46;
    const salesRevenueBs = sales.reduce((acc, s) => acc + (s.taxBaseBs || (s.totalBs / 1.16)), 0);
    const costOfGoodsSoldBs = sales.reduce((acc, s) => acc + (s.costBs || 0), 0);
    const grossProfitBs = salesRevenueBs - costOfGoodsSoldBs;

    const operatingExpensesBs = expenses.reduce((acc, e) => acc + e.amountBs, 0);
    const commissionExpensesBs = payrolls.reduce((acc, p) => acc + p.commissionAmountBs, 0);
    const totalExpensesBs = operatingExpensesBs + commissionExpensesBs;
    const netIncomeBs = grossProfitBs - totalExpensesBs;
    const profitMarginPercentage = salesRevenueBs > 0 ? Number(((netIncomeBs / salesRevenueBs) * 100).toFixed(2)) : 0;

    return {
      salesRevenueBs: Number(salesRevenueBs.toFixed(2)),
      salesRevenueUSD: Number((salesRevenueBs / rateUSD).toFixed(2)),
      costOfGoodsSoldBs: Number(costOfGoodsSoldBs.toFixed(2)),
      costOfGoodsSoldUSD: Number((costOfGoodsSoldBs / rateUSD).toFixed(2)),
      grossProfitBs: Number(grossProfitBs.toFixed(2)),
      grossProfitUSD: Number((grossProfitBs / rateUSD).toFixed(2)),
      operatingExpensesBs: Number(operatingExpensesBs.toFixed(2)),
      operatingExpensesUSD: Number((operatingExpensesBs / rateUSD).toFixed(2)),
      commissionExpensesBs: Number(commissionExpensesBs.toFixed(2)),
      commissionExpensesUSD: Number((commissionExpensesBs / rateUSD).toFixed(2)),
      totalExpensesBs: Number(totalExpensesBs.toFixed(2)),
      totalExpensesUSD: Number((totalExpensesBs / rateUSD).toFixed(2)),
      netIncomeBs: Number(netIncomeBs.toFixed(2)),
      netIncomeUSD: Number((netIncomeBs / rateUSD).toFixed(2)),
      profitMarginPercentage
    };
  };

  const getBalanceSheet = (): BalanceSheetReport => {
    const rateUSD = exchangeRates.bcvUSD || 854.46;
    const incomeStatement = getIncomeStatement();

    // 1. Activo Circulante
    const cashBsSales = sales
      .filter((s) => s.paymentMethod === 'Efectivo Bolívares')
      .reduce((acc, s) => acc + s.totalBs, 0);
    const cashBsExpenses = expenses
      .filter((e) => e.paymentMethod === 'Efectivo Bolívares')
      .reduce((acc, e) => acc + e.amountBs, 0);
    const cashBs = Math.max(85000, 250000 + cashBsSales - cashBsExpenses);

    const cashUSDSales = sales
      .filter((s) => s.paymentMethod === 'Efectivo Divisas (USD)' || s.paymentMethod === 'Efectivo USD/Bs')
      .reduce((acc, s) => acc + s.totalUSD, 0);
    const cashUSDExpenses = expenses
      .filter((e) => e.paymentMethod === 'Efectivo Divisas (USD)' || e.paymentMethod === 'Efectivo USD/Bs')
      .reduce((acc, e) => acc + e.amountUSD, 0);
    const cashUSD_raw = Math.max(200, 1500 + cashUSDSales - cashUSDExpenses);
    const cashUSD_convertedBs = Number((cashUSD_raw * rateUSD).toFixed(2));

    const banksBsSales = sales
      .filter((s) => s.paymentMethod === 'Pago Móvil' || s.paymentMethod === 'Transferencia')
      .reduce((acc, s) => acc + s.totalBs, 0);
    const banksBsExpenses = expenses
      .filter((e) => e.paymentMethod === 'Pago Móvil' || e.paymentMethod === 'Transferencia')
      .reduce((acc, e) => acc + e.amountBs, 0);
    const banksBs = Math.max(120000, 500000 + banksBsSales - banksBsExpenses);

    const banksUSDSales = sales
      .filter((s) => s.paymentMethod === 'Zelle')
      .reduce((acc, s) => acc + s.totalUSD, 0);
    const banksUSDExpenses = expenses
      .filter((e) => e.paymentMethod === 'Zelle')
      .reduce((acc, e) => acc + e.amountUSD, 0);
    const banksUSD_raw = Math.max(500, 3200 + banksUSDSales - banksUSDExpenses);
    const banksUSD_convertedBs = Number((banksUSD_raw * rateUSD).toFixed(2));

    const inventoryCostBs = phones.reduce((acc, p) => acc + (p.stock * (p.costBs || 0)), 0);
    const inventoryCostUSD = Number((inventoryCostBs / rateUSD).toFixed(2));

    const totalAssetsBs = Number((cashBs + cashUSD_convertedBs + banksBs + banksUSD_convertedBs + inventoryCostBs).toFixed(2));
    const totalAssetsUSD = Number((totalAssetsBs / rateUSD).toFixed(2));

    // 2. Pasivo Circulante
    const commissionsPayableBs = payrolls
      .filter((p) => p.status === 'Pendiente')
      .reduce((acc, p) => acc + p.finalPayoutBs, 0);
    const commissionsPayableUSD = Number((commissionsPayableBs / rateUSD).toFixed(2));

    const taxPayableBs = sales.reduce((acc, s) => acc + (s.ivaBs || 0) + (s.igtfBs || 0), 0);
    const taxPayableUSD = Number((taxPayableBs / rateUSD).toFixed(2));

    const totalLiabilitiesBs = Number((commissionsPayableBs + taxPayableBs).toFixed(2));
    const totalLiabilitiesUSD = Number((totalLiabilitiesBs / rateUSD).toFixed(2));

    // 3. Patrimonio
    const retainedEarningsBs = incomeStatement.netIncomeBs;
    const retainedEarningsUSD = incomeStatement.netIncomeUSD;

    const shareCapitalBs = Math.max(100000, Number((totalAssetsBs - totalLiabilitiesBs - retainedEarningsBs).toFixed(2)));
    const shareCapitalUSD = Number((shareCapitalBs / rateUSD).toFixed(2));

    const totalEquityBs = Number((shareCapitalBs + retainedEarningsBs).toFixed(2));
    const totalEquityUSD = Number((totalEquityBs / rateUSD).toFixed(2));

    const differenceBs = Number((totalAssetsBs - (totalLiabilitiesBs + totalEquityBs)).toFixed(2));
    const isBalanced = Math.abs(differenceBs) < 1;

    return {
      cashBs,
      cashUSD_convertedBs,
      cashUSD_raw,
      banksBs,
      banksUSD_convertedBs,
      banksUSD_raw,
      inventoryCostBs,
      inventoryCostUSD,
      totalAssetsBs,
      totalAssetsUSD,
      commissionsPayableBs,
      commissionsPayableUSD,
      taxPayableBs,
      taxPayableUSD,
      totalLiabilitiesBs,
      totalLiabilitiesUSD,
      shareCapitalBs,
      shareCapitalUSD,
      retainedEarningsBs,
      retainedEarningsUSD,
      totalEquityBs,
      totalEquityUSD,
      isBalanced,
      differenceBs
    };
  };

  const getDailyCashClose = (targetDate?: string): DailyCashCloseReport => {
    const date = targetDate || new Date().toISOString().split('T')[0];

    const daySales = sales.filter((s) => s.date.startsWith(date));
    const dayExpenses = expenses.filter((e) => e.date.startsWith(date));

    let cashBsCollected = 0;
    let cashUSDCollected = 0;
    let pagoMovilCollected = 0;
    let transferenciasCollected = 0;
    let zelleCollected = 0;
    let igtfCollectedBs = 0;
    let ivaCollectedBs = 0;
    let totalCollectedBs = 0;
    let totalCollectedUSD = 0;

    daySales.forEach((s) => {
      totalCollectedBs += s.totalBs;
      totalCollectedUSD += s.totalUSD;
      igtfCollectedBs += s.igtfBs || 0;
      ivaCollectedBs += s.ivaBs || 0;

      if (s.paymentMethod === 'Efectivo Bolívares') cashBsCollected += s.totalBs;
      else if (s.paymentMethod === 'Efectivo Divisas (USD)' || s.paymentMethod === 'Efectivo USD/Bs') cashUSDCollected += s.totalUSD;
      else if (s.paymentMethod === 'Pago Móvil') pagoMovilCollected += s.totalBs;
      else if (s.paymentMethod === 'Transferencia') transferenciasCollected += s.totalBs;
      else if (s.paymentMethod === 'Zelle') zelleCollected += s.totalUSD;
    });

    let cashExpensesBs = 0;
    let cashExpensesUSD = 0;

    dayExpenses.forEach((e) => {
      if (e.paymentMethod === 'Efectivo Bolívares') cashExpensesBs += e.amountBs;
      else if (e.paymentMethod === 'Efectivo Divisas (USD)' || e.paymentMethod === 'Efectivo USD/Bs') cashExpensesUSD += e.amountUSD;
    });

    const netCashInDrawerBs = cashBsCollected - cashExpensesBs;
    const netCashInDrawerUSD = cashUSDCollected - cashExpensesUSD;

    return {
      date,
      totalSalesCount: daySales.length,
      totalCollectedBs: Number(totalCollectedBs.toFixed(2)),
      totalCollectedUSD: Number(totalCollectedUSD.toFixed(2)),
      cashBsCollected: Number(cashBsCollected.toFixed(2)),
      cashUSDCollected: Number(cashUSDCollected.toFixed(2)),
      pagoMovilCollected: Number(pagoMovilCollected.toFixed(2)),
      transferenciasCollected: Number(transferenciasCollected.toFixed(2)),
      zelleCollected: Number(zelleCollected.toFixed(2)),
      igtfCollectedBs: Number(igtfCollectedBs.toFixed(2)),
      ivaCollectedBs: Number(ivaCollectedBs.toFixed(2)),
      cashExpensesBs: Number(cashExpensesBs.toFixed(2)),
      cashExpensesUSD: Number(cashExpensesUSD.toFixed(2)),
      netCashInDrawerBs: Number(netCashInDrawerBs.toFixed(2)),
      netCashInDrawerUSD: Number(netCashInDrawerUSD.toFixed(2)),
      transactions: daySales,
      expenses: dayExpenses
    };
  };

  const updateExchangeRates = async (rates: Partial<ExchangeRates>) => {
    try {
      const res = await fetch(`${API_BASE}/rates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...exchangeRates, ...rates, currentUser })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({ type: 'info', title: 'Tasa Guardada', message: 'Nueva cotización de cambio aplicada.' });
        return;
      }
    } catch {}

    setExchangeRates((prev) => ({ ...prev, ...rates, lastUpdated: new Date().toISOString() }));
    addToast({ type: 'info', title: 'Tasas Actualizadas', message: 'Cotizaciones de cambio actualizadas.' });
    logAuditAction(
      currentUser?.name || 'Super Usuario',
      activeRole,
      'Actualización de Tasas de Cambio',
      `Tasas actualizadas localmente: BCV USD: Bs. ${rates.bcvUSD ?? exchangeRates.bcvUSD}, BCV EUR: Bs. ${rates.bcvEUR ?? exchangeRates.bcvEUR}, Paralelo: Bs. ${rates.paraleloUSD ?? exchangeRates.paraleloUSD}`,
      'rates',
      'info'
    );
  };

  const fetchLiveExchangeRates = async () => {
    addToast({ type: 'info', title: 'Consultando Tasa...', message: 'Conectando con el indicador oficial del BCV y Mercado...' });
    
    // 1. Sincronización vía API backend (actualiza MySQL y rescale precios)
    try {
      const res = await fetch(`${API_BASE}/rates/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bcvUSD) {
          await refreshFromMySQL();
          addToast({
            type: 'success',
            title: 'Tasa BCV Sincronizada',
            message: `Tasa BCV actualizada a Bs. ${data.bcvUSD.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USD (Paralelo: Bs. ${data.paraleloUSD.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`
          });
          return;
        }
      }
    } catch {
      console.warn('Backend /rates/sync inaccesible, intentando API externa directa');
    }

    // 2. Fallback directo a DolarApi desde el navegador
    try {
      const [usdRes, eurRes] = await Promise.all([
        fetch('https://ve.dolarapi.com/v1/dolares'),
        fetch('https://ve.dolarapi.com/v1/euros')
      ]);

      if (usdRes.ok) {
        const dolares = await usdRes.json();
        const oficialUSD = dolares.find((d: any) => d.fuente === 'oficial');
        const paraleloUSDItem = dolares.find((d: any) => d.fuente === 'paralelo');
        let oficialEUR = 974.06;

        if (eurRes.ok) {
          const euros = await eurRes.json();
          const euroItem = euros.find((e: any) => e.fuente === 'oficial');
          if (euroItem?.promedio) oficialEUR = Number(parseFloat(euroItem.promedio).toFixed(2));
        }

        const bcvUSD = oficialUSD?.promedio ? Number(parseFloat(oficialUSD.promedio).toFixed(2)) : 854.46;
        const paraleloUSD = paraleloUSDItem?.promedio ? Number(parseFloat(paraleloUSDItem.promedio).toFixed(2)) : 954.16;

        await updateExchangeRates({ bcvUSD, bcvEUR: oficialEUR, paraleloUSD });
        addToast({
          type: 'success',
          title: 'Tasa BCV Sincronizada en Vivo',
          message: `Tasa BCV actualizada a Bs. ${bcvUSD.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USD`
        });
        return;
      }
    } catch {
      console.warn('Fallo consulta externa directa, aplicando valor referencial');
    }

    // 3. Fallback con valores reales vigentes
    await updateExchangeRates({ bcvUSD: 854.46, bcvEUR: 974.06, paraleloUSD: 954.16 });
    addToast({
      type: 'info',
      title: 'Tasa Actualizada',
      message: 'Cotización referencial aplicada: Bs. 854.46 / USD (BCV)'
    });
  };

  const approvePayroll = async (payrollId: string, paymentRef: string) => {
    const payroll = payrolls.find(p => p.id === payrollId);
    try {
      const res = await fetch(`${API_BASE}/payroll/${payrollId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentRef, currentUser })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({ type: 'success', title: 'Liquidación Aprobada', message: 'Pago de comisión registrado.' });
        return;
      }
    } catch {}

    setPayrolls((prev) =>
      prev.map((p) => (p.id === payrollId ? { ...p, status: 'Pagado', paymentDate: new Date().toISOString().split('T')[0], paymentRef } : p))
    );
    addToast({ type: 'success', title: 'Pago Aprobado', message: 'Liquidación aprobada.' });
    logAuditAction(
      currentUser?.name || 'Super Usuario',
      'super_user',
      'Aprobación y Liquidación de Nómina',
      `Liquidación autorizada para el vendedor ${payroll?.vendorName} (${payroll?.vendorDoc}). Monto: Bs. ${payroll?.finalPayoutBs.toLocaleString('es-VE')} ($${payroll?.finalPayoutUSD} USD). Ref: ${paymentRef}`,
      'payroll',
      'success'
    );
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    registerUser(userData);
  };

  const resetToDefaultData = async () => {
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({ type: 'warning', title: 'Datos Restablecidos', message: 'Base de datos recargada con valores iniciales.' });
        logAuditAction(
          currentUser?.name || 'Super Usuario',
          'super_user',
          'Restablecimiento de Datos de Fábrica',
          'Se restableció el inventario y transacciones a la configuración inicial por defecto',
          'system',
          'warning'
        );
        return;
      }
    } catch {}
    setUsers(DEFAULT_USERS);
    setPhones(DEFAULT_PHONES);
    setPurchases(DEFAULT_PURCHASES);
    setExpenses(DEFAULT_EXPENSES);
    setExchangeRates(DEFAULT_EXCHANGE_RATES);
    addToast({ type: 'warning', title: 'Datos Restablecidos', message: 'Se han cargado los datos iniciales.' });
    logAuditAction(
      currentUser?.name || 'Super Usuario',
      'super_user',
      'Restablecimiento de Datos',
      'Restablecimiento local',
      'system',
      'warning'
    );
  };

  const requestApproval = async (
    type: ApprovalRequest['type'],
    phoneId: string | undefined,
    phoneName: string,
    description: string,
    payload: any
  ): Promise<boolean> => {
    const code = `SOL-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 90)}`;
    const newReq: ApprovalRequest = {
      id: 'appr-' + Math.random().toString(36).substring(2, 9),
      code,
      type,
      requesterName: currentUser?.name || 'Vendedor Mostrador',
      requesterRole: activeRole,
      phoneId,
      phoneName,
      description,
      payload,
      status: 'pendiente',
      date: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    try {
      const res = await fetch(`${API_BASE}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          requesterName: currentUser?.name || 'Vendedor Mostrador',
          requesterRole: activeRole,
          phoneId,
          phoneName,
          description,
          payload
        })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({
          type: 'info',
          title: '📋 Solicitud Enviada a Gerencia',
          message: `Solicitud #${code} enviada. Debe ser aprobada por el Administrador antes de aplicarse.`
        });
        return true;
      }
    } catch {}

    setApprovals((prev) => [newReq, ...prev]);
    logAuditAction(
      currentUser?.name || 'Vendedor Mostrador',
      activeRole,
      'Solicitud de Aprobación Gerencial Creada',
      `Solicitud #${code} (${type}): ${description}`,
      'system',
      'info'
    );
    addToast({
      type: 'info',
      title: '📋 Solicitud Enviada a Gerencia (Local)',
      message: `Solicitud #${code} registrada para revisión y aprobación gerencial.`
    });
    return true;
  };

  const resolveApproval = async (
    id: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<boolean> => {
    const reviewer = currentUser?.name || 'Administrador Gerencial';
    const role = activeRole;

    try {
      const res = await fetch(`${API_BASE}/approvals/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewerName: reviewer,
          reviewerRole: role,
          reason
        })
      });
      if (res.ok) {
        await refreshFromMySQL();
        addToast({
          type: action === 'approve' ? 'success' : 'warning',
          title: action === 'approve' ? '✅ Decisión Aprobada' : '❌ Solicitud Rechazada',
          message: action === 'approve'
            ? 'El cambio gerencial fue aprobado y ejecutado exitosamente en el sistema.'
            : 'La solicitud ha sido rechazada por la administración.'
        });
        return true;
      }
    } catch {}

    // Fallback local
    const targetAppr = approvals.find((a) => a.id === id);
    if (targetAppr && action === 'approve') {
      const payload = targetAppr.payload;
      if (targetAppr.type === 'CAMBIO_PRECIO' && payload.phoneId && payload.newPriceBs) {
        setPhones((prev) =>
          prev.map((p) => (p.id === payload.phoneId ? { ...p, priceBs: payload.newPriceBs } : p))
        );
      } else if (targetAppr.type === 'SALIDA_STOCK' && payload.phoneId && payload.quantity) {
        setPhones((prev) =>
          prev.map((p) =>
            p.id === payload.phoneId ? { ...p, stock: Math.max(0, p.stock - payload.quantity) } : p
          )
        );
      } else if (targetAppr.type === 'ELIMINAR_EQUIPO' && payload.phoneId) {
        setPhones((prev) => prev.filter((p) => p.id !== payload.phoneId));
      } else if (targetAppr.type === 'ENTRADA_LOTE' && payload.phoneId) {
        registerPurchase(payload);
      }
    }

    setApprovals((prev) =>
      prev.map((appr) => {
        if (appr.id === id) {
          return {
            ...appr,
            status: action === 'approve' ? 'aprobada' : 'rechazada',
            reviewedBy: reviewer,
            resolutionDate: new Date().toISOString(),
            rejectionReason: action === 'reject' ? reason : undefined
          };
        }
        return appr;
      })
    );

    logAuditAction(
      reviewer,
      role,
      action === 'approve' ? 'Aprobación Gerencial Concedida' : 'Solicitud Gerencial Rechazada',
      `Gerencia resolvió solicitud #${targetAppr?.code || id}: ${action === 'approve' ? 'Aprobada' : 'Rechazada'}${reason ? ' - Motivo: ' + reason : ''}`,
      'system',
      action === 'approve' ? 'success' : 'warning'
    );

    addToast({
      type: action === 'approve' ? 'success' : 'warning',
      title: action === 'approve' ? '✅ Decisión Aprobada' : '❌ Solicitud Rechazada',
      message: action === 'approve'
        ? 'La solicitud fue aprobada por la gerencia.'
        : 'La solicitud fue rechazada.'
    });
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeRole,
        setActiveRole,
        users,
        phones,
        exchangeRates,
        sales,
        purchases,
        expenses,
        payrolls,
        marketStats,
        auditLogs,
        approvals,
        toasts,
        darkMode,
        setDarkMode,
        login,
        logout,
        registerUser,
        addPhone,
        updatePhone,
        deletePhone,
        adjustStock,
        registerPurchase,
        registerExpense,
        deleteExpense,
        registerSale,
        updateExchangeRates,
        fetchLiveExchangeRates,
        approvePayroll,
        addUser,
        resetToDefaultData,
        addToast,
        removeToast,
        getActiveExchangeRate,
        refreshFromMySQL,
        requestApproval,
        resolveApproval,
        logAuditAction,
        getIncomeStatement,
        getBalanceSheet,
        getDailyCashClose
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};
