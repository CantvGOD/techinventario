import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { SaleTransaction } from '../../types';
import {
  validateName,
  validateCedula,
  validateInteger,
  formatCedulaInput
} from '../../utils/validators';
import {
  ShoppingCart,
  X,
  User,
  Smartphone,
  Hash,
  CreditCard,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface SalesRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesRegisterModal: React.FC<SalesRegisterModalProps> = ({
  isOpen,
  onClose
}) => {
  const { users, phones, sales, exchangeRates, registerSale, addToast } = useApp();

  const activeVendors = users.filter((u) => u.role === 'vendedor');

  const [vendorId, setVendorId] = useState(activeVendors[0]?.id || '');
  const [phoneId, setPhoneId] = useState(phones[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] =
    useState<SaleTransaction['paymentMethod']>('Pago Móvil');
  const [paymentReference, setPaymentReference] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [notes, setNotes] = useState('');

  // Error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const selectedPhone = phones.find((p) => p.id === phoneId);
  const unitPriceBs = selectedPhone ? selectedPhone.priceBs : 0;
  const currentStock = selectedPhone ? selectedPhone.stock : 0;
  const subtotalBrutoBs = unitPriceBs * quantity;

  // Desglose fiscal legal (SENIAT & Ley IGTF)
  const taxBaseBs = Number((subtotalBrutoBs / 1.16).toFixed(2));
  const ivaBs = Number((subtotalBrutoBs - taxBaseBs).toFixed(2));
  const isEfectivoDivisas = paymentMethod === 'Efectivo Divisas (USD)';
  const igtfBs = isEfectivoDivisas ? Number((subtotalBrutoBs * 0.03).toFixed(2)) : 0;
  const totalBs = subtotalBrutoBs + igtfBs;

  const rateUSD = exchangeRates.bcvUSD;
  const rateEUR = exchangeRates.bcvEUR;

  const totalUSD = (totalBs / rateUSD).toFixed(2);
  const totalEUR = (totalBs / rateEUR).toFixed(2);

  const isElectronicPayment =
    paymentMethod === 'Pago Móvil' ||
    paymentMethod === 'Transferencia' ||
    paymentMethod === 'Zelle';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // 1. Validar Vendedor
    if (!vendorId) {
      newErrors.vendor = 'Debes seleccionar un vendedor responsable.';
    }

    // 2. Validar Teléfono y Stock
    if (!phoneId || !selectedPhone) {
      newErrors.phone = 'Debes seleccionar un modelo de teléfono.';
    } else {
      if (currentStock <= 0) {
        newErrors.quantity = 'Este modelo no tiene unidades disponibles en inventario.';
      } else {
        const qtyCheck = validateInteger(quantity, 1, currentStock, 'La cantidad de teléfonos');
        if (!qtyCheck.isValid) {
          newErrors.quantity = qtyCheck.error || `La cantidad debe estar entre 1 y el stock disponible (${currentStock}).`;
        }
      }
    }

    // 3. Validar Referencia de Pago Electrónico (Control de Duplicidad)
    if (isElectronicPayment) {
      const trimmedRef = paymentReference.trim();
      if (!trimmedRef) {
        newErrors.paymentReference = 'El número de referencia bancaria es obligatorio para pagos electrónicos.';
      } else if (trimmedRef.length < 4) {
        newErrors.paymentReference = 'La referencia bancaria debe tener al menos 4 caracteres numéricos.';
      } else {
        const isDuplicate = sales.some(
          (s) =>
            s.paymentReference &&
            s.paymentReference.trim().toLowerCase() === trimmedRef.toLowerCase()
        );
        if (isDuplicate) {
          newErrors.paymentReference = `⚠️ La referencia "${trimmedRef}" ya fue registrada en otra venta anterior. Ingrese una referencia distinta.`;
        }
      }
    }

    // 4. Validar Nombre del Cliente
    const nameCheck = validateName(clientName, 'El nombre del cliente');
    if (!nameCheck.isValid) {
      newErrors.clientName = nameCheck.error!;
    }

    // 5. Validar Cédula del Cliente
    const docCheck = validateCedula(clientDoc);
    if (!docCheck.isValid) {
      newErrors.clientDoc = docCheck.error!;
    }

    // 6. Validar Notas
    if (notes.trim().length > 250) {
      newErrors.notes = 'Las notas no pueden exceder 250 caracteres.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      addToast({
        type: 'error',
        title: 'Verificación de venta fallida',
        message: 'Revisa los campos señalados en rojo antes de confirmar la venta.'
      });
      return;
    }

    const success = registerSale({
      vendorId,
      phoneId,
      quantity,
      paymentMethod,
      paymentReference: isElectronicPayment ? paymentReference.trim() : undefined,
      clientName: clientName.trim(),
      clientDoc: clientDoc.trim().toUpperCase(),
      notes: notes.trim()
    });

    if (success) {
      onClose();
      setQuantity(1);
      setPaymentReference('');
      setClientName('');
      setClientDoc('');
      setNotes('');
      setErrors({});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200/80 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Registrar Nueva Venta de Teléfono</h3>
              <p className="text-[11px] text-slate-500 font-medium">Facturación fiscal en bolívares y divisas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Vendor selection */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Vendedor Responsable (Persona Natural)</span>
              <span className="text-red-500">*</span>
            </label>
            <select
              value={vendorId}
              onChange={(e) => {
                setVendorId(e.target.value);
                if (errors.vendor) setErrors({ ...errors, vendor: '' });
              }}
              className={`w-full px-3 py-2.5 border rounded-xl font-semibold bg-slate-50/60 focus:bg-white text-slate-900 transition-colors outline-none text-xs cursor-pointer ${
                errors.vendor ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              }`}
            >
              {activeVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.ci}) — Meta Bs. {(v.monthlyTargetBs || 0).toLocaleString()}
                </option>
              ))}
            </select>
            {errors.vendor && (
              <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.vendor}
              </p>
            )}
          </div>

          {/* Phone selection & Quantity */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block text-slate-700 mb-1 font-semibold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>Modelo de Teléfono</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={phoneId}
                onChange={(e) => {
                  setPhoneId(e.target.value);
                  const phone = phones.find(p => p.id === e.target.value);
                  if (phone && quantity > phone.stock) {
                    setQuantity(Math.max(1, phone.stock));
                  }
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-xl font-bold bg-slate-50/60 focus:bg-white text-slate-900 transition-colors outline-none text-xs cursor-pointer ${
                  errors.phone ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              >
                {phones.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.model} ({p.stock} unids) — Bs. {p.priceBs.toLocaleString('es-VE')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Cantidad</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={currentStock || 1}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) ? 1 : val);
                  if (errors.quantity) setErrors({ ...errors, quantity: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-xl font-bold text-center text-slate-900 transition-colors outline-none text-xs bg-slate-50/60 focus:bg-white ${
                  errors.quantity ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />
            </div>
          </div>
          {errors.quantity && (
            <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.quantity}
            </p>
          )}

          {/* Stock availability indicator */}
          <div className="flex justify-between items-center text-[11px] px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-600 font-medium">Existencia en inventario:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md ${
              currentStock > 4
                ? 'bg-emerald-50 text-emerald-700'
                : currentStock > 0
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {currentStock} {currentStock === 1 ? 'unidad disponible' : 'unidades disponibles'}
            </span>
          </div>

          {/* Calculated Totals with Fiscal Breakdown */}
          <div className="p-4 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-200/80 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">Subtotal / Base Imponible:</span>
              <span className="font-bold text-slate-900">Bs. {taxBaseBs.toLocaleString('es-VE')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">IVA (16% Alícuota General SENIAT):</span>
              <span className="font-bold text-slate-900">Bs. {ivaBs.toLocaleString('es-VE')}</span>
            </div>
            {isEfectivoDivisas && (
              <div className="flex justify-between text-amber-900 font-bold bg-amber-100/70 p-2 rounded-xl border border-amber-300/80 text-[11px]">
                <span>IGTF Percibido (3% Efectivo Divisas Ley SENIAT):</span>
                <span>+Bs. {igtfBs.toLocaleString('es-VE')}</span>
              </div>
            )}
            <div className="pt-2 border-t border-blue-200/80 flex justify-between items-center text-sm font-black text-blue-950">
              <span>Total Neto a Facturar:</span>
              <span className="text-base text-blue-700 font-black">Bs. {totalBs.toLocaleString('es-VE')}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700 font-bold">
              <span>Equivalente en Divisas ($ USD):</span>
              <span className="font-black text-sm">${totalUSD} USD</span>
            </div>
            <div className="flex justify-between text-xs text-indigo-700 font-bold">
              <span>Equivalente en Euros (€ EUR):</span>
              <span className="font-black text-sm">€{totalEUR} EUR</span>
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Método de Pago</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value as any);
                  if (errors.paymentReference) setErrors({ ...errors, paymentReference: '' });
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-semibold bg-slate-50/60 focus:bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs transition-colors cursor-pointer"
              >
                <option value="Pago Móvil">Pago Móvil</option>
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Zelle">Zelle (USD)</option>
                <option value="Efectivo Divisas (USD)">Efectivo Divisas (USD) [Aplica IGTF 3%]</option>
                <option value="Efectivo Bolívares">Efectivo Bolívares (Bs.)</option>
              </select>
            </div>

            {isElectronicPayment ? (
              <div>
                <label className="block text-slate-700 mb-1 font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nro. Referencia Bancaria</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: 849201"
                  value={paymentReference}
                  onChange={(e) => {
                    setPaymentReference(e.target.value);
                    if (errors.paymentReference) setErrors({ ...errors, paymentReference: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl font-mono font-bold text-slate-900 transition-colors outline-none text-xs bg-slate-50/60 focus:bg-white ${
                    errors.paymentReference ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                {errors.paymentReference && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.paymentReference}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-slate-700 mb-1 font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Modalidad de Efectivo</span>
                </label>
                <div className="px-3 py-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs flex items-center">
                  {isEfectivoDivisas ? '💵 Billetes USD en caja (IGTF 3%)' : '💵 Bolívares en efectivo (Sin IGTF)'}
                </div>
              </div>
            )}
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">
                Cédula / RIF del Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: V-12345678"
                value={clientDoc}
                onChange={(e) => {
                  const val = formatCedulaInput(e.target.value);
                  setClientDoc(val);
                  if (errors.clientDoc) setErrors({ ...errors, clientDoc: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-xl font-mono font-bold text-slate-900 transition-colors outline-none text-xs bg-slate-50/60 focus:bg-white ${
                  errors.clientDoc ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.clientDoc && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.clientDoc}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">
                Nombre Completo del Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Alejandro Morales"
                value={clientName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, '');
                  setClientName(val);
                  if (errors.clientName) setErrors({ ...errors, clientName: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-xl text-slate-900 font-medium transition-colors outline-none text-xs bg-slate-50/60 focus:bg-white ${
                  errors.clientName ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.clientName && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.clientName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold">
              Notas Adicionales (Opcional - Máx 250 caracteres)
            </label>
            <input
              type="text"
              placeholder="Garantía, referencia de pago móvil o detalle de entrega..."
              value={notes}
              maxLength={250}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs transition-colors"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer text-xs"
            >
              Confirmar y Facturar Venta
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};