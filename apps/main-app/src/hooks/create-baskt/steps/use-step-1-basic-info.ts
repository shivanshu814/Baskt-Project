import { CreateBasktFormData } from '../../../types/baskt/creation';
import { sanitizeBasktName } from '../../../utils/baskt/baskt';

export function useStep1BasicInfo(
  formData: CreateBasktFormData,
  setFormData: (
    data: CreateBasktFormData | ((prev: CreateBasktFormData) => CreateBasktFormData),
  ) => void,
) {
  const handleNameChange = (value: string) => {
    const sanitizedValue = sanitizeBasktName(value);
    setFormData((prev) => ({ ...prev, name: sanitizedValue }));
  };

  const handleVisibilityChange = (visibility: 'public' | 'private') => {
    setFormData((prev) => ({ ...prev, visibility }));
  };

  const handleRebalancingTypeChange = (type: 'automatic' | 'manual') => {
    setFormData((prev) => ({ ...prev, rebalancingType: type }));
  };

  const handleRebalancingPeriodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      rebalancingPeriod: value === '' ? 0 : parseInt(value) || 0,
    }));
  };

  const handleRebalancingUnitChange = (unit: 'days' | 'weeks' | 'months') => {
    setFormData((prev) => ({ ...prev, rebalancingUnit: unit }));
  };

  return {
    handleNameChange,
    handleVisibilityChange,
    handleRebalancingTypeChange,
    handleRebalancingPeriodChange,
    handleRebalancingUnitChange,
  };
}
