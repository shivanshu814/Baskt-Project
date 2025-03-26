use crate::error::PerpetualsError;
use anchor_lang::prelude::*;

/// Roles that can be assigned to accounts for access control
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub enum Role {
    /// Owner,
    Owner,
    /// Asset manager role with permission to add and manage assets
    AssetManager,
    /// Oracle manager role with permission to update oracle data
    OracleManager,
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
    pub fn has_role(&self, account: &Pubkey, role: Role) -> bool {
        self.entries
            .iter()
            .any(|entry| &entry.account == account && entry.role == role)
    }

    /// Check if an account has owner role
    pub fn is_owner(&self, account: &Pubkey) -> bool {
        self.has_role(account, Role::Owner)
    }

    /// Add a role to an account
    pub fn add_role(&mut self, account: Pubkey, role: Role) -> Result<()> {
        // Check if the account already has this role
        if self.has_role(&account, role) {
            return Ok(());
        }

        // Add the new role
        self.entries.push(AccessControlEntry { account, role });

        Ok(())
    }

    /// Remove a role from an account
    pub fn remove_role(&mut self, account: &Pubkey, role: Role) -> Result<()> {
        let initial_len = self.entries.len();
        self.entries
            .retain(|entry| !(entry.account == *account && entry.role == role));

        if self.entries.len() == initial_len {
            return Err(error!(PerpetualsError::RoleNotFound));
        }

        Ok(())
    }
}

#[account]
#[derive(Default, InitSpace)]

/**
 * REVIEW: I will need a permissions struct which can be used to turn of certain features of the system
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
}

impl Protocol {
    /// Initialize a new protocol state
    pub fn initialize(&mut self, owner: Pubkey) -> Result<()> {
        self.is_initialized = true;
        self.owner = owner;

        // Add owner to access control with Owner role
        self.access_control.add_role(owner, Role::Owner)?;

        Ok(())
    }

    /// Add a role to an account
    pub fn add_role(&mut self, account: Pubkey, role: Role) -> Result<()> {
        self.access_control.add_role(account, role)
    }

    /// Remove a role from an account
    pub fn remove_role(&mut self, account: &Pubkey, role: Role) -> Result<()> {
        self.access_control.remove_role(account, role)
    }

    /// Check if an account has a specific role
    pub fn has_role(&self, account: &Pubkey, role: Role) -> bool {
        self.access_control.has_role(account, role)
    }

    /// Check if an account is the owner or has owner role
    pub fn is_owner(&self, account: &Pubkey) -> bool {
        *account == self.owner || self.access_control.is_owner(account)
    }

    /// Check if an account has permission (is owner or has the specified role)
    pub fn has_permission(&self, account: &Pubkey, role: Role) -> bool {
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protocol_initialize() {
        let mut state = Protocol::default();
        let owner = Pubkey::new_unique();

        state.initialize(owner).unwrap();

        assert!(state.is_initialized());
        assert_eq!(state.get_owner(), owner);
    }
}
