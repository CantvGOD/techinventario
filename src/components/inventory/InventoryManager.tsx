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
import type { PhoneItem } from '../../types';
import {
  validatePrice,
  validateInteger,
  validateReleaseYear
} from '../../utils/validators';
import {
  Smartphone,
  Share2,
  BarChart2,
  Bell,
  Download,
  PackagePlus,
  Plus,
  Search,
  Filter,
  Edit3,
  Sliders,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Package,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const {
    phones,
    addPhone,
    updatePhone,
    deletePhone,
    adjustStock,
    registerPurchase,
    exchangeRates,
    activeRole,
    currentUser,
    logAuditAction,
    addToast,
    approvals,
    requestApproval,
    resolveApproval
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<PhoneItem | null>(null);

  // Estados para nuevas marcas, catálogo de clientes, gráficas y aprobaciones gerenciales
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [copiedCatalog, setCopiedCatalog] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState<{ [id: string]: string }>({});

  // Modal para Ajuste Rápido de Stock (Entradas y Salidas de Inventario)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedPhoneForStock, setSelectedPhoneForStock] = useState<PhoneItem | null>(null);
  const [stockMovementType, setStockMovementType] = useState<'out' | 'in'>('out');
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [stockReason, setStockReason] = useState<string>('Ajuste de inventario por conteo físico');
  const [stockCustomReason, setStockCustomReason] = useState<string>('');
  const [stockModalError, setStockModalError] = useState<string | null>(null);

  // Modal para Entrada de Lote / Compra a Proveedor con Gestión de Costos
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchasePhoneId, setPurchasePhoneId] = useState<string>('');
  const [purchaseSupplier, setPurchaseSupplier] = useState<string>('Distribuidora Mayorista Caracas C.A.');
  const [purchaseInvoice, setPurchaseInvoice] = useState<string>('');
  const [purchaseQty, setPurchaseQty] = useState<number>(5);
  const [purchaseCostUSD, setPurchaseCostUSD] = useState<number>(100);
  const [purchaseCostMethod, setPurchaseCostMethod] = useState<'promedio_ponderado' | 'ultimo_costo'>('promedio_ponderado');
  const [purchaseAdjustPrice, setPurchaseAdjustPrice] = useState<boolean>(false);
  const [purchaseTargetMargin, setPurchaseTargetMargin] = useState<number>(30);
  const [purchaseNewPriceBs, setPurchaseNewPriceBs] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    brand: 'Samsung',
    model: '',
    ram: '8 GB',
    storage: '256 GB',
    color: 'Negro',
    camera: '50 MP',
    screen: '6.5" AMOLED',
    costUSD: 100,
    priceBs: 15000,
    stock: 10,
    minStock: 4,
    category: 'Gama Media' as PhoneItem['category'],
    releaseYear: 2024
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const standardBrands = [
    'Samsung', 'Apple', 'Xiaomi', 'Motorola', 'Google', 'Honor', 'Infinix', 'Tecno', 'Realme', 'Huawei', 'ZTE', 'Oppo', 'Vivo', 'OnePlus', 'Sony', 'Nothing'
  ];
  const brandsList = Array.from(new Set([...phones.map((p) => p.brand), ...standardBrands])).sort();

  const pendingApprovals = approvals.filter((a) => a.status === 'pendiente');

  const filteredPhones = phones.filter((p) => {
    const matchesSearch =
      p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const openAddModal = () => {
    setEditingPhone(null);
    setFormErrors({});
    setIsCustomBrand(false);
    setCustomBrandInput('');
    setFormData({
      brand: 'Samsung',
      model: '',
      ram: '8 GB',
      storage: '256 GB',
      color: 'Negro',
      camera: '50 MP',
      screen: '6.5" AMOLED',
      costUSD: 100,
      priceBs: 150000,
      stock: 10,
      minStock: 4,
      category: 'Gama Media',
      releaseYear: 2024
    });
    setIsModalOpen(true);
  };

  const openEditModal = (phone: PhoneItem) => {
    setEditingPhone(phone);
    setFormErrors({});
    const isCustom = !standardBrands.includes(phone.brand);
    setIsCustomBrand(isCustom);
    setCustomBrandInput(isCustom ? phone.brand : '');
    setFormData({
      brand: phone.brand,
      model: phone.model,
      ram: phone.specs.ram,
      storage: phone.specs.storage,
      color: phone.specs.color,
      camera: phone.specs.camera,
      screen: phone.specs.screen,
      costUSD: phone.costUSD || Number((phone.costBs / exchangeRates.bcvUSD).toFixed(2)) || 100,
      priceBs: phone.priceBs,
      stock: phone.stock,
      minStock: phone.minStock,
      category: phone.category,
      releaseYear: phone.releaseYear
    });
    setIsModalOpen(true);
  };

  const handleCopyWhatsAppCatalog = () => {
    const availablePhones = phones.filter((p) => p.stock > 0);
    let text = `📱 *TECHINVENTARIO - CATÁLOGO OFICIAL DE TELÉFONOS* 📱\n`;
    text += `📅 Actualizado: ${new Date().toLocaleDateString('es-VE')}\n`;
    text += `💵 Tasa Oficial BCV: Bs. ${exchangeRates.bcvUSD.toFixed(2)} / USD\n`;
    text += `✨ *Equipos homologados 100% nuevos en caja sellada con garantía*\n\n`;

    availablePhones.forEach((p, index) => {
      const priceUSD = (p.priceBs / exchangeRates.bcvUSD).toFixed(2);
      text += `${index + 1}. *${p.brand} ${p.model}* (${p.category})\n`;
      text += `   • Memoria / Almacenamiento: ${p.specs.ram} RAM | ${p.specs.storage}\n`;
      text += `   • Pantalla: ${p.specs.screen} | Cámara: ${p.specs.camera}\n`;
      text += `   • Color: ${p.specs.color}\n`;
      text += `   • 💰 *Precio: $${priceUSD} USD* (Bs. ${p.priceBs.toLocaleString('es-VE')})\n`;
      text += `   • Disponibilidad: ✅ *DISPONIBLE EN TIENDA*\n\n`;
    });

    text += `📍 Tienda Física | Envíos a todo el país con cobro en destino.\n`;
    text += `💳 Métodos de Pago: Efectivo divisas, Pago Móvil, Transferencia bancaria, Zelle.\n`;
    text += `¡Haz tu pedido respondiendo a este mensaje! 🚀`;

    navigator.clipboard.writeText(text);
    setCopiedCatalog(true);
    setTimeout(() => setCopiedCatalog(false), 3000);
    addToast({
      type: 'success',
      title: '¡Catálogo Copiado!',
      message: 'Se copió el catálogo completo sin cantidades de inventario, listo para WhatsApp.'
    });
  };

  const openStockModal = (phone: PhoneItem) => {
    setSelectedPhoneForStock(phone);
    setStockMovementType('out');
    setStockQuantity(1);
    setStockReason('Ajuste de inventario por conteo físico');
    setStockCustomReason('');
    setStockModalError(null);
    setIsStockModalOpen(true);
  };

  const openPurchaseModal = (phone?: PhoneItem) => {
    const target = phone || (phones.length > 0 ? phones[0] : null);
    const targetId = target ? target.id : '';
    setPurchasePhoneId(targetId);
    const baseCostUSD = target?.costUSD || 100;
    setPurchaseCostUSD(baseCostUSD);
    setPurchaseSupplier('Distribuidora Mayorista Caracas C.A.');
    setPurchaseInvoice(`FACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setPurchaseQty(5);
    setPurchaseCostMethod('promedio_ponderado');
    setPurchaseAdjustPrice(false);
    setPurchaseTargetMargin(30);

    const suggestedUSD = Number((baseCostUSD * 1.30).toFixed(2));
    const suggestedBs = Number((suggestedUSD * exchangeRates.bcvUSD).toFixed(2));
    setPurchaseNewPriceBs(suggestedBs);

    setPurchaseNotes('Recepción de nuevo lote de inventario');
    setPurchaseError(null);
    setIsPurchaseModalOpen(true);
  };

  const handleStockMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoneForStock) return;

    if (stockQuantity <= 0 || !Number.isInteger(stockQuantity)) {
      setStockModalError('La cantidad debe ser un número entero mayor a 0.');
      return;
    }

    if (stockMovementType === 'out' && stockQuantity > selectedPhoneForStock.stock) {
      setStockModalError(`No se pueden retirar más de las ${selectedPhoneForStock.stock} unidades existentes en inventario.`);
      return;
    }

    const finalReason = stockReason === 'Otro'
      ? (stockCustomReason.trim() || 'Ajuste de almacén')
      : stockReason;

    // Regla de Toma de Decisiones Gerenciales: Usuarios operativos requieren aprobación previa
    if (stockMovementType === 'out' && activeRole !== 'admin' && activeRole !== 'super_user') {
      await requestApproval(
        'SALIDA_STOCK',
        selectedPhoneForStock.id,
        `${selectedPhoneForStock.brand} ${selectedPhoneForStock.model}`,
        `Solicitud de retiro / salida de ${stockQuantity} unidades de "${selectedPhoneForStock.brand} ${selectedPhoneForStock.model}". Motivo: ${finalReason}. (Stock actual: ${selectedPhoneForStock.stock} unids)`,
        {
          phoneId: selectedPhoneForStock.id,
          quantity: stockQuantity,
          reason: finalReason
        }
      );
      setIsStockModalOpen(false);
      setSelectedPhoneForStock(null);
      return;
    }

    setStockModalError(null);
    const success = await adjustStock(
      selectedPhoneForStock.id,
      stockMovementType,
      stockQuantity,
      finalReason
    );

    if (success) {
      setIsStockModalOpen(false);
      setSelectedPhoneForStock(null);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);

    if (!purchasePhoneId) {
      setPurchaseError('Selecciona un equipo para ingresar inventario.');
      return;
    }

    const selPhone = phones.find((p) => p.id === purchasePhoneId);
    if (!selPhone) {
      setPurchaseError('El equipo seleccionado no existe en el catálogo.');
      return;
    }

    if (!purchaseSupplier.trim()) {
      setPurchaseError('Ingresa el nombre del proveedor mayorista.');
      return;
    }

    if (!purchaseInvoice.trim()) {
      setPurchaseError('Ingresa el número de factura o control de compra.');
      return;
    }

    if (purchaseQty <= 0 || !Number.isInteger(purchaseQty)) {
      setPurchaseError('La cantidad recibida debe ser un número entero mayor a 0.');
      return;
    }

    if (purchaseCostUSD <= 0) {
      setPurchaseError('El costo unitario en USD debe ser mayor a 0.');
      return;
    }

    const rateUSD = exchangeRates.bcvUSD;
    const oldStock = selPhone.stock;
    const oldCostUSD = selPhone.costUSD || 0;
    const newStock = oldStock + purchaseQty;

    let resultingCostUSD = purchaseCostUSD;
    if (purchaseCostMethod === 'promedio_ponderado') {
      if (newStock > 0) {
        resultingCostUSD = Number((((oldStock * oldCostUSD) + (purchaseQty * purchaseCostUSD)) / newStock).toFixed(2));
      }
    }

    const resultingCostBs = Number((resultingCostUSD * rateUSD).toFixed(2));
    const effectivePriceBs = purchaseAdjustPrice ? purchaseNewPriceBs : selPhone.priceBs;

    // Regla de Negocio Fundamental: Costo de reposición no puede superar o igualar al precio de venta
    if (effectivePriceBs <= resultingCostBs) {
      setPurchaseError(
        `Regla de Negocio Fundamental Incumplida: El precio de venta (Bs. ${effectivePriceBs.toLocaleString('es-VE')}) no puede ser menor o igual al nuevo costo de reposición (Bs. ${resultingCostBs.toLocaleString('es-VE')}). Debe marcar la casilla para ajustar el precio de venta y garantizar un margen positivo.`
      );
      return;
    }

    // Regla de Toma de Decisiones Gerenciales: Usuarios operativos requieren aprobación previa
    if (activeRole !== 'admin' && activeRole !== 'super_user') {
      await requestApproval(
        'ENTRADA_LOTE',
        purchasePhoneId,
        `${selPhone.brand} ${selPhone.model}`,
        `Recepción de nuevo lote: ${purchaseQty} unids a $${purchaseCostUSD} USD c/u (Proveedor: ${purchaseSupplier.trim()}, Fact: ${purchaseInvoice.trim()}). Costo resultante: $${resultingCostUSD} USD. Precio propuesto: Bs. ${effectivePriceBs.toLocaleString('es-VE')}`,
        {
          phoneId: purchasePhoneId,
          supplier: purchaseSupplier.trim(),
          invoiceNumber: purchaseInvoice.trim(),
          quantity: purchaseQty,
          unitCostUSD: purchaseCostUSD,
          costMethodApplied: purchaseCostMethod,
          newPriceBs: purchaseAdjustPrice ? purchaseNewPriceBs : undefined,
          notes: purchaseNotes.trim()
        }
      );
      setIsPurchaseModalOpen(false);
      setPurchaseNotes('');
      return;
    }

    setIsSubmittingPurchase(true);
    const success = await registerPurchase({
      phoneId: purchasePhoneId,
      supplier: purchaseSupplier.trim(),
      invoiceNumber: purchaseInvoice.trim(),
      quantity: purchaseQty,
      unitCostUSD: purchaseCostUSD,
      costMethodApplied: purchaseCostMethod,
      newPriceBs: purchaseAdjustPrice ? purchaseNewPriceBs : undefined,
      notes: purchaseNotes.trim()
    });
    setIsSubmittingPurchase(false);

    if (success) {
      setIsPurchaseModalOpen(false);
      setPurchaseNotes('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // 1. Modelo
    if (!formData.model.trim() || formData.model.trim().length < 2) {
      errors.model = 'El modelo debe tener al menos 2 caracteres.';
    }

    // 2. RAM y Almacenamiento
    if (!formData.ram.trim()) errors.ram = 'Especifica la memoria RAM.';
    if (!formData.storage.trim()) errors.storage = 'Especifica el almacenamiento.';

    // 3. Color
    if (!formData.color.trim()) errors.color = 'Especifica el color.';

    // 4. Costo y Precio Bs
    const rateUSD = exchangeRates.bcvUSD;
    const costUSD = Number(formData.costUSD) || 0;
    const costBs = Number((costUSD * rateUSD).toFixed(2));

    if (costUSD <= 0) {
      errors.costUSD = 'El costo unitario en USD debe ser mayor a 0.';
    }

    const priceCheck = validatePrice(formData.priceBs);
    if (!priceCheck.isValid) {
      errors.priceBs = priceCheck.error!;
    } else if (Number(formData.priceBs) <= costBs) {
      errors.priceBs = `El precio de venta (Bs. ${Number(formData.priceBs).toLocaleString('es-VE')}) debe ser estrictamente mayor al costo de reposición (Bs. ${costBs.toLocaleString('es-VE')}).`;
    }

    // 5. Stock y Stock Mínimo
    const stockCheck = validateInteger(formData.stock, 0, 10000, 'El stock');
    if (!stockCheck.isValid) errors.stock = stockCheck.error!;

    const minStockCheck = validateInteger(formData.minStock, 1, 500, 'El stock mínimo');
    if (!minStockCheck.isValid) errors.minStock = minStockCheck.error!;

    // 6. Año de Lanzamiento
    const yearCheck = validateReleaseYear(formData.releaseYear);
    if (!yearCheck.isValid) errors.releaseYear = yearCheck.error!;

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      addToast({
        type: 'error',
        title: 'Verificación de teléfono fallida',
        message: 'Revisa los campos obligatorios señalados en rojo.'
      });
      return;
    }

    const profitMargin = costBs > 0 ? Number((((Number(formData.priceBs) - costBs) / costBs) * 100).toFixed(2)) : 30;

    if (editingPhone) {
      if (editingPhone.priceBs !== Number(formData.priceBs) && activeRole !== 'admin' && activeRole !== 'super_user') {
        requestApproval(
          'CAMBIO_PRECIO',
          editingPhone.id,
          `${editingPhone.brand} ${editingPhone.model}`,
          `Modificación de precio de venta: Bs. ${editingPhone.priceBs.toLocaleString('es-VE')} ➔ Bs. ${Number(formData.priceBs).toLocaleString('es-VE')}`,
          {
            phoneId: editingPhone.id,
            newPriceBs: Number(formData.priceBs)
          }
        );
        setIsModalOpen(false);
        setEditingPhone(null);
        return;
      }

      updatePhone({
        ...editingPhone,
        brand: formData.brand,
        model: formData.model.trim(),
        specs: {
          ram: formData.ram.trim(),
          storage: formData.storage.trim(),
          color: formData.color.trim(),
          camera: formData.camera.trim(),
          screen: formData.screen.trim()
        },
        costUSD,
        costBs,
        profitMargin,
        priceBs: Number(formData.priceBs),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        category: formData.category,
        releaseYear: Number(formData.releaseYear)
      });
    } else {
      addPhone({
        brand: formData.brand,
        model: formData.model.trim(),
        specs: {
          ram: formData.ram.trim(),
          storage: formData.storage.trim(),
          color: formData.color.trim(),
          camera: formData.camera.trim(),
          screen: formData.screen.trim()
        },
        costUSD,
        costBs,
        lastCostUSD: costUSD,
        avgCostUSD: costUSD,
        costMethod: 'promedio_ponderado',
        profitMargin,
        priceBs: Number(formData.priceBs),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        category: formData.category,
        releaseYear: Number(formData.releaseYear)
      });
    }
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Marca,Modelo,Gama,Precio_Bs,Precio_USD,Precio_EUR,Stock,Stock_Minimo\n' +
      phones
        .map((p) => {
          const usd = (p.priceBs / exchangeRates.bcvUSD).toFixed(2);
          const eur = (p.priceBs / exchangeRates.bcvEUR).toFixed(2);
          return `"${p.id}","${p.brand}","${p.model}","${p.category}",${p.priceBs},${usd},${eur},${p.stock},${p.minStock}`;
        })
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventario_Telefonos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Inventario Exportado',
      message: 'Se descargó el reporte de teléfonos en formato CSV.'
    });

    logAuditAction(
      currentUser?.name || 'Administrador',
      activeRole,
      'Exportación de Inventario',
      `El usuario descargó el catálogo completo de inventario (${phones.length} teléfonos) en formato CSV.`,
      'inventory',
      'info'
    );
  };

  const totalUnits = phones.reduce((acc, p) => acc + p.stock, 0);
  const totalValUSD = phones.reduce((acc, p) => acc + (p.stock * (p.costUSD || (p.costBs / exchangeRates.bcvUSD))), 0);
  const totalValBs = Number((totalValUSD * exchangeRates.bcvUSD).toFixed(2));
  const lowStockCount = phones.filter((p) => p.stock <= p.minStock).length;
  const avgMargin = phones.length > 0 ? (phones.reduce((acc, p) => acc + (p.profitMargin || 30), 0) / phones.length).toFixed(1) : '30';

  const brandStockData = Object.entries(
    phones.reduce((acc, p) => {
      acc[p.brand] = (acc[p.brand] || 0) + p.stock;
      return acc;
    }, {} as { [key: string]: number })
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const categoryStockData = ['Gama Alta', 'Gama Media', 'Gama Entrada'].map((cat) => ({
    name: cat,
    unidades: phones.filter((p) => p.category === cat).reduce((acc, p) => acc + p.stock, 0),
    modelos: phones.filter((p) => p.category === cat).length
  }));

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];

  return (
    <div className="space-y-6">
      
      {/* Header Unificado Moderno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-blue-600" />
            Inventario de Teléfonos y Equipos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Catálogo operativo con costeo continuo (Promedio Ponderado / Último Costo) y multimoneda (Bs., USD, EUR).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Catálogo para Clientes */}
          <button
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold border border-indigo-200/80 transition-all shadow-xs cursor-pointer"
            title="Compartir catálogo con clientes (fichas técnicas y precios sin cantidades de stock)"
          >
            <Share2 className="w-4 h-4 text-indigo-600" />
            <span>Catálogo Clientes</span>
          </button>

          {/* Botón Gráficas y Estadísticas */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 transition-all shadow-xs cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>{showStats ? 'Ocultar Gráficas' : 'Ver Estadísticas'}</span>
          </button>

          {/* Botón Decisiones Gerenciales */}
          {(activeRole === 'admin' || activeRole === 'super_user') && (
            <button
              onClick={() => setShowApprovalsModal(true)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Decisiones</span>
              {pendingApprovals.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 transition-all shadow-xs cursor-pointer"
            title="Exportar inventario en formato CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => openPurchaseModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            title="Ingreso de nuevo lote de mercancía"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Entrada / Lote</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Teléfono</span>
          </button>
        </div>
      </div>

      {/* Sección de Estadísticas y Gráficas Interactivas */}
      {showStats && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Métricas y Distribución de Stock en Almacén
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
              Tasa BCV: Bs. {exchangeRates.bcvUSD.toFixed(2)}/USD
            </span>
          </div>

          {/* KPI Cards Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidades Totales</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black text-slate-900 mt-2 block">{totalUnits} unids</span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">{phones.length} modelos en catálogo</span>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valoración Almacén</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black text-emerald-700 mt-2 block">
                ${totalValUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-bold text-slate-500 mt-0.5 block">Bs. {totalValBs.toLocaleString('es-VE')}</span>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margen Ponderado</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black text-indigo-700 mt-2 block">+{avgMargin}%</span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">Sobre costo de reposición</span>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
              lowStockCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Crítico</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <span className={`text-2xl font-black mt-2 block ${lowStockCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
                {lowStockCount} equipos
              </span>
              <span className={`text-[11px] font-medium mt-0.5 block ${lowStockCount > 0 ? 'text-amber-800 font-bold' : 'text-slate-500'}`}>
                {lowStockCount > 0 ? 'Requieren reposición urgente' : 'Existencias saludables'}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Gráfica 1: Stock por Marca */}
            <div className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Participación de Stock por Marca
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Unidades en existencias</span>
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brandStockData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={35}
                      paddingAngle={3}
                      label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {brandStockData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} unidades`, 'Existencia']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica 2: Equipos por Gama */}
            <div className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Distribución de Existencias por Gama
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Unidades en almacén</span>
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val: any) => [`${val} unids`, 'Inventario']} />
                    <Bar dataKey="unidades" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {categoryStockData.map((_, index) => (
                        <Cell key={`bar-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#3b82f6' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar Unificada */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Marca:</span>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold outline-none focus:border-blue-500 text-xs cursor-pointer"
          >
            <option value="all">Todas las marcas ({phones.length})</option>
            {brandsList.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Phone Catalog Table Unificada */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                <th className="p-3.5">Marca y Modelo</th>
                <th className="p-3.5">Gama</th>
                <th className="p-3.5">Stock Disp.</th>
                <th className="p-3.5">Costo Reposición</th>
                <th className="p-3.5">Precio Venta (Bs.)</th>
                <th className="p-3.5">Precio USD ($)</th>
                <th className="p-3.5">Margen</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPhones.map((phone) => {
                const usd = (phone.priceBs / exchangeRates.bcvUSD).toFixed(2);
                const isLowStock = phone.stock <= phone.minStock;
                const costUSD = phone.costUSD || (phone.costBs > 0 ? (phone.costBs / exchangeRates.bcvUSD) : 0);
                const costBs = phone.costBs || (costUSD * exchangeRates.bcvUSD);
                const margin = costBs > 0 ? (((phone.priceBs - costBs) / costBs) * 100).toFixed(1) : '0';
                const isMarginHealthy = Number(margin) >= 20;

                return (
                  <tr key={phone.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 text-sm">{phone.brand} {phone.model}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{phone.specs.ram} • {phone.specs.storage} • {phone.specs.color}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                        {phone.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-xs ${
                        isLowStock
                          ? 'text-amber-800 bg-amber-100/80 border border-amber-300'
                          : 'text-emerald-700 bg-emerald-50'
                      }`}>
                        {phone.stock} unids {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-600 inline" />}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">${costUSD.toFixed(2)} USD</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Bs. {costBs.toLocaleString('es-VE')}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold inline-block mt-0.5">
                        {phone.costMethod === 'promedio_ponderado' ? 'Promedio' : 'Último'}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-slate-900 font-mono">
                      Bs. {phone.priceBs.toLocaleString('es-VE')}
                    </td>
                    <td className="p-3.5 font-black text-emerald-700 font-mono text-sm">
                      ${usd}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                        isMarginHealthy
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : Number(margin) > 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        +{margin}%
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openPurchaseModal(phone)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Registrar nueva compra o lote de reposición"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Lote</span>
                        </button>
                        <button
                          onClick={() => openEditModal(phone)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Modificar datos del equipo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => openStockModal(phone)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Ajustar entradas o salidas físicas de stock"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Stock</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (activeRole !== 'admin' && activeRole !== 'super_user') {
                              await requestApproval(
                                'ELIMINAR_EQUIPO',
                                phone.id,
                                `${phone.brand} ${phone.model}`,
                                `Solicitud de baja y desincorporación total del equipo "${phone.brand} ${phone.model}" (${phone.stock} unids en existencia)`,
                                { phoneId: phone.id }
                              );
                              return;
                            }
                            if (window.confirm(`¿Estás seguro de dar de baja "${phone.brand} ${phone.model}" del inventario?\n\n⚠️ Se eliminarán del sistema ${phone.stock} unidades en existencia.\nEsta acción quedará registrada en el historial confidencial de auditoría.`)) {
                              deletePhone(phone.id, `Baja y desincorporación total de ${phone.stock} unidades de inventario`);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar del catálogo y desincorporar existencias"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit with Validations */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span>{editingPhone ? 'Modificar Teléfono en Inventario' : 'Registrar Nuevo Teléfono'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-bold">Marca</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBrand(!isCustomBrand);
                        if (!isCustomBrand) {
                          setFormData({ ...formData, brand: customBrandInput || '' });
                        } else {
                          setFormData({ ...formData, brand: 'Samsung' });
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                    >
                      {isCustomBrand ? '↩️ Lista' : '+ Otra marca'}
                    </button>
                  </div>
                  {isCustomBrand ? (
                    <input
                      type="text"
                      placeholder="Escribe la marca..."
                      value={formData.brand}
                      onChange={(e) => {
                        setFormData({ ...formData, brand: e.target.value });
                        setCustomBrandInput(e.target.value);
                      }}
                      className="w-full p-2.5 border-2 border-blue-500 rounded-xl bg-blue-50/20 font-bold text-slate-900 outline-none"
                    />
                  ) : (
                    <select
                      value={formData.brand}
                      onChange={(e) => {
                        if (e.target.value === '__other__') {
                          setIsCustomBrand(true);
                          setFormData({ ...formData, brand: '' });
                        } else {
                          setFormData({ ...formData, brand: e.target.value });
                        }
                      }}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-semibold outline-none focus:border-blue-500"
                    >
                      {brandsList.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="__other__">+ Otra marca personalizada...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Galaxy S24 Ultra"
                    value={formData.model}
                    onChange={(e) => {
                      setFormData({ ...formData, model: e.target.value });
                      if (formErrors.model) setFormErrors({ ...formErrors, model: '' });
                    }}
                    className={`w-full p-2.5 border rounded-xl font-bold text-slate-900 transition-colors ${
                      formErrors.model ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                    }`}
                  />
                  {formErrors.model && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 inline" /> {formErrors.model}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">RAM</label>
                  <input
                    type="text"
                    placeholder="Ej: 8 GB"
                    value={formData.ram}
                    onChange={(e) => {
                      setFormData({ ...formData, ram: e.target.value });
                      if (formErrors.ram) setFormErrors({ ...formErrors, ram: '' });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                  {formErrors.ram && <p className="text-[10px] text-red-600 mt-0.5">{formErrors.ram}</p>}
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Almacenamiento</label>
                  <input
                    type="text"
                    placeholder="Ej: 256 GB"
                    value={formData.storage}
                    onChange={(e) => {
                      setFormData({ ...formData, storage: e.target.value });
                      if (formErrors.storage) setFormErrors({ ...formErrors, storage: '' });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                  {formErrors.storage && <p className="text-[10px] text-red-600 mt-0.5">{formErrors.storage}</p>}
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Color</label>
                  <input
                    type="text"
                    placeholder="Ej: Titanium"
                    value={formData.color}
                    onChange={(e) => {
                      setFormData({ ...formData, color: e.target.value });
                      if (formErrors.color) setFormErrors({ ...formErrors, color: '' });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                  {formErrors.color && <p className="text-[10px] text-red-600 mt-0.5">{formErrors.color}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Cámara</label>
                  <input
                    type="text"
                    placeholder="Ej: 50 MP"
                    value={formData.camera}
                    onChange={(e) => setFormData({ ...formData, camera: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Pantalla</label>
                  <input
                    type="text"
                    placeholder="Ej: 6.7 AMOLED"
                    value={formData.screen}
                    onChange={(e) => setFormData({ ...formData, screen: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    Costo ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.costUSD}
                    onChange={(e) => {
                      setFormData({ ...formData, costUSD: parseFloat(e.target.value) || 0 });
                      if (formErrors.costUSD) setFormErrors({ ...formErrors, costUSD: '' });
                    }}
                    className={`w-full p-2 border rounded-xl font-bold ${
                      formErrors.costUSD ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                    }`}
                  />
                  {formErrors.costUSD && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">{formErrors.costUSD}</p>
                  )}
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                    = Bs. {(formData.costUSD * exchangeRates.bcvUSD).toLocaleString('es-VE')}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    Precio (Bs.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.priceBs}
                    onChange={(e) => {
                      setFormData({ ...formData, priceBs: parseFloat(e.target.value) || 0 });
                      if (formErrors.priceBs) setFormErrors({ ...formErrors, priceBs: '' });
                    }}
                    className={`w-full p-2 border rounded-xl font-bold ${
                      formErrors.priceBs ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                    }`}
                  />
                  {formErrors.priceBs && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">{formErrors.priceBs}</p>
                  )}
                  <span className="text-[9px] text-emerald-700 font-bold block mt-0.5 font-mono">
                    = ${(formData.priceBs / exchangeRates.bcvUSD).toFixed(2)} USD
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 });
                      if (formErrors.stock) setFormErrors({ ...formErrors, stock: '' });
                    }}
                    className={`w-full p-2 border rounded-xl font-bold ${
                      formErrors.stock ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                    }`}
                  />
                  {formErrors.stock && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">{formErrors.stock}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Mínimo Alerta</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => {
                      setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 1 });
                      if (formErrors.minStock) setFormErrors({ ...formErrors, minStock: '' });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Profitability live indicator */}
              {(() => {
                const costBs = formData.costUSD * exchangeRates.bcvUSD;
                const margin = costBs > 0 ? (((formData.priceBs - costBs) / costBs) * 100).toFixed(1) : '0';
                const isUnderCost = formData.priceBs <= costBs;
                return (
                  <div className={`p-3 rounded-xl border text-xs flex justify-between items-center font-bold ${
                    isUnderCost
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {isUnderCost ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <TrendingUp className="w-4 h-4 text-emerald-600" />}
                      {isUnderCost ? 'ALERTA: Precio de venta no cubre costo de reposición' : 'Margen Bruto Calculado:'}
                    </span>
                    <span className="text-sm font-black">
                      {isUnderCost ? 'PÉRDIDA (Incumple Regla)' : `+${margin}% sobre costo`}
                    </span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Gama</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Gama Alta">Gama Alta</option>
                    <option value="Gama Media">Gama Media</option>
                    <option value="Gama Entrada">Gama Entrada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Año de Lanzamiento</label>
                  <input
                    type="number"
                    min="2010"
                    max="2030"
                    value={formData.releaseYear}
                    onChange={(e) => {
                      setFormData({ ...formData, releaseYear: parseInt(e.target.value, 10) || 2024 });
                      if (formErrors.releaseYear) setFormErrors({ ...formErrors, releaseYear: '' });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
                  />
                  {formErrors.releaseYear && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">{formErrors.releaseYear}</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex justify-between font-bold text-blue-900 text-xs">
                <span>Conversión en tiempo real:</span>
                <span>
                  ${(formData.priceBs / exchangeRates.bcvUSD).toFixed(2)} USD | €{(formData.priceBs / exchangeRates.bcvEUR).toFixed(2)} EUR
                </span>
              </div>

              {editingPhone && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-medium flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>
                    <b>Auditoría automática:</b> Cada cambio en stock, precio o especificaciones quedará registrado con el valor anterior y nuevo en el historial de auditoría.
                  </span>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {editingPhone ? 'Guardar Cambios' : 'Registrar Teléfono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste Rápido de Stock */}
      {isStockModalOpen && selectedPhoneForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  Movimiento de Stock
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  {selectedPhoneForStock.brand} {selectedPhoneForStock.model}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsStockModalOpen(false);
                  setSelectedPhoneForStock(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stock Indicator */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Stock Actual en Bodega:</span>
              <span className="font-black text-slate-900 text-sm bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                {selectedPhoneForStock.stock} unidades
              </span>
            </div>

            <form onSubmit={handleStockMovementSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">Tipo de Operación:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStockMovementType('out');
                      setStockReason('Ajuste de inventario por conteo físico');
                      setStockModalError(null);
                    }}
                    className={`p-3 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      stockMovementType === 'out'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs ring-1 ring-rose-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <ArrowDownRight className="w-4 h-4 text-rose-600" />
                      <span>Quitar / Salida</span>
                    </div>
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Merma, daño o retiro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStockMovementType('in');
                      setStockReason('Recepción de nuevo lote de importación');
                      setStockModalError(null);
                    }}
                    className={`p-3 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      stockMovementType === 'in'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span>Ingresar / Entrada</span>
                    </div>
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Nuevo lote o reposición</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Cantidad de unidades a {stockMovementType === 'out' ? 'retirar' : 'incorporar'}:
                </label>
                <input
                  type="number"
                  min="1"
                  max={stockMovementType === 'out' ? selectedPhoneForStock.stock : 10000}
                  value={stockQuantity}
                  onChange={(e) => {
                    setStockQuantity(parseInt(e.target.value, 10) || 1);
                    setStockModalError(null);
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Motivo / Justificación del Movimiento:
                </label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium outline-none focus:border-blue-600 text-xs"
                >
                  {stockMovementType === 'out' ? (
                    <>
                      <option value="Ajuste de inventario por conteo físico">Ajuste de inventario por conteo físico</option>
                      <option value="Equipos dañados / defectuosos dados de baja">Equipos dañados / defectuosos dados de baja</option>
                      <option value="Devolución / Garantía a distribuidor">Devolución / Garantía a distribuidor</option>
                      <option value="Uso de exhibición / Demostración en tienda">Uso de exhibición / Demostración en tienda</option>
                      <option value="Merma o desincorporación por obsolescencia">Merma o desincorporación por obsolescencia</option>
                      <option value="Otro">Otro motivo (especificar abajo)...</option>
                    </>
                  ) : (
                    <>
                      <option value="Recepción de nuevo lote de importación">Recepción de nuevo lote de importación</option>
                      <option value="Reposición regular de almacén central">Reposición regular de almacén central</option>
                      <option value="Ajuste de inventario por conteo físico">Ajuste de inventario por conteo físico</option>
                      <option value="Reintegro por devolución de cliente">Reintegro por devolución de cliente</option>
                      <option value="Otro">Otro motivo (especificar abajo)...</option>
                    </>
                  )}
                </select>

                {stockReason === 'Otro' && (
                  <input
                    type="text"
                    placeholder="Escribe el motivo detallado..."
                    value={stockCustomReason}
                    onChange={(e) => setStockCustomReason(e.target.value)}
                    className="w-full mt-2 p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-xs"
                  />
                )}
              </div>

              {stockModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{stockModalError}</span>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Resultado del movimiento:</div>
                <div className="flex justify-between items-center font-bold">
                  <span>Stock Resultante:</span>
                  <span className={`text-sm font-black ${stockMovementType === 'out' ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {stockMovementType === 'out'
                      ? `${selectedPhoneForStock.stock} ➔ ${Math.max(0, selectedPhoneForStock.stock - stockQuantity)} unids (-${stockQuantity})`
                      : `${selectedPhoneForStock.stock} ➔ ${selectedPhoneForStock.stock + stockQuantity} unids (+${stockQuantity})`
                    }
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1.5 border-t border-slate-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Registrado automáticamente en la auditoría confidencial.</span>
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockModalOpen(false);
                    setSelectedPhoneForStock(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer ${
                    stockMovementType === 'out'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {stockMovementType === 'out' ? 'Confirmar Retiro' : 'Confirmar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Recepción de Mercancía / Compra de Lote */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-2xl w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-emerald-600" />
                  Recepción de Mercancía / Compra de Lote
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro de costos de adquisición, método de valuación y fijación del precio de venta según regla de reposición.
                </p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  Teléfono / Equipo a Ingresar <span className="text-red-500">*</span>
                </label>
                <select
                  value={purchasePhoneId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setPurchasePhoneId(pid);
                    const p = phones.find(x => x.id === pid);
                    if (p) {
                      setPurchaseCostUSD(p.costUSD || 100);
                      const baseUSD = p.costUSD || 100;
                      const sugBs = Number(((baseUSD * 1.30) * exchangeRates.bcvUSD).toFixed(2));
                      setPurchaseNewPriceBs(sugBs);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-900 outline-none focus:border-blue-600"
                >
                  {phones.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} {p.model} — Stock: {p.stock} unids | Costo actual: ${(p.costUSD || 0).toFixed(2)} USD | Precio: Bs. {p.priceBs.toLocaleString('es-VE')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Proveedor Mayorista / Distribuidora <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Distribuidora Telecom Caracas C.A."
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Nro. de Factura / Control Fiscal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: FACT-2024-9021"
                    value={purchaseInvoice}
                    onChange={(e) => setPurchaseInvoice(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Cantidad Recibida <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-black text-sm text-center outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Costo Compra USD ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={purchaseCostUSD}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setPurchaseCostUSD(cost);
                      const sugBs = Number(((cost * (1 + purchaseTargetMargin / 100)) * exchangeRates.bcvUSD).toFixed(2));
                      setPurchaseNewPriceBs(sugBs);
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-black text-sm text-center outline-none focus:border-blue-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Costo en Bolívares
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 text-center font-mono">
                    Bs. {(purchaseCostUSD * exchangeRates.bcvUSD).toLocaleString('es-VE')}
                  </div>
                </div>
              </div>

              {(() => {
                const sel = phones.find(p => p.id === purchasePhoneId);
                const oldStock = sel?.stock || 0;
                const oldCostUSD = sel?.costUSD || 0;
                const newStock = oldStock + purchaseQty;
                const weightedUSD = newStock > 0 ? Number((((oldStock * oldCostUSD) + (purchaseQty * purchaseCostUSD)) / newStock).toFixed(2)) : purchaseCostUSD;
                const effectiveCostUSD = purchaseCostMethod === 'promedio_ponderado' ? weightedUSD : purchaseCostUSD;
                const effectiveCostBs = Number((effectiveCostUSD * exchangeRates.bcvUSD).toFixed(2));
                const currentPriceBs = sel?.priceBs || 0;
                const currentPriceUSD = Number((currentPriceBs / exchangeRates.bcvUSD).toFixed(2));
                const costExceedsPrice = effectiveCostBs >= currentPriceBs;

                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 mb-1.5 font-bold">
                        Criterio / Método para Calcular el Costo de Inventario:
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPurchaseCostMethod('promedio_ponderado')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            purchaseCostMethod === 'promedio_ponderado'
                              ? 'bg-blue-50/70 border-blue-500 text-blue-950 ring-1 ring-blue-500'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-extrabold flex items-center justify-between">
                            <span>Costo Promedio Ponderado</span>
                            <span className="text-xs font-black text-blue-700 font-mono">${weightedUSD}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Pondera {oldStock} unids viejas (${oldCostUSD}) con {purchaseQty} nuevas (${purchaseCostUSD}).
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPurchaseCostMethod('ultimo_costo')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            purchaseCostMethod === 'ultimo_costo'
                              ? 'bg-blue-50/70 border-blue-500 text-blue-950 ring-1 ring-blue-500'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-extrabold flex items-center justify-between">
                            <span>Último Precio de Costo</span>
                            <span className="text-xs font-black text-blue-700 font-mono">${purchaseCostUSD}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Fija el costo de reposición íntegro al valor de la factura más reciente.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Nuevo Costo Unitario Registrado:</span>
                        <span className="font-black text-slate-900 text-sm font-mono">
                          ${effectiveCostUSD.toFixed(2)} USD / Bs. {effectiveCostBs.toLocaleString('es-VE')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Stock resultante en bodega:</span>
                        <span className="font-bold text-slate-800">{oldStock} + {purchaseQty} = {newStock} unidades</span>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border transition-all ${
                      costExceedsPrice
                        ? 'bg-rose-50/70 border-rose-300 text-rose-900'
                        : 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                    }`}>
                      <div className="flex items-start gap-2.5">
                        {costExceedsPrice ? (
                          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        )}
                        <div className="space-y-1 flex-1">
                          <h4 className="font-extrabold text-xs">
                            {costExceedsPrice
                              ? '¡ALERTA CRÍTICA: REGLA FUNDAMENTAL DE REPOSICIÓN!'
                              : 'Precio de Venta Actual Cubre el Costo de Reposición'}
                          </h4>
                          <p className="text-[11px] leading-relaxed">
                            {costExceedsPrice
                              ? `La mercancía llegó a un costo mayor ($${effectiveCostUSD.toFixed(2)} USD). El precio de venta actual ($${currentPriceUSD.toFixed(2)} USD / Bs. ${currentPriceBs.toLocaleString('es-VE')}) no cubre la reposición. De acuerdo a la regla contable del negocio, el precio de venta nunca puede ser menor o igual al costo de reposición.`
                              : `El precio actual es de $${currentPriceUSD.toFixed(2)} USD frente a un costo de $${effectiveCostUSD.toFixed(2)} USD. Puede mantener el precio actual o ajustarlo para optimizar su margen.`}
                          </p>

                          <div className="pt-2 border-t border-slate-200/60 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                              <input
                                type="checkbox"
                                checked={purchaseAdjustPrice || costExceedsPrice}
                                onChange={(e) => setPurchaseAdjustPrice(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                              />
                              <span>Reevaluar y ajustar precio de venta para este lote de inventario</span>
                            </label>
                          </div>

                          {(purchaseAdjustPrice || costExceedsPrice) && (
                            <div className="mt-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 text-slate-800">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-600 text-[11px]">Margen deseado sobre costo:</span>
                                <div className="flex gap-1.5">
                                  {[25, 30, 35, 40].map((m) => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        setPurchaseTargetMargin(m);
                                        const sugUSD = Number((effectiveCostUSD * (1 + m / 100)).toFixed(2));
                                        const sugBs = Number((sugUSD * exchangeRates.bcvUSD).toFixed(2));
                                        setPurchaseNewPriceBs(sugBs);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                        purchaseTargetMargin === m
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                      }`}
                                    >
                                      {m}%
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-slate-600 mb-0.5 font-semibold text-[10px]">
                                    Nuevo Precio Venta en Bolívares (Bs.):
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={purchaseNewPriceBs}
                                    onChange={(e) => setPurchaseNewPriceBs(parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-slate-200 rounded-lg font-black text-xs outline-none focus:border-blue-600 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 mb-0.5 font-semibold text-[10px]">
                                    Equivalente en Dólares (USD):
                                  </label>
                                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-black text-xs text-emerald-700 text-center font-mono">
                                    ${(purchaseNewPriceBs / exchangeRates.bcvUSD).toFixed(2)} USD
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Notas / Observaciones de la Compra:</label>
                <input
                  type="text"
                  placeholder="Detalles del embarque, condición del lote o proveedor..."
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-xs"
                />
              </div>

              {purchaseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{purchaseError}</span>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPurchase}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>{isSubmittingPurchase ? 'Guardando...' : 'Confirmar e Ingresar Lote'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 1: Catálogo Oficial para Clientes */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-4xl w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                  Catálogo Oficial para Clientes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fichas técnicas y precios actualizados en Bolívares y Dólares. Se ocultan las cantidades exactas de inventario por confidencialidad.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyWhatsAppCatalog}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCatalog ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCatalog ? '¡Copiado!' : 'Copiar para WhatsApp'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <strong>Modo Cliente Seguro:</strong> Todo el catálogo se muestra con estado "Disponible" omitiendo el número de unidades en bodega.
              </span>
              <span className="font-bold text-indigo-700 font-mono">Tasa BCV: Bs. {exchangeRates.bcvUSD.toFixed(2)}/USD</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {phones.filter((p) => p.stock > 0).map((p) => {
                const usd = (p.priceBs / exchangeRates.bcvUSD).toFixed(2);
                return (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 transition-all shadow-xs space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{p.brand}</span>
                        <h4 className="font-black text-sm text-slate-900">{p.model}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Disponible
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div><span className="font-semibold text-slate-400">RAM:</span> {p.specs.ram}</div>
                      <div><span className="font-semibold text-slate-400">Memoria:</span> {p.specs.storage}</div>
                      <div><span className="font-semibold text-slate-400">Pantalla:</span> {p.specs.screen}</div>
                      <div><span className="font-semibold text-slate-400">Cámara:</span> {p.specs.camera}</div>
                      <div className="col-span-2"><span className="font-semibold text-slate-400">Color:</span> {p.specs.color}</div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Precio en Bolívares</span>
                        <span className="text-sm font-black text-slate-900 font-mono">Bs. {p.priceBs.toLocaleString('es-VE')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 block font-semibold uppercase">Precio en Dólares</span>
                        <span className="text-base font-black text-emerald-700 font-mono">${usd} USD</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Panel de Toma de Decisiones Gerenciales */}
      {showApprovalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-3xl w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Panel de Toma de Decisiones y Aprobaciones Gerenciales
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revisión y autorización obligatoria de cambios críticos solicitados por personal operativo (precios, stock y bajas).
                </p>
              </div>
              <button
                onClick={() => setShowApprovalsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Solicitudes Pendientes ({pendingApprovals.length})</span>
                <span className="text-[11px] text-amber-600 font-semibold font-mono">Requieren Firma Gerencial</span>
              </h4>

              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No hay decisiones gerenciales pendientes</p>
                  <p className="text-[11px] text-slate-500">Todas las solicitudes operativas han sido procesadas o autorizadas.</p>
                </div>
              ) : (
                pendingApprovals.map((appr) => (
                  <div key={appr.id} className="p-4 bg-amber-50/40 border border-amber-200 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-md text-[10px]">
                            {appr.code}
                          </span>
                          <span className="font-black text-slate-900 text-sm">{appr.phoneName}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Solicitado por: <strong>{appr.requesterName}</strong> ({appr.requesterRole}) el {appr.date}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                        {appr.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-amber-200 text-slate-800 font-medium">
                      {appr.description}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-amber-200">
                      <input
                        type="text"
                        placeholder="Motivo (opcional si rechaza)..."
                        value={rejectReasonText[appr.id] || ''}
                        onChange={(e) => setRejectReasonText({ ...rejectReasonText, [appr.id]: e.target.value })}
                        className="w-full sm:w-64 p-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                      />

                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => resolveApproval(appr.id, 'reject', rejectReasonText[appr.id])}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => resolveApproval(appr.id, 'approve')}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Aprobar y Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Historial de Decisiones Recientes ({approvals.filter(a => a.status !== 'pendiente').length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {approvals.filter(a => a.status !== 'pendiente').map((appr) => (
                  <div key={appr.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-mono font-bold mr-2 text-slate-500">{appr.code}</span>
                      <span className="font-semibold text-slate-800">{appr.phoneName}</span>
                      <span className="text-slate-400 ml-1.5">por {appr.requesterName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        appr.status === 'aprobada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {appr.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
