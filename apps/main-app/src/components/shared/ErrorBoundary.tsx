'use client';

import { Button } from '@baskt/ui';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Component, ErrorInfo } from 'react';
import { Props, State } from '../../types/components/ui/ui';

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
          <div className="text-center max-w-lg mx-auto p-8">
            <div className="relative mb-8">
              <div className="text-9xl font-black text-destructive/20 animate-pulse">!</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertTriangle className="h-24 w-24 text-destructive animate-bounce" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Something went wrong!</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We encountered an unexpected error. Please try refreshing the page or contact
                  support if the problem persists.
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Error: {this.state.error?.message || 'Unknown error'}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={this.handleReset} variant="default" size="lg" className="group">
                  <RefreshCw className="h-4 w-4 group-hover:scale-110 transition-transform mr-2" />
                  Try Again
                </Button>

                <Button asChild variant="outline" size="lg" className="group">
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    Return to Home
                  </Link>
                </Button>
              </div>
            </div>

            <div className="absolute top-10 left-10 w-20 h-20 bg-destructive/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-destructive/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
