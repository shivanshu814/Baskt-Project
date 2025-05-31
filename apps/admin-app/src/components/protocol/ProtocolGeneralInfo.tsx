import { ProtocolGeneralInfoProps } from '../../types/protocol';

export function ProtocolGeneralInfo({ owner }: ProtocolGeneralInfoProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-foreground mb-2">General Information</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="text-muted-foreground">Status:</div>
        <div className="font-medium">
          <span className="text-primary">Initialized</span>
        </div>

        <div className="text-muted-foreground">Owner:</div>
        <div className="font-medium text-sm break-all text-foreground">{owner}</div>
      </div>
    </div>
  );
}
