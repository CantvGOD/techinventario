import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';
import {
  validateName,
  validateCedula,
  validatePhone,
  validateEmail,
  validatePrice,
  formatCedulaInput,
  formatPhoneInput
} from '../../utils/validators';

export const VendorManager: React.FC = () => {
  const { users, sales, payrolls, addUser, activeRole, exchangeRates, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ci: '',
    role: 'vendedor' as UserRole,
    monthlyTargetBs: 200000
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.ci?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // 1. Nombre
    const nameCheck = validateName(formData.name, 'El nombre completo');
    if (!nameCheck.isValid) newErrors.name = nameCheck.error!;

    // 2. Cédula
    const ciCheck = validateCedula(formData.ci);
    if (!ciCheck.isValid) newErrors.ci = ciCheck.error!;

    // 3. Teléfono
    const phoneCheck = validatePhone(formData.phone);
    if (!phoneCheck.isValid) newErrors.phone = phoneCheck.error!;

    // 4. Email
    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.isValid) newErrors.email = emailCheck.error!;

    // 5. Meta mensual si es vendedor
    if (formData.role === 'vendedor') {
      const priceCheck = validatePrice(formData.monthlyTargetBs);
      if (!priceCheck.isValid) newErrors.monthlyTargetBs = 'La meta de ventas mensual debe ser mayor a 0 Bs.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      addToast({
        type: 'error',
        title: 'Verificación de usuario fallida',
        message: 'Por favor completa y corrige los campos señalados en rojo.'
      });
      return;
    }

    addUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      ci: formData.ci.trim().toUpperCase(),
      role: formData.role,
      joinDate: new Date().toISOString().split('T')[0],
      monthlyTargetBs: Number(formData.monthlyTargetBs)
    });

    setIsModalOpen(false);
    setErrors({});
    setFormData({
      name: '',
      email: '',
      phone: '',
      ci: '',
      role: 'vendedor',
      monthlyTargetBs: 200000
    });
  };

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900">👥 Registro de Personal y Vendedores</h2>
          <p className="text-xs text-slate-600">
            Control de cuentas de Personas Naturales (Vendedores), Administradores de Empresa y Super Usuario (Jefe).
          </p>
        </div>

        {(activeRole === 'admin' || activeRole === 'super_user') && (
          <button
            onClick={() => {
              setErrors({});
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            + Registrar Persona
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <input
          type="text"
          placeholder="Buscar por nombre, email o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg w-full md:w-72 outline-none focus:border-blue-600"
        />

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Filtrar por Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="p-2 border border-slate-300 rounded-lg bg-white outline-none"
          >
            <option value="all">Todos los roles ({users.length})</option>
            <option value="vendedor">Persona Natural (Vendedor)</option>
            <option value="admin">Persona Empresa (Admin)</option>
            <option value="super_user">Super Usuario (Jefe)</option>
          </select>
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredUsers.map((user) => {
          const userSales = sales.filter((s) => s.vendorId === user.id);
          const totalSalesBs = userSales.reduce((acc, s) => acc + s.totalBs, 0);
          const totalSalesUSD = (totalSalesBs / exchangeRates.bcvUSD).toFixed(2);
          const payroll = payrolls.find((p) => p.vendorId === user.id);

          return (
            <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{user.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{user.ci || 'V-00.000.000'}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    user.role === 'super_user' ? 'bg-purple-100 text-purple-800' : user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {user.role === 'super_user' ? 'Jefe' : user.role === 'admin' ? 'Admin' : 'Vendedor'}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600">
                  <p><b>Email:</b> {user.email}</p>
                  <p><b>Teléfono:</b> {user.phone || '0412-0000000'}</p>
                  <p><b>Fecha de ingreso:</b> {user.joinDate}</p>
                </div>

                {user.role === 'vendedor' && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Ventas Acumuladas:</span>
                      <span className="text-blue-700 font-bold">Bs. {totalSalesBs.toLocaleString('es-VE')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Total USD ($):</span>
                      <span className="font-bold">${totalSalesUSD} USD</span>
                    </div>
                    {payroll && (
                      <div className="flex justify-between text-[11px] font-bold text-emerald-700 pt-1 border-t border-slate-200">
                        <span>Comisión (10%):</span>
                        <span>Bs. {payroll.commissionAmountBs.toLocaleString('es-VE')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 text-right pt-2 border-t border-slate-100">
                {userSales.length} ventas realizadas
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add User with Strict Verifications */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white max-w-md w-full rounded-xl p-5 border border-slate-300 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Registrar Persona / Usuario</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Laura Sofía Mendoza"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, '');
                    setFormData({ ...formData, name: val });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`w-full p-2.5 border rounded-lg font-semibold transition-colors ${
                    errors.name ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Cédula / RIF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="V-18.990.112"
                    value={formData.ci}
                    onChange={(e) => {
                      const formatted = formatCedulaInput(e.target.value);
                      setFormData({ ...formData, ci: formatted });
                      if (errors.ci) setErrors({ ...errors, ci: '' });
                    }}
                    className={`w-full p-2.5 border rounded-lg transition-colors ${
                      errors.ci ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {errors.ci && <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {errors.ci}</p>}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Teléfono Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0414-1234567"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneInput(e.target.value);
                      setFormData({ ...formData, phone: formatted });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    className={`w-full p-2.5 border rounded-lg transition-colors ${
                      errors.phone ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="correo@empresa.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full p-2.5 border rounded-lg transition-colors ${
                      errors.email ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {errors.email}</p>}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Rol asignado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold bg-white"
                  >
                    <option value="vendedor">Persona Natural (Vendedor)</option>
                    <option value="admin">Persona Empresa (Admin)</option>
                    <option value="super_user">Super Usuario (Jefe)</option>
                  </select>
                </div>
              </div>

              {formData.role === 'vendedor' && (
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Meta Mensual de Ventas (Bs.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.monthlyTargetBs}
                    onChange={(e) => {
                      setFormData({ ...formData, monthlyTargetBs: Number(e.target.value) });
                      if (errors.monthlyTargetBs) setErrors({ ...errors, monthlyTargetBs: '' });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                  />
                  {errors.monthlyTargetBs && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {errors.monthlyTargetBs}</p>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                >
                  Guardar Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
