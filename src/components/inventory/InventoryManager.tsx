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
        lastCostUSD: costUSD,
        avgCostUSD: costUSD,
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

  const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>📱</span> Inventario de Teléfonos y Equipos
          </h2>
          <p className="text-xs text-slate-600">Catálogo con cálculo automático multi-moneda (Bolívares, Dólares y Euros).</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Botón Catálogo para Clientes */}
          <button
            onClick={() => setShowCatalogModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            title="Compartir catálogo con clientes (fichas técnicas y precios sin cantidades de stock)"
          >
            📤 Catálogo para Clientes
          </button>

          {/* Botón Gráficas y Estadísticas */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-slate-300 flex items-center gap-1.5"
          >
            📊 {showStats ? 'Ocultar Gráficas' : 'Ver Estadísticas'}
          </button>

          {/* Botón Decisiones Gerenciales */}
          {(activeRole === 'admin' || activeRole === 'super_user') && (
            <button
              onClick={() => setShowApprovalsModal(true)}
              className="relative bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              🔔 Decisiones Gerenciales
              {pendingApprovals.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            📥 Exportar CSV
          </button>

          <button
            onClick={() => openPurchaseModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            title="Ingreso de nuevo lote de mercancía"
          >
            📦 Entrada / Compra Lote
          </button>

          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            + Agregar Teléfono
          </button>
        </div>
      </div>

      {/* Sección de Estadísticas y Gráficas Interactivas */}
      {showStats && (
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>📈</span> Estadísticas de Inventario y Distribución de Stock
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">Tasa: Bs. {exchangeRates.bcvUSD.toFixed(2)}/USD</span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-[11px] text-blue-700 font-semibold block">Total Unidades en Almacén</span>
              <span className="text-xl font-black text-blue-950">{totalUnits} unids</span>
              <span className="text-[10px] text-blue-600 block mt-0.5">{phones.length} modelos distintos</span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] text-emerald-700 font-semibold block">Valoración de Inventario</span>
              <span className="text-base font-black text-emerald-950">${totalValUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
              <span className="text-[10px] text-emerald-600 block font-bold">Bs. {totalValBs.toLocaleString('es-VE')}</span>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <span className="text-[11px] text-indigo-700 font-semibold block">Margen Promedio Ponderado</span>
              <span className="text-xl font-black text-indigo-950">+{avgMargin}%</span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">Sobre costo de reposición</span>
            </div>

            <div className={`p-3 rounded-xl border ${lowStockCount > 0 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <span className="text-[11px] font-semibold block">Stock Crítico / Alerta</span>
              <span className="text-xl font-black">{lowStockCount} equipos</span>
              <span className="text-[10px] block mt-0.5">{lowStockCount > 0 ? '⚠️ Requieren reposición' : 'Existencias saludables'}</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Gráfica 1: Stock por Marca */}
            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>🍩 Participación por Marca</span>
                <span className="text-[10px] text-slate-500 font-normal">Unidades en existencias</span>
              </h4>
              <div className="h-44 w-full">
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
            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>📊 Distribución por Gama</span>
                <span className="text-[10px] text-slate-500 font-normal">Unidades en almacén</span>
              </h4>
              <div className="h-44 w-full">
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

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <input
          type="text"
          placeholder="Buscar por marca o modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg w-full md:w-72 outline-none focus:border-blue-600"
        />

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Marca:</span>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg bg-white outline-none"
          >
            <option value="all">Todas las marcas ({phones.length})</option>
            {brandsList.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Phone Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="p-3">Marca y Modelo</th>
                <th className="p-3">Gama</th>
                <th className="p-3">Stock Disp.</th>
                <th className="p-3">Costo Reposición</th>
                <th className="p-3">Precio Venta (Bs.)</th>
                <th className="p-3">Precio USD ($)</th>
                <th className="p-3">Margen Ganancia</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredPhones.map((phone) => {
                const usd = (phone.priceBs / exchangeRates.bcvUSD).toFixed(2);
                const isLowStock = phone.stock <= phone.minStock;
                const costUSD = phone.costUSD || (phone.costBs > 0 ? (phone.costBs / exchangeRates.bcvUSD) : 0);
                const costBs = phone.costBs || (costUSD * exchangeRates.bcvUSD);
                const margin = costBs > 0 ? (((phone.priceBs - costBs) / costBs) * 100).toFixed(1) : '0';
                const isMarginHealthy = Number(margin) >= 20;

                return (
                  <tr key={phone.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{phone.brand} {phone.model}</p>
                      <p className="text-[10px] text-slate-500">{phone.specs.ram} | {phone.specs.storage} | {phone.specs.color}</p>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {phone.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${isLowStock ? 'text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300' : 'text-emerald-700 font-black'}`}>
                        {phone.stock} unids {isLowStock && '⚠️'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">${costUSD.toFixed(2)} USD</span>
                      <span className="text-[10px] text-slate-500 block">Bs. {costBs.toLocaleString('es-VE')}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-semibold">
                        {phone.costMethod === 'promedio_ponderado' ? 'Promedio' : 'Último'}
                      </span>
                    </td>
                    <td className="p-3 font-black text-slate-900">
                      Bs. {phone.priceBs.toLocaleString('es-VE')}
                    </td>
                    <td className="p-3 font-black text-emerald-700">
                      ${usd} USD
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                        isMarginHealthy
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : Number(margin) > 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        +{margin}%
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openPurchaseModal(phone)}
                        className="text-emerald-700 hover:text-emerald-900 hover:underline font-bold"
                        title="Registrar nueva compra o lote de reposición"
                      >
                        📦 Lote
                      </button>
                      <button
                        onClick={() => openEditModal(phone)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-bold ml-1.5"
                        title="Modificar datos del equipo"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => openStockModal(phone)}
                        className="text-slate-600 hover:text-slate-800 hover:underline font-bold ml-1.5"
                        title="Ajustar entradas o salidas físicas de stock"
                      >
                        ⚙️ Stock
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
                        className="text-rose-600 hover:text-rose-800 hover:underline font-bold ml-1.5"
                        title="Eliminar del catálogo y desincorporar existencias"
                      >
                        🗑️
                      </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white max-w-lg w-full rounded-xl p-5 border border-slate-300 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingPhone ? '✏️ Modificar Teléfono en Inventario' : '📱 Registrar Nuevo Teléfono en Inventario'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-semibold">Marca</label>
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
                      {isCustomBrand ? '↩️ Lista' : '➕ Otra marca'}
                    </button>
                  </div>
                  {isCustomBrand ? (
                    <input
                      type="text"
                      placeholder="Escribe la marca (ej: OnePlus, Huawei, Sony...)"
                      value={formData.brand}
                      onChange={(e) => {
                        setFormData({ ...formData, brand: e.target.value });
                        setCustomBrandInput(e.target.value);
                      }}
                      className="w-full p-2.5 border-2 border-blue-500 rounded-lg bg-blue-50/20 font-bold text-slate-900 outline-none"
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
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold"
                    >
                      {brandsList.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="__other__">➕ Otra marca personalizada...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
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
                    className={`w-full p-2.5 border rounded-lg font-bold text-slate-900 transition-colors ${
                      formErrors.model ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.model && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {formErrors.model}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
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
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                  {formErrors.ram && <p className="text-[10px] text-red-600 mt-0.5">⚠️ {formErrors.ram}</p>}
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
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                  {formErrors.storage && <p className="text-[10px] text-red-600 mt-0.5">⚠️ {formErrors.storage}</p>}
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
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                  {formErrors.color && <p className="text-[10px] text-red-600 mt-0.5">⚠️ {formErrors.color}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Cámara</label>
                  <input
                    type="text"
                    placeholder="Ej: 50 MP"
                    value={formData.camera}
                    onChange={(e) => setFormData({ ...formData, camera: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Pantalla</label>
                  <input
                    type="text"
                    placeholder="Ej: 6.7 AMOLED"
                    value={formData.screen}
                    onChange={(e) => setFormData({ ...formData, screen: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Costo Reposición ($) <span className="text-red-500">*</span>
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
                    className={`w-full p-2 border rounded-lg font-bold ${
                      formErrors.costUSD ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.costUSD && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">⚠️ {formErrors.costUSD}</p>
                  )}
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    = Bs. {(formData.costUSD * exchangeRates.bcvUSD).toLocaleString('es-VE')}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Precio Venta (Bs.) <span className="text-red-500">*</span>
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
                    className={`w-full p-2 border rounded-lg font-bold ${
                      formErrors.priceBs ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.priceBs && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">⚠️ {formErrors.priceBs}</p>
                  )}
                  <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">
                    = ${(formData.priceBs / exchangeRates.bcvUSD).toFixed(2)} USD
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Stock {editingPhone ? 'Existente' : 'Inicial'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 });
                      if (formErrors.stock) setFormErrors({ ...formErrors, stock: '' });
                    }}
                    className={`w-full p-2 border rounded-lg font-bold ${
                      formErrors.stock ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.stock && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">⚠️ {formErrors.stock}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Mínimo Alerta</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => {
                      setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 1 });
                      if (formErrors.minStock) setFormErrors({ ...formErrors, minStock: '' });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              {/* Profitability live indicator */}
              {(() => {
                const costBs = formData.costUSD * exchangeRates.bcvUSD;
                const margin = costBs > 0 ? (((formData.priceBs - costBs) / costBs) * 100).toFixed(1) : '0';
                const isUnderCost = formData.priceBs <= costBs;
                return (
                  <div className={`p-2.5 rounded-lg border text-xs flex justify-between items-center font-bold ${
                    isUnderCost
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}>
                    <span>
                      {isUnderCost ? '⚠️ ALERTA: Precio de venta no cubre costo de reposición' : '📈 Margen Bruto Calculado:'}
                    </span>
                    <span className="text-sm font-black">
                      {isUnderCost ? 'PÉRDIDA (Incumple Regla)' : `+${margin}% sobre costo`}
                    </span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Gama</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
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
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                  {formErrors.releaseYear && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">⚠️ {formErrors.releaseYear}</p>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex justify-between font-bold text-blue-900 text-xs">
                <span>Conversión en tiempo real:</span>
                <span>
                  ${(formData.priceBs / exchangeRates.bcvUSD).toFixed(2)} USD | €{(formData.priceBs / exchangeRates.bcvEUR).toFixed(2)} EUR
                </span>
              </div>

              {editingPhone && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-medium flex items-start gap-2">
                  <span className="text-base">🛡️</span>
                  <span>
                    <b>Auditoría automática:</b> Cada cambio en stock, precio o especificaciones quedará registrado con el valor anterior y nuevo en el panel de auditoría del Super Usuario.
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                >
                  {editingPhone ? 'Guardar Cambios' : 'Registrar Teléfono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste Rápido de Stock (Salida o Entrada de Inventario) */}
      {isStockModalOpen && selectedPhoneForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white max-w-md w-full rounded-xl p-5 border border-slate-300 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  📦 Movimiento de Stock en Inventario
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {selectedPhoneForStock.brand} {selectedPhoneForStock.model}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsStockModalOpen(false);
                  setSelectedPhoneForStock(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Current Stock Indicator */}
            <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Stock Actual en Bodega:</span>
              <span className="font-black text-slate-900 text-sm bg-white px-2.5 py-0.5 rounded border border-slate-300 shadow-xs">
                {selectedPhoneForStock.stock} unidades
              </span>
            </div>

            <form onSubmit={handleStockMovementSubmit} className="space-y-3.5 text-xs">
              {/* Type Selection Tabs */}
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
                    className={`py-2 px-3 rounded-lg font-bold border text-center transition-all ${
                      stockMovementType === 'out'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs ring-1 ring-rose-500'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔻 Quitar / Salida
                    <span className="block text-[10px] font-normal opacity-80">Merma, daño o retiro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStockMovementType('in');
                      setStockReason('Recepción de nuevo lote de importación');
                      setStockModalError(null);
                    }}
                    className={`py-2 px-3 rounded-lg font-bold border text-center transition-all ${
                      stockMovementType === 'in'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔺 Ingresar / Entrada
                    <span className="block text-[10px] font-normal opacity-80">Nuevo lote o reposición</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
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
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-black text-sm outline-none focus:border-blue-600"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Motivo / Justificación del Movimiento:
                </label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium outline-none focus:border-blue-600"
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
                    className="w-full mt-2 p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                  />
                )}
              </div>

              {/* Error Message */}
              {stockModalError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] font-bold">
                  ⚠️ {stockModalError}
                </div>
              )}

              {/* Transformation Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Resultado del movimiento:</div>
                <div className="flex justify-between items-center font-bold">
                  <span>Stock Resultante:</span>
                  <span className={`text-sm font-black ${stockMovementType === 'out' ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {stockMovementType === 'out'
                      ? `${selectedPhoneForStock.stock} ➔ ${Math.max(0, selectedPhoneForStock.stock - stockQuantity)} unids (-${stockQuantity})`
                      : `${selectedPhoneForStock.stock} ➔ ${selectedPhoneForStock.stock + stockQuantity} unids (+${stockQuantity})`
                    }
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200">
                  🛡️ Este movimiento se registrará con fecha, hora, usuario y justificación en la auditoría confidencial.
                </p>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockModalOpen(false);
                    setSelectedPhoneForStock(null);
                  }}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-lg font-bold shadow-sm transition-colors ${
                    stockMovementType === 'out'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {stockMovementType === 'out' ? 'Confirmar Retiro de Stock' : 'Confirmar Ingreso de Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Recepción de Mercancía / Compra de Lote con Regla de Reposición */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-2xl w-full rounded-2xl p-6 border border-slate-300 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  📦 Recepción de Mercancía / Compra de Lote
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro de costos de adquisición, método de valuación y fijación del precio de venta según regla de reposición.
                </p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
              
              {/* Phone Selection */}
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
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 outline-none focus:border-blue-600"
                >
                  {phones.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} {p.model} — Stock: {p.stock} unids | Costo actual: ${(p.costUSD || 0).toFixed(2)} USD | Precio: Bs. {p.priceBs.toLocaleString('es-VE')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier & Invoice */}
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
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:border-blue-600"
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
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Quantity & Unit Cost */}
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
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-black text-sm text-center outline-none focus:border-blue-600"
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
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-black text-sm text-center outline-none focus:border-blue-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Costo en Bolívares
                  </label>
                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-bold text-slate-800 text-center">
                    Bs. {(purchaseCostUSD * exchangeRates.bcvUSD).toLocaleString('es-VE')}
                  </div>
                </div>
              </div>

              {/* Valuation Method Selector & Calculations */}
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
                    {/* Method Tabs */}
                    <div>
                      <label className="block text-slate-700 mb-1.5 font-bold">
                        Criterio / Método para Calcular el Costo de Inventario:
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPurchaseCostMethod('promedio_ponderado')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            purchaseCostMethod === 'promedio_ponderado'
                              ? 'bg-blue-50 border-blue-500 text-blue-950 ring-1 ring-blue-500'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-extrabold flex items-center justify-between">
                            <span>⚖️ Costo Promedio Ponderado</span>
                            <span className="text-xs font-black text-blue-700">${weightedUSD} USD</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Pondera las {oldStock} unids viejas (${oldCostUSD}) con las {purchaseQty} nuevas (${purchaseCostUSD}).
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPurchaseCostMethod('ultimo_costo')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            purchaseCostMethod === 'ultimo_costo'
                              ? 'bg-blue-50 border-blue-500 text-blue-950 ring-1 ring-blue-500'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-extrabold flex items-center justify-between">
                            <span>🏷️ Último Precio de Costo</span>
                            <span className="text-xs font-black text-blue-700">${purchaseCostUSD} USD</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Fija el costo de reposición íntegro al valor de la factura más reciente.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Cost Preview Box */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Nuevo Costo Unitario Registrado:</span>
                        <span className="font-black text-slate-900 text-sm">
                          ${effectiveCostUSD.toFixed(2)} USD / Bs. {effectiveCostBs.toLocaleString('es-VE')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Stock resultante en bodega:</span>
                        <span className="font-bold text-slate-800">{oldStock} + {purchaseQty} = {newStock} unidades</span>
                      </div>
                    </div>

                    {/* Fundamental Business Rule Alert & Price Adjustment */}
                    <div className={`p-3.5 rounded-xl border transition-all ${
                      costExceedsPrice
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{costExceedsPrice ? '⚠️' : '✅'}</span>
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

                          {/* Adjustment Checkbox */}
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
                            <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 text-slate-800">
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
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        purchaseTargetMargin === m
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-slate-100 text-slate-700 border-slate-300'
                                      }`}
                                    >
                                      {m}%
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-slate-600 mb-0.5 font-semibold text-[10px]">
                                    Nuevo Precio Venta en Bolívares (Bs.):
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={purchaseNewPriceBs}
                                    onChange={(e) => setPurchaseNewPriceBs(parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-slate-300 rounded-lg font-black text-xs outline-none focus:border-blue-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 mb-0.5 font-semibold text-[10px]">
                                    Equivalente en Dólares (USD):
                                  </label>
                                  <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 font-black text-xs text-emerald-700 text-center">
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

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Notas / Observaciones de la Compra:</label>
                <input
                  type="text"
                  placeholder="Detalles del embarque, condición del lote o proveedor..."
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              {/* Error Alert */}
              {purchaseError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-[11px] font-bold">
                  ⚠️ {purchaseError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPurchase}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingPurchase ? 'Guardando...' : 'Confirmar e Ingresar Lote'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 1: Catálogo Oficial para Clientes (SIN CANTIDADES DE STOCK) */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-4xl w-full rounded-2xl p-6 border border-slate-300 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Header del Catálogo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <span>📤</span> Catálogo Oficial para Clientes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fichas técnicas y precios actualizados en Bolívares y Dólares. Se ocultan las cantidades exactas de inventario por confidencialidad.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyWhatsAppCatalog}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCatalog ? '✅ ¡Copiado!' : '📋 Copiar para WhatsApp'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
                >
                  🖨️ Imprimir
                </button>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-base"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Aviso confidencialidad */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center justify-between">
              <span>🛡️ <strong>Modo Cliente Seguro:</strong> Todo el catálogo se muestra con estado "Disponible" omitiendo el número de unidades en bodega.</span>
              <span className="font-bold text-indigo-700">Tasa BCV: Bs. {exchangeRates.bcvUSD.toFixed(2)}/USD</span>
            </div>

            {/* Tarjetas de Teléfonos del Catálogo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {phones.filter((p) => p.stock > 0).map((p) => {
                const usd = (p.priceBs / exchangeRates.bcvUSD).toFixed(2);
                return (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all shadow-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{p.brand}</span>
                        <h4 className="font-black text-sm text-slate-900">{p.model}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Disponible
                      </span>
                    </div>

                    {/* Ficha técnica resumida */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <div><span className="font-semibold text-slate-400">RAM:</span> {p.specs.ram}</div>
                      <div><span className="font-semibold text-slate-400">Memoria:</span> {p.specs.storage}</div>
                      <div><span className="font-semibold text-slate-400">Pantalla:</span> {p.specs.screen}</div>
                      <div><span className="font-semibold text-slate-400">Cámara:</span> {p.specs.camera}</div>
                      <div className="col-span-2"><span className="font-semibold text-slate-400">Color:</span> {p.specs.color}</div>
                    </div>

                    {/* Precios Bs y USD */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">PRECIO EN BOLÍVARES</span>
                        <span className="text-sm font-black text-slate-900">Bs. {p.priceBs.toLocaleString('es-VE')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 block font-semibold">PRECIO EN DÓLARES</span>
                        <span className="text-base font-black text-emerald-700">${usd} USD</span>
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
          <div className="bg-white max-w-3xl w-full rounded-2xl p-6 border border-slate-300 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Header Modal Aprobaciones */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <span>🔔</span> Panel de Toma de Decisiones y Aprobaciones Gerenciales
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revisión y autorización obligatoria de cambios críticos solicitados por personal operativo (precios, stock y bajas).
                </p>
              </div>
              <button
                onClick={() => setShowApprovalsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Solicitudes Pendientes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                <span>Solicitudes Pendientes ({pendingApprovals.length})</span>
                <span className="text-[11px] text-amber-600 font-semibold font-mono">Requieren Firma Gerencial</span>
              </h4>

              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <span className="text-3xl block">✅</span>
                  <p className="text-xs font-bold text-slate-700">No hay decisiones gerenciales pendientes</p>
                  <p className="text-[11px] text-slate-500">Todas las solicitudes operativas han sido procesadas o autorizadas.</p>
                </div>
              ) : (
                pendingApprovals.map((appr) => (
                  <div key={appr.id} className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px]">
                            {appr.code}
                          </span>
                          <span className="font-black text-slate-900">{appr.phoneName}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Solicitado por: <strong>{appr.requesterName}</strong> ({appr.requesterRole}) el {appr.date}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                        {appr.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-slate-800 font-medium">
                      {appr.description}
                    </div>

                    {/* Acciones de Aprobación / Rechazo */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-amber-200">
                      <input
                        type="text"
                        placeholder="Motivo (opcional si rechaza)..."
                        value={rejectReasonText[appr.id] || ''}
                        onChange={(e) => setRejectReasonText({ ...rejectReasonText, [appr.id]: e.target.value })}
                        className="w-full sm:w-64 p-1.5 border border-slate-300 rounded-lg text-[11px] outline-none"
                      />

                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => resolveApproval(appr.id, 'reject', rejectReasonText[appr.id])}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                        >
                          ❌ Rechazar
                        </button>
                        <button
                          onClick={() => resolveApproval(appr.id, 'approve')}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          ✅ Aprobar y Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Historial de Decisiones Resueltas */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Historial de Decisiones Recientes ({approvals.filter(a => a.status !== 'pendiente').length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {approvals.filter(a => a.status !== 'pendiente').map((appr) => (
                  <div key={appr.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-mono font-bold mr-2 text-slate-600">{appr.code}</span>
                      <span className="font-semibold text-slate-800">{appr.phoneName}</span>
                      <span className="text-slate-400 ml-1.5">por {appr.requesterName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
