import { EmptyStateBaseProps } from '../../types/baskt';

/**
 * Validates empty state configuration.
 * @param config - The configuration to validate.
 * @returns True if the configuration is valid, false otherwise.
 */
export const validateEmptyStateConfig = (config: EmptyStateBaseProps): boolean => {
  return !!(
    config.title &&
    config.description &&
    config.buttonText &&
    config.icon &&
    config.onButtonClick
  );
};

/**
 * Creates a standardized empty state configuration.
 * @param title - The title of the empty state.
 * @param description - The description of the empty state.
 * @param buttonText - The text of the button.
 * @param icon - The icon of the empty state.
 * @param onButtonClick - The function to call when the button is clicked.
 * @returns The empty state configuration.
 */
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
