use anchor_lang::prelude::*;
/// Permissions for the asset - optimized to use bitfield
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, Debug, PartialEq, InitSpace)]
pub struct AssetPermissions {
    pub flags: u8, // Bitfield: bit 0 = allow_longs, bit 1 = allow_shorts
}

impl AssetPermissions {
    pub fn allow_longs(&self) -> bool {
        self.flags & 0x01 != 0
    }
    
    pub fn allow_shorts(&self) -> bool {
        self.flags & 0x02 != 0
    }
    
    pub fn set_allow_longs(&mut self, allow: bool) {
        if allow {
            self.flags |= 0x01;
        } else {
            self.flags &= !0x01;
        }
    }
    
    pub fn set_allow_shorts(&mut self, allow: bool) {
        if allow {
            self.flags |= 0x02;
        } else {
            self.flags &= !0x02;
        }
    }
    
    pub fn new(allow_longs: bool, allow_shorts: bool) -> Self {
        let mut permissions = Self::default();
        permissions.set_allow_longs(allow_longs);
        permissions.set_allow_shorts(allow_shorts);
        permissions
    }
}

#[account]
#[derive(InitSpace)]
pub struct SyntheticAsset {
    #[max_len(10)]
    pub ticker: String, // Keep as String for simplicity
    pub permissions: AssetPermissions, // Optimized permissions (1 byte vs 2 bytes)
    pub is_active: bool,  // Whether the asset is active
    pub listing_time: u32, // Unix timestamp (4 bytes vs 8 bytes i64)
}

impl SyntheticAsset {
    /// Initialize a new synthetic asset
    pub fn initialize(
        &mut self,
        ticker: String,
        permissions: AssetPermissions,
        listing_time: u32,
    ) -> Result<()> {
        self.ticker = ticker;
        self.permissions = permissions;
        self.is_active = true;
        self.listing_time = listing_time;
        Ok(())
    }
}
