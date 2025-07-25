
import DOMPurify from 'dompurify';

export class SecureInputValidator {
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validateCnpjCpf(document: string): boolean {
    if (!document) return false;
    
    // Remove non-numeric characters
    const cleanDoc = document.replace(/[^0-9]/g, '');
    
    // Check length (11 for CPF, 14 for CNPJ)
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) return false;
    
    // Check for repeated digits (invalid)
    if (/^(.)\1*$/.test(cleanDoc)) return false;
    
    return true;
  }

  static validatePhoneNumber(phone: string): boolean {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Remove potential XSS patterns
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '')
      .trim();
  }

  static validateNumeric(value: string | number): boolean {
    if (typeof value === 'number') return !isNaN(value) && isFinite(value);
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return !isNaN(num) && isFinite(num);
    }
    return false;
  }

  static validateLength(input: string, minLength: number, maxLength: number): boolean {
    if (!input) return minLength === 0;
    return input.length >= minLength && input.length <= maxLength;
  }
}
