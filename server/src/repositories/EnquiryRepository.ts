import Enquiry, { IEnquiry } from '../models/Enquiry.model.js';

export class EnquiryRepository {
  /**
   * Create a new enquiry
   */
  async create(data: {
    userId: string;
    username: string;
    subject: string;
    message: string;
  }): Promise<IEnquiry> {
    const enquiry = new Enquiry(data);
    return await enquiry.save();
  }

  /**
   * Get enquiry by ID
   */
  async findById(enquiryId: string): Promise<IEnquiry | null> {
    return await Enquiry.findById(enquiryId);
  }

  /**
   * Get all enquiries by user ID
   */
  async findByUserId(userId: string): Promise<IEnquiry[]> {
    return await Enquiry.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Get all enquiries (admin)
   */
  async findAll(filter?: { status?: string }): Promise<IEnquiry[]> {
    const query = filter?.status ? { status: filter.status } : {};
    return await Enquiry.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update enquiry status
   */
  async updateStatus(
    enquiryId: string,
    status: 'pending' | 'responded' | 'resolved' | 'closed'
  ): Promise<IEnquiry | null> {
    return await Enquiry.findByIdAndUpdate(
      enquiryId,
      { status },
      { new: true }
    );
  }

  /**
   * Add admin response to enquiry
   */
  async addResponse(
    enquiryId: string,
    adminResponse: string,
    adminId: string,
    adminUsername: string
  ): Promise<IEnquiry | null> {
    return await Enquiry.findByIdAndUpdate(
      enquiryId,
      {
        adminResponse,
        adminId,
        adminUsername,
        status: 'responded',
        respondedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Delete enquiry
   */
  async delete(enquiryId: string): Promise<boolean> {
    const result = await Enquiry.findByIdAndDelete(enquiryId);
    return result !== null;
  }

  /**
   * Get enquiry count by status
   */
  async getStatusCount(): Promise<{
    pending: number;
    responded: number;
    resolved: number;
    closed: number;
    total: number;
  }> {
    const [pending, responded, resolved, closed, total] = await Promise.all([
      Enquiry.countDocuments({ status: 'pending' }),
      Enquiry.countDocuments({ status: 'responded' }),
      Enquiry.countDocuments({ status: 'resolved' }),
      Enquiry.countDocuments({ status: 'closed' }),
      Enquiry.countDocuments(),
    ]);

    return { pending, responded, resolved, closed, total };
  }
}

export const enquiryRepository = new EnquiryRepository();
