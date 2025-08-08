'use client';

import { Button } from '@baskt/ui';
import { AlertTriangle, Home, MoveLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center max-w-lg mx-auto p-8">
        <div className="relative mb-8">
          <div className="text-9xl font-black text-primary/20">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="h-24 w-24 text-primary animate-pulse" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Oops! Page Not Found</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The page you're looking for seems to have wandered off into the digital void. Don't
              worry, even the best explorers get lost sometimes!
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Try checking the URL or navigating from the main menu</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg" className="group">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Return to Home
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="group"
            >
              <MoveLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="flex items-center gap-2">Go Back</span>
            </Button>
          </div>
        </div>

        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
}
