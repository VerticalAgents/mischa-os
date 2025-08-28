import { create } from 'zustand';

interface ErrorDetail {
  error: any;
  context?: string;
  timestamp: Date;
}

interface ErrorDetailStore {
  isOpen: boolean;
  errorDetail: ErrorDetail | null;
  showErrorDetail: (error: any, context?: string) => void;
  hideErrorDetail: () => void;
}

export const useErrorDetail = create<ErrorDetailStore>((set) => ({
  isOpen: false,
  errorDetail: null,
  showErrorDetail: (error: any, context?: string) => {
    console.error('🔍 Error Detail Store - Showing error detail:', {
      error,
      context,
      timestamp: new Date().toISOString()
    });
    
    set({
      isOpen: true,
      errorDetail: {
        error,
        context,
        timestamp: new Date()
      }
    });
  },
  hideErrorDetail: () => {
    set({
      isOpen: false,
      errorDetail: null
    });
  }
}));