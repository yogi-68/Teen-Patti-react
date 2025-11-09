import mongoose, { Schema, Document, Model } from 'mongoose';
import { 
  BotBlueprint, 
  CreateBotBlueprintInput, 
  UpdateBotBlueprintInput,
  BehaviorProfile 
} from '../models/BotBlueprint';

// MongoDB Schema
interface BotBlueprintDocument extends Document {
  bot_blueprint_id: string;
  display_name_template: string;
  avatar_url?: string;
  behavior_profile: BehaviorProfile;
  default_level: number;
  persistent: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

const BehaviorProfileSchema = new Schema({
  aggressiveness: { type: Number, required: true, min: 0, max: 100 },
  risk_tolerance: { type: Number, required: true, min: 0, max: 100 },
  reaction_delay_ms: { type: Number, required: true, min: 500, max: 5000 },
  error_rate: { type: Number, required: true, min: 0, max: 20 },
  skill_level: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false });

const BotBlueprintSchema = new Schema<BotBlueprintDocument>({
  bot_blueprint_id: { type: String, required: true, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  display_name_template: { type: String, required: true },
  avatar_url: { type: String },
  behavior_profile: { type: BehaviorProfileSchema, required: true },
  default_level: { type: Number, default: 50, min: 0, max: 100 },
  persistent: { type: Boolean, default: false },
  created_by: { type: String },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const BotBlueprintModel: Model<BotBlueprintDocument> = mongoose.model<BotBlueprintDocument>('BotBlueprint', BotBlueprintSchema);

export class BotBlueprintRepository {
  /**
   * Create a new bot blueprint
   */
  async create(input: CreateBotBlueprintInput): Promise<BotBlueprint> {
    const blueprint = new BotBlueprintModel({
      bot_blueprint_id: new mongoose.Types.ObjectId().toString(),
      display_name_template: input.display_name_template,
      avatar_url: input.avatar_url,
      behavior_profile: input.behavior_profile,
      default_level: input.default_level || 50,
      persistent: input.persistent || false,
      created_by: input.created_by,
      is_active: true
    });

    const saved = await blueprint.save();
    return this.mapToModel(saved);
  }

  /**
   * Get bot blueprint by ID
   */
  async findById(blueprintId: string): Promise<BotBlueprint | null> {
    const blueprint = await BotBlueprintModel.findOne({ bot_blueprint_id: blueprintId });
    return blueprint ? this.mapToModel(blueprint) : null;
  }

  /**
   * Get all active bot blueprints
   */
  async findAll(includeInactive: boolean = false): Promise<BotBlueprint[]> {
    const query = includeInactive ? {} : { is_active: true };
    const blueprints = await BotBlueprintModel.find(query).sort({ created_at: -1 });
    return blueprints.map((bp: BotBlueprintDocument) => this.mapToModel(bp));
  }

  /**
   * Update bot blueprint
   */
  async update(blueprintId: string, input: UpdateBotBlueprintInput): Promise<BotBlueprint | null> {
    const updateData: any = {};

    if (input.display_name_template !== undefined) {
      updateData.display_name_template = input.display_name_template;
    }

    if (input.avatar_url !== undefined) {
      updateData.avatar_url = input.avatar_url;
    }

    if (input.behavior_profile !== undefined) {
      // Merge with existing profile
      const existing = await this.findById(blueprintId);
      if (existing) {
        updateData.behavior_profile = { ...existing.behavior_profile, ...input.behavior_profile };
      }
    }

    if (input.default_level !== undefined) {
      updateData.default_level = input.default_level;
    }

    if (input.persistent !== undefined) {
      updateData.persistent = input.persistent;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(blueprintId);
    }

    const updated = await BotBlueprintModel.findOneAndUpdate(
      { bot_blueprint_id: blueprintId },
      { $set: updateData },
      { new: true }
    );

    return updated ? this.mapToModel(updated) : null;
  }

  /**
   * Delete bot blueprint (soft delete by marking inactive)
   */
  async delete(blueprintId: string): Promise<boolean> {
    const result = await BotBlueprintModel.findOneAndUpdate(
      { bot_blueprint_id: blueprintId },
      { $set: { is_active: false } },
      { new: true }
    );
    return result !== null;
  }

  /**
   * Hard delete bot blueprint (permanent)
   */
  async hardDelete(blueprintId: string): Promise<boolean> {
    const result = await BotBlueprintModel.deleteOne({ bot_blueprint_id: blueprintId });
    return result.deletedCount > 0;
  }

  /**
   * Get blueprints by behavior profile type
   */
  async findByBehaviorProfile(profileName: string): Promise<BotBlueprint[]> {
    const blueprints = await BotBlueprintModel.find({
      is_active: true,
      'behavior_profile.skill_level': { $exists: true }
    }).sort({ created_at: -1 });
    
    return blueprints.map((bp: BotBlueprintDocument) => this.mapToModel(bp));
  }

  /**
   * Get count of active bot instances using this blueprint
   */
  async getActiveInstanceCount(blueprintId: string): Promise<number> {
    // This will be implemented when BotInstance model is created
    // For now return 0
    return 0;
  }

  /**
   * Map database document to model
   */
  private mapToModel(doc: BotBlueprintDocument): BotBlueprint {
    return {
      bot_blueprint_id: doc.bot_blueprint_id,
      display_name_template: doc.display_name_template,
      avatar_url: doc.avatar_url,
      behavior_profile: doc.behavior_profile,
      default_level: doc.default_level,
      persistent: doc.persistent,
      created_by: doc.created_by,
      created_at: new Date(doc.created_at),
      updated_at: new Date(doc.updated_at),
      is_active: doc.is_active
    };
  }
}

export default new BotBlueprintRepository();
