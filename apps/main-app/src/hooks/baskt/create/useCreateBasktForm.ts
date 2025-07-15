import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
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
        return new Set(addresses).size === addresses.length;
      },
      {
        message: 'Duplicate assets are not allowed',
      },
    )
    .refine(
      (assets) => {
        return assets.every((a) => a.weight >= 5);
      },
      {
        message: 'All assets must have a minimum weight of 5%',
      },
    ),
  isPublic: z.boolean(),
});

export type BasktFormData = z.infer<typeof BasktFormSchema>;

export const useCreateBasktForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<BasktFormData>({
    name: '',
    rebalancePeriod: {
      value: 1,
      unit: 'day',
    },
    assets: [],
    isPublic: true,
  });

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
  };
};
