'use client';

import { Button } from '@baskt/ui';
import { AlertTriangle, Home, MoveLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute top-40 right-32 w-24 h-24 bg-purple-500/10 rounded-full blur-lg animate-bounce"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-32 left-32 w-20 h-20 bg-pink-500/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl animate-bounce"
          style={{ animationDelay: '0.5s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary/5 rounded-full blur-lg animate-ping"
          style={{ animationDelay: '1.5s' }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-12 h-12 bg-purple-500/5 rounded-full blur-md animate-ping"
          style={{ animationDelay: '2.5s' }}
        ></div>
      </div>

      <div className="text-center max-w-lg mx-auto p-8 relative z-10">
        <div className="relative mb-8 group">
          <div className="text-9xl font-black text-primary/20 animate-pulse">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="h-24 w-24 text-primary animate-bounce group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="absolute inset-0">
            <div
              className="absolute top-4 left-4 w-2 h-2 bg-primary/60 rounded-full animate-ping"
              style={{ animationDelay: '0s' }}
            ></div>
            <div
              className="absolute top-8 right-8 w-1.5 h-1.5 bg-purple-500/60 rounded-full animate-ping"
              style={{ animationDelay: '0.5s' }}
            ></div>
            <div
              className="absolute bottom-6 left-8 w-1 h-1 bg-pink-500/60 rounded-full animate-ping"
              style={{ animationDelay: '1s' }}
            ></div>
            <div
              className="absolute bottom-4 right-4 w-1.5 h-1.5 bg-violet-500/60 rounded-full animate-ping"
              style={{ animationDelay: '1.5s' }}
            ></div>
          </div>
        </div>

        <div className="space-y-6 animate-fade-in">
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The page you're looking for seems to have wandered off into the digital void. Don't
              worry, even the best explorers get lost sometimes!
            </p>
          </div>

          <div
            className="bg-muted/30 rounded-lg p-4 border border-border/50 animate-slide-up backdrop-blur-sm hover:bg-muted/40 transition-all duration-300"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Try checking the URL or navigating from the main menu</span>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up w-full"
            style={{ animationDelay: '0.6s' }}
          >
            <Button
              asChild
              variant="default"
              size="lg"
              className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-primary/25 w-full sm:w-auto min-w-[200px]"
            >
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                Return to Home
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="group bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-primary/10 w-full sm:w-auto min-w-[200px]"
            >
              <MoveLeft className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="flex items-center justify-center gap-2">Go Back</span>
            </Button>
          </div>
        </div>
      </div>
      <div
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary/40 rounded-full animate-ping"
        style={{ animationDelay: '3s' }}
      ></div>
      <div
        className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-purple-500/40 rounded-full animate-ping"
        style={{ animationDelay: '3.5s' }}
      ></div>
    </div>
  );
}
