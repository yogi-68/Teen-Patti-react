import express from 'express';
import { BotDecisionEngine, DecisionContext, BotDecision } from '../services/BotDecisionEngine.js';
import { BehaviorProfile } from '../models/BotBlueprint.js';
import { Card } from '../models/Card.js';

const router = express.Router();

/**
 * Test endpoint to demonstrate Bot Decision Engine
 * POST /api/test/bot-decision
 */
router.post('/bot-decision', async (req, res) => {
  try {
    const {
      behaviorProfile,
      context
    } = req.body;

    // Validate behavior profile
    if (!behaviorProfile) {
      return res.status(400).json({
        error: 'behavior_profile is required',
        example: {
          aggressiveness: 0.7,
          risk_tolerance: 60,
          skill_level: 'intermediate',
          reaction_delay_ms: 2000,
          error_rate: 0.1
        }
      });
    }

    // Validate context
    if (!context) {
      return res.status(400).json({
        error: 'context is required',
        example: {
          currentBet: 10,
          pot: 50,
          boot: 5,
          lastBlind: true,
          botBalance: 1000,
          botCards: [], // Use Card constructor: new Card('heart', 1)
          hasSeenCards: true,
          totalBetSoFar: 10,
          activePlayers: 3,
          foldedPlayers: 1,
          totalPlayers: 4,
          roundNumber: 5,
          potLimit: 2048,
          isPotLimitClose: false
        }
      });
    }

    // Make decision
    const decision = await BotDecisionEngine.makeDecision(
      behaviorProfile as BehaviorProfile,
      context as DecisionContext
    );

    res.json({
      success: true,
      decision,
      behaviorProfile,
      context
    });
  } catch (error: any) {
    console.error('Error in bot decision test:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Test endpoint with sample scenarios
 * GET /api/test/bot-scenarios
 */
router.get('/bot-scenarios', async (req, res) => {
  try {
    const scenarios = [];

    // Scenario 1: Aggressive bot with strong hand (Trail - AAA)
    const aggressiveStrong = await BotDecisionEngine.makeDecision(
      {
        aggressiveness: 0.9,
        risk_tolerance: 80,
        skill_level: 80, // expert level
        reaction_delay_ms: 1000,
        error_rate: 0.05
      },
      {
        currentBet: 10,
        pot: 100,
        boot: 5,
        lastBlind: false,
        botBalance: 1000,
        botCards: [
          new Card('heart', 1), // Ace
          new Card('spade', 1), // Ace
          new Card('diamond', 1) // Ace - Trail!
        ],
        hasSeenCards: true,
        totalBetSoFar: 20,
        activePlayers: 2,
        foldedPlayers: 2,
        totalPlayers: 4,
        roundNumber: 10,
        potLimit: 2048,
        isPotLimitClose: false
      }
    );
    scenarios.push({ name: 'Aggressive Bot with Trail (AAA)', decision: aggressiveStrong });

    // Scenario 2: Conservative bot with weak hand (High Card - 2-5-9)
    const conservativeWeak = await BotDecisionEngine.makeDecision(
      {
        aggressiveness: 0.2,
        risk_tolerance: 30,
        skill_level: 30, // beginner level
        reaction_delay_ms: 3000,
        error_rate: 0.15
      },
      {
        currentBet: 50,
        pot: 200,
        boot: 5,
        lastBlind: false,
        botBalance: 500,
        botCards: [
          new Card('heart', 2),
          new Card('club', 5),
          new Card('diamond', 9)
        ],
        hasSeenCards: true,
        totalBetSoFar: 50,
        activePlayers: 3,
        foldedPlayers: 1,
        totalPlayers: 4,
        roundNumber: 8,
        potLimit: 2048,
        isPotLimitClose: false
      }
    );
    scenarios.push({ name: 'Conservative Bot with High Card (2-5-9)', decision: conservativeWeak });

    // Scenario 3: Bot playing blind
    const blindPlayer = await BotDecisionEngine.makeDecision(
      {
        aggressiveness: 0.5,
        risk_tolerance: 50,
        skill_level: 50, // intermediate level
        reaction_delay_ms: 2000,
        error_rate: 0.1
      },
      {
        currentBet: 10,
        pot: 30,
        boot: 5,
        lastBlind: true,
        botBalance: 800,
        botCards: [
          new Card('heart', 13), // King
          new Card('spade', 12), // Queen
          new Card('diamond', 11) // Jack
        ],
        hasSeenCards: false, // Playing blind
        totalBetSoFar: 5,
        activePlayers: 4,
        foldedPlayers: 0,
        totalPlayers: 4,
        roundNumber: 3,
        potLimit: 2048,
        isPotLimitClose: false
      }
    );
    scenarios.push({ name: 'Balanced Bot Playing Blind', decision: blindPlayer });

    // Scenario 4: Bot with medium hand (Pair - 99K), high pot
    const mediumHandHighPot = await BotDecisionEngine.makeDecision(
      {
        aggressiveness: 0.6,
        risk_tolerance: 55,
        skill_level: 55, // intermediate level
        reaction_delay_ms: 1500,
        error_rate: 0.08
      },
      {
        currentBet: 20,
        pot: 500,
        boot: 5,
        lastBlind: false,
        botBalance: 1500,
        botCards: [
          new Card('heart', 9),
          new Card('club', 9),
          new Card('diamond', 13) // Pair of 9s
        ],
        hasSeenCards: true,
        totalBetSoFar: 60,
        activePlayers: 2,
        foldedPlayers: 2,
        totalPlayers: 4,
        roundNumber: 15,
        potLimit: 2048,
        isPotLimitClose: false
      }
    );
    scenarios.push({ name: 'Bot with Pair (99K), High Pot', decision: mediumHandHighPot });

    res.json({
      success: true,
      scenarios,
      description: 'Sample bot decision scenarios demonstrating different behavior profiles and game states'
    });
  } catch (error: any) {
    console.error('Error in bot scenarios test:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
