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
    <div className="space-y-4 text-slate-800">
      
      {/* Title */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>📈</span> Estadísticas de Mercado y Rendimiento de Ventas
          </h2>
          <p className="text-xs text-slate-600">
            Análisis comparativo de teléfonos más vendidos en el mercado vs ventas internas de la empresa y comisiones a vendedores.
          </p>
        </div>
      </div>

      {/* Gráficas Visuales de Mercado e Inventario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfica 1: Cuota de Mercado (%) */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-2">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>📊</span> Cuota de Mercado Nacional (% Market Share)
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Tendencia Telecom</span>
          </div>
          <div className="h-44 w-full pt-1">
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
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-2">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>📱</span> Unidades Despachadas en Tienda
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Ventas internas reales</span>
          </div>
          <div className="h-44 w-full pt-1">
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
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-3">
        <h3 className="font-bold text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
          <span>🏆 Ranking de Rendimiento de Vendedores (Mes Actual)</span>
          <span className="text-[11px] text-slate-500 font-normal">Cálculo de comisiones al 10%</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedPayrolls.map((p, index) => (
            <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-900">{index + 1}. {p.vendorName}</span>
                <span className="text-blue-700">#{index + 1}</span>
              </div>
              <p className="text-slate-500 text-[11px]">Cédula: {p.vendorDoc}</p>
              <div className="pt-2 border-t border-slate-200 space-y-0.5 font-medium">
                <p>Equipos vendidos: <b>{p.totalSalesCount} unids</b></p>
                <p>Ventas en Bs: <b>Bs. {p.totalSalesBs.toLocaleString('es-VE')}</b></p>
                <p className="text-emerald-700">Ventas en USD: <b>${p.totalSalesUSD} USD</b></p>
                <p className="text-blue-700 font-bold pt-1">Comisión (10%): Bs. {p.commissionAmountBs.toLocaleString('es-VE')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: External Market Stats & Internal Top Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* External Market Statistics */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-3">
          <h3 className="font-bold text-sm border-b border-slate-200 pb-2">
            📊 Teléfonos Más Vendidos Actualmente en el Mercado
          </h3>

          <div className="space-y-2 text-xs">
            {marketStats.map((item) => (
              <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">{item.brand} {item.model}</p>
                  <p className="text-slate-500 text-[11px]">
                    Cuota de Mercado: <b>{item.marketSharePercentage}%</b> • Est. ${item.avgPriceUSD} USD
                  </p>
                </div>

                <div>
                  {item.isStoreStocked ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      En Catálogo
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      Agotado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Inventory Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-3">
          <h3 className="font-bold text-sm border-b border-slate-200 pb-2">
            📱 Teléfonos en Catálogo de la Tienda
          </h3>

          <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
            {phones.map((phone) => {
              const soldQty = phoneSalesMap[phone.model] || 0;
              return (
                <div key={phone.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{phone.brand} {phone.model}</span>
                    <span className="text-blue-700">Bs. {phone.priceBs.toLocaleString('es-VE')}</span>
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
