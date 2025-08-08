use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::error::PerpetualsError;


pub fn transfer_sol<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, PerpetualsError::InvalidInput);
    let cpi_context = CpiContext::new(
        system_program.clone(),
        system_program::Transfer {
            from: from.clone(),
            to: to.clone(),
        }
    );

    // Execute the transfer
    let res = system_program::transfer(cpi_context, amount);

    if res.is_err() {
        return err!(PerpetualsError::TransferFailed);
    }    
    Ok(())  
}

