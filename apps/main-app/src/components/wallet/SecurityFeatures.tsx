import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/src/card';
import { Shield, Lock, AlertTriangle, Smartphone, KeyRound } from 'lucide-react';
import { Switch } from '../../components/src/switch';
import { Button } from '../../components/src/button';
import { useState } from 'react';
import { toast } from '../../hooks/use-toast';

export function SecurityFeatures() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [smsVerificationEnabled, setSmsVerificationEnabled] = useState(true);
  const [antiPhishingEnabled, setAntiPhishingEnabled] = useState(false);

  const handleToggle = (feature: string, value: boolean) => {
    if (feature === 'twoFA') {
      setTwoFAEnabled(value);
      toast({
        title: value ? '2FA Enabled' : '2FA Disabled',
        description: value
          ? 'Two-factor authentication has been enabled for your account'
          : 'Two-factor authentication has been disabled for your account',
      });
    } else if (feature === 'sms') {
      setSmsVerificationEnabled(value);
      toast({
        title: value ? 'SMS Verification Enabled' : 'SMS Verification Disabled',
        description: value
          ? 'SMS verification has been enabled for withdrawals'
          : 'SMS verification has been disabled for withdrawals',
      });
    } else if (feature === 'antiPhishing') {
      setAntiPhishingEnabled(value);
      toast({
        title: value ? 'Anti-Phishing Protection Enabled' : 'Anti-Phishing Protection Disabled',
        description: value
          ? 'Anti-phishing code has been set up for your emails'
          : 'Anti-phishing protection has been disabled',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Security Center
        </CardTitle>
        <CardDescription>Protect your account with advanced security features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center">
            <Smartphone className="h-5 w-5 mr-3 text-orange-500" />
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Secure your account with an authentication app
              </p>
            </div>
          </div>
          <Switch
            checked={twoFAEnabled}
            onCheckedChange={(checked) => handleToggle('twoFA', checked)}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center">
            <Lock className="h-5 w-5 mr-3 text-blue-500" />
            <div>
              <p className="font-medium">SMS Verification</p>
              <p className="text-sm text-muted-foreground">
                Require SMS verification for withdrawals
              </p>
            </div>
          </div>
          <Switch
            checked={smsVerificationEnabled}
            onCheckedChange={(checked) => handleToggle('sms', checked)}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 text-yellow-500" />
            <div>
              <p className="font-medium">Anti-Phishing Code</p>
              <p className="text-sm text-muted-foreground">
                Protect against phishing emails with a unique code
              </p>
            </div>
          </div>
          <Switch
            checked={antiPhishingEnabled}
            onCheckedChange={(checked) => handleToggle('antiPhishing', checked)}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center">
            <KeyRound className="h-5 w-5 mr-3 text-green-500" />
            <div>
              <p className="font-medium">API Keys</p>
              <p className="text-sm text-muted-foreground">
                Manage API keys for programmatic trading
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Manage
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button variant="default" className="w-full">
            <Shield className="h-4 w-4 mr-2" />
            Security Checkup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
