
// Utilitário para validação de PIN administrativo
export const PIN_MESTRE = "651998";

export function validarPinAdmin(pin: string): boolean {
  return pin === PIN_MESTRE;
}

export function validateAdminPin(pin: string): boolean {
  return pin === PIN_MESTRE;
}

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
