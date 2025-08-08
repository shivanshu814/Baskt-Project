import { PublicKeyText } from '@baskt/ui';
import { InfoItemProps } from '../../../../types/trading/components/tabs';

export function InfoItem({ label, value, isPublicKey = false, isDate = false }: InfoItemProps) {
  const renderValue = () => {
    if (isPublicKey) {
      return <PublicKeyText publicKey={value as string} isCopy={true} />;
    }
    return <span>{value}</span>;
  };

  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {renderValue()}
    </div>
  );
}
