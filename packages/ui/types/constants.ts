/**
 * UI-specific constants shared between main app and admin app
 */

export const CATEGORIES = ['all', 'defi', 'metaverse', 'ai', 'gaming', 'layer1'] as const;
export const SORT_OPTIONS = ['popular', 'newest', 'performance'] as const;

// Type definitions for the constants
export type Category = (typeof CATEGORIES)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];
