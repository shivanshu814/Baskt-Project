use crate::constants::*;
use crate::error::PerpetualsError;
use anchor_lang::prelude::*;

/// Roles that can be assigned to accounts for access control
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub enum Role {
    /// Owner with global permissions
    Owner,
    /// Asset manager role with permission to add and manage assets
    AssetManager,
    /// Oracle manager role with permission to update oracle data
    OracleManager,
    /// Rebalancer role with permission to rebalance baskts
    Rebalancer,
    /// Matcher role with permission to match orders and open/close positions
    Matcher,
    /// Liquidator role with permission to liquidate underwater positions
    Liquidator,
    /// FundingManager role with permission to update funding rates and indices
    FundingManager,
    /// ConfigManager role with permission to update protocol configuration
    ConfigManager,
}

/// Access control entry for a specific account
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct AccessControlEntry {
    /// The account that has this role
    pub account: Pubkey,
    /// The role assigned to this account
    pub role: Role,
}

/// Access control system for the protocol
#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Debug, InitSpace)]
pub struct AccessControl {
    /// Map of accounts to their roles
    #[max_len(20)]
    pub entries: Vec<AccessControlEntry>,
}

impl AccessControl {
    /// Check if an account has a specific role
    pub fn has_role(&self, account: Pubkey, role: Role) -> bool {
        self.entries
            .iter()
            .any(|entry| entry.account == account && entry.role == role)
    }

    /// Check if an account has owner role
    pub fn is_owner(&self, account: Pubkey) -> bool {
        self.has_role(account, Role::Owner)
    }

    /// Add a role to an account
    pub fn add_role(&mut self, account: Pubkey, role: Role) -> Result<()> {
        // Check if the account already has this role
        if self.has_role(account, role) {
            return Ok(());
        }

        // Add the new role
        self.entries.push(AccessControlEntry { account, role });

        Ok(())
    }

    /// Remove a role from an account
    pub fn remove_role(&mut self, account: Pubkey, role: Role) -> Result<()> {
        let initial_len = self.entries.len();
        self.entries
            .retain(|entry| !(entry.account == account && entry.role == role));

        if self.entries.len() == initial_len {
            return Err(error!(PerpetualsError::RoleNotFound));
        }

        Ok(())
    }
}

