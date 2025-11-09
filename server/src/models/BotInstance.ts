export interface BotInstance {
  bot_instance_id: string;
  bot_blueprint_id: string;
  display_name: string; // resolved final name
  bot_id: string; // unique identifier like "RS-8732"
  avatar_url?: string;
  session_id?: string; // game session this bot is in
  assigned_table_id?: number;
  assigned_seat_index?: number; // 0-5
  balance_coins: number;
  balance_cash: number;
  created_at: Date;
  expires_at?: Date; // null = persistent, set value = ephemeral
  randomized: boolean; // true if identity was randomized
  created_by_admin_id?: string;
  is_active: boolean;
  last_action_at?: Date;
  
  // Analytics & Metrics
  games_played: number;
  games_won: number;
  total_winnings: number; // Net winnings (wins - losses)
  total_bet_amount: number; // Total amount bet across all games
  total_hands_folded: number;
  total_hands_shown: number;
  last_game_at?: Date;
}

export interface CreateBotInstanceInput {
  bot_blueprint_id: string;
  display_name: string;
  bot_id: string;
  avatar_url?: string;
  session_id?: string;
  assigned_table_id?: number;
  assigned_seat_index?: number;
  balance_coins?: number;
  balance_cash?: number;
  expires_at?: Date;
  randomized?: boolean;
  created_by_admin_id?: string;
}

export interface UpdateBotInstanceInput {
  display_name?: string;
  bot_id?: string;
  avatar_url?: string;
  session_id?: string;
  assigned_table_id?: number;
  assigned_seat_index?: number;
  balance_coins?: number;
  balance_cash?: number;
  expires_at?: Date;
  is_active?: boolean;
  last_action_at?: Date;
}

export interface BotAnalytics {
  bot_instance_id: string;
  display_name: string;
  bot_id: string;
  games_played: number;
  games_won: number;
  win_rate: number; // Percentage
  total_winnings: number;
  total_bet_amount: number;
  avg_bet_per_game: number;
  total_hands_folded: number;
  total_hands_shown: number;
  fold_rate: number; // Percentage
  show_rate: number; // Percentage
  roi: number; // Return on Investment (%)
  last_game_at?: Date;
  behavior_profile_summary: {
    aggressiveness: number;
    risk_tolerance: number;
    skill_level: number;
  };
}

export type IdentityMode = 'persistent' | 'ephemeral' | 'randomize';
