import { EmptyStateBaseProps } from '../../types/baskt';

export const validateEmptyStateConfig = (config: EmptyStateBaseProps): boolean => {
  return !!(
    config.title &&
    config.description &&
    config.buttonText &&
    config.icon &&
    config.onButtonClick
  );
};

export const createStandardEmptyState = (
  title: string,
  description: string,
  buttonText: string,
  icon: React.ReactNode,
  onButtonClick: () => void,
): EmptyStateBaseProps => {
  const config = {
    title,
    description,
    buttonText,
    icon,
    onButtonClick,
  };

  if (!validateEmptyStateConfig(config)) {
    throw new Error('Invalid empty state configuration');
  }

  return config;
};
