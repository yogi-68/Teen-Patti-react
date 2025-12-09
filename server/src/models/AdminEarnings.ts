import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminEarnings extends Document {
  totalTips: number;
  totalCommission: number;
  totalEarnings: number;
  lastUpdated: Date;
}

const AdminEarningsSchema: Schema = new Schema(
  {
    totalTips: {
      type: Number,
      default: 0,
      required: true,
    },
    totalCommission: {
      type: Number,
      default: 0,
      required: true,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one admin earnings record exists
AdminEarningsSchema.index({ _id: 1 }, { unique: true });

const AdminEarnings = mongoose.model<IAdminEarnings>(
  'AdminEarnings',
  AdminEarningsSchema
);

export default AdminEarnings;
