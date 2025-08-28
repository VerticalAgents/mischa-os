// JSON validation and sanitization utilities
export interface ValidationResult<T> {
  isValid: boolean;
  data: T;
  error?: string;
}

/**
 * Safely parses JSON data with fallback to default value
 */
export function safeParseJSON<T>(value: any, defaultValue: T): ValidationResult<T> {
  // If already the correct type, return as is
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    return { isValid: true, data: value as T };
  }
  
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof defaultValue === 'object') {
    return { isValid: true, data: value as T };
  }

  // If null or undefined, return default
  if (value === null || value === undefined) {
    return { isValid: true, data: defaultValue };
  }

  // If string, try to parse
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return { isValid: true, data: defaultValue };
    }
    
    try {
      const parsed = JSON.parse(value);
      return { isValid: true, data: parsed as T };
    } catch (error) {
      console.warn(`Failed to parse JSON: "${value}". Using default value.`, error);
      return { 
        isValid: false, 
        data: defaultValue, 
        error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // For any other type, return default
  return { isValid: true, data: defaultValue };
}

/**
 * Safely prepares data for Supabase JSONB storage
 * Returns the value directly for JSONB fields (no stringification needed)
 */
export function safeStringifyJSON(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }

  // For JSONB fields in Supabase, return arrays and objects directly
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    return value;
  }

  // If it's a string that looks like JSON, try to parse it back to object/array
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return null;
    }
    
    try {
      const parsed = JSON.parse(value);
      return parsed; // Return the parsed object/array directly
    } catch (error) {
      console.warn(`Invalid JSON string: "${value}". Converting to null.`, error);
      return null;
    }
  }

  // For primitive types, return null
  return null;
}

/**
 * Validates and sanitizes janelas_entrega field
 */
export function validateJanelasEntrega(value: any): ValidationResult<any[]> {
  const result = safeParseJSON(value, []);
  
  // Return the array as-is to maintain type compatibility
  if (result.isValid && Array.isArray(result.data)) {
    return { isValid: true, data: result.data };
  }
  
  return { isValid: true, data: [] };
}

/**
 * Validates and sanitizes categorias_habilitadas field
 */
export function validateCategoriasHabilitadas(value: any): ValidationResult<number[]> {
  const result = safeParseJSON(value, []);
  
  // Additional validation for array of numbers
  if (result.isValid && Array.isArray(result.data)) {
    const isValidArray = result.data.every(item => typeof item === 'number' || (typeof item === 'string' && !isNaN(Number(item))));
    if (!isValidArray) {
      console.warn('categorias_habilitadas contains invalid values, using empty array');
      return { isValid: false, data: [], error: 'Array contains non-numeric values' };
    }
    
    // Convert string numbers to actual numbers
    const sanitizedData = result.data.map(item => typeof item === 'string' ? Number(item) : item);
    return { isValid: true, data: sanitizedData };
  }
  
  return result;
}

/**
 * Comprehensive data validation for cliente fields
 */
export function validateClienteData(data: any): { isValid: boolean; errors: string[]; sanitizedData: any } {
  const errors: string[] = [];
  const sanitizedData = { ...data };

  // Validate janelas_entrega
  const janelasResult = validateJanelasEntrega(data.janelas_entrega);
  if (!janelasResult.isValid && janelasResult.error) {
    errors.push(`janelas_entrega: ${janelasResult.error}`);
  }
  sanitizedData.janelas_entrega = janelasResult.data;

  // Validate categorias_habilitadas
  const categoriasResult = validateCategoriasHabilitadas(data.categorias_habilitadas);
  if (!categoriasResult.isValid && categoriasResult.error) {
    errors.push(`categorias_habilitadas: ${categoriasResult.error}`);
  }
  sanitizedData.categorias_habilitadas = categoriasResult.data;

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}