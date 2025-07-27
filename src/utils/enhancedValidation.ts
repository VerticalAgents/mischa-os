
import { InputValidator } from '@/utils/inputValidation';
import { logger } from '@/utils/logger';

export class EnhancedValidator extends InputValidator {
  // Enhanced server-side validation with security checks
  static validateUserInput(input: any, fieldName: string): { isValid: boolean; errors: string[]; sanitized: any } {
    const errors: string[] = [];
    let sanitized = input;

    if (typeof input === 'string') {
      // Sanitize HTML and dangerous characters
      sanitized = this.sanitizeHtml(input);
      
      // Check for SQL injection patterns
      if (this.containsSQLInjection(input)) {
        errors.push(`${fieldName} contém padrões suspeitos`);
        logger.warn('Potential SQL injection attempt detected', { input, fieldName });
      }
      
      // Check for XSS patterns
      if (this.containsXSSPatterns(input)) {
        errors.push(`${fieldName} contém código malicioso`);
        logger.warn('Potential XSS attempt detected', { input, fieldName });
      }
      
      // Check for path traversal
      if (this.containsPathTraversal(input)) {
        errors.push(`${fieldName} contém caminho inválido`);
        logger.warn('Potential path traversal attempt detected', { input, fieldName });
      }
    }

    // Rate limiting check for repeated validation attempts
    this.checkValidationRateLimit(fieldName);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // SQL injection detection
  private static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)/gi,
      /(\bor\b|\band\b)\s*\d+\s*=\s*\d+/gi,
      /('|\"|;|--|\*|\/\*|\*\/)/g,
      /(\bexec\b|\bexecute\b|\bsp_\w+)/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS pattern detection
  private static containsXSSPatterns(input: string): boolean {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload=|onerror=|onclick=|onmouseover=|onmouseout=|onfocus=|onblur=/gi,
      /<img[\s\S]*?src[\s\S]*?=[\s\S]*?[\"\'][\s\S]*?javascript:/gi,
      /data:text\/html/gi,
      /expression\(/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Path traversal detection
  private static containsPathTraversal(input: string): boolean {
    const pathTraversalPatterns = [
      /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/gi,
      /\%2e\%2e\%2f|\%2e\%2e\%5c/gi,
      /\.\./gi
    ];
    
    return pathTraversalPatterns.some(pattern => pattern.test(input));
  }

  // Rate limiting for validation attempts
  private static validationAttempts = new Map<string, { count: number; timestamp: number }>();
  
  private static checkValidationRateLimit(fieldName: string): void {
    const now = Date.now();
    const key = `${fieldName}_${now}`;
    const timeWindow = 60000; // 1 minute
    const maxAttempts = 100;
    
    // Clean old entries
    for (const [k, v] of this.validationAttempts.entries()) {
      if (now - v.timestamp > timeWindow) {
        this.validationAttempts.delete(k);
      }
    }
    
    // Check current attempts
    const currentAttempts = Array.from(this.validationAttempts.values())
      .filter(v => now - v.timestamp < timeWindow)
      .reduce((sum, v) => sum + v.count, 0);
    
    if (currentAttempts > maxAttempts) {
      logger.warn('Validation rate limit exceeded', { fieldName, attempts: currentAttempts });
      throw new Error('Rate limit exceeded for validation attempts');
    }
    
    // Record this attempt
    const existing = this.validationAttempts.get(key);
    if (existing) {
      existing.count++;
    } else {
      this.validationAttempts.set(key, { count: 1, timestamp: now });
    }
  }

  // Enhanced CNPJ/CPF validation with checksum
  static validateCnpjCpfWithChecksum(document: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!document) {
      errors.push('CNPJ/CPF é obrigatório');
      return { isValid: false, errors };
    }

    // Remove non-numeric characters
    const cleanDoc = document.replace(/[^0-9]/g, '');
    
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      errors.push('CNPJ/CPF deve ter 11 ou 14 dígitos');
      return { isValid: false, errors };
    }

    // Validate CPF (11 digits)
    if (cleanDoc.length === 11) {
      if (!this.validateCPFChecksum(cleanDoc)) {
        errors.push('CPF inválido');
      }
    }

    // Validate CNPJ (14 digits)
    if (cleanDoc.length === 14) {
      if (!this.validateCNPJChecksum(cleanDoc)) {
        errors.push('CNPJ inválido');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // CPF checksum validation
  private static validateCPFChecksum(cpf: string): boolean {
    if (cpf.length !== 11) return false;
    
    // Check for known invalid CPFs
    const invalidCPFs = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999'
    ];
    
    if (invalidCPFs.includes(cpf)) return false;

    // Calculate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    // Calculate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10));
  }

  // CNPJ checksum validation
  private static validateCNPJChecksum(cnpj: string): boolean {
    if (cnpj.length !== 14) return false;

    // Check for known invalid CNPJs
    const invalidCNPJs = [
      '00000000000000', '11111111111111', '22222222222222',
      '33333333333333', '44444444444444', '55555555555555',
      '66666666666666', '77777777777777', '88888888888888',
      '99999999999999'
    ];
    
    if (invalidCNPJs.includes(cnpj)) return false;

    // Calculate first check digit
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    // Calculate second check digit
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digit1 === parseInt(cnpj.charAt(12)) && digit2 === parseInt(cnpj.charAt(13));
  }

  // Enhanced phone validation with Brazilian patterns
  static validateBrazilianPhone(phone: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!phone) {
      errors.push('Telefone é obrigatório');
      return { isValid: false, errors };
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Brazilian phone patterns
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
      return { isValid: false, errors };
    }

    // Check area code (first 2 digits)
    const areaCode = cleanPhone.substring(0, 2);
    const validAreaCodes = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', '62', '64', '65', '66', '67', '68', '69', // Centro-Oeste
      '71', '73', '74', '75', '77', '79', // BA
      '81', '82', '83', '84', '85', '86', '87', '88', '89', // Nordeste
      '91', '92', '93', '94', '95', '96', '97', '98', '99' // Norte
    ];
    
    if (!validAreaCodes.includes(areaCode)) {
      errors.push('Código de área inválido');
    }

    // Check mobile number format (11 digits)
    if (cleanPhone.length === 11) {
      const firstDigit = cleanPhone.charAt(2);
      if (!['8', '9'].includes(firstDigit)) {
        errors.push('Número de celular deve começar com 8 ou 9');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
