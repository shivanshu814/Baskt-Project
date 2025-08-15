'use client';

import { Button } from '@baskt/ui';
import { AlertTriangle, Check, Copy, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GlobalErrorProps } from '../types/baskt/ui/ui';

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [copied, setCopied] = useState(false);
  const [errorId, setErrorId] = useState<string>('');

  useEffect(() => {
    const generateErrorId = () => {
      if (error.digest) {
        return error.digest;
      }

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `${timestamp}-${random}`;
    };

    const id = generateErrorId();
    setErrorId(id);

    // console.error('Global application error:', {
    //   error: error.message,
    //   stack: error.stack,
    //   errorId: id,
    //   timestamp: new Date().toISOString(),
    //   url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    //   userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    // });
  }, [error]);

  const copyErrorId = async () => {
    try {
      await navigator.clipboard.writeText(errorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error ID:', err);
    }
  };

  return (
    <html lang="en" className="dark">
      <head>
        <title>Error - Baskt</title>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
          <div className="text-center max-w-lg mx-auto p-8">
            <div className="relative mb-8">
              <div className="text-9xl font-black text-destructive/20 animate-pulse">500</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertTriangle className="h-24 w-24 text-destructive animate-bounce" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Server Error</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We're experiencing technical difficulties. Our team has been notified and is
                  working to resolve this issue. Please try again or contact support if the problem
                  persists.
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Error ID: {errorId}</span>
                  <Button
                    onClick={copyErrorId}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                {error.message && (
                  <div className="mt-2 text-xs text-muted-foreground/70 break-words">
                    {error.message}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={reset} variant="default" size="lg" className="group">
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
      </body>
    </html>
  );
}
