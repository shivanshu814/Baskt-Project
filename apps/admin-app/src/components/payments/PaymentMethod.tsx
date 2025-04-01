import { Button } from '../../components/src/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/src/card';
import { CreditCard, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaymentMethodProps {
  title: string;
  description: string;
  lastFour: string;
  expiryDate: string;
  icon?: React.ReactNode;
  isDefault?: boolean;
  className?: string;
}

export function PaymentMethod({
  title,
  description,
  lastFour,
  expiryDate,
  icon = <CreditCard className="h-5 w-5" />,
  isDefault = false,
  className,
}: PaymentMethodProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-full">{icon}</div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {isDefault && (
            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Default</div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Card Number</span>
            <span className="font-medium">•••• •••• •••• {lastFour}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Expiry Date</span>
            <span className="font-medium">{expiryDate}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button variant="ghost" size="sm" className="flex-1">
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
}