/// Feature flags to enable or disable specific protocol features
#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Debug, InitSpace)]
pub struct FeatureFlags {
    /// Allow adding liquidity to the protocol
    pub allow_add_liquidity: bool,
    /// Allow removing liquidity from the protocol
    pub allow_remove_liquidity: bool,
    /// Allow opening new positions
    pub allow_open_position: bool,
    /// Allow closing existing positions
    pub allow_close_position: bool,
    /// Allow withdrawal of PnL
    pub allow_pnl_withdrawal: bool,
    /// Allow withdrawal of collateral
    pub allow_collateral_withdrawal: bool,
    /// Allow adding collateral to existing positions
    pub allow_add_collateral: bool,
    /// Allow creation of new baskts
    pub allow_baskt_creation: bool,
    /// Allow updating existing baskts
    pub allow_baskt_update: bool,
    /// Allow trading on the protocol
    pub allow_trading: bool,
    /// Allow liquidations to occur
    pub allow_liquidations: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct ProtocolConfig {
    /// Fee parameters (in basis points)
    pub opening_fee_bps: u64,
    pub closing_fee_bps: u64,
    pub liquidation_fee_bps: u64,

    /// Fee split parameters (in basis points)
    pub treasury_cut_bps: u64,
    pub funding_cut_bps: u64,

    /// Funding parameters
    pub max_funding_rate_bps: u64,
    pub funding_interval_seconds: i64,

    /// Risk parameters
    pub min_collateral_ratio_bps: u64,
    pub liquidation_threshold_bps: u64,

    /// Oracle parameters
    pub max_price_age_sec: u32,
    pub max_price_deviation_bps: u64,
    pub liquidation_price_deviation_bps: u64,

    /// Pool parameters
    pub min_liquidity: u64,

    /// Baskt decommissioning parameters
    pub decommission_grace_period: i64, // Grace period in seconds

    /// Metadata
    pub last_updated: i64,
    pub last_updated_by: Pubkey,
}

impl ProtocolConfig {
    fn new(owner: Pubkey) -> Self {
        Self {
            opening_fee_bps: OPENING_FEE_BPS,
            closing_fee_bps: CLOSING_FEE_BPS,
            liquidation_fee_bps: LIQUIDATION_FEE_BPS,
            treasury_cut_bps: DEFAULT_TREASURY_CUT_BPS,
            funding_cut_bps: DEFAULT_FUNDING_CUT_BPS,
            max_funding_rate_bps: MAX_FUNDING_RATE_BPS,
            funding_interval_seconds: FUNDING_INTERVAL_SECONDS,
            min_collateral_ratio_bps: MIN_COLLATERAL_RATIO_BPS,
            liquidation_threshold_bps: LIQUIDATION_THRESHOLD_BPS,
            max_price_age_sec: MAX_PRICE_AGE_SEC,
            max_price_deviation_bps: MAX_PRICE_DEVIATION_BPS,
            liquidation_price_deviation_bps: LIQUIDATION_PRICE_DEVIATION_BPS,
            min_liquidity: MIN_LIQUIDITY,
            decommission_grace_period: 86400, // Default to 24 hours (86400 seconds)
            last_updated: 0,
            last_updated_by: owner,
        }
    }
}

#[account]
#[derive(InitSpace)]

/**
 * It should track all the assets that we have in the system.
 * it should keep track of all the fees we are charging and what not
 * it should keep track of min liqudiation margins
 * it should keep track of fee splits
 * it should keep track of owner and be able to transfer ownership
 * it should keep track of protocol level stats maybe? fees, trading, volume, total baskts, total assets
 */
pub struct Protocol {
    pub is_initialized: bool,
    pub owner: Pubkey,
    pub access_control: AccessControl,
    pub feature_flags: FeatureFlags,

    pub treasury: Pubkey,
    /// Escrow mint (USDC)
    pub escrow_mint: Pubkey,

    /// Protocol configuration parameters
    pub config: ProtocolConfig,
}

impl Protocol {
    /// Initialize a new protocol state
    pub fn initialize(
        &mut self,
        owner: Pubkey,
        treasury: Pubkey,
        escrow_mint: Pubkey,
    ) -> Result<()> {
        self.is_initialized = true;
        self.owner = owner;

        // Add owner to access control with Owner role
        self.access_control.add_role(owner, Role::Owner)?;

        // Initialize feature flags - enable all features by default
        self.feature_flags = FeatureFlags {
            allow_add_liquidity: true,
            allow_remove_liquidity: true,
            allow_open_position: true,
            allow_close_position: true,
            allow_pnl_withdrawal: true,
            allow_collateral_withdrawal: true,
            allow_add_collateral: true,
            allow_baskt_creation: true,
            allow_baskt_update: true,
            allow_trading: true,
            allow_liquidations: true,
        };

        self.treasury = treasury;
        self.escrow_mint = escrow_mint;

        // Initialize default protocol configuration
        self.config = ProtocolConfig::new(owner);

        Ok(())
    }

    /// Add a role to an account
    pub fn add_role(&mut self, account: Pubkey, role: Role) -> Result<()> {
        self.access_control.add_role(account, role)
    }

    /// Remove a role from an account
    pub fn remove_role(&mut self, account: Pubkey, role: Role) -> Result<()> {
        self.access_control.remove_role(account, role)
    }

    /// Check if an account has a specific role
    pub fn has_role(&self, account: Pubkey, role: Role) -> bool {
        self.access_control.has_role(account, role)
    }

    /// Check if an account is the owner or has owner role
    pub fn is_owner(&self, account: Pubkey) -> bool {
        account == self.owner || self.access_control.is_owner(account)
    }

    /// Check if an account has permission (is owner or has the specified role)
    pub fn has_permission(&self, account: Pubkey, role: Role) -> bool {
        self.is_owner(account) || self.has_role(account, role)
    }

