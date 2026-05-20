import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class LazyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const msg = error?.message || '';
    const isDynamicImportError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('error loading dynamically imported module') ||
      /ChunkLoadError/i.test(error?.name || '');

    if (isDynamicImportError) {
      const key = 'lazy-reload-attempts';
      const attempts = Number(sessionStorage.getItem(key) || '0');
      console.warn('Dynamic import failed, attempt', attempts + 1, msg);
      if (attempts < 2) {
        sessionStorage.setItem(key, String(attempts + 1));
        this.hardReload();
        return;
      }
    }
  }

  hardReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) {
      console.warn('Cache/SW cleanup failed:', e);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('_r', Date.now().toString());
    window.location.replace(url.toString());
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    sessionStorage.removeItem('lazy-reload-attempts');
    this.hardReload();
  };

  render() {
    if (this.state.hasError) {
      const isDynamicImportError = this.state.error?.message.includes('Failed to fetch dynamically imported module');

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {isDynamicImportError ? 'Erro ao carregar página' : 'Algo deu errado'}
          </h2>
          <p className="text-muted-foreground text-center max-w-md">
            {isDynamicImportError 
              ? 'Houve um problema ao carregar esta página. Isso pode acontecer após atualizações do sistema.'
              : 'Ocorreu um erro inesperado.'
            }
          </p>
          <Button onClick={this.handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Recarregar página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyErrorBoundary;
