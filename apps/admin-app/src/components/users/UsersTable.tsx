import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Loading,
  NumberFormat,
  PublicKeyText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  USDC_MINT,
  useBasktClient,
} from '@baskt/ui';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { Coins, Copy, MoreVertical, SquareArrowOutUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UsersTableProps } from '../../types/faucet';
import { trpc } from '../../utils/trpc';

export function UsersTable({ roles, isLoading, onCopyAddress, onFaucet }: UsersTableProps) {
  const { client } = useBasktClient();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [userPositions, setUserPositions] = useState<Record<string, number>>({});
  const [userBaskts, setUserBaskts] = useState<Record<string, number>>({});
  const [loadingUserData, setLoadingUserData] = useState(false);

  const { data: positionsData } = trpc.position.getPositions.useQuery(
    {},
    {
      refetchInterval: 30 * 1000,
    },
  );

  //TODO: We should just use a useBasktList hook here and give it a user address
  const { data: basktsData } = trpc.baskt.getAllBaskts.useQuery(
    {},
    {
      refetchInterval: 30 * 1000,
    },
  );

  useEffect(() => {
    const processUserData = () => {
      if (!positionsData?.success || !basktsData?.success) return;

      const newUserPositions: Record<string, number> = {};
      const newUserBaskts: Record<string, number> = {};

      if (positionsData.data) {
        positionsData.data.forEach((position: any) => {
          if (position.owner && position.status === 'OPEN') {
            const owner = position.owner.toLowerCase();
            newUserPositions[owner] = (newUserPositions[owner] || 0) + 1;
          }
        });
      }

      if (basktsData.data) {
        basktsData.data.forEach((baskt: any) => {
          if (baskt?.creator) {
            const creator = baskt.creator.toLowerCase();
            newUserBaskts[creator] = (newUserBaskts[creator] || 0) + 1;
          }
        });
      }

      setUserPositions(newUserPositions);
      setUserBaskts(newUserBaskts);
    };

    processUserData();
  }, [positionsData, basktsData]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (roles.length === 0 || !client) return;

      setLoadingBalances(true);
      const newBalances: Record<string, number> = {};

      try {
        const connection = client.connection;

        for (const user of roles) {
          try {
            const userPublicKey = new PublicKey(user.account);
            const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, userPublicKey);

            try {
              const accountInfo = await getAccount(connection, tokenAccount);
              const balance = Number(accountInfo.amount) / Math.pow(10, 6);
              newBalances[user.account] = balance;
            } catch (error) {
              newBalances[user.account] = 0;
            }
          } catch (error) {
            console.error(`Error fetching balance for ${user.account}:`, error);
            newBalances[user.account] = 0;
          }
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setBalances(newBalances);
        setLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [roles, client]);

  return (
    <div className="rounded-md border border-white/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Address</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>USDC Balance</TableHead>
            <TableHead>Open Positions</TableHead>
            <TableHead>Baskts Created</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32">
                <div className="flex items-center justify-center">
                  <Loading />
                </div>
              </TableCell>
            </TableRow>
          ) : roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32">
                <div className="flex items-center justify-center text-white/60">No users found</div>
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span>
                      <PublicKeyText publicKey={role.account} isCopy={true} noFormat={true} />
                    </span>
                  </div>
                </TableCell>
                <TableCell>User</TableCell>
                <TableCell>
                  {loadingBalances ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mr-2"></div>
                      <span className="text-white/60">Loading...</span>
                    </div>
                  ) : (
                    <NumberFormat value={balances[role.account] * 1e6 || 0} isPrice={true} />
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{userPositions[role.account.toLowerCase()] || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{userBaskts[role.account.toLowerCase()] || 0}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFaucet(role.account)}
                      className="h-8"
                    >
                      <Coins className="h-4 w-4 mr-1" />
                      Faucet
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onCopyAddress(role.account)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Address
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`https://solscan.io/account/${role.account}`, '_blank')
                          }
                        >
                          <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
                          View on Explorer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
