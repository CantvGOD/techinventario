import React from 'react';
import { useApp } from '../../context/AppContext';

export const MarketAnalytics: React.FC = () => {
  const { sales, marketStats, payrolls, phones } = useApp();

  // Internal sales by phone
  const phoneSalesMap: { [model: string]: number } = {};
  sales.forEach((s) => {
    phoneSalesMap[s.phoneName] = (phoneSalesMap[s.phoneName] || 0) + s.quantity;
  });

  const sortedPayrolls = [...payrolls].sort((a, b) => b.totalSalesBs - a.totalSalesBs);

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Title */}
      <div className="bg-white p-4 rounded border border-slate-300">
        <h2 className="text-lg font-bold">📈 Estadísticas de Mercado y Ventas por Vendedor</h2>
        <p className="text-xs text-slate-600">
          Análisis comparativo de teléfonos más vendidos en el mercado vs ventas internas y comisiones por vendedor.
        </p>
      </div>

      {/* Vendor Sales Leaderboard */}
      <div className="bg-white p-4 rounded border border-slate-300 space-y-3">
        <h3 className="font-bold text-sm border-b border-slate-200 pb-2">
          🏆 Ranking de Rendimiento de Vendedores (Mes Actual)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedPayrolls.map((p, index) => (
            <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
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
        <div className="bg-white p-4 rounded border border-slate-300 space-y-3">
          <h3 className="font-bold text-sm border-b border-slate-200 pb-2">
            📊 Teléfonos Más Vendidos Actualmente en el Mercado
          </h3>

          <div className="space-y-2 text-xs">
            {marketStats.map((item) => (
              <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
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
        <div className="bg-white p-4 rounded border border-slate-300 space-y-3">
          <h3 className="font-bold text-sm border-b border-slate-200 pb-2">
            📱 Teléfonos en Catálogo de la Tienda
          </h3>

          <div className="space-y-2 text-xs">
            {phones.map((phone) => {
              const soldQty = phoneSalesMap[phone.model] || 0;
              return (
                <div key={phone.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
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
