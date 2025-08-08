'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Critical indexes for performance queries
    
    // 1. Primary index on asset_id (most important for filtering)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_id 
      ON asset_prices (asset_id);
    `);
    
    // 2. Composite index on (asset_id, time DESC) for time-range queries
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_id_time_desc 
      ON asset_prices (asset_id, time DESC);
    `);
    
    // 3. Time-based index for TimescaleDB chunk exclusion
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_prices_time_desc 
      ON asset_prices (time DESC);
    `);
    
    // 4. Composite index for range queries (asset_id, time) - optimized for subqueries
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_time_range 
      ON asset_prices (asset_id, time DESC) 
      WHERE time IS NOT NULL AND asset_id IS NOT NULL;
    `);
    
    // 5. TimescaleDB-specific: Enable compression (optional but recommended)
    await queryInterface.sequelize.query(`
      ALTER TABLE asset_prices SET (
        timescaledb.compress = true,
        timescaledb.compress_segmentby = 'asset_id'
      );
    `);
    
    // 6. Add compression policy for data older than 7 days
    await queryInterface.sequelize.query(`
      SELECT add_compression_policy('asset_prices', INTERVAL '7 days');
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove compression policy
    await queryInterface.sequelize.query(`
      SELECT remove_compression_policy('asset_prices');
    `);
    
    // Remove indexes
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_asset_prices_asset_id;
    `);
    
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_asset_prices_asset_id_time_desc;
    `);
    
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_asset_prices_time_desc;
    `);
    
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_asset_prices_asset_time_range;
    `);
  }
}; 