import { Card, CardHeader, CardTitle, CardContent } from '@baskt/ui';
import { NumberFormat } from '@baskt/ui';
import { ObjectId } from 'mongoose';
import { useRouter } from 'next/navigation';

interface Baskt {
  basktId?: string | ObjectId;
  name: string;
  price: number;
  change24h: number;
  aum?: number;
}

interface MyBasktsProps {
  myBaskts: Baskt[];
}

const MyBaskts = ({ myBaskts }: MyBasktsProps) => {
  const router = useRouter();
  const safeBaskts = (myBaskts || [])
    .filter((b): b is NonNullable<typeof b> => b != null)
    .map((b) => ({
      basktId: b.basktId,
      name: b.name ?? '',
      price: b.price ?? 0,
      change24h: b.change24h ?? 0,
      aum: b.aum ?? 0,
    }));
  return (
    <Card className="bg-background border border-border rounded-xl shadow-none bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-xl font-bold">My Baskts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeBaskts.slice(0, 6).map((baskt, i) => (
            <div
              key={baskt.basktId?.toString() || 'unknown-' + i}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/baskts/${encodeURIComponent(baskt.name)}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium truncate">{baskt.name}</h3>
                <span
                  className={`text-sm ${baskt.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {baskt.change24h >= 0 ? '+' : ''}
                  {baskt.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">
                <NumberFormat value={baskt.price} isPrice />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyBaskts;
