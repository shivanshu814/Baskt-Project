import { z } from 'zod';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '../../hooks/use-toast';
import { Copy, Check, Pencil, Trash2, UserCog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { trpc } from '../../utils/trpc';
import { Role, ROLE_TYPES } from '@baskt/types';

type ApiRole = Omit<Role, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

const formSchema = z.object({
  address: z.string().min(1, { message: 'User address is required' }),
  name: z.string().min(1, { message: 'User name is required' }),
  role: z.enum([ROLE_TYPES.ORACLE_MANAGER, ROLE_TYPES.REBALANCER, ROLE_TYPES.OWNER], {
    required_error: 'Please select a role',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface RolesManagementProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const ROLE_DISPLAY_MAP = {
  [ROLE_TYPES.ORACLE_MANAGER]: 'Oracle Manager',
  [ROLE_TYPES.REBALANCER]: 'Rebalancer',
  [ROLE_TYPES.OWNER]: 'Owner',
} as const;

export function RolesManagement({ showModal, setShowModal }: RolesManagementProps) {
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<ApiRole | null>(null);
  const utils = trpc.useUtils();

  const { data: roles = [], isLoading } = trpc.roles.getAllRoles.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '',
      name: '',
      role: undefined,
    },
  });

  const handleCopyAddress = useCallback(async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  }, []);

  const truncateAddress = useCallback((address: string) => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  }, []);

  const handleEditRole = useCallback(
    (role: ApiRole) => {
      setEditingRole(role);
      form.reset({
        address: role.address,
        name: role.name,
        role: role.role as (typeof ROLE_TYPES)[keyof typeof ROLE_TYPES],
      });
      setShowModal(true);
    },
    [form, setShowModal],
  );

  const addRole = trpc.roles.addRole.useMutation({
    onMutate: async (newRole) => {
      await utils.roles.getAllRoles.cancel();
      const previousRoles = utils.roles.getAllRoles.getData() || [];
      utils.roles.getAllRoles.setData(undefined, (old) => {
        const optimisticRole = {
          ...newRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as ApiRole;
        return [...(old || []), optimisticRole];
      });
      return { previousRoles };
    },
    onError: (err, newRole, context) => {
      utils.roles.getAllRoles.setData(undefined, context?.previousRoles);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Role Added',
        description: 'Successfully added new role',
      });
    },
  });

  const updateRole = trpc.roles.updateRole.useMutation({
    onMutate: async (updatedRole) => {
      await utils.roles.getAllRoles.cancel();
      const previousRoles = utils.roles.getAllRoles.getData() || [];
      utils.roles.getAllRoles.setData(undefined, (old) => {
        return (old || []).map((role) =>
          role.address === updatedRole.address
            ? { ...role, ...updatedRole, updatedAt: new Date().toISOString() }
            : role,
        );
      });
      return { previousRoles };
    },
    onError: (err, updatedRole, context) => {
      utils.roles.getAllRoles.setData(undefined, context?.previousRoles);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Role Updated',
        description: 'Successfully updated role',
      });
    },
  });

  const deleteRole = trpc.roles.deleteRole.useMutation({
    onMutate: async (deletedRole) => {
      await utils.roles.getAllRoles.cancel();
      const previousRoles = utils.roles.getAllRoles.getData() || [];
      utils.roles.getAllRoles.setData(undefined, (old) => {
        return (old || []).filter((role) => role.address !== deletedRole.address);
      });
      return { previousRoles };
    },
    onError: (err, deletedRole, context) => {
      utils.roles.getAllRoles.setData(undefined, context?.previousRoles);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Role Deleted',
        description: 'Successfully deleted role',
      });
    },
  });

  const handleDeleteRole = useCallback(
    async (role: ApiRole) => {
      try {
        await deleteRole.mutateAsync({ address: role.address });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete role',
          variant: 'destructive',
        });
      }
    },
    [deleteRole],
  );

  const handleQuickRoleChange = useCallback(
    async (role: ApiRole, newRole: (typeof ROLE_TYPES)[keyof typeof ROLE_TYPES]) => {
      try {
        await updateRole.mutateAsync({
          address: role.address,
          name: role.name,
          role: newRole,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update role',
          variant: 'destructive',
        });
      }
    },
    [updateRole],
  );

  const onSubmit = useCallback(
    async (values: FormValues) => {
      try {
        if (editingRole) {
          await updateRole.mutateAsync(values);
        } else {
          await addRole.mutateAsync(values);
        }
        form.reset();
        setShowModal(false);
        setEditingRole(null);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update role',
          variant: 'destructive',
        });
      }
    },
    [editingRole, updateRole, addRole, form, setShowModal],
  );

  const getRoleDisplay = useCallback((role: (typeof ROLE_TYPES)[keyof typeof ROLE_TYPES]) => {
    return ROLE_DISPLAY_MAP[role] || role;
  }, []);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      setShowModal(open);
      if (!open) {
        setEditingRole(null);
        form.reset();
      }
    },
    [form, setShowModal],
  );

  const renderRoleRow = useCallback(
    (role: ApiRole) => (
      <TableRow key={role.address}>
        <TableCell className="font-mono text-xs">
          <div className="flex items-center gap-2">
            <span>{truncateAddress(role.address)}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleCopyAddress(role.address)}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                  >
                    {copiedAddress === role.address ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy address</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
        <TableCell>{role.name}</TableCell>
        <TableCell>
          {getRoleDisplay(role.role as (typeof ROLE_TYPES)[keyof typeof ROLE_TYPES])}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-white/60" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit role details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-white/10 rounded-md transition-colors text-blue-500/60 hover:text-blue-500">
                        <UserCog className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quick change role</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent className="w-40 bg-[#1a1f2e] border-white/10">
                {Object.entries(ROLE_DISPLAY_MAP).map(([roleType, displayName]) => (
                  <DropdownMenuItem
                    key={roleType}
                    className="text-white/80 hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10"
                    onClick={() =>
                      handleQuickRoleChange(
                        role,
                        roleType as (typeof ROLE_TYPES)[keyof typeof ROLE_TYPES],
                      )
                    }
                  >
                    {displayName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-red-500/60 hover:text-red-500"
                    disabled={deleteRole.isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete role</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>
    ),
    [
      handleCopyAddress,
      truncateAddress,
      copiedAddress,
      getRoleDisplay,
      handleEditRole,
      handleQuickRoleChange,
      handleDeleteRole,
      deleteRole.isLoading,
    ],
  );

  const renderTableContent = useMemo(() => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-32 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-white/60 text-sm">Loading roles...</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (roles.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-32 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-white/60 text-sm">No roles found</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return roles.map(renderRoleRow);
  }, [isLoading, roles, renderRoleRow]);

  return (
    <div className="space-y-6">
      <Dialog open={showModal} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-[#010b1d] border-white/10 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </DialogTitle>
            <DialogDescription className="text-[#E5E7EB]">
              {editingRole
                ? 'Modify the role details below.'
                : 'Add a new role to manage protocol access.'}
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
                      <Input
                        placeholder="Enter user's wallet address"
                        {...field}
                        disabled={!!editingRole}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter user's name" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  disabled={addRole.isLoading || updateRole.isLoading}
                >
                  {editingRole ? 'Update Role' : 'Add Role'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Address</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableContent}</TableBody>
        </Table>
      </div>
    </div>
  );
}
