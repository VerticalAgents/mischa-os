
import { toast } from '@/hooks/use-toast';

export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'lovable-secure-key';
  
  static encrypt(data: string): string {
    try {
      // Simple encryption for demo - in production, use proper encryption
      return btoa(data);
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      return atob(encryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  static setSecureItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      const encryptedValue = this.encrypt(serializedValue);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Failed to store secure item:', error);
      toast({
        title: "Erro de Segurança",
        description: "Não foi possível armazenar dados de forma segura",
        variant: "destructive"
      });
    }
  }

  static getSecureItem(key: string): any {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;
      
      const decryptedValue = this.decrypt(encryptedValue);
      return JSON.parse(decryptedValue);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  }

  static removeSecureItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove secure item:', error);
    }
  }

  static clearSecureStorage(): void {
    try {
      // Only clear app-specific items, not all localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('lovable-') || key?.startsWith('app-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
}
