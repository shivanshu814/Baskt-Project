'use client';
import { useRef, useState } from 'react';
import leoProfanity from 'leo-profanity';
import { AlertCircle } from 'lucide-react';
import { Footer } from '../../components/shared/Footer';
import { CreateBasktGuideDialog } from '../../components/baskt/create/CreateBasktGuideDialog';
import { AssetSelectionModal } from '../../components/baskt/create/AssetSelectionModal';
import { TransactionStatusModal } from '../../components/baskt/create/TransactionStatusModal';
import { BasicInfoForm } from '../../components/baskt/create/BasicInfoForm';
import { AssetManagementForm } from '../../components/baskt/create/AssetManagementForm';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useCreateBasktForm } from '../../hooks/baskt/create/useCreateBasktForm';
import { useAssetManagement } from '../../hooks/baskt/create/useAssetManagement';
import { useBasktCreation } from '../../hooks/baskt/create/useBasktCreation';

const CreateBasktPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const {
    isSubmitting,
    transactionStatus,
    isTransactionModalOpen,
    setIsTransactionModalOpen,
    createBaskt,
    handleRetry,
    authenticated,
    ready,
    login,
    signature,
  } = useBasktCreation();

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
            <BasicInfoForm
              formData={formData}
              errors={errors}
              fileInputRef={fileInputRef}
              onNameChange={(value) => handleChange('name', value)}
              onRebalancePeriodChange={handleRebalancePeriodChange}
              onVisibilityChange={(value) => handleChange('isPublic', value)}
            />

            <AssetManagementForm
              formData={formData}
              totalWeightage={totalWeightage}
              onAddAsset={() => setIsAssetModalOpen(true)}
              onRemoveAsset={handleRemoveAsset}
              onAssetPositionChange={handleAssetPositionChange}
              onAssetWeightChange={handleAssetWeightChange}
            />

            <div className="grid grid-cols-[auto_auto] gap-4 justify-end">
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
        onAssetSelect={handleAssetSelect}
      />

      <TransactionStatusModal
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        status={transactionStatus}
        onRetry={handleRetry}
        error={error || undefined}
        signature={signature || undefined}
      />

      <Footer />
    </div>
  );
};

export default CreateBasktPage;
