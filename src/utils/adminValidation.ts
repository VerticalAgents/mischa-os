
import { validateAdminAccess } from './secureAdminValidation';

/**
 * @deprecated Use validateAdminAccess from secureAdminValidation.ts instead
 * This file is maintained for backward compatibility only
 */

// Remove the hardcoded PIN for security
export const PIN_MESTRE = ""; // Deprecated - PIN-based auth removed for security

export function validarPinAdmin(pin: string): boolean {
  console.warn('PIN-based admin validation is deprecated and disabled for security reasons. Use role-based authentication instead.');
  return false;
}

export function validateAdminPin(pin: string): boolean {
  console.warn('PIN-based admin validation is deprecated and disabled for security reasons. Use role-based authentication instead.');
  return false;
}

export function solicitarPinAdminModal(): Promise<boolean> {
  console.warn('PIN-based admin validation is deprecated. Use validateAdminAccess() instead.');
  return validateAdminAccess();
}

export function solicitarPinAdmin(): Promise<boolean> {
  console.warn('PIN-based admin validation is deprecated. Use validateAdminAccess() instead.');
  return validateAdminAccess();
}
