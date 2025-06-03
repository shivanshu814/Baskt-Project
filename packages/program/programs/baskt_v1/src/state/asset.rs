use anchor_lang::prelude::*;
/// Permissions for the asset
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, Debug, PartialEq, InitSpace)]
pub struct AssetPermissions {
    pub allow_longs: bool,  // Whether long positions are allowed
    pub allow_shorts: bool, // Whether short positions are allowed
}

#[account]
#[derive(InitSpace)]
pub struct SyntheticAsset {
    pub asset_id: Pubkey, // Account ID of the asset
    #[max_len(10)]
    pub ticker: String, // Ticker symbol for the asset (e.g., "BTC", "ETH")
    pub permissions: AssetPermissions, // Permissions for the asset
    pub is_active: bool,  // Whether the asset is active
    pub listing_time: i64, // Time when the asset was listed

    // Extra Space
    pub extra_space: [u8; 128],
}

impl SyntheticAsset {
    /// Initialize a new synthetic asset
    pub fn initialize(
        &mut self,
        asset_id: Pubkey,
        ticker: String,
        permissions: AssetPermissions,
        listing_time: i64,
    ) -> Result<()> {
        self.asset_id = asset_id;
        self.ticker = ticker;
        self.permissions = permissions;
        self.is_active = true;
        self.listing_time = listing_time;
        Ok(())
    }
}
