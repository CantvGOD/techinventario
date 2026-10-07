import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AuditLog } from '../../types';

export const AuditLogView: React.FC = () => {
  const { auditLogs, activeRole, currentUser, logAuditAction, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AuditLog | null>(null);

  // Verificación estricta: ÚNICAMENTE super_user
  if (activeRole !== 'super_user') {
    return (
      <div className="p-8 bg-white border border-red-200 rounded-xl shadow-sm text-center space-y-3">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl mx-auto font-bold">
          ⛔
        </div>
        <h2 className="text-lg font-bold text-red-800">Acceso Restringido</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
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
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">👤 Autenticación</span>;
      case 'sale':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">💰 Venta</span>;
      case 'inventory':
        if (act.includes('elimin') || act.includes('salida') || act.includes('retiro') || act.includes('disminuc')) {
          return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">🔻 Salida / Baja</span>;
        } else if (act.includes('ingreso') || act.includes('nuevo') || act.includes('aumento')) {
          return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">🔺 Ingreso Stock</span>;
        }
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">✏️ Modificación</span>;
      case 'payroll':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">💵 Nómina / Pago</span>;
      case 'rates':
        return <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold">💱 Tasas de Cambio</span>;
      case 'system':
        return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">⚙️ Sistema</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">Operación</span>;
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">🛡️ Registro Exhaustivo de Auditoría y Trazabilidad</h2>
            <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Exclusivo Super Usuario (Jefe)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Registro total e inviolable de cada operación: entradas, salidas, modificaciones y bajas de inventario, ventas, nómina y seguridad.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            📥 Exportar Auditoría (.csv)
          </button>
        </div>
      </div>

      {/* Summary KPI Strip con Filtro Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500'
              : 'bg-white border-slate-300 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <span className="text-slate-500 font-bold uppercase block text-[10px]">Total Eventos Registrados</span>
          <p className="text-xl font-black text-blue-700 mt-1">{auditLogs.length}</p>
        </button>

        <button
          onClick={() => setSelectedCategory('inventory')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedCategory === 'inventory'
              ? 'bg-indigo-50 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
              : 'bg-white border-slate-300 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <span className="text-slate-500 font-bold uppercase block text-[10px]">📦 Movimientos de Inventario</span>
          <p className="text-xl font-black text-indigo-700 mt-1">
            {auditLogs.filter((l) => l.category === 'inventory').length}
          </p>
        </button>

        <button
          onClick={() => setSelectedCategory('sale')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedCategory === 'sale'
              ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
              : 'bg-white border-slate-300 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <span className="text-slate-500 font-bold uppercase block text-[10px]">💰 Ventas Registradas</span>
          <p className="text-xl font-black text-emerald-700 mt-1">
            {auditLogs.filter((l) => l.category === 'sale').length}
          </p>
        </button>

        <button
          onClick={() => setSelectedCategory('auth')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedCategory === 'auth'
              ? 'bg-purple-50 border-purple-500 shadow-xs ring-1 ring-purple-500'
              : 'bg-white border-slate-300 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <span className="text-slate-500 font-bold uppercase block text-[10px]">👤 Sesión y Seguridad</span>
          <p className="text-xl font-black text-purple-700 mt-1">
            {auditLogs.filter((l) => l.category === 'auth').length}
          </p>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <input
          type="text"
          placeholder="Buscar por usuario, acción o detalles de inventario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg w-full md:w-80 outline-none focus:border-blue-600"
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Categoría:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg bg-white outline-none font-medium"
            >
              <option value="all">Todas las categorías</option>
              <option value="inventory">📦 Inventario (quitar, agregar, editar, stock)</option>
              <option value="sale">💰 Ventas</option>
              <option value="auth">👤 Autenticación y Cuentas</option>
              <option value="payroll">💵 Nómina y Pagos</option>
              <option value="rates">💱 Tasas de Cambio</option>
              <option value="system">⚙️ Sistema y Exportaciones</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Usuario:</span>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg bg-white outline-none font-medium"
            >
              <option value="all">Todos los usuarios</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Usuario Responsable</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Tipo / Categoría</th>
                <th className="p-3">Acción Realizada</th>
                <th className="p-3">Detalle Exhaustivo de la Operación</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
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
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="p-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('es-VE')}
                    </td>
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.role === 'super_user'
                          ? 'bg-purple-100 text-purple-800'
                          : log.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.role === 'super_user' ? 'Super Usuario' : log.role === 'admin' ? 'Admin' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {getCategoryBadge(log.category, log.action)}
                    </td>
                    <td className="p-3 font-black text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-600 max-w-lg truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogForDetail(log);
                        }}
                        className="text-blue-600 hover:underline font-bold text-[11px]"
                      >
                        Ver Detalle 🔍
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white max-w-lg w-full rounded-xl p-5 border border-slate-300 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                🛡️ Detalle de Evento de Auditoría
              </h3>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">Fecha y Hora:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {new Date(selectedLogForDetail.timestamp).toLocaleString('es-VE')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">Identificador:</span>
                  <span className="font-mono text-slate-700">{selectedLogForDetail.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">Usuario Responsable:</span>
                  <span className="font-bold text-slate-900">{selectedLogForDetail.user}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">Rol:</span>
                  <span className="font-bold text-slate-700 capitalize">
                    {selectedLogForDetail.role === 'super_user' ? 'Super Usuario (Jefe)' : selectedLogForDetail.role === 'admin' ? 'Administrador' : 'Vendedor'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] mb-1">Acción Registrada:</span>
                <div className="p-2.5 bg-slate-100 rounded-lg font-black text-slate-900 flex items-center justify-between">
                  <span>{selectedLogForDetail.action}</span>
                  {getCategoryBadge(selectedLogForDetail.category, selectedLogForDetail.action)}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] mb-1">Desglose Completo de la Operación / Modificaciones:</span>
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedLogForDetail.details}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors text-xs"
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
