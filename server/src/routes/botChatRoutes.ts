import express from 'express';
import BotChatService, { ChatContext } from '../services/BotChatService.js';
import { BotBlueprintRepository } from '../repositories/BotBlueprintRepository.js';
import { authenticate, verifyAdmin } from '../middleware/adminAuth.js';
import { adminBotRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const botBlueprintRepo = new BotBlueprintRepository();

// Apply authentication and admin verification to all routes
router.use(authenticate);
router.use(verifyAdmin);
router.use(adminBotRateLimiter);

/**
 * GET /api/admin/bot-chat/contexts
 * Get all available chat contexts
 */
router.get('/contexts', (req, res) => {
  try {
    const contexts = BotChatService.getAvailableContexts();
    
    res.json({
      success: true,
      count: contexts.length,
      contexts
    });
  } catch (error: any) {
    console.error('Error fetching chat contexts:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/bot-chat/preview
 * Preview messages for a specific bot blueprint and context
 * Body: { 
 *   blueprint_id: string,
 *   context: string (ChatContext enum value),
 *   count?: number (default 3)
 * }
 */
router.post('/preview', async (req, res) => {
  try {
    const { blueprint_id, context, count = 3 } = req.body;

    if (!blueprint_id || !context) {
      return res.status(400).json({
        error: 'blueprint_id and context are required'
      });
    }

    const blueprint = await botBlueprintRepo.findById(blueprint_id);
    if (!blueprint) {
      return res.status(404).json({
        error: 'Blueprint not found'
      });
    }

    // Validate context
    if (!Object.values(ChatContext).includes(context as ChatContext)) {
      return res.status(400).json({
        error: 'Invalid context',
        available_contexts: BotChatService.getAvailableContexts()
      });
    }

    const messages = BotChatService.getMessageOptions(
      blueprint.behavior_profile,
      context as ChatContext,
      count
    );

    const personalityType = BotChatService.getPersonalityTypeName(blueprint.behavior_profile);

    res.json({
      success: true,
      blueprint: {
        id: blueprint.bot_blueprint_id,
        name: blueprint.display_name_template,
        personality_type: personalityType
      },
      context,
      message_count: messages.length,
      messages
    });
  } catch (error: any) {
    console.error('Error generating message preview:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/bot-chat/generate
 * Generate a single message for a blueprint and context
 * Body: {
 *   blueprint_id: string,
 *   context: string,
 *   force_message?: boolean,
 *   custom_probability?: number (0-100)
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const { blueprint_id, context, force_message = false, custom_probability } = req.body;

    if (!blueprint_id || !context) {
      return res.status(400).json({
        error: 'blueprint_id and context are required'
      });
    }

    const blueprint = await botBlueprintRepo.findById(blueprint_id);
    if (!blueprint) {
      return res.status(404).json({
        error: 'Blueprint not found'
      });
    }

    // Validate context
    if (!Object.values(ChatContext).includes(context as ChatContext)) {
      return res.status(400).json({
        error: 'Invalid context',
        available_contexts: BotChatService.getAvailableContexts()
      });
    }

    const message = BotChatService.generateMessage(
      blueprint.behavior_profile,
      context as ChatContext,
      {
        forceMessage: force_message,
        customProbability: custom_probability
      }
    );

    const personalityType = BotChatService.getPersonalityTypeName(blueprint.behavior_profile);

    res.json({
      success: true,
      blueprint: {
        id: blueprint.bot_blueprint_id,
        name: blueprint.display_name_template,
        personality_type: personalityType
      },
      context,
      message: message || null,
      sent: message !== null
    });
  } catch (error: any) {
    console.error('Error generating message:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/bot-chat/test/:blueprintId
 * Get a comprehensive test of all contexts for a blueprint
 */
router.get('/test/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;

    const blueprint = await botBlueprintRepo.findById(blueprintId);
    if (!blueprint) {
      return res.status(404).json({
        error: 'Blueprint not found'
      });
    }

    const personalityType = BotChatService.getPersonalityTypeName(blueprint.behavior_profile);
    const contexts = BotChatService.getAvailableContexts();

    const contextMessages: Record<string, string[]> = {};
    
    contexts.forEach(context => {
      const messages = BotChatService.getMessageOptions(
        blueprint.behavior_profile,
        context,
        5 // Get up to 5 sample messages per context
      );
      contextMessages[context] = messages;
    });

    res.json({
      success: true,
      blueprint: {
        id: blueprint.bot_blueprint_id,
        name: blueprint.display_name_template,
        personality_type: personalityType,
        behavior_profile: blueprint.behavior_profile
      },
      context_count: contexts.length,
      messages_by_context: contextMessages
    });
  } catch (error: any) {
    console.error('Error testing bot chat:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
