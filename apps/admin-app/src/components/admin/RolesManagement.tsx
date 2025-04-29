'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Copy, Trash2, Check, MoreVertical, SquareArrowOutUpRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../../hooks/use-toast';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient } from '@baskt/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { AccessControlRole } from '@baskt/types';

const ROLE_DISPLAY_MAP = {
  AssetManager: 'Asset Manager',
  OracleManager: 'Oracle Manager',
  Rebalancer: 'Rebalancer',
  Owner: 'Owner',
};

const formSchema = z.object({
  address: z
    .string()
    .min(1, 'address is required')
    .refine(
      (val) => {
        try {
          new PublicKey(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'invalid Solana address' },
    ),
  role: z.string().min(1, 'role is required'),
});

export function RolesManagement({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
}) {
  const { toast } = useToast();
  const { client } = useBasktClient();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Array<{ account: string; role: string }>>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '',
      role: '',
    },
  });

  const checkOwnerPermission = async () => {
    if (!client) return;
    try {
      const protocol = await client.getProtocolAccount();
      const userAddress = client.getPublicKey().toString();
      const isProtocolOwner = protocol.owner === userAddress;
      const hasOwnerRole = protocol.accessControl.entries.some(
        (entry) => entry.account === userAddress && entry.role.toLowerCase() === 'owner',
      );
      const hasPermission = isProtocolOwner || hasOwnerRole;
      setIsOwner(hasPermission);
    } catch (error) {
      setIsOwner(false);
    }
  };

  useEffect(() => {
    if (client) {
      checkOwnerPermission();
    }
  }, [client]);

  const fetchRoles = async () => {
    if (!client) return;
    try {
      const protocolAccount = await client.getProtocolAccount();
      if (protocolAccount?.accessControl?.entries) {
        setRoles(protocolAccount.accessControl.entries);
      }
    } catch (error) {
      toast({
        title: 'error',
        description: 'failed to fetch the roles',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (client) {
      fetchRoles();
    }
  }, [client]);

  const handleAddRole = async (account: string, role: string) => {
    if (!client || !isOwner) {
      toast({
        title: 'Error',
        description: 'Only owners can add roles',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const txSignature = await client.addRole(new PublicKey(account), AccessControlRole[role as keyof typeof AccessControlRole]);
      if (txSignature) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast({
          title: 'success',
          description: 'role added successfully',
        });
        setShowModal(false);
        form.reset();
        await fetchRoles();
      } else {
        toast({
          title: 'transaction failed',
          description: 'please check your wallet balance and try again',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message?.includes('insufficient funds')
        ? 'insufficient balance in your wallet'
        : error?.message || 'failed to add role';

      toast({
        title: 'error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRole = async (account: string, role: string) => {
    if (!client || !isOwner) {
      toast({
        title: 'Error',
        description: 'Only owners can remove roles',
        variant: 'destructive',
      });
      return;
    }

    try {
      const protocol = await client.getProtocolAccount();
      const userAddress = client.getPublicKey().toString();

      if (account === userAddress) {
        toast({
          title: 'error',
          description: 'cannot remove your own role',
          variant: 'destructive',
        });
        return;
      }

      if (protocol.owner === account) {
        toast({
          title: 'error',
          description: 'cannot remove the protocol owner',
          variant: 'destructive',
        });
        return;
      }

      const txSignature = await client.removeRole(new PublicKey(account), AccessControlRole[role as keyof typeof AccessControlRole]);
      if (txSignature) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast({
          title: 'success',
          description: 'role removed successfully',
        });
        await fetchRoles();
      } else {
        toast({
          title: 'transaction failed',
          description: 'please check your wallet balance and try again',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message?.includes('insufficient funds')
        ? 'insufficient balance in your wallet'
        : error?.message || 'failed to remove role';

      toast({
        title: 'error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('failed to copy address:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await handleAddRole(values.address, values.role);
  };

  return (
    <div className="space-y-6">
      {isOwner && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-[#010b1d] border-white/10 text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Add Role</DialogTitle>
              <DialogDescription className="text-[#E5E7EB]">
                Fill in the role details below.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user's wallet address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ROLE_DISPLAY_MAP).map(([roleType, displayName]) => (
                            <SelectItem key={roleType} value={roleType}>
                              {displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4 border-t border-white/10">
                  <Button
                    type="submit"
                    className="h-11 px-8 bg-blue-500 text-white hover:bg-blue-500/90 rounded-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Role'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span>{role.account}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="p-1 hover:bg-white/10 rounded-md"
                            onClick={() => handleCopyAddress(role.account)}
                          >
                            {copiedAddress === role.account ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-white/60" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copiedAddress === role.account ? 'Copied!' : 'Copy address'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>
                  {ROLE_DISPLAY_MAP[role.role as keyof typeof ROLE_DISPLAY_MAP] || role.role}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyAddress(role.account)}>
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
                        {isOwner && (
                          <DropdownMenuItem
                            onClick={() => handleRemoveRole(role.account, role.role)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Role
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
