use anchor_lang::prelude::*;

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
}

impl Protocol {
    /// Initialize a new protocol state
    pub fn initialize(&mut self, owner: Pubkey) -> Result<()> {
        self.is_initialized = true;
        self.owner = owner;
        Ok(())
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