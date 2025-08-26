'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCreateBasktForm } from '../../hooks/create-baskt/use-create-baskt-form';
import { checkProfanity } from '../../lib/validation/profanity';
import { CongratulationsModal } from '../shared/CongratulationsModal';
import { Step1BasicInfo } from './createBasktSteps/Step1BasicInfo';
import { Step2Assets } from './createBasktSteps/Step2Assets';
import { Step3Review } from './createBasktSteps/Step3Review';

export function CreateBasktForm() {
  const {
    formData,
    setFormData,
    currentStep,
    totalSteps,
    setTotalWeight,
    setHasLowWeightAssets,
    selectedAssets,
    setSelectedAssets,
    assetDetails,
    setAssetDetails,
    isSubmitting,
    isWeightExactly100,
    showCongratulationsModal,
    setShowCongratulationsModal,
    createdBasktData,
    handleNext,
    handleBack,
    handleCreateBaskt,
  } = useCreateBasktForm();

  return (
    <div className="max-w-2xl mx-auto">
      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Launch Your Baskt</h1>
        <p className="text-muted-foreground">Step into the market with purpose.</p>

        {/* progress steps */}
        <div className="flex gap-2 mt-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>

      {/* form card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">
            Step {currentStep} of {totalSteps}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* step 1 */}
          {currentStep === 1 && <Step1BasicInfo formData={formData} setFormData={setFormData} />}
          {/* step 2 */}
          {currentStep === 2 && (
            <Step2Assets
              formData={formData}
              setFormData={setFormData}
              onWeightChange={(weight: number, hasLowWeight: boolean) => {
                setTotalWeight(weight);
                setHasLowWeightAssets(hasLowWeight);
              }}
              // eslint-disable-next-line
              onAssetsChange={(assets: any[], details: any) => {
                setSelectedAssets(assets);
                setAssetDetails(details);
              }}
              selectedAssets={selectedAssets}
              assetDetails={assetDetails}
            />
          )}
          {/* step 3 */}
          {currentStep === 3 && (
            <Step3Review
              formData={formData}
              selectedAssets={selectedAssets}
              assetDetails={assetDetails}
            />
          )}
        </CardContent>
      </Card>

      {/* navigation */}
      <div className="flex justify-between mt-6">
        <Button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="bg-primary hover:bg-primary/90 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={currentStep === totalSteps ? handleCreateBaskt : handleNext}
          disabled={
            (currentStep === 1 &&
              (!formData.name ||
                checkProfanity(formData.name) ||
                (formData.rebalancingType === 'automatic' && formData.rebalancingPeriod === 0))) ||
            (currentStep === 2 && formData.assets.length === 0) ||
            (currentStep === 2 && !isWeightExactly100()) ||
            (currentStep === 2 && formData.assets.length > 10) ||
            (currentStep === 3 && isSubmitting)
          }
          className="bg-primary hover:bg-primary/90 text-white border border-white/20"
        >
          {currentStep === totalSteps
            ? isSubmitting
              ? 'Launching Baskt...'
              : 'Launch Baskt'
            : 'Next'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Congratulations Modal */}
      {createdBasktData && (
        <CongratulationsModal
          open={showCongratulationsModal}
          onOpenChange={setShowCongratulationsModal}
          basktName={createdBasktData.basktId}
          basktDescription={`Custom weighted baskt with ${createdBasktData.assets.length} assets`}
          assets={createdBasktData.assets}
          basktId={createdBasktData.basktId}
        />
      )}
    </div>
  );
}
