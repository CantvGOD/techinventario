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
import {
  Smartphone,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  Info
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, registerUser, addToast } = useApp();
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCi, setRegCi] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('vendedor');
  const [regPassword, setRegPassword] = useState('');
  const [regErrors, setRegErrors] = useState<{ [key: string]: string }>({});

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};

    const cleanEmail = loginEmail.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanEmail) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else {
      const emailValidation = validateEmail(cleanEmail);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error || 'Formato de correo inválido.';
      }
    }

    if (!cleanPassword) {
      errors.password = 'La contraseña de acceso es obligatoria.';
    }

    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) {
      addToast({
        type: 'error',
        title: 'Datos requeridos',
        message: 'Debe ingresar sus credenciales completas para iniciar sesión.'
      });
      return;
    }

    login(cleanEmail, cleanPassword);
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

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-2.5">
          <div className="w-12 h-12 bg-blue-600/20 text-blue-400 flex items-center justify-center rounded-2xl mx-auto border border-blue-500/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              TechInventario
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v2.5 Enterprise
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sistema Web de Gestión de Inventario, Ventas y Finanzas
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveMode('login');
              setLoginErrors({});
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeMode === 'login'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('register');
              setRegErrors({});
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeMode === 'register'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registrar Personal
          </button>
        </div>

        <div className="p-6">
          {activeMode === 'login' ? (
            <div className="space-y-4">
              
              {/* Formulario de Login Estricto */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Correo Electrónico</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ej: jefe@empresa.com"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginErrors.email) setLoginErrors({ ...loginErrors, email: undefined });
                    }}
                    className={`w-full px-3 py-2.5 border rounded-xl text-slate-900 font-medium outline-none transition-colors text-xs bg-slate-50/60 focus:bg-white ${
                      loginErrors.email
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  {loginErrors.email && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {loginErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contraseña</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Ingrese su contraseña"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginErrors.password) setLoginErrors({ ...loginErrors, password: undefined });
                      }}
                      className={`w-full pl-3 pr-10 py-2.5 border rounded-xl text-slate-900 font-medium outline-none transition-colors text-xs bg-slate-50/60 focus:bg-white ${
                        loginErrors.password
                          ? 'border-red-500 bg-red-50/50'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {loginErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </button>
              </form>

              {/* Guía informativa de credenciales registradas (Solo informativa, no autocompleta) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Credenciales Registradas de la Empresa:</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-600 font-mono">
                  <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200/60">
                    <div>
                      <strong className="text-purple-700 font-sans">Super Usuario:</strong> jefe@empresa.com
                    </div>
                    <span className="text-slate-400">Clave: 123</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200/60">
                    <div>
                      <strong className="text-blue-700 font-sans">Administrador:</strong> admin@empresa.com
                    </div>
                    <span className="text-slate-400">Clave: 123</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200/60">
                    <div>
                      <strong className="text-emerald-700 font-sans">Vendedor:</strong> carlos@empresa.com
                    </div>
                    <span className="text-slate-400">Clave: 123</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nombre Completo</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Roberto Silva Mendoza"
                  value={regName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, '');
                    setRegName(val);
                    if (regErrors.name) setRegErrors({ ...regErrors, name: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl text-slate-900 font-medium outline-none transition-colors text-xs bg-slate-50/60 focus:bg-white ${
                    regErrors.name
                      ? 'border-red-500 bg-red-50/50'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                {regErrors.name && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {regErrors.name}
                  </p>
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
                    className={`w-full px-3 py-2.5 border rounded-xl text-slate-900 font-mono font-bold outline-none transition-colors text-xs bg-slate-50/60 focus:bg-white ${
                      regErrors.ci
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  {regErrors.ci && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {regErrors.ci}
                    </p>
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
                    className={`w-full px-3 py-2.5 border rounded-xl text-slate-900 font-medium outline-none transition-colors text-xs bg-slate-50/60 focus:bg-white ${
                      regErrors.phone
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  {regErrors.phone && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {regErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Correo Electrónico</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    if (regErrors.email) setRegErrors({ ...regErrors, email: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl text-slate-900 font-medium outline-none transition-colors text-xs bg-slate-50/60 focus:bg-white ${
                    regErrors.email
                      ? 'border-red-500 bg-red-50/50'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                {regErrors.email && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {regErrors.email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rol Asignado</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-semibold bg-slate-50/60 focus:bg-white outline-none text-xs cursor-pointer"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="admin">Administrador</option>
                    <option value="super_user">Super Usuario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contraseña</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 3 caract."
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regErrors.password) setRegErrors({ ...regErrors, password: '' });
                    }}
                    className={`w-full px-3 py-2.5 border rounded-xl text-slate-900 font-medium outline-none transition-colors text-xs bg-slate-50/60 focus:bg-white ${
                      regErrors.password
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  {regErrors.password && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {regErrors.password}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-xs mt-2 cursor-pointer"
              >
                Completar Registro e Ingresar
              </button>
            </form>
          )}
        </div>

        <div className="p-3 bg-slate-50/80 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          Acceso protegido con autenticación de credenciales
        </div>

      </div>
    </div>
  );
};