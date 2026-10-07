/**
 * Utilidades de validación y verificación de campos de texto y numéricos
 * Para TechInventario - Sistema Web Telecom
 */

// Validación de Correo Electrónico
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'El correo electrónico es obligatorio.' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Formato de correo inválido (ejemplo: usuario@dominio.com).' };
  }
  return { isValid: true };
};

// Validación de Nombres y Apellidos (solo letras y espacios)
export const validateName = (name: string, fieldName = 'Nombre'): { isValid: boolean; error?: string } => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} es obligatorio.` };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: `${fieldName} debe tener al menos 3 caracteres.` };
  }
  if (trimmed.length > 60) {
    return { isValid: false, error: `${fieldName} no puede exceder 60 caracteres.` };
  }
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldName} solo debe contener letras y espacios.` };
  }
  return { isValid: true };
};

// Validación de Documento de Identidad / Cédula / RIF (Venezuela: V-, E-, J-, G-)
export const validateCedula = (cedula: string): { isValid: boolean; error?: string } => {
  const trimmed = cedula.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, error: 'La cédula o RIF es obligatorio.' };
  }
  // Formatos válidos: V-12345678, V-12.345.678, E-12345678, J-123456789, G-123456789, o sin guion pero con prefijo
  const cedulaRegex = /^[VEJGvejg]-?(\d{1,2}\.?\d{3}\.?\d{3}|\d{6,10})$/;
  if (!cedulaRegex.test(trimmed)) {
    return { isValid: false, error: 'Formato inválido. Debe iniciar con V-, E-, J- o G- seguido de números (ej: V-19.458.112).' };
  }
  return { isValid: true };
};

// Validación de Teléfono Venezolano (0414, 0424, 0412, 0416, 0426)
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: false, error: 'El número de teléfono es obligatorio.' };
  }
  // Limpiar guiones y espacios para comprobar los dígitos
  const cleanDigits = trimmed.replace(/[\s-]/g, '');
  const phoneRegex = /^04(12|14|16|24|26)\d{7}$/;
  if (!phoneRegex.test(cleanDigits)) {
    return { isValid: false, error: 'Debe ser un teléfono venezolano válido (0414, 0424, 0412, 0416, 0426) con 11 dígitos (ej: 0414-1234567).' };
  }
  return { isValid: true };
};

// Validación de Precio en Bolívares (Número positivo > 0)
export const validatePrice = (price: number | string): { isValid: boolean; error?: string } => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) {
    return { isValid: false, error: 'El precio debe ser un número válido.' };
  }
  if (num <= 0) {
    return { isValid: false, error: 'El precio debe ser mayor a 0 Bs.' };
  }
  if (num > 50000000) {
    return { isValid: false, error: 'El precio supera el monto máximo permitido (50.000.000 Bs).' };
  }
  return { isValid: true };
};

// Validación de Cantidad / Stock (Entero no negativo)
export const validateInteger = (
  val: number | string,
  min = 0,
  max = 9999,
  fieldName = 'Cantidad'
): { isValid: boolean; error?: string } => {
  const str = String(val).trim();
  if (!str) {
    return { isValid: false, error: `${fieldName} es obligatorio.` };
  }
  const num = Number(str);
  if (!Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} debe ser un número entero sin decimales.` };
  }
  if (num < min) {
    return { isValid: false, error: `${fieldName} no puede ser menor a ${min}.` };
  }
  if (num > max) {
    return { isValid: false, error: `${fieldName} no puede ser mayor a ${max}.` };
  }
  return { isValid: true };
};

// Validación de Año de Lanzamiento
export const validateReleaseYear = (year: number | string): { isValid: boolean; error?: string } => {
  const num = Number(year);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(num) || num < 2010 || num > currentYear + 1) {
    return { isValid: false, error: `El año de lanzamiento debe estar entre 2010 y ${currentYear + 1}.` };
  }
  return { isValid: true };
};

// Validación de Referencia Bancaria (pago)
export const validateReference = (ref: string): { isValid: boolean; error?: string } => {
  const trimmed = ref.trim();
  if (!trimmed) {
    return { isValid: false, error: 'El número de referencia es obligatorio.' };
  }
  if (trimmed.length < 4) {
    return { isValid: false, error: 'La referencia debe tener al menos 4 caracteres.' };
  }
  const refRegex = /^[a-zA-Z0-9\s_-]+$/;
  if (!refRegex.test(trimmed)) {
    return { isValid: false, error: 'La referencia solo debe contener letras, números y guiones.' };
  }
  return { isValid: true };
};

// Validación de Tasa de Cambio
export const validateExchangeRate = (rate: number | string, rateName = 'Tasa'): { isValid: boolean; error?: string } => {
  const num = typeof rate === 'string' ? parseFloat(rate) : rate;
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: `${rateName} debe ser un valor numérico positivo mayor a 0.` };
  }
  if (num > 500) {
    return { isValid: false, error: `${rateName} supera el valor razonable permitido.` };
  }
  return { isValid: true };
};

// Formateador automático de Cédula al escribir
export const formatCedulaInput = (val: string): string => {
  let cleaned = val.toUpperCase().replace(/[^VEJG0-9.-]/g, '');
  if (cleaned.length > 0 && !/^[VEJG]/.test(cleaned)) {
    cleaned = 'V-' + cleaned;
  }
  return cleaned;
};

// Formateador automático de Teléfono al escribir
export const formatPhoneInput = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return digits;
};
