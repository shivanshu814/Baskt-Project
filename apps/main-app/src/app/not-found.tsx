'use client';

import { Button } from '../components/src/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-8 animate-fade-in">
        <h1 className="text-7xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-foreground mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
