'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/src/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/src/form';
import { Input } from '../../components/src/input';
import { Button } from '../../components/src/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/src/select';
import { useToast } from '../../hooks/use-toast';

const formSchema = z
  .object({
    oracleName: z.string().min(1, { message: 'Oracle name is required' }),
    oracleType: z.enum(['Pyth', 'Switchboard', 'Custom']),
    // Only required for Custom oracle type
    oracleId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.oracleType === 'Custom') {
        return !!data.oracleId;
      }
      return true;
    },
    {
      message: 'Custom oracle requires an ID',
      path: ['oracleId'],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface AddOracleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOracleAdded: (address?: string) => void;
}

export function AddOracleModal({ open, onOpenChange, onOracleAdded }: AddOracleModalProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oracleName: '',
      oracleType: 'Pyth',
      oracleId: '',
    },
  });

  const oracleType = form.watch('oracleType');

  const onSubmit = (values: FormValues) => {
    // Mock oracle address creation
    const mockOracleAddress = '8ibFbzbAKTTQjECGDtjVfGEMwvQSKYARrm4FUcxbPPBW';

    toast({
      title: 'Oracle Added Successfully',
      description: `The oracle "${values.oracleName}" has been added.`,
    });

    onOracleAdded(mockOracleAddress);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Oracle</DialogTitle>
          <DialogDescription>Configure and add a new price oracle feed.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="oracleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oracle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="BTC/USD Price Feed" {...field} />
                    </FormControl>
                    <FormDescription>A descriptive name for this oracle</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oracleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oracle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select oracle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pyth">Pyth</SelectItem>
                        <SelectItem value="Switchboard">Switchboard</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the oracle type to use</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {oracleType === 'Custom' && (
                <FormField
                  control={form.control}
                  name="oracleId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Oracle ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter oracle ID" {...field} />
                      </FormControl>
                      <FormDescription>Unique identifier for this custom oracle</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="submit">Add Oracle</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
