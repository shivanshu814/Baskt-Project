'use client';
import { useState } from 'react';
import leoProfanity from 'leo-profanity';
import { AlertCircle } from 'lucide-react';
import { Footer } from '../../components/shared/Footer';
import { CreateBasktGuideDialog } from '../../components/baskt/create/CreateBasktGuideDialog';
import { AssetSelectionModal } from '../../components/baskt/create/AssetSelectionModal';
import { BasktForm } from '../../components/baskt/create/BasktForm';
import { Button, Alert, AlertDescription, AlertTitle } from '@baskt/ui';
import { useCreateBasktForm } from '../../hooks/baskt/create/useCreateBasktForm';
import { useAssetManagement } from '../../hooks/baskt/create/useAssetManagement';
import { useBasktCreation } from '../../hooks/baskt/create/useBasktCreation';

const CreateBasktPage = () => {
  const [isGuideDialogOpen, setIsGuideDialogOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
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
  } = useCreateBasktForm();
  const { handleAddAsset, handleRemoveAsset, handleAssetPositionChange, handleAssetWeightChange } =
    useAssetManagement(formData, setFormData);
  const { isSubmitting, createBaskt, authenticated, ready, login } = useBasktCreation();

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
      setError('Please connect your wallet to create a Baskt.');
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

    try {
      await createBaskt(formData);
    } catch (error) {
      setError('Failed to create baskt. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-grow">
        <div className="max-w-full mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Create a New Baskt</h1>
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
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
        onAssetSelect={handleAssetSelect}
      />

      <Footer />
    </div>
  );
};

export default CreateBasktPage;
