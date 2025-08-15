import { cn } from '@baskt/ui';
import { Brain, Coins, Globe, MessageCircle, Shield, TrendingUp, Twitter } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '../../routes/route';

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'border-t mt-12 py-16 bg-gradient-to-b from-background to-secondary/5',
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-primary">Baskt</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              Baskt revolutionizes crypto investing with AI-powered index products. Create custom
              baskts, trade with intelligent rebalancing, and maximize returns with our advanced
              DeFi platform.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://x.com/basktdotai"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="https://baskt.ai/"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Globe className="h-5 w-5" />
                <span className="sr-only">Website</span>
              </Link>
              <Link
                href="https://t.me/basktai"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">Telegram</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trading
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={ROUTES.EXPLORE}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Explore Baskts
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CREATE_BASKT}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Launch Baskt
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PORTFOLIO}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.VAULT}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Earn
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Platform
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  AI Rebalancing
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  BLP Tokens
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure Trading</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span>DeFi Powered</span>
              </div>
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-muted-foreground">
            <p>© 2025 Baskt. All rights reserved. AI-powered trading platform.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
