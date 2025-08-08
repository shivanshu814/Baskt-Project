import { ErrorDisplayProps } from '../../../../types/trading/components/tabs';

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="px-1 py-1">
      <div className="text-sm text-red-500 font-medium">{error}</div>
    </div>
  );
}
