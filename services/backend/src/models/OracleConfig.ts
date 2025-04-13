import mongoose from 'mongoose';
// create oracle schema
const oracleConfigSchema = new mongoose.Schema({
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
  oracleAddress: {
    type: String,
    required: true,
    trim: true,
  },
  priceConfig: {
    type: {
      provider: {
        type: {
          id: { type: String, required: true },
          chain: { type: String, required: true },
          name: { type: String, required: true },
        },
        required: true,
      },
      twp: {
        type: {
          seconds: { type: Number, required: true },
        },
        required: true,
      },
      updateFrequencySeconds: { type: Number, required: true },
    },
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const OracleConfig = mongoose.model('OracleConfig', oracleConfigSchema);
