import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  BarChart2,
  Award,
  Smartphone,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const MarketAnalytics: React.FC = () => {
  const { sales, marketStats, payrolls, phones } = useApp();

  // Internal sales by phone
  const phoneSalesMap: { [model: string]: number } = {};
  sales.forEach((s) => {
    phoneSalesMap[s.phoneName] = (phoneSalesMap[s.phoneName] || 0) + s.quantity;
  });

  const sortedPayrolls = [...payrolls].sort((a, b) => b.totalSalesBs - a.totalSalesBs);

  // Datos para gráficas
  const marketChartData = marketStats.map((item) => ({
    name: item.model.split(' ')[0] + ' ' + (item.model.split(' ')[1] || ''),
    fullName: `${item.brand} ${item.model}`,
    share: item.marketSharePercentage,
    price: item.avgPriceUSD
  }));

  const storeSalesChartData = Object.entries(phoneSalesMap)
    .map(([model, qty]) => ({
      name: model.length > 15 ? model.substring(0, 13) + '..' : model,
      fullName: model,
      unidades: qty
    }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 6);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      
      {/* Header Unificado Moderno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            Estadísticas de Mercado y Rendimiento
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Análisis comparativo de demanda nacional vs despacho interno de equipos y comisiones a vendedores.
          </p>
        </div>
      </div>

      {/* Gráficas Visuales de Mercado e Inventario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfica 1: Cuota de Mercado (%) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              Cuota de Mercado Nacional (% Market Share)
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">Tendencia Telecom</span>
          </div>
          <div className="h-48 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: any, _name: any, item: any) => [`${val}% de cuota ($${item.payload.price} USD)`, item.payload.fullName]} />
                <Bar dataKey="share" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {marketChartData.map((_, index) => (
                    <Cell key={`bar-m-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 2: Ventas Internas de la Tienda */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Unidades Despachadas en Tienda
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">Ventas internas reales</span>
          </div>
          <div className="h-48 w-full pt-1">
            {storeSalesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeSalesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(val: any, _name: any, item: any) => [`${val} unidades vendidas`, item.payload.fullName]} />
                  <Bar dataKey="unidades" fill="#10b981" radius={[6, 6, 0, 0]}>
                    {storeSalesChartData.map((_, index) => (
                      <Cell key={`bar-s-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin ventas registradas todavía
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Sales Leaderboard */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Ranking de Rendimiento de Vendedores (Mes Actual)
          </h3>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
            Cálculo de comisiones al 10%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedPayrolls.map((p, index) => (
            <div
              key={p.id}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition-all text-xs space-y-2"
            >
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-900 text-sm truncate">{p.vendorName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  #{index + 1}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] font-mono">Cédula: {p.vendorDoc}</p>
              <div className="pt-2 border-t border-slate-100 space-y-1 font-medium text-slate-600">
                <p className="flex justify-between">
                  <span>Equipos vendidos:</span>
                  <b className="text-slate-900">{p.totalSalesCount} unids</b>
                </p>
                <p className="flex justify-between">
                  <span>Ventas en Bs:</span>
                  <b className="font-mono text-slate-900">Bs. {p.totalSalesBs.toLocaleString('es-VE')}</b>
                </p>
                <p className="flex justify-between text-emerald-700">
                  <span>Ventas en USD:</span>
                  <b className="font-mono">${p.totalSalesUSD}</b>
                </p>
                <div className="pt-1.5 border-t border-slate-100 flex justify-between text-blue-700 font-bold">
                  <span>Comisión (10%):</span>
                  <span className="font-mono">Bs. {p.commissionAmountBs.toLocaleString('es-VE')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: External Market Stats & Internal Top Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* External Market Statistics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Teléfonos Más Vendidos Actualmente en el Mercado
          </h3>

          <div className="space-y-2 text-xs">
            {marketStats.map((item) => (
              <div key={item.id} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-slate-900">{item.brand} {item.model}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Cuota de Mercado: <b>{item.marketSharePercentage}%</b> • Est. ${item.avgPriceUSD} USD
                  </p>
                </div>

                <div>
                  {item.isStoreStocked ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      En Catálogo
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Agotado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Inventory Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            Teléfonos en Catálogo de la Tienda
          </h3>

          <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
            {phones.map((phone) => {
              const soldQty = phoneSalesMap[phone.model] || 0;
              return (
                <div key={phone.id} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-900">{phone.brand} {phone.model}</span>
                    <span className="text-blue-700 font-mono">Bs. {phone.priceBs.toLocaleString('es-VE')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Stock disponible: <b>{phone.stock} unids</b></span>
                    <span>Ventas registradas: <b>{soldQty} unids</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
