
import DOMPurify from 'dompurify';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class InputValidator {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email é obrigatório');
    } else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        errors.push('Email deve ter um formato válido');
      }
      
      if (email.length > 254) {
        errors.push('Email deve ter no máximo 254 caracteres');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Senha é obrigatória');
    } else {
      if (password.length < 8) {
        errors.push('Senha deve ter pelo menos 8 caracteres');
      }
      
      if (password.length > 128) {
        errors.push('Senha deve ter no máximo 128 caracteres');
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra maiúscula');
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra minúscula');
      }
      
      if (!/[0-9]/.test(password)) {
        errors.push('Senha deve conter pelo menos um número');
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Senha deve conter pelo menos um caractere especial');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // CNPJ/CPF validation
  static validateCnpjCpf(document: string): ValidationResult {
    const errors: string[] = [];
    
    if (!document) {
      errors.push('CNPJ/CPF é obrigatório');
    } else {
      // Remove non-numeric characters
      const cleanDoc = document.replace(/[^0-9]/g, '');
      
      if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
        errors.push('CNPJ/CPF deve ter 11 ou 14 dígitos');
      }
      
      // Basic CPF validation (11 digits)
      if (cleanDoc.length === 11) {
        if (!/^\d{11}$/.test(cleanDoc)) {
          errors.push('CPF deve conter apenas números');
        }
        
        // Check for repeated digits
        if (/^(\d)\1{10}$/.test(cleanDoc)) {
          errors.push('CPF inválido (dígitos repetidos)');
        }
      }
      
      // Basic CNPJ validation (14 digits)
      if (cleanDoc.length === 14) {
        if (!/^\d{14}$/.test(cleanDoc)) {
          errors.push('CNPJ deve conter apenas números');
        }
        
        // Check for repeated digits
        if (/^(\d)\1{13}$/.test(cleanDoc)) {
          errors.push('CNPJ inválido (dígitos repetidos)');
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Phone validation
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone) {
      errors.push('Telefone é obrigatório');
    } else {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.push('Telefone deve ter 10 ou 11 dígitos');
      }
      
      if (cleanPhone.length === 11 && !['8', '9'].includes(cleanPhone[2])) {
        errors.push('Celular deve começar com 8 ou 9');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Generic text validation
  static validateText(text: string, fieldName: string, minLength = 1, maxLength = 255): ValidationResult {
    const errors: string[] = [];
    
    if (!text || text.trim().length === 0) {
      errors.push(`${fieldName} é obrigatório`);
    } else {
      const trimmed = text.trim();
      
      if (trimmed.length < minLength) {
        errors.push(`${fieldName} deve ter pelo menos ${minLength} caracteres`);
      }
      
      if (trimmed.length > maxLength) {
        errors.push(`${fieldName} deve ter no máximo ${maxLength} caracteres`);
      }
      
      // Check for potentially malicious content
      if (this.containsMaliciousContent(trimmed)) {
        errors.push(`${fieldName} contém conteúdo não permitido`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Numeric validation
  static validateNumber(value: any, fieldName: string, min?: number, max?: number): ValidationResult {
    const errors: string[] = [];
    
    if (value === null || value === undefined || value === '') {
      errors.push(`${fieldName} é obrigatório`);
    } else {
      const num = Number(value);
      
      if (isNaN(num)) {
        errors.push(`${fieldName} deve ser um número válido`);
      } else {
        if (min !== undefined && num < min) {
          errors.push(`${fieldName} deve ser maior ou igual a ${min}`);
        }
        
        if (max !== undefined && num > max) {
          errors.push(`${fieldName} deve ser menor ou igual a ${max}`);
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Sanitize HTML content
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title']
    });
  }

  // Check for malicious content
  private static containsMaliciousContent(text: string): boolean {
    const maliciousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /onload=/gi,
      /onerror=/gi,
      /onclick=/gi,
      /onmouseover=/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(text));
  }

  // Sanitize text input
  static sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/onload=/gi, '') // Remove onload=
      .replace(/onerror=/gi, '') // Remove onerror=
      .trim();
  }

  // Validate multiple fields at once
  static validateFields(fields: Record<string, any>, rules: Record<string, any>): ValidationResult {
    const allErrors: string[] = [];
    
    for (const [fieldName, value] of Object.entries(fields)) {
      const rule = rules[fieldName];
      if (!rule) continue;
      
      let result: ValidationResult;
      
      switch (rule.type) {
        case 'email':
          result = this.validateEmail(value);
          break;
        case 'password':
          result = this.validatePassword(value);
          break;
        case 'cnpj_cpf':
          result = this.validateCnpjCpf(value);
          break;
        case 'phone':
          result = this.validatePhone(value);
          break;
        case 'text':
          result = this.validateText(value, rule.label || fieldName, rule.minLength, rule.maxLength);
          break;
        case 'number':
          result = this.validateNumber(value, rule.label || fieldName, rule.min, rule.max);
          break;
        default:
          result = { isValid: true, errors: [] };
      }
      
      allErrors.push(...result.errors);
    }
    
    return { isValid: allErrors.length === 0, errors: allErrors };
  }
}
