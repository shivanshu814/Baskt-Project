import {
  NumberFormat,
  PublicKeyText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { formatWeight } from '../../../../../lib/trading/helper';

export const AssetConfigTable = ({
  title,
  configs,
  badgeColor,
  badgeText,
}: {
  title: string;
  configs: any[];
  badgeColor: string;
  badgeText: string;
}) => (
  <div className="bg-gradient-to-br from-zinc-800/30 to-zinc-700/30 rounded-sm p-4 border border-border/30">
    <h4 className="font-bold mb-4 text-sm text-white flex items-center gap-2">
      <div className={`h-5 w-5 rounded-lg ${badgeColor} flex items-center justify-center`}>
        <span className="text-xs text-white">{badgeText}</span>
      </div>
      {title}
    </h4>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/30">
            <TableHead className="text-xs text-muted-foreground font-medium">Asset</TableHead>
            <TableHead className="text-xs text-center text-muted-foreground font-medium">
              Weight
            </TableHead>
            <TableHead className="text-xs text-center text-muted-foreground font-medium">
              Direction
            </TableHead>
            <TableHead className="text-xs text-right text-muted-foreground font-medium">
              Price
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <TableRow
              key={config._id}
              className="border-border/20 hover:bg-zinc-700/20 transition-colors"
            >
              <TableCell className="text-xs text-white">
                <PublicKeyText publicKey={config.assetId} isCopy={true} />
              </TableCell>
              <TableCell className="text-xs text-center text-white font-medium">
                {formatWeight(config.weight)}
              </TableCell>
              <TableCell className="text-xs text-center">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    config.direction
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {config.direction ? 'Long' : 'Short'}
                </span>
              </TableCell>
              <TableCell className="text-xs text-right text-white font-medium">
                <NumberFormat
                  value={
                    typeof config.baselinePrice === 'string'
                      ? parseFloat(config.baselinePrice)
                      : config.baselinePrice
                  }
                  isPrice={true}
                  showCurrency={true}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
