import mongoose from "mongoose";
import BN from "bn.js";

export function BNAndDecimal128(required: boolean, trim: boolean = true) {
    return {
        required,
        trim,
        type: mongoose.Schema.Types.Decimal128,
        get: (v: mongoose.Types.Decimal128) => {
            return new BN(v.toString());
        },
        set: (v: string | bigint | number | BN) => {
            return v == null ? v : mongoose.Types.Decimal128.fromString(v.toString())
        },
        default: 0,
    };
  }