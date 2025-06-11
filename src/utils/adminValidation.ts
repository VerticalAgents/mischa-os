
// Utilitário para validação de PIN administrativo
export const PIN_MESTRE = "651998";

export function validarPinAdmin(pin: string): boolean {
  return pin === PIN_MESTRE;
}

export function validateAdminPin(pin: string): boolean {
  return pin === PIN_MESTRE;
}

// Função atualizada que retorna Promise<boolean> para ser usada com modal
export function solicitarPinAdminModal(): Promise<boolean> {
  return new Promise((resolve) => {
    // Esta função será substituída pelo componente PinDialog
    // Mantida apenas para compatibilidade
    resolve(false);
  });
}

// Versão legacy mantida para compatibilidade
export function solicitarPinAdmin(): Promise<boolean> {
  return new Promise((resolve) => {
    const pin = prompt("Digite o PIN de administrador:");
    if (pin === null) {
      resolve(false);
      return;
    }
    
    const isValid = validarPinAdmin(pin);
    if (!isValid) {
      alert("PIN inválido!");
    }
    resolve(isValid);
  });
}
