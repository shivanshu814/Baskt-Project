'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import leoProfanity from 'leo-profanity';
import { cn, useBasktClient } from '@baskt/ui';
import { trpc } from '../../utils/trpc';
import { X, Plus, Search, AlertCircle, Trash2, Clock, Image } from 'lucide-react';
import { z } from 'zod';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// Components
import { Footer } from '../../components/Footer';
import { CreateBasktGuideDialog } from '../../components/baskt/CreateBasktGuideDialog';
import { AssetSelectionModal } from '../../components/baskt/AssetSelectionModal';
import { TransactionStatusModal } from '../../components/baskt/TransactionStatusModal';

// UI Components
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

// Hooks & Types
import { useToast } from '../../hooks/use-toast';
import { AssetInfo, BasktAssetInfo, OnchainAssetConfig } from '@baskt/types';

// Zod schema for form validation
const BasktFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(30, 'Name must be 30 characters or less'),
  description: z.string().min(1, 'Description is required'),
  categories: z.array(z.string()).min(1, 'At least one tag is required'),
  rebalancePeriod: z.object({
    value: z.number().min(1),
    unit: z.enum(['day', 'hour']),
  }),
  risk: z.enum(['low', 'medium', 'high']),
  assets: z
    .array(
      z.object({
        ticker: z.string(),
        name: z.string(),
        price: z.number(),
        weight: z.number(),
        direction: z.boolean(),
        logo: z.string().optional(),
        assetAddress: z.string(),
      }),
    )
    .refine(
      (assets) => {
        // Check for duplicate assets by address
        const addresses = assets.map((a) => a.assetAddress);

        const weights = assets.every((a) => a.weight >= 5);

        return new Set(addresses).size === addresses.length && weights;
      },
      {
        message: 'Duplicate assets are not allowed',
      },
    ),
  isPublic: z.boolean(),
  image: z.string().optional(),
});

type BasktFormData = z.infer<typeof BasktFormSchema>;

const CreateBasktPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { authenticated, ready, login } = usePrivy();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { client: basktClient, wallet } = useBasktClient();
  const createBasktMutation = trpc.baskt.createBasktMetadata.useMutation();
  const uploadImageMutation = trpc.image.upload.useMutation();

  // Form state
  const [formData, setFormData] = useState<BasktFormData>({
    name: '',
    description: '',
    categories: [],
    rebalancePeriod: {
      value: 1,
      unit: 'day',
    },
    risk: 'medium',
    assets: [],
    isPublic: true,
    image: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [categoryInput, setCategoryInput] = useState('');
  const [isGuideDialogOpen, setIsGuideDialogOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<
    'waiting' | 'confirmed' | 'creating' | 'success' | 'failed'
  >('waiting');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRebalancePeriodChange = (value: number, unit: 'day' | 'hour') => {
    setFormData((prev) => ({
      ...prev,
      rebalancePeriod: {
        value,
        unit,
      },
    }));
  };

  const handleAddCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      if (leoProfanity.check(categoryInput.trim())) {
        toast({
          title: 'Inappropriate content',
          description: 'The category contains inappropriate words. Please use different words.',
          variant: 'destructive',
        });
        return;
      }
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()],
      }));
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category !== categoryToRemove),
    }));
  };

  const handleAddAsset = (asset: AssetInfo) => {
    // Check if asset already exists by address
    if (formData.assets.some((a) => a.assetAddress === asset.assetAddress)) {
      toast({
        title: 'Asset already in Baskt',
        description: `${asset.ticker} has already been added to your Baskt.`,
        variant: 'destructive',
      });
      return;
    }

    // Ensure the asset has the required properties
    const newAsset: BasktAssetInfo = {
      ...asset,
      weight: 0, // Default to minimum allowed weight as string
      direction: true,
    };

    setFormData((prev) => ({
      ...prev,
      assets: [...prev.assets, newAsset],
    }));

    setIsAssetModalOpen(false);
  };

  const handleRemoveAsset = (assetticker: string) => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.filter((asset) => asset.ticker !== assetticker),
    }));
  };

  const handleAssetPositionChange = (assetticker: string, position: 'long' | 'short') => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) =>
        asset.ticker === assetticker ? { ...asset, direction: position === 'long' } : asset,
      ),
    }));
  };

  const handleAssetWeightChange = (assetticker: string, input: string) => {
    const weight = parseFloat(input) || 0;
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) =>
        asset.ticker === assetticker ? { ...asset, weight } : asset,
      ),
    }));
  };

  const totalWeightage = formData.assets.reduce((sum, asset) => sum + asset.weight, 0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 15MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result as string;
        const filename = `${Date.now()}_${file.name}`;

        const result = await uploadImageMutation.mutateAsync({
          filename,
          data: base64Data,
          contentType: file.type,
        });

        if (result.url) {
          setPreviewImage(result.url);
          setFormData((prev) => ({ ...prev, image: result.url }));
        }
      };

      reader.onerror = () => {
        toast({
          title: 'Upload failed',
          description: 'Failed to read image file. Please try again.',
          variant: 'destructive',
        });
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Create baskt function
  const createBaskt = async (basktData: BasktFormData) => {
    if (!wallet) return;
    try {
      setIsTransactionModalOpen(true);
      setTransactionStatus('waiting');

      const result = await basktClient?.createBaskt(
        basktData.name,
        basktData.assets.map(
          (asset) =>
            ({
              assetId: new PublicKey(asset.assetAddress),
              baselinePrice: new anchor.BN(0),
              direction: asset.direction,
              weight: new anchor.BN((asset.weight / 100) * 10_000),
            }) as OnchainAssetConfig,
        ),
        basktData.isPublic,
      );

      if (!result) {
        throw new Error('Failed to create baskt');
      }

      const { basktId, txSignature } = result;

      if (!basktId || !txSignature) {
        throw new Error('Failed to create baskt');
      }

      setTransactionStatus('confirmed');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setTransactionStatus('creating');
      try {
        const createBasktMetadataResult = await createBasktMutation.mutateAsync({
          basktId: basktId.toString(),
          name: basktData.name,
          description: basktData.description,
          creator: wallet?.address.toString() || '',
          categories: basktData.categories,
          risk: basktData.risk,
          assets: basktData.assets.map((asset) => asset.assetAddress.toString()),
          image: basktData.image || 'https://placehold.co/640x480/',
          rebalancePeriod: basktData.rebalancePeriod,
          txSignature,
        });

        if (!createBasktMetadataResult.success) {
          setTransactionStatus('failed');
          toast({
            title: 'Warning',
            description:
              'Baskt created on-chain, but metadata storage failed. Some features may be limited.',
            variant: 'destructive',
          });
          return;
        }

        setTransactionStatus('success');
        await new Promise((resolve) => setTimeout(resolve, 3000));
        router.push(`/baskts/${basktId}`);
      } catch (error) {
        console.error('Error storing baskt metadata:', error);
        setTransactionStatus('failed');
        toast({
          title: 'Warning',
          description:
            'Baskt created on-chain, but metadata storage failed. Some features may be limited.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating baskt:', error);
      setTransactionStatus('failed');
    }
  };

  const handleRetry = () => {
    setTransactionStatus('waiting');
    handleSubmit(new Event('submit') as any);
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      BasktFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);

        console.log('Validation errors:', newErrors);

        // Show toast for the first error
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ready) {
      setError('System is not ready. Please wait for initialization.');
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a Baskt.',
        variant: 'destructive',
      });
      return;
    }

    if (!authenticated) {
      setError('Please connect your wallet to create a Baskt.');
      login();
      return;
    }

    if (leoProfanity.check(formData.name)) {
      setError('Your Baskt name contains inappropriate words. Please change it.');
      return;
    }

    if (leoProfanity.check(formData.description)) {
      setError(`Your Baskt description contains inappropriate word. Please remove these words.`);
      return;
    }

    if (!formData.name.trim()) {
      setError('Please provide a name for your Baskt.');
      return;
    }
    const nameExists = await basktClient?.doesBasktNameExist(formData.name);
    if (nameExists) {
      setError('A Baskt with this name already exists. Please choose a different name.');
      toast({
        title: 'Name taken',
        description: 'A Baskt with this name already exists. Please choose a different name.',
        variant: 'destructive',
      });
      return;
    }
    // Additional validation checks
    if (formData.assets.length < 2) {
      setError('Please add at least 2 assets to your Baskt.');
      return;
    }

    if (totalWeightage !== 100) {
      setError(`Total weightage must be 100%. Current total: ${totalWeightage}%`);
      toast({
        title: 'Invalid weight',
        description: `Total weight must be 100%. Current total: ${totalWeightage}%`,
        variant: 'destructive',
      });
      return;
    }

    // Validate with Zod
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the create baskt function
      await createBaskt(formData);
    } catch (error) {
      setError('Failed to create baskt. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Create a New Baskt</h1>
            <Button variant="outline" onClick={() => setIsGuideDialogOpen(true)}>
              <AlertCircle className="h-4 w-4 mr-2" />
              Creation Guide
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name" className="mb-2 block">
                    Baskt Name{' '}
                    <span className="text-xs text-muted-foreground">(max 10 characters)</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. DeFi Index"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    maxLength={10}
                  />
                  {errors['name'] && (
                    <p className="text-xs text-destructive mt-1">{errors['name']}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.name.length}/10 characters
                  </p>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <div>
                    <Label htmlFor="image" className="sr-only">
                      Baskt Image
                    </Label>
                    <div
                      className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Baskt preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="image"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <Textarea
                      id="description"
                      placeholder="Describe what this Baskt represents and its investment thesis..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                    />
                    {errors['description'] && (
                      <p className="text-xs text-destructive mt-1">{errors['description']}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="risk">Risk Level</Label>
                      <Select
                        value={formData.risk}
                        onValueChange={(value) => handleChange('risk', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors['risk'] && (
                        <p className="text-xs text-destructive">{errors['risk']}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <Label className="flex items-center" htmlFor="rebalancing">
                        Rebalancing Period
                        <Clock className="ml-1 h-4 w-4 text-muted-foreground" />
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="rebalance-value"
                          type="number"
                          min={1}
                          max={formData.rebalancePeriod.unit === 'day' ? 30 : 24}
                          value={formData.rebalancePeriod.value}
                          onChange={(e) => {
                            const value = Math.min(
                              parseInt(e.target.value) || 1,
                              formData.rebalancePeriod.unit === 'day' ? 30 : 24,
                            );
                            handleRebalancePeriodChange(value, formData.rebalancePeriod.unit);
                          }}
                          className="w-16"
                        />
                        <Select
                          value={formData.rebalancePeriod.unit}
                          onValueChange={(value: 'day' | 'hour') => {
                            handleRebalancePeriodChange(formData.rebalancePeriod.value, value);
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Days</SelectItem>
                            <SelectItem value="hour">Hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="categories">Categories</Label>
                      <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md focus-within:ring-1 focus-within:ring-ring focus-within:border-input">
                        {formData.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="gap-1 mb-1 mr-1">
                            {category}
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(category)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        <input
                          id="categories"
                          placeholder={
                            formData.categories.length > 0
                              ? 'Add more categories...'
                              : 'Add categories and press Enter'
                          }
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCategory();
                            }
                          }}
                          className="flex-1 min-w-[120px] bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="public" className="mb-2">
                        Visibility
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted rounded-full p-0.5">
                          <div
                            className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${formData.isPublic ? 'bg-background text-foreground font-medium' : 'text-muted-foreground'}`}
                            onClick={() => handleChange('isPublic', true)}
                          >
                            Public
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${!formData.isPublic ? 'bg-background text-foreground font-medium' : 'text-muted-foreground'}`}
                            onClick={() => handleChange('isPublic', false)}
                          >
                            Private
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Assets</span>
                  <div className="flex items-center text-sm font-normal gap-2">
                    <span
                      className={cn(totalWeightage === 100 ? 'text-success' : 'text-destructive')}
                    >
                      Total: {totalWeightage}%
                    </span>
                    {totalWeightage !== 100 && (
                      <span className="text-destructive">(Must equal 100%)</span>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-[1fr_auto] items-center">
                  <p className="text-muted-foreground">
                    Add assets to your Baskt and set their allocation weights.
                  </p>

                  <Button onClick={() => setIsAssetModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </div>

                {formData.assets.length === 0 ? (
                  <div className="grid place-items-center py-8 border border-dashed rounded-lg">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No assets added yet. Click "Add Asset" to start building your Baskt.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Weight (%)</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.assets.map((asset) => (
                          <TableRow key={asset.ticker}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center overflow-hidden">
                                  {asset.logo ? (
                                    <img
                                      src={asset.logo}
                                      alt={asset.ticker}
                                      className="w-6 h-6 object-contain"
                                    />
                                  ) : (
                                    <span className="font-medium text-primary text-xs">
                                      {asset.ticker.substring(0, 2)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{asset.ticker}</div>
                                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>${asset.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={asset.weight.toString()}
                                onChange={(e) =>
                                  handleAssetWeightChange(asset.ticker, e.target.value)
                                }
                                className="w-20"
                              />
                              {asset.weight < 5 && (
                                <p className="text-xs text-destructive">Min 5%</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={asset.direction ? 'long' : 'short'}
                                onValueChange={(value: 'long' | 'short') =>
                                  handleAssetPositionChange(asset.ticker, value)
                                }
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="long">Long</SelectItem>
                                  <SelectItem value="short">Short</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveAsset(asset.ticker)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-[auto_auto] gap-4 justify-end">
              <Button type="submit" disabled={isSubmitting} onClick={handleSubmit}>
                {isSubmitting ? 'Creating...' : 'Create Baskt'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <CreateBasktGuideDialog open={isGuideDialogOpen} onOpenChange={setIsGuideDialogOpen} />

      <AssetSelectionModal
        open={isAssetModalOpen}
        onOpenChange={setIsAssetModalOpen}
        onAssetSelect={handleAddAsset}
      />

      <TransactionStatusModal
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        status={transactionStatus}
        onRetry={handleRetry}
        error={error || undefined}
      />

      <Footer />
    </div>
  );
};

export default CreateBasktPage;
