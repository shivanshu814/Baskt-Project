use crate::error::PerpetualsError;
use anchor_lang::prelude::*;

pub fn checked_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or(PerpetualsError::MathOverflow.into())
}

pub fn checked_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or(PerpetualsError::MathOverflow.into())
}

pub fn checked_mul(a: u64, b: u64) -> Result<u64> {
    a.checked_mul(b).ok_or(PerpetualsError::MathOverflow.into())
}

pub fn checked_div(a: u64, b: u64) -> Result<u64> {
    if b == 0 {
        return Err(PerpetualsError::MathOverflow.into());
    }
    a.checked_div(b).ok_or(PerpetualsError::MathOverflow.into())
}

pub fn checked_as_u64(a: u128) -> Result<u64> {
    if a > u64::MAX as u128 {
        return Err(PerpetualsError::MathOverflow.into());
    }
    Ok(a as u64)
}

pub fn checked_as_i64(a: i128) -> Result<i64> {
    if a > i64::MAX as i128 || a < i64::MIN as i128 {
        return Err(PerpetualsError::MathOverflow.into());
    }
    Ok(a as i64)
}

pub fn checked_pow(base: u64, exp: u32) -> Result<u64> {
    base.checked_pow(exp)
        .ok_or(PerpetualsError::MathOverflow.into())
}

pub fn checked_percentage(amount: u64, percentage_bps: u64, bps_divisor: u64) -> Result<u64> {
    let result = (amount as u128)
        .checked_mul(percentage_bps as u128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(bps_divisor as u128)
        .ok_or(PerpetualsError::MathOverflow)?;

    checked_as_u64(result)
}

pub fn checked_decimal_mul(a: u64, a_exp: i32, b: u64, b_exp: i32, target_exp: i32) -> Result<u64> {
    // Calculate the result exponent
    let result_exp = a_exp + b_exp;

    // Calculate the raw multiplication
    let raw_result = (a as u128)
        .checked_mul(b as u128)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Adjust to target exponent
    let exp_diff = result_exp - target_exp;

    let result = if exp_diff > 0 {
        // Need to divide
        let divisor = 10u128
            .checked_pow(exp_diff as u32)
            .ok_or(PerpetualsError::MathOverflow)?;
        raw_result
            .checked_div(divisor)
            .ok_or(PerpetualsError::MathOverflow)?
    } else if exp_diff < 0 {
        // Need to multiply
        let multiplier = 10u128
            .checked_pow((-exp_diff) as u32)
            .ok_or(PerpetualsError::MathOverflow)?;
        raw_result
            .checked_mul(multiplier)
            .ok_or(PerpetualsError::MathOverflow)?
    } else {
        // No adjustment needed
        raw_result
    };

    checked_as_u64(result)
}

pub fn checked_decimal_div(a: u64, a_exp: i32, b: u64, b_exp: i32, target_exp: i32) -> Result<u64> {
    if b == 0 {
        return Err(PerpetualsError::MathOverflow.into());
    }

    // Calculate the result exponent
    let result_exp = a_exp - b_exp;

    // Scale the dividend to ensure precision
    let scale_factor = 10u128.checked_pow(9).ok_or(PerpetualsError::MathOverflow)?; // 9 decimal places of precision
    let scaled_a = (a as u128)
        .checked_mul(scale_factor)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Perform the division
    let raw_result = scaled_a
        .checked_div(b as u128)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Adjust to target exponent
    let exp_diff = (result_exp - 9) - target_exp; // -9 from the scale factor

    let result = if exp_diff > 0 {
        // Need to divide
        let divisor = 10u128
            .checked_pow(exp_diff as u32)
            .ok_or(PerpetualsError::MathOverflow)?;
        raw_result
            .checked_div(divisor)
            .ok_or(PerpetualsError::MathOverflow)?
    } else if exp_diff < 0 {
        // Need to multiply
        let multiplier = 10u128
            .checked_pow((-exp_diff) as u32)
            .ok_or(PerpetualsError::MathOverflow)?;
        raw_result
            .checked_mul(multiplier)
            .ok_or(PerpetualsError::MathOverflow)?
    } else {
        // No adjustment needed
        raw_result
    };

    checked_as_u64(result)
}

pub fn checked_add_signed(a: i64, b: i64) -> Result<i64> {
    a.checked_add(b).ok_or(PerpetualsError::MathOverflow.into())
}
