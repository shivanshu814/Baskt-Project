'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import leoProfanity from 'leo-profanity';
import { AlertCircle } from 'lucide-react';
import { Footer } from '../../../components/shared/Footer';
import { CreateBasktGuideDialog } from '../../../components/baskt/create/CreateBasktGuideDialog';
import { AssetSelectionModal } from '../../../components/baskt/create/AssetSelectionModal';
import { BasktForm } from '../../../components/baskt/create/BasktForm';
import { Button, Alert, AlertDescription, AlertTitle, Loading } from '@baskt/ui';
import { useEditBasktForm } from '../../../hooks/baskt/edit/useEditBasktForm';
import { useAssetManagement } from '../../../hooks/baskt/create/useAssetManagement';
import { useBasktEdit } from '../../../hooks/baskt/edit/useBasktEdit';
import { useBasktDetail } from '../../../hooks/baskt/useBasktDetail';
import { toast } from 'sonner';

const EditBasktPage = () => {
  // blocking the route for now
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="text-center space-y-4 p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            We're working hard to bring you the baskt editing feature. Stay tuned for updates!
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    </div>
  );

  const params = useParams();
  const router = useRouter();
  const basktName = decodeURIComponent(params.name as string);

  const [isGuideDialogOpen, setIsGuideDialogOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const { baskt, isLoading: isBasktLoading } = useBasktDetail(basktName);
  const {
    formData,
    setFormData,
    error,
    setError,
    errors,
    handleChange,
    handleRebalancePeriodChange,
    validateForm,
    totalWeightage,
    isFormLoading,
    resetToOriginal,
  } = useEditBasktForm(baskt);

  const { handleAddAsset, handleRemoveAsset, handleAssetPositionChange, handleAssetWeightChange } =
    useAssetManagement(formData, setFormData);
  const {
    isSubmitting,
    updateBaskt,
    authenticated,
    ready,
    login,
    client: basktClient,
  } = useBasktEdit();

  // eslint-disable-next-line
  const handleAssetSelect = (asset: any) => {
    handleAddAsset(asset);
    setIsAssetModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ready) {
      setError('System is not ready. Please wait for initialization.');
      return;
    }

    if (!authenticated) {
      setError('Please connect your wallet to edit a Baskt.');
      login();
      return;
    }

    if (leoProfanity.check(formData.name)) {
      setError('Your Baskt name contains inappropriate words. Please change it.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please provide a name for your Baskt.');
      return;
    }

    if (formData.assets.length < 2) {
      setError('Please add at least 2 assets to your Baskt.');
      return;
    }

    if (totalWeightage !== 100) {
      setError(`Total weightage must be 100%. Current total: ${totalWeightage}%`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (basktClient && formData.name !== baskt?.name) {
      try {
        const nameExists = await basktClient.doesBasktNameExist(formData.name);
        if (nameExists) {
          setError('A baskt with this name already exists. Please choose a different name.');
          return;
        }
      } catch (error) {
        toast.error('Error checking baskt name');
      }
    }

    try {
      await updateBaskt(basktName, formData);
    } catch (error) {
      setError('Failed to update baskt. Please try again later.');
    }
  };

  if (isBasktLoading || isFormLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!baskt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-2">Baskt not found</h2>
        <p className="text-muted-foreground mb-4 text-center px-4">
          The baskt you're trying to edit doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push('/baskts')}>Back to Baskts</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-grow">
        <div className="max-w-full mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Edit Baskt</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGuideDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Guide
            </Button>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="!border-warning/50 !text-warning !bg-warning/10 [&>svg]:text-warning"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <BasktForm
              formData={formData}
              errors={errors}
              totalWeightage={totalWeightage}
              onNameChange={(value) => handleChange('name', value)}
              onRebalancePeriodChange={handleRebalancePeriodChange}
              onVisibilityChange={(value) => handleChange('isPublic', value)}
              onAddAsset={() => setIsAssetModalOpen(true)}
              onRemoveAsset={handleRemoveAsset}
              onAssetPositionChange={handleAssetPositionChange}
              onAssetWeightChange={handleAssetWeightChange}
              title="Edit Baskt"
            />

            <div className="flex justify-end pt-4 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetToOriginal}
                className="w-full sm:w-auto"
              >
                Reset to Original
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? 'Updating...' : 'Update Baskt'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <CreateBasktGuideDialog open={isGuideDialogOpen} onOpenChange={setIsGuideDialogOpen} />

      <AssetSelectionModal
        open={isAssetModalOpen}
        onOpenChange={setIsAssetModalOpen}
        onAssetSelect={handleAssetSelect}
      />

      <Footer />
    </div>
  );
};

export default EditBasktPage;
