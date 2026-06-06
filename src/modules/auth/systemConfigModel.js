import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    prefBackup: {
      type: Boolean,
      default: true,
    },
    prefDebugLog: {
      type: Boolean,
      default: false,
    },
    prefAutoCache: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export default SystemConfig;
