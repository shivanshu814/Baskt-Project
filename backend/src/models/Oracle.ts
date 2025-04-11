import mongoose from 'mongoose';
// create oracle schema
const oracleSchema = new mongoose.Schema({
  oracleName: {
    type: String,
    required: true,
    trim: true,
  },
  oracleType: {
    type: String,
    required: true,
    enum: ['custom', 'pyth'],
    default: 'custom',
  },
  price: {
    type: Number,
    required: true,
  },
  exponent: {
    type: Number,
    required: true,
  },
  confidence: {
    type: Number,
    required: false,
  },
  ema: {
    type: Number,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Oracle = mongoose.model('Oracle', oracleSchema);
