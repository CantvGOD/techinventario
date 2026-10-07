import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { SaleTransaction } from '../../types';
import {
  validateName,
  validateCedula,
  validateInteger,
  formatCedulaInput
} from '../../utils/validators';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white max-w-lg w-full rounded-xl border border-slate-300 shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h3 className="font-extrabold text-sm text-slate-900">Registrar Nueva Venta de Teléfono</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Vendor selection */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">
              Vendedor Responsable (Persona Natural) <span className="text-red-500">*</span>
            </label>
            <select
              value={vendorId}
              onChange={(e) => {
                setVendorId(e.target.value);
                if (errors.vendor) setErrors({ ...errors, vendor: '' });
              }}
              className={`w-full p-2.5 border rounded-lg font-semibold bg-white text-slate-900 transition-colors ${
                errors.vendor ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
              }`}
            >
              {activeVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.ci}) — Meta Bs. {(v.monthlyTargetBs || 0).toLocaleString()}
                </option>
              ))}
            </select>
            {errors.vendor && (
              <p className="text-[11px] text-red-600 mt-1 font-semibold">⚠️ {errors.vendor}</p>
            )}
          </div>

          {/* Phone selection & Quantity */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block text-slate-700 mb-1 font-semibold">
                Modelo de Teléfono <span className="text-red-500">*</span>
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
                className={`w-full p-2.5 border rounded-lg font-bold bg-white text-slate-900 transition-colors ${
                  errors.phone ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
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
              <label className="block text-slate-700 mb-1 font-semibold">
                Cantidad <span className="text-red-500">*</span>
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
                className={`w-full p-2.5 border rounded-lg font-bold text-center text-slate-900 transition-colors ${
                  errors.quantity ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
            </div>
          </div>
          {errors.quantity && (
            <p className="text-[11px] text-red-600 font-semibold">⚠️ {errors.quantity}</p>
          )}

          {/* Stock availability indicator */}
          <div className="flex justify-between items-center text-[11px] px-2 py-1 bg-slate-100 rounded-md">
            <span className="text-slate-600 font-medium">Stock en almacén para este modelo:</span>
            <span className={`font-bold ${currentStock > 4 ? 'text-emerald-700' : currentStock > 0 ? 'text-amber-700' : 'text-red-700'}`}>
              {currentStock} unidades disponibles
            </span>
          </div>

          {/* Calculated Totals with Fiscal Breakdown */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5 font-medium text-slate-800 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal / Base Imponible:</span>
              <span className="font-bold">Bs. {taxBaseBs.toLocaleString('es-VE')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (16% Alícuota General):</span>
              <span className="font-bold">Bs. {ivaBs.toLocaleString('es-VE')}</span>
            </div>
            {isEfectivoDivisas && (
              <div className="flex justify-between text-amber-900 font-bold bg-amber-100/80 p-1.5 rounded-lg border border-amber-300">
                <span>IGTF (3% Efectivo Divisas Ley SENIAT):</span>
                <span>+Bs. {igtfBs.toLocaleString('es-VE')}</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-blue-200 flex justify-between items-center text-sm font-black text-blue-950">
              <span>Total Neto a Cobrar (Bs.):</span>
              <span className="text-base text-blue-900">Bs. {totalBs.toLocaleString('es-VE')}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-800 font-bold">
              <span>Equivalente en Divisas ($ USD):</span>
              <span className="font-extrabold text-sm">${totalUSD} USD</span>
            </div>
            <div className="flex justify-between text-xs text-indigo-800 font-bold">
              <span>Equivalente en Euros (€ EUR):</span>
              <span className="font-extrabold text-sm">€{totalEUR} EUR</span>
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">
                Método de Pago <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value as any);
                  if (errors.paymentReference) setErrors({ ...errors, paymentReference: '' });
                }}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold bg-white text-slate-900 focus:border-blue-600"
              >
                <option value="Pago Móvil">Pago Móvil</option>
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Zelle">Zelle</option>
                <option value="Efectivo Divisas (USD)">Efectivo Divisas (USD) [Aplica IGTF 3%]</option>
                <option value="Efectivo Bolívares">Efectivo Bolívares (Bs.)</option>
              </select>
            </div>

            {isElectronicPayment ? (
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Nro. Referencia Bancaria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: 849201 (Últimos dígitos)"
                  value={paymentReference}
                  onChange={(e) => {
                    setPaymentReference(e.target.value);
                    if (errors.paymentReference) setErrors({ ...errors, paymentReference: '' });
                  }}
                  className={`w-full p-2.5 border rounded-lg font-mono font-bold text-slate-900 transition-colors ${
                    errors.paymentReference ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {errors.paymentReference && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {errors.paymentReference}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Modalidad de Efectivo
                </label>
                <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs">
                  {isEfectivoDivisas ? '💵 Billetes USD en taquilla (IGTF 3%)' : '💵 Bolívares en efectivo (Sin IGTF)'}
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
                placeholder="V-19.458.112"
                value={clientDoc}
                onChange={(e) => {
                  const formatted = formatCedulaInput(e.target.value);
                  setClientDoc(formatted);
                  if (errors.clientDoc) setErrors({ ...errors, clientDoc: '' });
                }}
                className={`w-full p-2.5 border rounded-lg text-slate-900 font-medium transition-colors ${
                  errors.clientDoc ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {errors.clientDoc && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {errors.clientDoc}</p>
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
                className={`w-full p-2.5 border rounded-lg text-slate-900 font-medium transition-colors ${
                  errors.clientName ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {errors.clientName && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {errors.clientName}</p>
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
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors"
            >
              Confirmar y Procesar Venta
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
