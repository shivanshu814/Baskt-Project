'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '../ui/button';
import { useState } from 'react';
import { Wallet } from 'lucide-react';

export function LoginButton() {
  const { login, authenticated, ready } = usePrivy();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) {
      return;
    }
    setIsLoggingIn(true);

    try {
      await login(); //eslint-disable-line
    } catch (error) {
      console.error('LoginButton: Login failed:', error); //eslint-disable-line
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!ready) {
    return (
      <Button disabled variant="outline" size="lg" className="w-full bg-card/50 backdrop-blur-xl">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary mr-2" />
        Loading...
      </Button>
    );
  }

  if (authenticated) {
    return (
      <Button disabled variant="outline" size="lg" className="w-full bg-card/50 backdrop-blur-xl">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary mr-2" />
        Connecting...
      </Button>
    );
  }

  if (isLoggingIn) {
    return (
      <Button disabled variant="outline" size="lg" className="w-full bg-card/50 backdrop-blur-xl">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary mr-2" />
        Connecting...
      </Button>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      size="lg"
      className="w-full bg-primary hover:opacity-90 text-white font-medium flex items-center justify-center gap-3 h-14 rounded-2xl text-lg transition-all duration-200 ease-out"
    >
      <Wallet className="w-6 h-6" />
      Connect Wallet
    </Button>
  );
}
