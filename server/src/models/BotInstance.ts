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

export type IdentityMode = 'persistent' | 'ephemeral' | 'randomize';
