use anchor_lang::prelude::*;

/// Per-user withdrawal request queued when liquidity utilisation is high.
#[account]
#[derive(InitSpace)]
pub struct WithdrawRequest {
    /// Sequential queue ID (monotonically increasing per pool)
    pub id: u64,
    /// Requester (LP owner)
    pub provider: Pubkey,
    /// LP tokens locked in the request (may be partially fulfilled)
    pub remaining_lp: u64,
    /// Destination token account for payouts
    pub provider_usdc_account: Pubkey,
    /// Timestamp when the request was created
    pub requested_ts: i64,
    /// PDA bump
    pub bump: u8,
}

impl WithdrawRequest {
    pub const SEED_PREFIX: &'static [u8] = b"withdraw";
}
