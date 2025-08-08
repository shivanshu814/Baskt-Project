use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;


// From: https://github.com/solana-foundation/anchor/blob/3dd2386d89123b4639995957ba67c35108f96ae5/lang/src/common.rs#L6
pub fn close_account(account: &AccountInfo, destination: &AccountInfo) -> Result<()> {
  // Transfer tokens from the account to the sol_destination.
  let dest_starting_lamports = destination.lamports();
  **destination.lamports.borrow_mut() =
      dest_starting_lamports.checked_add(account.lamports()).unwrap();
  **account.lamports.borrow_mut() = 0;

  account.assign(&system_program::ID);
  account.realloc(0, false)?;
  
  Ok(())
}
