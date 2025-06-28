use {
    crate::error::PerpetualsError,
    crate::state::{liquidity::LiquidityPool, protocol::Protocol},
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
};

/// Validates treasury token account and token vault for position instructions
///
/// This function performs comprehensive validation logic for position instructions:
/// 1. Validates treasury token account ownership and mint
/// 2. Validates token vault matches liquidity pool
/// 3. Validates account uniqueness (treasury_token != token_vault)
/// 4. Validates treasury token has no delegate or close authority
///
/// # Security Considerations
/// - Account uniqueness prevents double-counting and manipulation attacks
/// - Delegate/close authority checks prevent post-validation fund theft
/// - All validations are critical for DeFi protocol security
///
/// # Arguments
/// * `treasury_token` - The treasury token account to validate
/// * `token_vault` - The token vault account to validate
/// * `protocol` - The protocol account containing treasury and escrow mint info
/// * `liquidity_pool` - The liquidity pool account containing token vault info
///
/// # Returns
/// * `Result<()>` - Ok if validation passes, error otherwise
///
/// # Errors
/// * `InvalidAccountInput` - If treasury token account cannot be deserialized
/// * `InvalidTreasuryAccount` - If treasury token account owner doesn't match protocol treasury
/// * `InvalidMint` - If treasury token account mint doesn't match protocol escrow mint
/// * `InvalidTokenVault` - If token vault key doesn't match liquidity pool token vault
/// * `InvalidAccountInput` - If treasury_token and token_vault are the same account
/// * `TokenHasDelegate` - If treasury token account has a delegate set
/// * `TokenHasCloseAuthority` - If treasury token account has close authority set
pub fn validate_treasury_and_vault(
    treasury_token: &AccountInfo,
    token_vault: &AccountInfo,
    protocol: &Protocol,
    liquidity_pool: &LiquidityPool,
) -> Result<()> {
    // 1. Validate account uniqueness - prevent double-counting attacks
    require!(
        treasury_token.key() != token_vault.key(),
        PerpetualsError::InvalidAccountInput
    );

    // 2. Validate treasury token account
    let borrowed_data = treasury_token.data.borrow();
    let mut data_slice = &borrowed_data[..];
    let treasury_token_account =
        TokenAccount::try_deserialize(&mut data_slice)
            .map_err(|_| PerpetualsError::InvalidAccountInput)?;

    // 2a. Validate ownership and mint
    require!(
        treasury_token_account.owner == protocol.treasury,
        PerpetualsError::InvalidTreasuryAccount
    );
    require!(
        treasury_token_account.mint == protocol.escrow_mint,
        PerpetualsError::InvalidMint
    );

    // 2b. Validate no delegate or close authority - prevent post-validation theft
    require!(
        treasury_token_account.delegate.is_none(),
        PerpetualsError::TokenHasDelegate
    );
    require!(
        treasury_token_account.close_authority.is_none(),
        PerpetualsError::TokenHasCloseAuthority
    );

    // 3. Validate token vault matches liquidity pool
    require!(
        token_vault.key() == liquidity_pool.token_vault,
        PerpetualsError::InvalidTokenVault
    );

    Ok(())
}
