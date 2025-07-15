/**
 * Filters and validates baskt names.
 */

export const filterBasktName = (input: string): string => {
  let filtered = input.replace(/[^a-zA-Z0-9\s\-_]/g, '');

  const hyphenCount = (filtered.match(/-/g) || []).length;
  const underscoreCount = (filtered.match(/_/g) || []).length;

  if (hyphenCount > 1) {
    filtered = filtered.replace(/-/g, (match, index) => {
      return filtered.indexOf('-') === index ? '-' : '';
    });
  }

  if (underscoreCount > 1) {
    filtered = filtered.replace(/_/g, (match, index) => {
      return filtered.indexOf('_') === index ? '_' : '';
    });
  }

  return filtered;
};

export const validateBasktName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.length > 30) {
    return { isValid: false, error: 'Name must be 30 characters or less' };
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return {
      isValid: false,
      error: 'Name can only contain letters, numbers, spaces, hyphens, and underscores',
    };
  }

  const hyphenCount = (name.match(/-/g) || []).length;
  const underscoreCount = (name.match(/_/g) || []).length;

  if (hyphenCount > 1 || underscoreCount > 1) {
    return { isValid: false, error: 'Name can contain at most one hyphen and one underscore' };
  }

  return { isValid: true };
};

/**
 * Checks if a baskt name already exists
 */
export const checkBasktNameExists = async (
  name: string,
  basktClient: any,
): Promise<{ exists: boolean; error?: string }> => {
  try {
    if (!basktClient) {
      return { exists: false, error: 'Client not available' };
    }

    const exists = await basktClient.doesBasktNameExist(name);
    return { exists };
  } catch (error) {
    return { exists: false, error: 'Error checking baskt name' };
  }
};

/**
 * Checks if a baskt with the same asset configuration already exists
 */
export const checkDuplicateAssetConfig = (
  newAssets: Array<{ assetAddress: string; weight: number; direction: boolean }>,
  existingBaskts: Array<{
    name?: string;
    assets: Array<{ assetAddress: string; weight: number; direction: boolean }>;
  }>,
): { isDuplicate: boolean; duplicateBaskt?: string } => {
  const normalizeAssets = (
    assets: Array<{ assetAddress: string; weight: number; direction: boolean }>,
  ) => {
    return assets
      .filter((asset) => asset && asset.assetAddress)
      .map((asset) => ({
        assetAddress: asset.assetAddress.toLowerCase(),
        weight: asset.weight,
        direction: asset.direction,
      }))
      .sort((a, b) => a.assetAddress.localeCompare(b.assetAddress));
  };

  const newNormalized = normalizeAssets(newAssets);

  for (const baskt of existingBaskts) {
    if (!baskt || !baskt.assets || !Array.isArray(baskt.assets)) {
      continue;
    }

    if (baskt.assets.length !== newAssets.length) {
      continue;
    }

    const existingNormalized = normalizeAssets(baskt.assets);

    const isIdentical = newNormalized.every((newAsset, index) => {
      const existingAsset = existingNormalized[index];
      return (
        existingAsset &&
        newAsset.assetAddress === existingAsset.assetAddress &&
        newAsset.weight === existingAsset.weight &&
        newAsset.direction === existingAsset.direction
      );
    });

    if (isIdentical) {
      return { isDuplicate: true, duplicateBaskt: baskt.name || 'Unknown Baskt' };
    }
  }

  return { isDuplicate: false };
};
