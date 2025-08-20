export const preventNegativeInput = (e: React.KeyboardEvent): void => {
  if (e.key === '-') {
    e.preventDefault();
  }
};
