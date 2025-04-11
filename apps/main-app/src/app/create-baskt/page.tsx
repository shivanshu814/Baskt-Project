'use client';
import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/src/button';
import { Input } from '../../components/src/input';
import { Textarea } from '../../components/src/textarea';
import { toast } from '../../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import { Label } from '../../components/src/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/src/select';
import { Badge } from '../../components/src/badge';
import { X, Plus, Search, Tag, AlertCircle, Trash2, Clock } from 'lucide-react';
import { Switch } from '../../components/src/switch';
import { cn } from '../../lib/utils';
import { useRouter } from 'next/navigation';
import { CreateBasktGuideDialog } from '../../components/baskt/CreateBasktGuideDialog';
import { AssetSelectionModal } from '../../components/baskt/AssetSelectionModal';
import { Tabs, TabsList, TabsTrigger } from '../../components/src/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/src/table';
import { Asset } from '../../types/baskt';
import { usePrivy } from '@privy-io/react-auth';
import React from 'react';

// Types
interface BasktAsset extends Asset {
  weightage: number;
  position: 'long' | 'short';
}

interface BasktFormData {
  name: string;
  description: string;
  tags: string[];
  rebalancePeriod: {
    value: number;
    unit: 'day' | 'hour';
  };
  risk: string;
  assets: BasktAsset[];
  isPublic: boolean;
}

const CreateBaskt = () => {
  const navigate = useRouter();
  const { authenticated, ready, login } = usePrivy();
  const [formData, setFormData] = useState<BasktFormData>({
    name: '',
    description: '',
    tags: [],
    rebalancePeriod: {
      value: 1,
      unit: 'day',
    },
    risk: 'medium',
    assets: [],
    isPublic: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [isGuideDialogOpen, setIsGuideDialogOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); //eslint-disable-line

  // Handle basic form changes
  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle rebalancing period changes
  const handleRebalancePeriodChange = (
    type: 'value' | 'unit',
    newValue: number | 'day' | 'hour',
  ) => {
    setFormData((prev) => ({
      ...prev,
      rebalancePeriod: {
        ...prev.rebalancePeriod,
        [type]: newValue,
      },
    }));
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle adding an asset
  const handleAddAsset = (asset: Asset) => {
    if (formData.assets.some((a) => a.symbol === asset.symbol)) {
      toast({
        title: 'Asset already added',
        description: `${asset.symbol} is already in your Baskt.`,
        variant: 'destructive',
      });
      return;
    }

    const newAsset: BasktAsset = {
      ...asset,
      weightage: 0,
      position: 'long',
    };

    setFormData((prev) => ({
      ...prev,
      assets: [...prev.assets, newAsset],
    }));

    setIsAssetModalOpen(false);
  };

  // Handle removing an asset
  const handleRemoveAsset = (assetSymbol: string) => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.filter((asset) => asset.symbol !== assetSymbol),
    }));
  };

  // Handle changing asset position (long/short)
  const handleAssetPositionChange = (assetSymbol: string, position: 'long' | 'short') => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) =>
        asset.symbol === assetSymbol ? { ...asset, position } : asset,
      ),
    }));
  };

  // Handle changing asset weightage
  const handleAssetWeightChange = (assetSymbol: string, weightage: number) => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) =>
        asset.symbol === assetSymbol ? { ...asset, weightage } : asset,
      ),
    }));
  };

  // Calculate total weightage
  const totalWeightage = formData.assets.reduce((sum, asset) => sum + asset.weightage, 0);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ready) return;

    if (!authenticated) {
      login();
      return;
    }

    // Validate form
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for your Baskt.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.assets.length < 2) {
      toast({
        title: 'Assets required',
        description: 'Please add at least 2 assets to your Baskt.',
        variant: 'destructive',
      });
      return;
    }

    if (totalWeightage !== 100) {
      toast({
        title: 'Invalid weightage',
        description: `Total weightage must be 100%. Current total: ${totalWeightage}%`,
        variant: 'destructive',
      });
      return;
    }

    // Submit form
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/baskts', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to create baskt');
      // }

      toast({
        title: 'Baskt created',
        description: `${formData.name} has been created successfully.`,
      });

      // Redirect to Baskts page
      navigate.push('/baskts');
    } catch (error) {
      console.error('Error creating baskt:', error); //eslint-disable-line
      toast({
        title: 'Error',
        description: 'Failed to create baskt. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Create a New Baskt</h1>
            <Button variant="outline" onClick={() => setIsGuideDialogOpen(true)}>
              <AlertCircle className="h-4 w-4 mr-2" />
              Creation Guide
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Baskt Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. DeFi Leaders Index"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this Baskt represents and its investment thesis..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="risk">Risk Level</Label>
                    <Select
                      value={formData.risk}
                      onValueChange={(value) => handleChange('risk', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
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
                        onChange={(e) =>
                          handleRebalancePeriodChange(
                            'value',
                            Math.min(
                              parseInt(e.target.value) || 1,
                              formData.rebalancePeriod.unit === 'day' ? 30 : 24,
                            ),
                          )
                        }
                        className="w-20"
                      />
                      <Tabs
                        value={formData.rebalancePeriod.unit}
                        onValueChange={(v) =>
                          handleRebalancePeriodChange('unit', v as 'day' | 'hour')
                        }
                        className="h-9"
                      >
                        <TabsList className="grid w-16 grid-cols-2">
                          <TabsTrigger value="day" className="text-xs px-1">
                            D
                          </TabsTrigger>
                          <TabsTrigger value="hour" className="text-xs px-1">
                            Hr
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="public"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => handleChange('isPublic', checked)}
                    />
                    <Label htmlFor="public">Make this Baskt public</Label>
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
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">
                    Add assets to your Baskt and set their allocation weights.
                  </p>

                  <Button onClick={() => setIsAssetModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </div>

                {formData.assets.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No assets added yet. Click "Add Asset" to start building your Baskt.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
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
                          <TableRow key={asset.symbol}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center">
                                  <span className="font-medium text-primary text-xs">
                                    {asset.symbol.substring(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">{asset.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>${asset.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={asset.weightage}
                                onChange={(e) =>
                                  handleAssetWeightChange(
                                    asset.symbol,
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={asset.position}
                                onValueChange={(value: 'long' | 'short') =>
                                  handleAssetPositionChange(asset.symbol, value)
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
                                onClick={() => handleRemoveAsset(asset.symbol)}
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

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate.push('/baskts')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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

      <Footer />
    </Layout>
  );
};

export default CreateBaskt;
