import { Button } from '../../components/src/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/src/card';
import { Input } from '../../components/src/input';
import { CreditCard, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/use-toast';
import { ReactNode } from 'react';

interface WalletCardProps {
  title: string;
  address: string;
  balance: number;
  symbol: string;
  className?: string;
  children?: ReactNode;
}

export function WalletCard({
  title,
  address,
  balance,
  symbol,
  className,
  children,
}: WalletCardProps) {
  const { toast } = useToast();
  const [showAddress, setShowAddress] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: 'Address copied',
      description: 'Wallet address copied to clipboard',
    });
  };

  const shortenedAddress = `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <CreditCard className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
        {children}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Address</div>
          <div className="relative">
            <Input
              readOnly
              value={showAddress ? address : shortenedAddress}
              className="pr-20 font-mono text-sm"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowAddress(!showAddress)}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">View full address</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy address</span>
              </Button>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Balance</div>
          <div className="text-2xl font-bold">
            {balance} {symbol}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button className="flex-1" variant="outline">
          Deposit
        </Button>
        <Button className="flex-1" variant="outline">
          Withdraw
        </Button>
      </CardFooter>
    </Card>
  );
}
