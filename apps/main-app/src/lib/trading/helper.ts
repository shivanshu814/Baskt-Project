export const preventNegativeInput = (e: React.KeyboardEvent): void => {
  if (e.key === '-') {
    e.preventDefault();
  }
};

export const formatWeight = (weight: number) => (weight / 100).toFixed(2) + '%';
export const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

export const getNavChangeColor = (change: string | number) => {
  const numChange = typeof change === 'string' ? parseInt(change) : change;
  if (numChange === 0) return '';
  return numChange > 0 ? 'text-green-500' : 'text-red-500';
};
