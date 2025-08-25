import { NumberFormat, PublicKeyText, TableCell, getSolscanAddressUrl } from '@baskt/ui';
import Image from 'next/image';
import { ASSET_TABLE_IDS, DATE_FORMAT_OPTIONS } from '../../constants/assets';
import { AssetTableCellProps } from '../../types/assets';

export function AssetTableCell({ asset, id }: AssetTableCellProps) {
  switch (id) {
    case ASSET_TABLE_IDS.NAME:
      return (
        <TableCell className="font-medium flex items-center gap-2">
          {asset.logo && (
            <Image
              src={asset.logo}
              alt={asset.name || asset.ticker}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span>{asset.name || asset.ticker}</span>
        </TableCell>
      );

    case ASSET_TABLE_IDS.ADDRESS:
      return (
        <TableCell className="font-mono text-xs">
          <a
            href={getSolscanAddressUrl(asset?.account?.address?.toString())}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            <PublicKeyText publicKey={asset?.account?.address?.toString()} />
          </a>
        </TableCell>
      );

    case ASSET_TABLE_IDS.LISTING_TIME:
      return (
        <TableCell className="whitespace-nowrap">
          {new Date(asset?.account?.listingTime).toLocaleString('en-US', DATE_FORMAT_OPTIONS)}
        </TableCell>
      );

    case ASSET_TABLE_IDS.PRICE:
      return (
        <TableCell>
          <NumberFormat value={asset?.price} isPrice={true} showCurrency={true} />
        </TableCell>
      );

    case ASSET_TABLE_IDS.ALLOW_LONG:
      return <TableCell>{asset?.account?.permissions?.allowLongs ? 'Yes' : 'No'}</TableCell>;

    case ASSET_TABLE_IDS.ALLOW_SHORT:
      return <TableCell>{asset?.account?.permissions?.allowShorts ? 'Yes' : 'No'}</TableCell>;

    case ASSET_TABLE_IDS.STATUS:
      return <TableCell>{asset?.account?.isActive ? 'Active' : 'Inactive'}</TableCell>;

    default:
      return <TableCell />;
  }
}
