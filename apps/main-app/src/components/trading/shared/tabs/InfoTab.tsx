import { InfoTabProps } from '../../../../types/trading/components/tabs';
import {
  getBasktStatusColor,
  getBasktStatusText,
  getInfoItems,
} from '../../../../utils/formatters/formatters';
import { InfoItem } from '../cards/InfoItem';

export function InfoTab({ baskt }: InfoTabProps) {
  const infoItems = getInfoItems(baskt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Baskt Status</span>
        <span className={`text-sm ${getBasktStatusColor(baskt?.isActive)}`}>
          {getBasktStatusText(baskt?.isActive)}
        </span>
      </div>
      <div className="space-y-2">
        {infoItems.map((item, index) => (
          <InfoItem
            key={index}
            label={item.label}
            value={item.value}
            isPublicKey={item.isPublicKey}
            isDate={item.isDate}
          />
        ))}
      </div>
    </div>
  );
}
