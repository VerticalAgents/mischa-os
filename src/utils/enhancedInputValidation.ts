
import DOMPurify from 'dompurify';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

export class EnhancedInputValidator {
  // Enhanced email validation with security checks
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    if (!email || email.trim() === '') {
      return { isValid: false, errors: ['Email é obrigatório'] };
    }

    const sanitizedEmail = DOMPurify.sanitize(email.trim().toLowerCase());
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      errors.push('Formato de email inválido');
      isValid = false;
    }

    // Check for suspicious patterns
    if (sanitizedEmail.includes('<script') || sanitizedEmail.includes('javascript:')) {
      errors.push('Email contém caracteres suspeitos');
      isValid = false;
    }

    // Check against disposable email domains
    const disposableDomains = [
      'tempmail.org', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'yopmail.com', 'temp-mail.org'
    ];
    
    const domain = sanitizedEmail.split('@')[1];
    if (domain && disposableDomains.includes(domain)) {
      errors.push('Email temporário não é permitido');
      isValid = false;
    }

    // Length validation
    if (sanitizedEmail.length > 254) {
      errors.push('Email muito longo');
      isValid = false;
    }

    return {
      isValid,
      errors,
      sanitizedValue: isValid ? sanitizedEmail : undefined
    };
  }

  // Enhanced password validation with security requirements
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    if (!password) {
      return { isValid: false, errors: ['Senha é obrigatória'] };
    }

    // Length requirements
    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
      isValid = false;
    }

    if (password.length > 128) {
      errors.push('Senha muito longa (máximo 128 caracteres)');
      isValid = false;
    }

    // Character requirements
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
      isValid = false;
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
      isValid = false;
    }

    if (!/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
      isValid = false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
      isValid = false;
    }

    // Check for common weak patterns
    const commonPatterns = [
      /123456/, /password/i, /qwerty/i, /abc123/i, /admin/i,
      /12345678/, /123123/, /password123/i, /admin123/i
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Senha contém padrões comuns - use uma senha mais segura');
        isValid = false;
        break;
      }
    }

    // Check for sequential characters
    if (/123|abc|qwe/i.test(password)) {
      errors.push('Evite sequências de caracteres na senha');
      isValid = false;
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Evite repetir o mesmo caractere várias vezes');
      isValid = false;
    }

    return { isValid, errors };
  }

  // Sanitize general text input
  static sanitizeText(input: string, maxLength: number = 1000): ValidationResult {
    if (!input) {
      return { isValid: true, errors: [], sanitizedValue: '' };
    }

    let sanitized = DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    const errors: string[] = [];
    let isValid = true;

    // Length validation
    if (sanitized.length > maxLength) {
      errors.push(`Texto muito longo (máximo ${maxLength} caracteres)`);
      isValid = false;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload/gi,
      /onerror/gi,
      /onclick/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        errors.push('Texto contém conteúdo suspeito');
        isValid = false;
        break;
      }
    }

    return {
      isValid,
      errors,
      sanitizedValue: isValid ? sanitized : undefined
    };
  }

  // Validate and sanitize numeric input
  static validateNumericInput(input: string | number, min?: number, max?: number): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    const numValue = typeof input === 'string' ? parseFloat(input) : input;

    if (isNaN(numValue)) {
      return { isValid: false, errors: ['Valor numérico inválido'] };
    }

    if (min !== undefined && numValue < min) {
      errors.push(`Valor deve ser pelo menos ${min}`);
      isValid = false;
    }

    if (max !== undefined && numValue > max) {
      errors.push(`Valor deve ser no máximo ${max}`);
      isValid = false;
    }

    return {
      isValid,
      errors,
      sanitizedValue: isValid ? numValue.toString() : undefined
    };
  }

  // Validate CNPJ/CPF with security checks
  static validateDocument(document: string): ValidationResult {
    if (!document) {
      return { isValid: false, errors: ['Documento é obrigatório'] };
    }

    const sanitized = DOMPurify.sanitize(document.replace(/\D/g, ''));
    const errors: string[] = [];
    let isValid = true;

    if (sanitized.length !== 11 && sanitized.length !== 14) {
      errors.push('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
      isValid = false;
    }

    // Check for repeated numbers (common invalid documents)
    if (/^(\d)\1+$/.test(sanitized)) {
      errors.push('Documento inválido');
      isValid = false;
    }

    return {
      isValid,
      errors,
      sanitizedValue: isValid ? sanitized : undefined
    };
  }

  // Validate phone number
  static validatePhone(phone: string): ValidationResult {
    if (!phone) {
      return { isValid: true, errors: [], sanitizedValue: '' };
    }

    const sanitized = DOMPurify.sanitize(phone.replace(/\D/g, ''));
    const errors: string[] = [];
    let isValid = true;

    if (sanitized.length < 10 || sanitized.length > 11) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
      isValid = false;
    }

    return {
      isValid,
      errors,
      sanitizedValue: isValid ? sanitized : undefined
    };
  }
}
