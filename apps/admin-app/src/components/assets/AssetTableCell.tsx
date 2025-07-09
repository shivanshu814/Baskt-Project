import { PublicKeyText, NumberFormat, TableCell, getSolscanAddressUrl } from '@baskt/ui';
import { DATE_FORMAT_OPTIONS } from '../../constants/assets';
import { ASSET_TABLE_IDS } from '../../constants/assets';
import { AssetTableCellProps } from '../../types/assets';

export function AssetTableCell({ asset, id }: AssetTableCellProps) {
  switch (id) {
    case ASSET_TABLE_IDS.TICKER:
      return <TableCell className="font-medium">{asset.ticker}</TableCell>;

    case ASSET_TABLE_IDS.ADDRESS:
      return (
        <TableCell className="font-mono text-xs">
          <a
            href={getSolscanAddressUrl(asset.account.address.toString())}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            <PublicKeyText publicKey={asset.account.address.toString()} />
          </a>
        </TableCell>
      );

    case ASSET_TABLE_IDS.LISTING_TIME:
      return (
        <TableCell>
          {new Date(asset.account.listingTime).toLocaleString('en-US', DATE_FORMAT_OPTIONS)}
        </TableCell>
      );

    case ASSET_TABLE_IDS.PRICE:
      return (
        <TableCell>
          <NumberFormat value={asset.price} isPrice={true} />
        </TableCell>
      );

    case ASSET_TABLE_IDS.ALLOW_LONG:
      return <TableCell>{asset.account.permissions.allowLongs ? 'Yes' : 'No'}</TableCell>;

    case ASSET_TABLE_IDS.ALLOW_SHORT:
      return <TableCell>{asset.account.permissions.allowShorts ? 'Yes' : 'No'}</TableCell>;

    case ASSET_TABLE_IDS.STATUS:
      return <TableCell>{asset.account.isActive ? 'Active' : 'Inactive'}</TableCell>;

    case ASSET_TABLE_IDS.LATEST_PRICE:
      return (
        <TableCell>
          <NumberFormat value={asset?.price ?? 0} isPrice={true} />
        </TableCell>
      );

    case ASSET_TABLE_IDS.LATEST_PRICE_TIME:
      return (
        <TableCell>
          {asset.latestPrice?.time
            ? new Date(asset.latestPrice.time * 1000).toLocaleString('en-US', DATE_FORMAT_OPTIONS)
            : '---'}
        </TableCell>
      );

    default:
      return <TableCell />;
  }
}
