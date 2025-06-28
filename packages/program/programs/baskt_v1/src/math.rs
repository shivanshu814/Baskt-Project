use crate::error::PerpetualsError;
use anchor_lang::error::Error as AnchorError;
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
    mul_div_u64(amount, percentage_bps, bps_divisor)
}

pub fn checked_add_signed(a: i64, b: i64) -> Result<i64> {
    a.checked_add(b).ok_or(PerpetualsError::MathOverflow.into())
}

pub fn mul_div_u64(a: u64, b: u64, c: u64) -> Result<u64> {
    if c == 0 {
        return Err(PerpetualsError::MathOverflow.into());
    }
    let result = (a as u128)
        .checked_mul(b as u128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(c as u128)
        .ok_or(PerpetualsError::MathOverflow)?;
    checked_as_u64(result)
}

pub fn mul_div_u128(a: u128, b: u128, c: u128) -> Result<u128> {
    // Denominator must be non-zero
    if c == 0 {
        return Err(PerpetualsError::MathOverflow.into());
    }
    // Use decomposition to avoid intermediate overflow: (a / c) * b + ((a % c) * b) / c
    let hi = a / c;
    let lo = a % c;

    let hi_part = hi
        .checked_mul(b)
        .ok_or_else(|| AnchorError::from(PerpetualsError::MathOverflow))?;
    let lo_mul = lo
        .checked_mul(b)
        .ok_or_else(|| AnchorError::from(PerpetualsError::MathOverflow))?;
    let lo_part = lo_mul
        .checked_div(c)
        .ok_or_else(|| AnchorError::from(PerpetualsError::MathOverflow))?;

    hi_part
        .checked_add(lo_part)
        .ok_or_else(|| AnchorError::from(PerpetualsError::MathOverflow))
}
