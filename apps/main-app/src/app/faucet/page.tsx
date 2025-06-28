'use client';
import Faucet from '../../components/faucet/Faucet';
import { Footer } from '../../components/shared/Footer';
import { Lightbulb, HelpCircle, ShieldCheck } from 'lucide-react';

export default function FaucetPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side: Information */}
          <div className="space-y-8 text-center lg:text-left">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                USDC Testnet Faucet
              </h1>
              <p className="mt-4 text-md sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Fuel your development and testing on the Baskt platform with free testnet USDC. Get
                started in seconds.
              </p>
            </div>

            <div className="space-y-6 text-left">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-foreground/5">
                <HelpCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">What is a Faucet?</h3>
                  <p className="text-muted-foreground text-sm">
                    A crypto faucet provides testnet tokens for free, allowing you to experiment
                    with platform features without risking real funds.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-foreground/5">
                <Lightbulb className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">How To Use It</h3>
                  <p className="text-muted-foreground text-sm">
                    Connect your wallet, click the "Mint" button, and approve the transaction.
                    You'll receive 10,000 testnet USDC.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-foreground/5">
                <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">Safe & Secure</h3>
                  <p className="text-muted-foreground text-sm">
                    Our faucet operates on the testnet, so your real assets are never at risk. Feel
                    free to experiment and explore.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Faucet Component */}
          <div className="w-full max-w-md mx-auto">
            <Faucet />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
