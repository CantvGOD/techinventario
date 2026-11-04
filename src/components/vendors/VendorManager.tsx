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
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Shield,
  X,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

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

  const totalVendors = users.filter((u) => u.role === 'vendedor').length;
  const totalAdmins = users.filter((u) => u.role === 'admin' || u.role === 'super_user').length;
  const totalSalesBs = sales.reduce((acc, s) => acc + s.totalBs, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Unificado Moderno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            Registro de Personal y Vendedores
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Control de cuentas RBAC: Vendedores (Persona Natural), Administradores de Empresa y Super Usuario (Jefe).
          </p>
        </div>

        {(activeRole === 'admin' || activeRole === 'super_user') && (
          <button
            onClick={() => {
              setErrors({});
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Persona</span>
          </button>
        )}
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Vendedores</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">{totalVendors} activos</span>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">Comisionistas autorizados</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipo Directivo</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">{totalAdmins} personas</span>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">Admins & Super Usuarios</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas Gestionadas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-blue-700 mt-2 block">
            Bs. {totalSalesBs.toLocaleString('es-VE')}
          </span>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">{sales.length} transacciones registradas</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Filtrar por Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="p-2 border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold outline-none focus:border-blue-500 text-xs cursor-pointer"
          >
            <option value="all">Todos los roles ({users.length})</option>
            <option value="vendedor">Persona Natural (Vendedor)</option>
            <option value="admin">Persona Empresa (Admin)</option>
            <option value="super_user">Super Usuario (Jefe)</option>
          </select>
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const userSales = sales.filter((s) => s.vendorId === user.id);
          const userSalesBs = userSales.reduce((acc, s) => acc + s.totalBs, 0);
          const userSalesUSD = (userSalesBs / exchangeRates.bcvUSD).toFixed(2);
          const payroll = payrolls.find((p) => p.vendorId === user.id);

          return (
            <div
              key={user.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{user.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.ci || 'V-00.000.000'}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    user.role === 'super_user'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : user.role === 'admin'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {user.role === 'super_user' ? 'Jefe / Super' : user.role === 'admin' ? 'Administrador' : 'Vendedor'}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.phone || '0412-0000000'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Ingreso: {user.joinDate}</span>
                  </p>
                </div>

                {user.role === 'vendedor' && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-600">Ventas Acumuladas:</span>
                      <span className="text-blue-700 font-black font-mono">Bs. {userSalesBs.toLocaleString('es-VE')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Equivalente USD:</span>
                      <span className="font-bold font-mono">${userSalesUSD} USD</span>
                    </div>
                    {payroll && (
                      <div className="flex justify-between text-[11px] font-bold text-emerald-700 pt-1.5 border-t border-slate-200">
                        <span>Comisión Ganada (10%):</span>
                        <span className="font-mono">Bs. {payroll.commissionAmountBs.toLocaleString('es-VE')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 text-right pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[10px]">ID: {user.id}</span>
                <span className="font-semibold text-slate-600">{userSales.length} ventas</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200/80 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Registrar Persona / Usuario
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">
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
                  className={`w-full p-2.5 border rounded-xl font-semibold transition-colors ${
                    errors.name ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                  }`}
                />
                {errors.name && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 inline" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
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
                    className={`w-full p-2.5 border rounded-xl font-mono font-bold transition-colors ${
                      errors.ci ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                    }`}
                  />
                  {errors.ci && <p className="text-[10px] text-red-600 mt-1 font-semibold">{errors.ci}</p>}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
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
                    className={`w-full p-2.5 border rounded-xl font-mono transition-colors ${
                      errors.phone ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-600 mt-1 font-semibold">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
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
                    className={`w-full p-2.5 border rounded-xl transition-colors ${
                      errors.email ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600 outline-none'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-600 mt-1 font-semibold">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    Rol Asignado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold bg-white outline-none focus:border-blue-500"
                  >
                    <option value="vendedor">Persona Natural (Vendedor)</option>
                    <option value="admin">Persona Empresa (Admin)</option>
                    <option value="super_user">Super Usuario (Jefe)</option>
                  </select>
                </div>
              </div>

              {formData.role === 'vendedor' && (
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
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
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold font-mono outline-none focus:border-blue-500"
                  />
                  {errors.monthlyTargetBs && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">{errors.monthlyTargetBs}</p>
                  )}
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
