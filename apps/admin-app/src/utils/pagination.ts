/**
 * Pagination utility functions
 */

export const getPaginatedData = <T>(data: T[], page: number, pageSize: number): T[] => {
  if (!data || !Array.isArray(data)) return [];
  const start = page * pageSize;
  return data.slice(start, start + pageSize);
};

export const getTotalPages = (totalItems: number, pageSize: number): number => {
  if (!totalItems) return 1;
  return Math.ceil(totalItems / pageSize);
};
