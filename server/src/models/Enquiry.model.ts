import mongoose, { Document, Schema } from 'mongoose';

export interface IEnquiry extends Document {
  userId: string;
  username: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'resolved' | 'closed';
  adminResponse?: string;
  adminId?: string;
  adminUsername?: string;
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      enum: ['account', 'payment', 'game', 'subscription', 'technical', 'feedback', 'other'],
    },
    message: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['pending', 'responded', 'resolved', 'closed'],
      default: 'pending',
    },
    adminResponse: {
      type: String,
      maxlength: 2000,
    },
    adminId: {
      type: String,
    },
    adminUsername: {
      type: String,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
EnquirySchema.index({ userId: 1, createdAt: -1 });
EnquirySchema.index({ status: 1, createdAt: -1 });

const Enquiry = mongoose.model<IEnquiry>('Enquiry', EnquirySchema);

export default Enquiry;
