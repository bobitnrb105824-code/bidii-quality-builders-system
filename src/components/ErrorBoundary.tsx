import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    // @ts-ignore
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // @ts-ignore
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try refreshing the page.";
      
      try {
        // @ts-ignore
        const parsedError = JSON.parse(this.state.error?.message || "");
        if (parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error} (${parsedError.operationType} on ${parsedError.path})`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-xl border text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-4">Application Error</h1>
            <p className="text-muted-foreground mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all shadow-md"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
