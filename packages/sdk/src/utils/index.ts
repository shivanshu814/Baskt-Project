import BN from 'bn.js';

export * from './acl-helper';

export * from './lookup-table-helper';

/**
 * Converts a number or BN to an 8-byte little-endian Buffer (Rust u64::to_le_bytes equivalent)
 */
export function toU64LeBytes(num: number | BN): Buffer {
  const n = num instanceof BN ? num : new BN(num);
  const buf = Buffer.alloc(8);
  const le = n.toArrayLike(Buffer, 'le', 8);
  le.copy(buf);
  return buf;
}
