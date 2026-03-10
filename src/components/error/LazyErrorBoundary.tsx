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
    const isDynamicImportError = error.message.includes('Failed to fetch dynamically imported module');
    
    if (isDynamicImportError) {
      console.warn('Dynamic import failed, attempting auto-reload:', error.message);
      if (!sessionStorage.getItem('lazy-reload-attempted')) {
        sessionStorage.setItem('lazy-reload-attempted', 'true');
        window.location.reload();
        return;
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    sessionStorage.removeItem('lazy-reload-attempted');
    window.location.reload();
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
