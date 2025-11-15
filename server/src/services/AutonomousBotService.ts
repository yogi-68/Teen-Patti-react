import type { PlayerInfo } from '../models/Player.js';
import type { Table } from '../models/Table.js';
import { GameState } from '../models/Table.js';
import type { HandRank } from './CardComparer.js';

/**
 * Bot personality profiles that influence decision making
 */
interface BotPersonality {
  aggression: number; // 0-1: How likely to raise vs call
  bluffing: number; // 0-1: How likely to bet with weak hands
  caution: number; // 0-1: How likely to fold marginal hands
  patience: number; // 0-1: How long they wait before seeing cards
}

/**
 * Autonomous bot player that makes decisions based on probabilities
 */
export class AutonomousBotService {
  private botNames = [
    'RajBot', 'PriyaAI', 'VikramPlay', 'AnanyaBot', 'ArjunGamer',
    'DiyaPlay', 'KabirBot', 'SaraAI', 'RohanPlay', 'NihaBot',
    'AdityaAI', 'IshaniPlay', 'DevBot', 'TaraAI', 'KrishPlay',
    'MeraBot', 'SidPlay', 'RiyaAI', 'AakashBot', 'ZoyaPlay',
    'VedPlay', 'MayaBot', 'NeilAI', 'AditiPlay', 'VarunBot'
  ];

  private usedNames: Set<string> = new Set();

  /**
   * Generate a unique bot player
   */
  generateBot(chips: number = 100): PlayerInfo {
    const name = this.getUniqueBotName();
    const personality = this.generatePersonality();

    return {
      userName: name,
      userId: `autobot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chips: Math.round(chips * 100) / 100, // 2 decimal precision
      isBot: true,
      avatar: this.getRandomAvatar(),
      // Store personality in a way that can be accessed later
      botPersonality: personality as any
    };
  }

  /**
   * Get a unique bot name
   */
  private getUniqueBotName(): string {
    const availableNames = this.botNames.filter(name => !this.usedNames.has(name));
    
    if (availableNames.length === 0) {
      // If all names used, add number suffix
      const baseName = this.botNames[Math.floor(Math.random() * this.botNames.length)];
      const suffix = Math.floor(Math.random() * 1000);
      return `${baseName}${suffix}`;
    }

    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    this.usedNames.add(name);
    return name;
  }

  /**
   * Release a bot name back to the pool
   */
  releaseBotName(name: string): void {
    this.usedNames.delete(name);
  }

  /**
   * Generate a random personality for the bot
   */
  private generatePersonality(): BotPersonality {
    return {
      aggression: 0.3 + Math.random() * 0.4, // 0.3-0.7 (average)
      bluffing: 0.1 + Math.random() * 0.3,   // 0.1-0.4 (conservative)
      caution: 0.4 + Math.random() * 0.3,    // 0.4-0.7 (cautious)
      patience: 0.3 + Math.random() * 0.6    // 0.3-0.9 (varied)
    };
  }

  /**
   * Get a random avatar for the bot
   */
  private getRandomAvatar(): string {
    const avatars = [
      '👨', '👩', '🧑', '👦', '👧',
      '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '🧔'
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  /**
   * Decide if bot should see their cards (based on patience and round)
   */
  shouldSeeCards(player: any, roundCount: number): boolean {
    const personality = player.playerInfo.botPersonality as BotPersonality;
    
    // More patient bots wait longer
    const seeThreshold = 0.5 - (personality.patience * 0.3);
    const roundFactor = Math.min(roundCount / 5, 1); // Increase likelihood as rounds progress
    
    return Math.random() < (seeThreshold + roundFactor * 0.4);
  }

  /**
   * Decide bot's betting action based on hand strength and personality
   */
  decideBettingAction(
    player: any,
    table: Table,
    handStrength: number // 0-1, where 1 is best possible hand
  ): { action: 'fold' | 'call' | 'raise'; raiseAmount?: number } {
    const personality = player.playerInfo.botPersonality as BotPersonality;
    const currentBet = table.lastBet || table.config.bootAmount;
    const isBlind = player.cardSet?.closed || false;

    // Calculate decision thresholds
    const foldThreshold = 0.2 + (personality.caution * 0.3);
    const raiseThreshold = 0.6 - (personality.aggression * 0.2);

    // Add bluffing factor
    const bluffBonus = Math.random() < personality.bluffing ? 0.3 : 0;
    const adjustedStrength = Math.min(handStrength + bluffBonus, 1);

    // Blind players are more cautious
    const strengthMultiplier = isBlind ? 0.7 : 1;
    const finalStrength = adjustedStrength * strengthMultiplier;

    // Decide action
    if (finalStrength < foldThreshold) {
      return { action: 'fold' };
    } else if (finalStrength > raiseThreshold || Math.random() < personality.aggression * 0.3) {
      // Decide raise amount (1-3 times current bet)
      const raiseMultiplier = isBlind ? 2 : (2 + Math.floor(Math.random() * 2));
      const raiseAmount = currentBet * raiseMultiplier;
      
      // Check if bot has enough chips
      if (player.playerInfo.chips >= raiseAmount) {
        return { action: 'raise', raiseAmount };
      }
      return { action: 'call' };
    } else {
      return { action: 'call' };
    }
  }

  /**
   * Calculate hand strength based on cards
   * This is a simplified version - returns a value between 0-1
   */
  calculateHandStrength(handRank: HandRank, highCard: number): number {
    // HandRank values: 1=High Card, 2=Pair, 3=Flush, 4=Straight, 5=Three of Kind, 6=Straight Flush, 7=Trail
    const rankValues: { [key: number]: number } = {
      1: 0.2, // High Card
      2: 0.4, // Pair
      3: 0.6, // Flush
      4: 0.7, // Straight
      5: 0.8, // Three of a Kind
      6: 0.9, // Straight Flush
      7: 1.0  // Trail (best)
    };

    const baseStrength = rankValues[handRank] || 0.2;
    
    // Adjust based on high card (Ace=14, King=13, etc.)
    const cardBonus = (highCard - 2) / 12 * 0.1; // Max 0.1 bonus
    
    return Math.min(baseStrength + cardBonus, 1);
  }

  /**
   * Add thinking delay to make bot behavior more natural (in milliseconds)
   */
  getThinkingDelay(): number {
    // Random delay between 800ms and 2500ms
    return 800 + Math.random() * 1700;
  }

  /**
   * Check if this player is an autonomous bot
   */
  isAutonomousBot(player: any): boolean {
    return player?.playerInfo?.userId?.startsWith('autobot_') || false;
  }

  /**
   * Get all autonomous bots from a table
   */
  getTableBots(table: Table): any[] {
    return table.getPlayers().filter(player => this.isAutonomousBot(player));
  }

  /**
   * Get human player count in a table
   */
  getHumanPlayerCount(table: Table): number {
    return table.getPlayers().filter(player => !this.isAutonomousBot(player)).length;
  }
}

export const autonomousBotService = new AutonomousBotService();