    /// Check if the protocol is initialized
    pub fn is_initialized(&self) -> bool {
        self.is_initialized
    }

    /// Get the owner of the protocol
    pub fn get_owner(&self) -> Pubkey {
        self.owner
    }

    /// Update feature flags
    pub fn update_feature_flags(&mut self, new_feature_flags: FeatureFlags) -> Result<()> {
        self.feature_flags = new_feature_flags;
        Ok(())
    }

    /// Get feature flags
    pub fn get_feature_flags(&self) -> &FeatureFlags {
        &self.feature_flags
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protocol_initialize() {
        let mut state = Protocol {
            is_initialized: false,
            owner: Pubkey::default(),
            access_control: AccessControl::default(),
            feature_flags: FeatureFlags::default(),
            treasury: Pubkey::default(),
            escrow_mint: Pubkey::default(),
            config: ProtocolConfig::new(Pubkey::default()),
        };
        let owner = Pubkey::new_unique();
        let treasury = Pubkey::new_unique();
        let escrow_mint = Pubkey::new_unique();

        state.initialize(owner, treasury, escrow_mint).unwrap();

        assert!(state.is_initialized());
        assert_eq!(state.get_owner(), owner);
    }

    #[test]
    fn test_role_based_permissions() {
        let mut state = Protocol {
            is_initialized: false,
            owner: Pubkey::default(),
            access_control: AccessControl::default(),
            feature_flags: FeatureFlags::default(),
            treasury: Pubkey::default(),
            escrow_mint: Pubkey::default(),
            config: ProtocolConfig::new(Pubkey::default()),
        };
        let owner = Pubkey::new_unique();
        let treasury = Pubkey::new_unique();
        let escrow_mint = Pubkey::new_unique();
        let asset_manager = Pubkey::new_unique();
        let liquidator = Pubkey::new_unique();
        let random_user = Pubkey::new_unique();

        // Initialize protocol with owner
        state.initialize(owner, treasury, escrow_mint).unwrap();

        // Add roles to accounts
        state.add_role(asset_manager, Role::AssetManager).unwrap();
        state.add_role(liquidator, Role::Liquidator).unwrap();

        // Test owner permissions
        assert!(state.has_permission(owner, Role::Owner));
        assert!(state.has_permission(owner, Role::AssetManager)); // Owner has all permissions
        assert!(state.has_permission(owner, Role::Liquidator)); // Owner has all permissions

        // Test specific role permissions
        assert!(state.has_permission(asset_manager, Role::AssetManager));
        assert!(!state.has_permission(asset_manager, Role::Liquidator));
        assert!(state.has_permission(liquidator, Role::Liquidator));
        assert!(!state.has_permission(liquidator, Role::AssetManager));

        // Test unauthorized user
        assert!(!state.has_permission(random_user, Role::AssetManager));
        assert!(!state.has_permission(random_user, Role::Liquidator));
        assert!(!state.has_permission(random_user, Role::Owner));

        // Test role removal
        state.remove_role(liquidator, Role::Liquidator).unwrap();
        assert!(!state.has_permission(liquidator, Role::Liquidator));
    }

    #[test]
    fn test_role_not_found_error() {
        let mut state = Protocol {
            is_initialized: false,
            owner: Pubkey::default(),
            access_control: AccessControl::default(),
            feature_flags: FeatureFlags::default(),
            treasury: Pubkey::default(),
            escrow_mint: Pubkey::default(),
            config: ProtocolConfig::new(Pubkey::default()),
        };
        let user = Pubkey::new_unique();
        let treasury = Pubkey::new_unique();
        let escrow_mint = Pubkey::new_unique();

        state.initialize(user, treasury, escrow_mint).unwrap();

        // Try to remove a role that doesn't exist
        let random_user = Pubkey::new_unique();
        let result = state.remove_role(random_user, Role::Liquidator);

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            error!(PerpetualsError::RoleNotFound).to_string()
        );
    }
}
