export interface BehaviorProfile {
  aggressiveness: number; // 0-100: how often bot raises/bets
  risk_tolerance: number; // 0-100: likelihood to play marginal hands
  reaction_delay_ms: number; // 500-5000: delay before action (human-like)
  error_rate: number; // 0-20: % chance of suboptimal play
  skill_level: number; // 0-100: hand evaluation depth
}

export interface BotBlueprint {
  bot_blueprint_id: string;
  display_name_template: string; // e.g., "{{first}} {{last}}"
  avatar_url?: string;
  behavior_profile: BehaviorProfile;
  default_level: number; // 0-100
  persistent: boolean; // if true, keeps same identity across sessions
  created_by?: string; // admin user ID
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface CreateBotBlueprintInput {
  display_name_template: string;
  avatar_url?: string;
  behavior_profile: BehaviorProfile;
  default_level?: number;
  persistent?: boolean;
  created_by?: string;
}

export interface UpdateBotBlueprintInput {
  display_name_template?: string;
  avatar_url?: string;
  behavior_profile?: Partial<BehaviorProfile>;
  default_level?: number;
  persistent?: boolean;
  is_active?: boolean;
}

// Predefined behavior profiles - Human-like behavior
export const BehaviorProfiles = {
  CONSERVATIVE: {
    aggressiveness: 35,
    risk_tolerance: 40,
    reaction_delay_ms: 2500,
    error_rate: 8,
    skill_level: 50
  } as BehaviorProfile,
  
  AGGRESSIVE: {
    aggressiveness: 75, // Aggressive but not unrealistic
    risk_tolerance: 70, // Takes risks but not reckless
    reaction_delay_ms: 1500, // Human-like reaction time
    error_rate: 3, // Makes occasional mistakes like humans
    skill_level: 80 // Skilled but not perfect
  } as BehaviorProfile,
  
  BALANCED: {
    aggressiveness: 55, // Moderate aggression
    risk_tolerance: 55, // Balanced risk-taking
    reaction_delay_ms: 2000, // Natural thinking time
    error_rate: 5, // Some human errors
    skill_level: 65 // Good player
  } as BehaviorProfile,
  
  BEGINNER: {
    aggressiveness: 40,
    risk_tolerance: 35,
    reaction_delay_ms: 3000,
    error_rate: 12,
    skill_level: 35
  } as BehaviorProfile
};
