import { cn } from '@baskt/ui';
import Link from 'next/link';
import { Globe, Mail, MessageCircle, Twitter } from 'lucide-react';

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn('border-t mt-12 py-12 bg-secondary/20', className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Baskt</h3>
            <p className="text-muted-foreground mb-4">
              Baskt simplifies crypto investing with expertly curated index products aligned with
              high-growth trends, helping you navigate the market's complexity with confidence.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://x.com/basktdotai"
                className="text-muted-foreground hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="https://baskt.ai/"
                className="text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-5 w-5" />
                <span className="sr-only">Website</span>
              </Link>
              <Link
                href="https://t.me/basktai"
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">Telegram</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/baskts" className="text-muted-foreground hover:text-primary">
                  Baskts
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  Litepaper
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <Link href="https://t.me/basktai" className="hover:text-primary">
                  Join our Telegram
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Baskt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
