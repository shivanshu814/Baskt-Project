import { useState, useEffect } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { BasktFormData } from '../create/useCreateBasktForm';
import { BasktInfo } from '@baskt/types';
import { RawBasktData } from '../../../types/baskt';
import { validateBasktName } from '../../../utils/baskt/nameValidation';

const BasktFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(10, 'Name must be 10 characters or less')
    .refine(
      (name) => {
        const validation = validateBasktName(name);
        return validation.isValid;
      },
      (name) => {
        const validation = validateBasktName(name);
        return { message: validation.error || 'Invalid name' };
      },
    ),
  rebalancePeriod: z.object({
    value: z.number().min(1),
    unit: z.enum(['day', 'hour']),
  }),
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
        const addresses = assets.map((a) => a.assetAddress);
        const weights = assets.every((a) => a.weight >= 5);
        return new Set(addresses).size === addresses.length && weights;
      },
      {
        message: 'Duplicate assets are not allowed',
      },
    ),
  isPublic: z.boolean(),
});

export const useEditBasktForm = (baskt: BasktInfo | null) => {
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const [formData, setFormData] = useState<BasktFormData>({
    name: '',
    rebalancePeriod: {
      value: 1,
      unit: 'day',
    },
    assets: [],
    isPublic: true,
  });

  useEffect(() => {
    if (baskt && !isInitialized) {
      const assets =
        baskt.assets?.map((asset) => ({
          ticker: asset.ticker || '',
          name: asset.name || '',
          price: asset.price || 0,
          weight: asset.weight || 0,
          direction: asset.direction || true,
          logo: asset.logo || '',
          assetAddress: asset.assetAddress || '',
        })) || [];

      const rawBaskt = baskt as unknown as RawBasktData;
      const isPublic = rawBaskt.account?.isPublic ?? true;

      setFormData({
        name: baskt.name || '',
        rebalancePeriod: {
          value: 1,
          unit: 'day',
        },
        assets,
        isPublic,
      });
      setIsFormLoading(false);
      setIsInitialized(true);
    }
  }, [baskt, isInitialized]);

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

        const firstError = error.errors[0];
        toast.error(firstError.message);
      }
      return false;
    }
  };

  const totalWeightage = formData.assets.reduce((sum, asset) => sum + asset.weight, 0);

  const resetToOriginal = () => {
    if (baskt) {
      const assets =
        baskt.assets?.map((asset) => ({
          ticker: asset.ticker || '',
          name: asset.name || '',
          price: asset.price || 0,
          weight: asset.weight || 0,
          direction: asset.direction || true,
          logo: asset.logo || '',
          assetAddress: asset.assetAddress || '',
        })) || [];

      const rawBaskt = baskt as unknown as RawBasktData;
      const isPublic = rawBaskt.account?.isPublic ?? true;

      setFormData({
        name: baskt.name || '',
        rebalancePeriod: {
          value: 1,
          unit: 'day',
        },
        assets,
        isPublic,
      });
      setErrors({});
      setError(null);
    }
  };

  return {
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
  };
};
