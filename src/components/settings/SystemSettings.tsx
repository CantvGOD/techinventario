import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { validateExchangeRate } from '../../utils/validators';
import {
  Settings,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const {
    exchangeRates,
    updateExchangeRates,
    fetchLiveExchangeRates,
    resetToDefaultData,
    auditLogs,
    addToast
  } = useApp();

  const [ratesForm, setRatesForm] = useState({
    bcvUSD: exchangeRates.bcvUSD,
    bcvEUR: exchangeRates.bcvEUR,
    paraleloUSD: exchangeRates.paraleloUSD
  });

  useEffect(() => {
    setRatesForm({
      bcvUSD: exchangeRates.bcvUSD,
      bcvEUR: exchangeRates.bcvEUR,
      paraleloUSD: exchangeRates.paraleloUSD
    });
  }, [exchangeRates.bcvUSD, exchangeRates.bcvEUR, exchangeRates.paraleloUSD]);

  const [rateErrors, setRateErrors] = useState<{ [key: string]: string }>({});

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    const usdCheck = validateExchangeRate(ratesForm.bcvUSD, 'La tasa BCV Dólar');
    if (!usdCheck.isValid) errors.bcvUSD = usdCheck.error!;

    const eurCheck = validateExchangeRate(ratesForm.bcvEUR, 'La tasa BCV Euro');
    if (!eurCheck.isValid) errors.bcvEUR = eurCheck.error!;

    const paraleloCheck = validateExchangeRate(ratesForm.paraleloUSD, 'La tasa Paralelo');
    if (!paraleloCheck.isValid) errors.paraleloUSD = paraleloCheck.error!;

    setRateErrors(errors);

    if (Object.keys(errors).length > 0) {
      addToast({
        type: 'error',
        title: 'Verificación de tasa fallida',
        message: 'Las tasas de cambio deben ser valores numéricos positivos mayores a 0.'
      });
      return;
    }

    updateExchangeRates({
      bcvUSD: Number(ratesForm.bcvUSD),
      bcvEUR: Number(ratesForm.bcvEUR),
      paraleloUSD: Number(ratesForm.paraleloUSD)
    });
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas restablecer todos los registros y datos del sistema a los valores iniciales de fábrica? Esta acción quedará registrada en la auditoría.')) {
      resetToDefaultData();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Unificado Moderno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-blue-600" />
            Configuración del Sistema y Parámetros
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Ajuste de cotizaciones de cambio oficiales (BCV) y mantenimiento de datos (Super Usuario).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        
        {/* Exchange Form with Strict Verifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Tasas de Cambio Oficiales (Bolívares)
            </h3>
            <button
              onClick={fetchLiveExchangeRates}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar BCV</span>
            </button>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-3.5">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                Dólar Oficial BCV (Bs. / USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={ratesForm.bcvUSD}
                onChange={(e) => {
                  setRatesForm({ ...ratesForm, bcvUSD: parseFloat(e.target.value) || 0 });
                  if (rateErrors.bcvUSD) setRateErrors({ ...rateErrors, bcvUSD: '' });
                }}
                className={`w-full p-2.5 border rounded-xl font-mono font-bold text-slate-900 transition-colors ${
                  rateErrors.bcvUSD ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                }`}
              />
              {rateErrors.bcvUSD && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 inline" /> {rateErrors.bcvUSD}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                Euro Oficial BCV (Bs. / EUR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={ratesForm.bcvEUR}
                onChange={(e) => {
                  setRatesForm({ ...ratesForm, bcvEUR: parseFloat(e.target.value) || 0 });
                  if (rateErrors.bcvEUR) setRateErrors({ ...rateErrors, bcvEUR: '' });
                }}
                className={`w-full p-2.5 border rounded-xl font-mono font-bold text-slate-900 transition-colors ${
                  rateErrors.bcvEUR ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                }`}
              />
              {rateErrors.bcvEUR && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 inline" /> {rateErrors.bcvEUR}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                Dólar Paralelo Referencial (Bs. / USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={ratesForm.paraleloUSD}
                onChange={(e) => {
                  setRatesForm({ ...ratesForm, paraleloUSD: parseFloat(e.target.value) || 0 });
                  if (rateErrors.paraleloUSD) setRateErrors({ ...rateErrors, paraleloUSD: '' });
                }}
                className={`w-full p-2.5 border rounded-xl font-mono font-bold text-slate-900 transition-colors ${
                  rateErrors.paraleloUSD ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                }`}
              />
              {rateErrors.paraleloUSD && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 inline" /> {rateErrors.paraleloUSD}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all text-xs cursor-pointer"
            >
              Guardar y Aplicar Nuevas Tasas
            </button>
          </form>
        </div>

        {/* Reset System */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-sm border-b border-slate-100 pb-3 text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Mantenimiento del Sistema
            </h3>
            <p className="text-slate-600 leading-relaxed text-xs">
              Permite reiniciar y volver a cargar todos los registros iniciales del sistema para demostraciones universitarias.
            </p>

            <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
              <span className="font-bold text-amber-900 block">Restablecer Datos de Fábrica</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Restablece el catálogo de teléfonos y las ventas iniciales del sistema. La acción quedará registrada en auditoría.
              </p>
              <button
                onClick={handleReset}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
              >
                Restablecer Datos Iniciales
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex justify-between items-center font-mono">
            <span>TechInventario v2.5.0</span>
            <span className="text-blue-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Auditoría ({auditLogs.length} eventos)
            </span>
          </div>
        </div>

      </div>

      {/* Audit Log Preview with link to full view */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Vista Rápida de Auditoría (Últimos Movimientos)
          </h3>
          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            Solo Super Usuario
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditLogs.slice(0, 6).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 text-slate-500 whitespace-nowrap text-[11px] font-mono">
                    {new Date(log.timestamp).toLocaleString('es-VE')}
                  </td>
                  <td className="p-3 font-bold text-slate-900">{log.user}</td>
                  <td className="p-3 text-blue-700 capitalize font-semibold">{log.role}</td>
                  <td className="p-3 font-bold text-slate-800">{log.action}</td>
                  <td className="p-3 text-slate-600 max-w-sm truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
