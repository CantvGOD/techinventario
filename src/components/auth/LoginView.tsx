import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';
import {
  validateEmail,
  validateName,
  validateCedula,
  validatePhone,
  formatCedulaInput,
  formatPhoneInput
} from '../../utils/validators';

export const LoginView: React.FC = () => {
  const { login, registerUser, users, addToast } = useApp();
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login state
  const [selectedUserEmail, setSelectedUserEmail] = useState(users[0]?.email || 'jefe@empresa.com');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCi, setRegCi] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('vendedor');
  const [regPassword, setRegPassword] = useState('');

  // Register errors
  const [regErrors, setRegErrors] = useState<{ [key: string]: string }>({});

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = loginEmail.trim() || selectedUserEmail;

    if (loginEmail.trim()) {
      const emailValidation = validateEmail(loginEmail);
      if (!emailValidation.isValid) {
        setLoginEmailError(emailValidation.error || 'Correo inválido');
        addToast({ type: 'error', title: 'Verificación fallida', message: emailValidation.error || 'Correo inválido' });
        return;
      }
    }
    setLoginEmailError(null);
    login(emailToUse, loginPassword);
  };

  const handleSelectLogin = () => {
    login(selectedUserEmail, '123');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // 1. Validar Nombre
    const nameCheck = validateName(regName, 'El nombre completo');
    if (!nameCheck.isValid) errors.name = nameCheck.error!;

    // 2. Validar Cédula
    const ciCheck = validateCedula(regCi);
    if (!ciCheck.isValid) errors.ci = ciCheck.error!;

    // 3. Validar Teléfono
    const phoneCheck = validatePhone(regPhone);
    if (!phoneCheck.isValid) errors.phone = phoneCheck.error!;

    // 4. Validar Correo
    const emailCheck = validateEmail(regEmail);
    if (!emailCheck.isValid) errors.email = emailCheck.error!;

    // 5. Validar Contraseña
    if (!regPassword.trim() || regPassword.trim().length < 3) {
      errors.password = 'La contraseña debe contener al menos 3 caracteres.';
    }

    setRegErrors(errors);

    if (Object.keys(errors).length > 0) {
      addToast({
        type: 'error',
        title: 'Verificación de datos requerida',
        message: 'Por favor corrige los campos marcados en rojo antes de continuar.'
      });
      return;
    }

    const success = registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      ci: regCi.trim().toUpperCase(),
      phone: regPhone.trim(),
      role: regRole,
      joinDate: new Date().toISOString().split('T')[0],
      monthlyTargetBs: regRole === 'vendedor' ? 200000 : 0,
      password: regPassword.trim()
    });

    if (success) {
      setRegErrors({});
    }
  };

  const quickLogin = (email: string) => {
    login(email, '123');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-xl shadow-lg border border-slate-300 overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/30 text-2xl flex items-center justify-center rounded-xl mx-auto border border-blue-500/30">
            📱
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">TechInventario</h1>
          <p className="text-xs text-slate-300">Sistema de Inventario, Ventas y Comisiones</p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setActiveMode('login');
              setRegErrors({});
            }}
            className={`flex-1 py-3 text-center transition-colors ${
              activeMode === 'login'
                ? 'bg-white text-blue-700 border-b-2 border-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setActiveMode('register');
              setLoginEmailError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors ${
              activeMode === 'register'
                ? 'bg-white text-blue-700 border-b-2 border-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Crear Cuenta / Registrarse
          </button>
        </div>

        <div className="p-6">
          {activeMode === 'login' ? (
            <div className="space-y-5">
              
              {/* Option A: Select User Dropdown */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-xs">
                <label className="block font-bold text-blue-950">
                  Seleccionar usuario registrado para ingresar:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                    className="flex-1 p-2 border border-blue-300 rounded bg-white font-semibold text-slate-900 text-xs outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.name} ({u.role === 'super_user' ? 'Super Usuario' : u.role === 'admin' ? 'Admin' : 'Vendedor'}) — {u.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSelectLogin}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded text-xs transition-colors"
                  >
                    Ingresar
                  </button>
                </div>
              </div>

              {/* Option B: Manual Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs pt-1">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">O ingresar correo manualmente:</label>
                  <input
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginEmailError) setLoginEmailError(null);
                    }}
                    className={`w-full p-2.5 border rounded-lg text-slate-900 font-medium outline-none transition-colors ${
                      loginEmailError ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {loginEmailError && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">⚠️ {loginEmailError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm transition-colors text-xs"
                >
                  Ingresar al Sistema
                </button>
              </form>

              {/* Quick Demo Buttons */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                  ⚡ Ingreso Rápido de Prueba (1-Click)
                </span>
                
                <div className="grid grid-cols-1 gap-1.5 text-xs font-semibold">
                  <button
                    onClick={() => quickLogin('jefe@empresa.com')}
                    className="w-full p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-between transition-colors"
                  >
                    <span>🛡️ Carlos Mendoza (Super Usuario)</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold">Jefe</span>
                  </button>

                  <button
                    onClick={() => quickLogin('admin@empresa.com')}
                    className="w-full p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-between transition-colors"
                  >
                    <span>🏢 Laura Rodríguez (Administrador)</span>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-bold">Admin</span>
                  </button>

                  <button
                    onClick={() => quickLogin('maria.gonzalez@empresa.com')}
                    className="w-full p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center justify-between transition-colors"
                  >
                    <span>👤 María González (Vendedor)</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Vendedor</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* Register Form with strict verification */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Roberto Silva Mendoza"
                  value={regName}
                  onChange={(e) => {
                    // Only letters, accents and spaces
                    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, '');
                    setRegName(val);
                    if (regErrors.name) setRegErrors({ ...regErrors, name: '' });
                  }}
                  className={`w-full p-2.5 border rounded-lg text-slate-900 font-medium outline-none transition-colors ${
                    regErrors.name ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {regErrors.name && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold">⚠️ {regErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Cédula / RIF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="V-20.123.456"
                    value={regCi}
                    onChange={(e) => {
                      const formatted = formatCedulaInput(e.target.value);
                      setRegCi(formatted);
                      if (regErrors.ci) setRegErrors({ ...regErrors, ci: '' });
                    }}
                    className={`w-full p-2.5 border rounded-lg text-slate-900 font-medium transition-colors ${
                      regErrors.ci ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {regErrors.ci && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {regErrors.ci}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Teléfono Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0414-1234567"
                    value={regPhone}
                    onChange={(e) => {
                      const formatted = formatPhoneInput(e.target.value);
                      setRegPhone(formatted);
                      if (regErrors.phone) setRegErrors({ ...regErrors, phone: '' });
                    }}
                    className={`w-full p-2.5 border rounded-lg text-slate-900 font-medium transition-colors ${
                      regErrors.phone ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {regErrors.phone && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {regErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    if (regErrors.email) setRegErrors({ ...regErrors, email: '' });
                  }}
                  className={`w-full p-2.5 border rounded-lg text-slate-900 font-medium transition-colors ${
                    regErrors.email ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {regErrors.email && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold">⚠️ {regErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Rol en la Empresa <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white"
                  >
                    <option value="vendedor">Persona Natural (Vendedor)</option>
                    <option value="admin">Empresa (Admin)</option>
                    <option value="super_user">Super Usuario (Jefe)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 3 caracteres"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regErrors.password) setRegErrors({ ...regErrors, password: '' });
                    }}
                    className={`w-full p-2.5 border rounded-lg text-slate-900 font-medium transition-colors ${
                      regErrors.password ? 'border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {regErrors.password && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">⚠️ {regErrors.password}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors text-xs mt-2"
              >
                Completar Registro e Ingresar
              </button>
            </form>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          TechInventario — Verificación activa de campos
        </div>

      </div>
    </div>
  );
};
