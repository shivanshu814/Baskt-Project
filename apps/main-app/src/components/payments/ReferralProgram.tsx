import { Button } from '../../components/src/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/src/card';
import { Input } from '../../components/src/input';
import { Copy, Share2, Gift, Twitter, Facebook } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../hooks/use-toast';

export function ReferralProgram() {
  const { toast } = useToast();
  const [referralCode] = useState(
    'BASKT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  );
  const referralUrl = `https://baskt.app/r/${referralCode}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} copied`,
      description: `The ${type.toLowerCase()} has been copied to your clipboard.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Gift className="h-5 w-5 mr-2 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>Earn rewards by inviting friends to join our platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Your Referral Code</div>
          <div className="relative">
            <Input readOnly value={referralCode} className="font-mono" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => copyToClipboard(referralCode, 'Referral code')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Referral Link</div>
          <div className="relative">
            <Input readOnly value={referralUrl} className="pr-10" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => copyToClipboard(referralUrl, 'Referral link')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="text-sm font-medium">Share with Friends</div>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1">
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button variant="outline" className="flex-1">
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-lg space-y-2">
          <h3 className="font-medium">Rewards Structure</h3>
          <p className="text-sm text-muted-foreground">
            • You receive 20% of the trading fees from your referrals
          </p>
          <p className="text-sm text-muted-foreground">
            • Your friends get a 10% discount on their trading fees
          </p>
          <p className="text-sm text-muted-foreground">
            • Additional bonuses for high-volume referrals
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center">
          <div className="font-bold mb-1">Total Referrals: 0</div>
          <div className="text-sm text-muted-foreground">Total Earnings: 0.00 USDT</div>
        </div>
      </CardFooter>
    </Card>
  );
}
