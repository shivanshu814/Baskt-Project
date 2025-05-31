import React from 'react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { useBasktClient } from '@baskt/ui';

export function ProtocolInitialization() {
  const { client } = useBasktClient();
  const [isInitializing, setIsInitializing] = React.useState(false);
  const { toast } = useToast();

  const handleInitializeProtocol = React.useCallback(async () => {
    if (!client) {
      toast({
        title: 'Error',
        description: 'Baskt client not initialized',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsInitializing(true);
      await client.initializeProtocol();
      toast({
        title: 'Success',
        description: 'Protocol initialized successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize protocol',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  }, [client, toast]);

  return (
    <div className="p-6 border border-border rounded-lg">
      <p className="text-muted-foreground">No protocol information available.</p>
      <div className="mt-4 flex space-x-2">
        <Button
          onClick={handleInitializeProtocol}
          disabled={isInitializing}
          className="min-w-[120px]"
        >
          {isInitializing ? 'Initializing...' : 'Initialize Protocol'}
        </Button>
      </div>
    </div>
  );
}
