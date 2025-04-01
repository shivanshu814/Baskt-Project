import { Button } from '../../components/src/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/src/card';
import { CheckCircle, Clock, FileText, Upload, User, AlertCircle } from 'lucide-react';
import { Progress } from '../../components/src/progress';
import { toast } from '../../hooks/use-toast';

export function KYCVerification() {
  const verificationStatus = {
    emailVerified: true,
    phoneVerified: true,
    identityVerified: false,
    addressVerified: false,
    progress: 50,
  };

  const handleVerificationStart = (type: string) => {
    toast({
      title: 'Verification initiated',
      description: `Your ${type} verification process has started. Follow the instructions to complete.`,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <User className="h-5 w-5 mr-2" />
          KYC Verification
        </CardTitle>
        <CardDescription>
          Complete your verification to unlock full platform features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm">{verificationStatus.progress}%</span>
          </div>
          <Progress value={verificationStatus.progress} className="h-2" />
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
              <span>Email Verification</span>
            </div>
            <span className="text-sm text-green-500 font-medium">Verified</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
              <span>Phone Verification</span>
            </div>
            <span className="text-sm text-green-500 font-medium">Verified</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-yellow-500" />
              <span>Identity Verification</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleVerificationStart('identity')}>
              <Upload className="h-4 w-4 mr-2" />
              Start
            </Button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Address Verification</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!verificationStatus.identityVerified}
              onClick={() => handleVerificationStart('address')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          <p className="mb-1">
            KYC verification helps us comply with regulatory requirements and secure your account.
          </p>
          <p>Higher verification levels unlock higher withdrawal limits and additional features.</p>
        </div>
      </CardFooter>
    </Card>
  );
}
