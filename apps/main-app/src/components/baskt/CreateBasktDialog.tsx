import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, X, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';

// Form schema
const formSchema = z.object({
  name: z.string().min(3, {
    message: 'Baskt name must be at least 3 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  category: z.string().min(1, {
    message: 'Please select a category.',
  }),
  risk: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select a risk level.',
  }),
  assets: z
    .array(
      z.object({
        name: z.string().min(1, 'Asset name is required'),
        symbol: z.string().min(1, 'Symbol is required'),
        weightage: z.number().min(1).max(100),
        position: z.enum(['long', 'short']),
      }),
    )
    .min(1, 'Add at least one asset'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateBasktDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBasktDialog({ open, onOpenChange }: CreateBasktDialogProps) {
  const navigate = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      risk: 'medium',
      assets: [{ name: '', symbol: '', weightage: 25, position: 'long' }],
    },
  });

  // Add a new asset to the form
  const addAsset = () => {
    const assets = form.getValues('assets');
    form.setValue('assets', [...assets, { name: '', symbol: '', weightage: 25, position: 'long' }]);
  };

  // Remove an asset from the form
  const removeAsset = (index: number) => {
    const assets = form.getValues('assets');
    if (assets.length > 1) {
      form.setValue(
        'assets',
        assets.filter((_, i) => i !== index),
      );
    }
  };

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);

    // Check if weightages add up to 100%
    const totalWeightage = data.assets.reduce((sum, asset) => sum + asset.weightage, 0);
    if (totalWeightage !== 100) {
      toast({
        title: 'Invalid allocation',
        description: `Total weightage must be 100%. Current total: ${totalWeightage}%`,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate creation of a new Baskt
    setTimeout(() => {
      toast({
        title: 'Baskt Created',
        description: `${data.name} has been created successfully.`,
      });
      setIsSubmitting(false);
      onOpenChange(false);

      // In a real app, this would navigate to the new Baskt
      // For now, we'll just navigate back to the Baskts page
      navigate.push('/baskts');
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Create New Baskt
          </DialogTitle>
          <DialogDescription>
            Design your own index of assets with custom allocations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baskt Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AI Leaders Index" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this Baskt represents and its investment thesis"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DeFi">DeFi</SelectItem>
                          <SelectItem value="AI">AI / ML</SelectItem>
                          <SelectItem value="Metaverse">Metaverse</SelectItem>
                          <SelectItem value="Large Cap">Large Cap</SelectItem>
                          <SelectItem value="Meme">Meme Coins</SelectItem>
                          <SelectItem value="Gaming">Gaming</SelectItem>
                          <SelectItem value="NFT">NFT</SelectItem>
                          <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="risk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Assets Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Assets</h3>
                <Button type="button" variant="outline" size="sm" onClick={addAsset}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Asset
                </Button>
              </div>

              <FormDescription>
                Add assets to your Baskt. Weightage percentages must total 100%.
              </FormDescription>

              {form.getValues('assets').map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3 items-end border p-3 rounded-md"
                >
                  <FormField
                    control={form.control}
                    name={`assets.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="col-span-5">
                        <FormLabel>Asset Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bitcoin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`assets.${index}.symbol`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="BTC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`assets.${index}.weightage`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Weight %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`assets.${index}.position`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Position</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="long">Long</SelectItem>
                            <SelectItem value="short">Short</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-1"
                    onClick={() => removeAsset(index)}
                    disabled={form.getValues('assets').length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Baskt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
