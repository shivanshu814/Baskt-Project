//! Oracle price service handling

use {
    crate::{constants::Constants, error::PerpetualsError, utils::Utils},
    anchor_lang::prelude::*,
};

#[derive(
    Copy, Clone, Eq, PartialEq, InitSpace, AnchorSerialize, AnchorDeserialize, Default, Debug,
)]
pub struct OraclePrice {
    pub price: u64,
    pub exponent: i32,
}

#[derive(Clone, PartialEq, InitSpace, AnchorSerialize, AnchorDeserialize, Default, Debug)]
pub struct OracleParams {
    pub oracle_account: Pubkey,
    pub max_price_error: u64,
    pub max_price_age_sec: u32,
}

#[account]
#[derive(InitSpace, Default, Debug)]
pub struct CustomOracle {
    pub price: u64,
    pub expo: i32,
    pub conf: u64,
    pub ema: u64,
    pub publish_time: i64,
}

impl CustomOracle {
    pub fn set(&mut self, price: u64, expo: i32, conf: u64, ema: u64, publish_time: i64) {
        self.price = price;
        self.expo = expo;
        self.conf = conf;
        self.ema = ema;
        self.publish_time = publish_time;
    }
}

impl OraclePrice {
    pub fn new_from_oracle(
        oracle_account: &AccountInfo,
        oracle_params: &OracleParams,
        current_time: i64,
        use_ema: bool,
    ) -> Result<Self> {
        Self::get_custom_price(
            oracle_account,
            oracle_params.max_price_error,
            oracle_params.max_price_age_sec,
            current_time,
            use_ema,
        )
    }
    // private helpers
    fn get_custom_price(
        custom_price_info: &AccountInfo,
        max_price_error: u64,
        max_price_age_sec: u32,
        current_time: i64,
        use_ema: bool,
    ) -> Result<OraclePrice> {
        require!(
            !Utils::is_empty_account(custom_price_info)?,
            PerpetualsError::InvalidOracleAccount
        );

        // Use deserialize directly to avoid lifetime issues
        let oracle_acc: CustomOracle = anchor_lang::AccountDeserialize::try_deserialize(
            &mut custom_price_info.data.borrow().as_ref(),
        )?;

        let last_update_age_sec = (current_time - oracle_acc.publish_time) as u64; // Safe conversion for time difference
        if last_update_age_sec > max_price_age_sec as u64 {
            msg!("Error: Custom oracle price is stale");
            return err!(PerpetualsError::StaleOraclePrice);
        }
        let price = if use_ema {
            oracle_acc.ema
        } else {
            oracle_acc.price
        };

        if price == 0 {
            msg!("Error: Custom oracle price is zero");
            return err!(PerpetualsError::InvalidOraclePrice);
        }

        // Calculate confidence ratio as percentage of price
        let conf_ratio = (oracle_acc.conf as u128)
            .checked_mul(Constants::BPS_POWER as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(price as u128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Convert to u64 for comparison, safe as conf_ratio is a percentage
        let conf_ratio_u64 = conf_ratio as u64;
        if conf_ratio_u64 > max_price_error {
            msg!("Error: Custom oracle price is out of bounds");
            return err!(PerpetualsError::InvalidOraclePrice);
        }

        Ok(OraclePrice {
            // price is i64 and > 0 per check above
            price,
            exponent: oracle_acc.expo,
        })
    }
}
