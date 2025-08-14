import { PublicKeyText } from '@baskt/ui';
import { InfoTabProps } from '../../../../types/baskt/trading/components/tabs';
import {
  getBasktStatusColor,
  getBasktStatusText,
  getInfoItems,
} from '../../../../utils/formatters/formatters';

export function InfoTab({ baskt }: InfoTabProps) {
  const infoItems = getInfoItems(baskt);

  return (
    <div className="space-y-4 -mt-4 -ml-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Baskt Status</span>
        <span className={`text-sm ${getBasktStatusColor(baskt?.isActive)}`}>
          {getBasktStatusText(baskt?.isActive)}
        </span>
      </div>
      <div className="space-y-2">
        {infoItems.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            {item.isPublicKey ? (
              <PublicKeyText publicKey={item.value as string} isCopy={true} />
            ) : (
              <span>{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
