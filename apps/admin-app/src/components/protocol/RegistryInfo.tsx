'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { useRegistry } from '../../hooks/protocols/useRegistry';
import { Loader2 } from 'lucide-react';
import { useBasktClient, USDC_MINT } from '@baskt/ui';

interface RegistryInfoProps {
  className?: string;
}

export function RegistryInfo({ className = '' }: RegistryInfoProps) {
  const { client } = useBasktClient();
  const { registry, loading, error, refresh } = useRegistry();
  const [isInitializing, setIsInitializing] = React.useState(false);

  const handleInitRegistry = async () => {
    if (!client) return;
    try {
      setIsInitializing(true);
      // Get default treasury from client's public key
      const treasury = client.getPublicKey();
      // Using USDC as the escrow mint
      const escrowMint = USDC_MINT;

      await client.initProtocolRegistry(treasury, escrowMint);
      await refresh();
    } catch (err) {
      console.error('Failed to initialize registry:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Registry Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !registry) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Registry Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {error ? `Error: ${error.message}` : 'Registry not initialized'}
          </p>
          <Button
            onClick={handleInitRegistry}
            disabled={isInitializing || !client}
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              'Initialize Registry'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Registry Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Protocol</TableCell>
              <TableCell className="font-mono text-xs">{registry.protocol}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Treasury</TableCell>
              <TableCell className="font-mono text-xs">{registry.treasury}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Treasury Token</TableCell>
              <TableCell className="font-mono text-xs">{registry.treasuryToken}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Liquidity Pool</TableCell>
              <TableCell className="font-mono text-xs">{registry.liquidityPool}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Token Vault</TableCell>
              <TableCell className="font-mono text-xs">{registry.tokenVault}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Pool Authority</TableCell>
              <TableCell className="font-mono text-xs">{registry.poolAuthority}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Pool Authority Bump</TableCell>
              <TableCell>{registry.poolAuthorityBump}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Program Authority</TableCell>
              <TableCell className="font-mono text-xs">{registry.programAuthority}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Program Authority Bump</TableCell>
              <TableCell>{registry.programAuthorityBump}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Escrow Mint</TableCell>
              <TableCell className="font-mono text-xs">{registry.escrowMint}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Registry Bump</TableCell>
              <TableCell>{registry.bump}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
