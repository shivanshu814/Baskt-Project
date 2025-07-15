/**
 * Data combination utilities for the querier package
 *
 * This file is used to combine data from multiple sources.
 * It is used to combine data from MongoDB, Onchain, and TimescaleDB.
 * It has methods to combine data, validate data consistency, and transform data.
 */
export interface DataSource {
  type: 'mongodb' | 'timescale' | 'onchain';
  data: any;
  timestamp?: number;
}

export const combineDataSources = (sources: DataSource[]): any => {
  // Simple combination logic - can be enhanced based on specific needs
  const combined: any = {};

  sources.forEach((source) => {
    if (source.data) {
      Object.assign(combined, source.data);
    }
  });

  return combined;
};

export const validateDataConsistency = (data: any): boolean => {
  // Basic validation - can be enhanced with specific rules
  return data !== null && data !== undefined;
};

export const transformData = <T>(data: any, transformer: (data: any) => T): T => {
  return transformer(data);
};
