/**
 * Table utility functions
 */

// eslint-disable-next-line
export const formatTableValue = (value: any, defaultValue: string = '-'): string => {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};

export const getTableRowKey = (index: number, id?: string | number): string => {
  return id ? `row-${id}` : `row-${index}`;
};
