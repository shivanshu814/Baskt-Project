import { useBasktClient } from '@baskt/ui';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '../../lib/api/trpc';
import { checkProfanity } from '../../lib/validation/profanity';
import { Asset } from '../../types/asset';
import { AssetWithPosition, CreateBasktFormData } from '../../types/baskt/creation';
import { createBasktAssetConfigs, getErrorMessage } from '../../utils/baskt/baskt';

export const useCreateBasktForm = () => {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { client: basktClient, wallet } = useBasktClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBasketMutation = trpc.baskt.createBasktMetadata.useMutation();

  const [formData, setFormData] = useState<CreateBasktFormData>({
    name: '',
    visibility: 'public',
    rebalancingType: 'automatic',
    rebalancingPeriod: 0,
    rebalancingUnit: 'days',
    assets: [],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [totalWeight, setTotalWeight] = useState(0);
  const [hasLowWeightAssets, setHasLowWeightAssets] = useState(false);

  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [assetDetails, setAssetDetails] = useState<AssetWithPosition[]>([]);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [createdBasktData, setCreatedBasktData] = useState<{
    basktId: string;
    uid: string;
    name: string;
    assets: Array<{ ticker: string; weight: number; logo?: string }>;
  } | null>(null);

  const isWeightExactly100 = () => {
    return totalWeight === 100 && !hasLowWeightAssets;
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCreateBaskt = async () => {
    if (!wallet || !basktClient) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!authenticated) {
      toast.error('Please authenticate first');
      return;
    }

    if (checkProfanity(formData.name)) {
      toast.error('Please choose a different name without inappropriate language');
      return;
    }

    try {
      setIsSubmitting(true);

      const assetConfigs = createBasktAssetConfigs(assetDetails, selectedAssets);

      const result = await basktClient.createBaskt(assetConfigs, formData.visibility === 'public');

      if (!result) {
        throw new Error('Failed to create baskt');
      }

      const { basktId, txSignature, uid } = result;

      if (!basktId || !txSignature) {
        throw new Error('Failed to create baskt');
      }

      await createBasketMutation.mutateAsync({
        basktId: basktId.toString(),
        basktName: formData.name,
        txSignature: txSignature,
      });

      toast.success('Baskt created successfully!');

      // Store the created baskt data and show congratulations modal
      setCreatedBasktData({
        basktId: basktId.toString(),
        uid: uid.toString(),
        name: formData.name,
        assets: selectedAssets.map((asset, index) => ({
          ticker: asset.ticker,
          weight: Number(assetDetails[index]?.weight) || 0,
          logo: asset.logo,
        })),
      });
      setShowCongratulationsModal(true);
    } catch (error) {
      const userFriendlyMessage = getErrorMessage(error);
      toast.error(userFriendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    currentStep,
    totalSteps,
    totalWeight,
    setTotalWeight,
    hasLowWeightAssets,
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
  };
};
