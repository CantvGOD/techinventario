import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AuditLog } from '../../types';
import {
  ShieldCheck,
  Download,
  Search,
  Filter,
  X,
  Lock
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, activeRole, currentUser, logAuditAction, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AuditLog | null>(null);

  // Verificación estricta: ÚNICAMENTE super_user
  if (activeRole !== 'super_user') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200/80 shadow-xs text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
          <Lock className="w-6 h-6 text-rose-600" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Acceso Restringido</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Este módulo contiene el registro confidencial de auditoría y actividades del sistema.
          Solo el usuario con rol de <b>Super Usuario (Jefe)</b> tiene autorización para consultar esta información.
        </p>
      </div>
    );
  }

  // Filtrar logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesUser = selectedUser === 'all' || log.user === selectedUser;
    return matchesSearch && matchesCategory && matchesUser;
  });

  const uniqueUsers = Array.from(new Set(auditLogs.map((l) => l.user)));

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Fecha y Hora,Usuario,Rol,Accion,Detalles,Categoria\n' +
      auditLogs
        .map((l) => `"${l.id}","${new Date(l.timestamp).toLocaleString('es-VE')}","${l.user}","${l.role}","${l.action}","${l.details.replace(/"/g, '""')}","${l.category || 'General'}"`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Auditoria_Sistema_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Reporte Exportado',
      message: 'El registro de auditoría se ha descargado en formato CSV.'
    });

    logAuditAction(
      currentUser?.name || 'Super Usuario',
      activeRole,
      'Exportación de Auditoría',
      `El Super Usuario descargó el historial completo de auditoría (${auditLogs.length} eventos) en formato CSV.`,
      'system',
      'info'
    );
  };

  const getCategoryBadge = (category?: string, action?: string) => {
    const act = (action || '').toLowerCase();
    switch (category) {
      case 'auth':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-200">Autenticación</span>;
      case 'sale':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">Venta</span>;
      case 'inventory':
        if (act.includes('elimin') || act.includes('salida') || act.includes('retiro') || act.includes('disminuc')) {
          return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Salida / Baja</span>;
        } else if (act.includes('ingreso') || act.includes('nuevo') || act.includes('aumento')) {
          return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Ingreso Stock</span>;
        }
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Modificación</span>;
      case 'payroll':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">Nómina / Pago</span>;
      case 'rates':
        return <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200">Tasas Cambio</span>;
      case 'system':
        return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">Sistema</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Operación</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Unificado Moderno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
              Auditoría y Trazabilidad del Sistema
            </h1>
            <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Exclusivo Super Usuario
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Registro cronológico inmutable de inventario, bajas, ventas, tasas, nóminas y cambios administrativos.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-300" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Summary KPI Strip con Filtro Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Total Eventos</span>
          <p className="text-2xl font-black text-blue-700 mt-1 font-mono">{auditLogs.length}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Historial completo</span>
        </button>

        <button
          onClick={() => setSelectedCategory('inventory')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedCategory === 'inventory'
              ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Inventario & Stock</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {auditLogs.filter((l) => l.category === 'inventory').length}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Entradas, salidas y precios</span>
        </button>

        <button
          onClick={() => setSelectedCategory('sale')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedCategory === 'sale'
              ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Ventas Procesadas</span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {auditLogs.filter((l) => l.category === 'sale').length}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Despachos por vendedor</span>
        </button>

        <button
          onClick={() => setSelectedCategory('auth')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedCategory === 'auth'
              ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Seguridad & Accesos</span>
          <p className="text-2xl font-black text-purple-700 mt-1 font-mono">
            {auditLogs.filter((l) => l.category === 'auth').length}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Inicios de sesión y usuarios</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold outline-none focus:border-blue-500 text-xs cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              <option value="inventory">Inventario (lotes, stock, precios, bajas)</option>
              <option value="sale">Ventas y Facturación</option>
              <option value="auth">Autenticación y Cuentas</option>
              <option value="payroll">Nómina y Comisiones</option>
              <option value="rates">Tasas de Cambio</option>
              <option value="system">Sistema y Exportaciones</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold outline-none focus:border-blue-500 text-xs cursor-pointer"
            >
              <option value="all">Todos los usuarios ({uniqueUsers.length})</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Usuario</th>
                <th className="p-3.5">Rol</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Acción</th>
                <th className="p-3.5">Detalle Operación</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-semibold">
                    No se encontraron registros de auditoría con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: AuditLog) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogForDetail(log)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('es-VE')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        log.role === 'super_user'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : log.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {log.role === 'super_user' ? 'Super Usuario' : log.role === 'admin' ? 'Admin' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {getCategoryBadge(log.category, log.action)}
                    </td>
                    <td className="p-3.5 font-black text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogForDetail(log);
                        }}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
                      >
                        <span>Detalle</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle Completo de Auditoría */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Detalle de Evento de Auditoría
              </h3>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Fecha y Hora:</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">
                    {new Date(selectedLogForDetail.timestamp).toLocaleString('es-VE')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">ID Transacción:</span>
                  <span className="font-mono text-slate-700 mt-0.5 block">{selectedLogForDetail.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Usuario:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedLogForDetail.user}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Rol:</span>
                  <span className="font-bold text-slate-700 capitalize mt-0.5 block">
                    {selectedLogForDetail.role === 'super_user' ? 'Super Usuario (Jefe)' : selectedLogForDetail.role === 'admin' ? 'Administrador' : 'Vendedor'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-1">Acción Registrada:</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-black text-slate-900 flex items-center justify-between">
                  <span>{selectedLogForDetail.action}</span>
                  {getCategoryBadge(selectedLogForDetail.category, selectedLogForDetail.action)}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-1">Desglose Completo de la Operación:</span>
                <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedLogForDetail.details}
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
