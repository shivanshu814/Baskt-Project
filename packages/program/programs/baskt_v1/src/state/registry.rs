use anchor_lang::prelude::*;

/// Central registry for commonly used protocol addresses
#[account]
#[derive(InitSpace)]
// TODO: sidduHERE why do we need to protocol, lp, pool_auth. These are all anyway PDAs right.
// We can basically remove the use of this if we store the escrow mint in the protocol account
pub struct ProtocolRegistry {
    /// Protocol account reference
    pub protocol: Pubkey,

    /// Treasury account that receives fees
    pub treasury: Pubkey,

    /// Treasury token account for USDC
    pub treasury_token: Pubkey,

    /// Main liquidity pool
    pub liquidity_pool: Pubkey,

    /// Token vault for the liquidity pool
    pub token_vault: Pubkey,

    /// Pool authority PDA
    pub pool_authority: Pubkey,

    /// Pool authority bump
    pub pool_authority_bump: u8,

    /// Program authority PDA
    pub program_authority: Pubkey,

    /// Program authority bump  
    pub program_authority_bump: u8,

    /// Escrow mint (USDC)
    pub escrow_mint: Pubkey,

    /// Registry bump
    pub bump: u8,

    // Extra Space
    pub extra_space: [u8; 128],
}

impl ProtocolRegistry {
    pub const SEED: &'static [u8] = b"protocol_registry";
}
