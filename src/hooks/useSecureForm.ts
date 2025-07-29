
import { useState, useCallback } from 'react';
import { EnhancedInputValidator, ValidationResult } from '@/utils/enhancedInputValidation';
import { CSRFProtection } from '@/utils/csrfProtection';
import { securityMonitoring } from '@/services/securityMonitoring';
import { toast } from 'sonner';

interface SecureFormConfig {
  enableCSRFProtection?: boolean;
  enableInputSanitization?: boolean;
  enableSecurityMonitoring?: boolean;
  rateLimitAction?: string;
}

interface FormErrors {
  [key: string]: string[];
}

export function useSecureForm<T extends Record<string, any>>(
  initialValues: T,
  config: SecureFormConfig = {}
) {
  const {
    enableCSRFProtection = true,
    enableInputSanitization = true,
    enableSecurityMonitoring = true,
    rateLimitAction
  } = config;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrfToken] = useState(() => 
    enableCSRFProtection ? CSRFProtection.getTokenForForm() : ''
  );

  // Secure value setter with validation and sanitization
  const setValue = useCallback((field: keyof T, value: any) => {
    let processedValue = value;
    let fieldErrors: string[] = [];

    if (enableInputSanitization && typeof value === 'string') {
      const validation = EnhancedInputValidator.sanitizeText(value);
      if (!validation.isValid) {
        fieldErrors = validation.errors;
        
        // Monitor suspicious input
        if (enableSecurityMonitoring) {
          securityMonitoring.monitorInputValidationFailure(
            String(field),
            value,
            fieldErrors
          );
        }
      } else {
        processedValue = validation.sanitizedValue || value;
      }
    }

    setValues(prev => ({ ...prev, [field]: processedValue }));
    setErrors(prev => ({ ...prev, [field]: fieldErrors }));
  }, [enableInputSanitization, enableSecurityMonitoring]);

  // Validate specific field
  const validateField = useCallback((field: keyof T, value: any): ValidationResult => {
    const fieldName = String(field);
    
    switch (fieldName) {
      case 'email':
        return EnhancedInputValidator.validateEmail(value);
      
      case 'password':
        return EnhancedInputValidator.validatePassword(value);
      
      case 'cnpj_cpf':
        return EnhancedInputValidator.validateDocument(value);
      
      case 'contato_telefone':
        return EnhancedInputValidator.validatePhone(value);
      
      default:
        if (typeof value === 'string') {
          return EnhancedInputValidator.sanitizeText(value);
        }
        if (typeof value === 'number') {
          return EnhancedInputValidator.validateNumericInput(value);
        }
        return { isValid: true, errors: [] };
    }
  }, []);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.entries(values).forEach(([field, value]) => {
      const validation = validateField(field as keyof T, value);
      if (!validation.isValid) {
        newErrors[field] = validation.errors;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  // Secure form submission
  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void>,
    options: { skipValidation?: boolean } = {}
  ) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Rate limiting check
      if (rateLimitAction && enableSecurityMonitoring) {
        const ipAddress = await fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(d => d.ip)
          .catch(() => '127.0.0.1');
        
        // This would be better handled server-side, but we can at least log it
        await securityMonitoring.monitorDataAccess('form_submission', rateLimitAction, 1);
      }

      // CSRF protection
      if (enableCSRFProtection) {
        if (!CSRFProtection.validateToken(csrfToken)) {
          throw new Error('Requisição inválida. Recarregue a página e tente novamente.');
        }
      }

      // Form validation
      if (!options.skipValidation && !validateForm()) {
        toast.error('Por favor, corrija os erros no formulário');
        return;
      }

      // Execute submission
      await onSubmit(values);

      // Log successful form submission
      if (enableSecurityMonitoring) {
        await securityMonitoring.logSecurityEvent({
          eventType: 'FORM_SUBMISSION_SUCCESS',
          severity: 'INFO',
          details: {
            form: rateLimitAction || 'unknown',
            fieldCount: Object.keys(values).length
          }
        });
      }

    } catch (error) {
      // Log failed form submission
      if (enableSecurityMonitoring) {
        await securityMonitoring.logSecurityEvent({
          eventType: 'FORM_SUBMISSION_ERROR',
          severity: 'WARNING',
          details: {
            form: rateLimitAction || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }

      toast.error(error instanceof Error ? error.message : 'Erro ao processar formulário');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    values,
    csrfToken,
    enableCSRFProtection,
    enableSecurityMonitoring,
    rateLimitAction,
    validateForm
  ]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  // Get field error
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    const fieldErrors = errors[String(field)];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((field: keyof T): boolean => {
    const fieldErrors = errors[String(field)];
    return fieldErrors && fieldErrors.length > 0;
  }, [errors]);

  return {
    values,
    errors,
    isSubmitting,
    csrfToken,
    setValue,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
    getFieldError,
    hasFieldError
  };
}
