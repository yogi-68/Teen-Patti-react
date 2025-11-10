import { BehaviorProfile } from '../models/BotBlueprint.js';

/**
 * Message contexts for bot chat
 */
export enum ChatContext {
  GAME_START = 'game_start',
  STRONG_HAND = 'strong_hand',
  WEAK_HAND = 'weak_hand',
  BIG_WIN = 'big_win',
  BIG_LOSS = 'big_loss',
  FOLD = 'fold',
  RAISE = 'raise',
  BLUFF = 'bluff',
  SIDE_SHOW = 'side_show',
  SHOW = 'show',
  OPPONENT_FOLD = 'opponent_fold',
  LOW_CHIPS = 'low_chips',
  CONFIDENT = 'confident',
  CAUTIOUS = 'cautious'
}

/**
 * Personality types derived from behavior profile
 */
export enum PersonalityType {
  CONSERVATIVE = 'conservative',
  AGGRESSIVE = 'aggressive',
  BALANCED = 'balanced',
  BEGINNER = 'beginner'
}

/**
 * Message templates organized by personality and context
 */
const MESSAGE_TEMPLATES: Record<PersonalityType, Record<ChatContext, string[]>> = {
  [PersonalityType.CONSERVATIVE]: {
    [ChatContext.GAME_START]: [
      "Let's play it safe this round.",
      "I prefer steady progress over risky moves.",
      "Good luck everyone. Let's have a fair game.",
      "I'm here for a calm game.",
      "Let's keep it simple."
    ],
    [ChatContext.STRONG_HAND]: [
      "I have a decent feeling about this.",
      "This might be worth considering.",
      "Interesting cards...",
      "Let's see where this goes."
    ],
    [ChatContext.WEAK_HAND]: [
      "Not my best hand.",
      "I'll be careful here.",
      "Let me think about this.",
      "Playing it safe."
    ],
    [ChatContext.BIG_WIN]: [
      "Nice! That worked out well.",
      "A pleasant surprise.",
      "That was a good round.",
      "Steady wins the race."
    ],
    [ChatContext.BIG_LOSS]: [
      "That's unfortunate. Moving on.",
      "Can't win them all.",
      "I'll be more careful next time.",
      "Back to basics."
    ],
    [ChatContext.FOLD]: [
      "I'll sit this one out.",
      "Not worth the risk.",
      "Better safe than sorry.",
      "I'll pass."
    ],
    [ChatContext.RAISE]: [
      "Let's add a bit more.",
      "I think this is fair.",
      "Raising modestly.",
      "A small increase."
    ],
    [ChatContext.BLUFF]: [
      "Hmm...",
      "Let me think...",
      "Interesting situation.",
      ""
    ],
    [ChatContext.SIDE_SHOW]: [
      "Let's compare hands.",
      "Curious to see your cards.",
      "Show me what you've got.",
      "Let's settle this."
    ],
    [ChatContext.SHOW]: [
      "Time to reveal.",
      "Here are my cards.",
      "Let's see...",
      "Showing my hand."
    ],
    [ChatContext.OPPONENT_FOLD]: [
      "Moving forward.",
      "Alright then.",
      "Next hand.",
      ""
    ],
    [ChatContext.LOW_CHIPS]: [
      "Need to be more careful now.",
      "Running a bit low.",
      "Time to play smart.",
      "Every chip counts."
    ],
    [ChatContext.CONFIDENT]: [
      "I like my chances.",
      "Feeling good about this.",
      "This looks promising.",
      ""
    ],
    [ChatContext.CAUTIOUS]: [
      "Let's be careful.",
      "Taking it slow.",
      "One step at a time.",
      ""
    ]
  },

  [PersonalityType.AGGRESSIVE]: {
    [ChatContext.GAME_START]: [
      "Let's get this party started! 🔥",
      "Time to dominate!",
      "Ready to go all out!",
      "Let's make this exciting!",
      "Bring it on!"
    ],
    [ChatContext.STRONG_HAND]: [
      "This is MY round!",
      "You're all in trouble! 💪",
      "Feeling unstoppable!",
      "Time to collect some chips!",
      "Let's raise the stakes!"
    ],
    [ChatContext.WEAK_HAND]: [
      "Still not backing down!",
      "I can turn this around.",
      "Let's make it interesting anyway.",
      "Weak hand? I'll make it work."
    ],
    [ChatContext.BIG_WIN]: [
      "BOOM! That's how it's done! 💰",
      "Too easy!",
      "Who's next?",
      "Keep them coming!",
      "Victory tastes sweet!"
    ],
    [ChatContext.BIG_LOSS]: [
      "Just warming up!",
      "I'll get it back double!",
      "One setback won't stop me!",
      "Watch me bounce back!"
    ],
    [ChatContext.FOLD]: [
      "Fine, I'll sit out... for now.",
      "Saving energy for the next round.",
      "You got lucky.",
      "Don't get comfortable."
    ],
    [ChatContext.RAISE]: [
      "Let's make this REAL!",
      "Time to separate the weak from the strong!",
      "Going BIG!",
      "All or nothing!",
      "Can you handle this?"
    ],
    [ChatContext.BLUFF]: [
      "Try me. 😎",
      "I dare you to call!",
      "Feeling confident!",
      "You don't want to test me."
    ],
    [ChatContext.SIDE_SHOW]: [
      "Let's settle this RIGHT NOW!",
      "Face me!",
      "I'm not afraid!",
      "Show me what you got!"
    ],
    [ChatContext.SHOW]: [
      "BOOM! Read them and weep!",
      "Check this out!",
      "Told you!",
      "This is how it's done!"
    ],
    [ChatContext.OPPONENT_FOLD]: [
      "Smart move.",
      "That's what I thought!",
      "Next victim!",
      "Who else wants some?"
    ],
    [ChatContext.LOW_CHIPS]: [
      "Perfect! Time for a comeback!",
      "This just makes it more fun!",
      "Watch me climb back!",
      "Low chips, high spirit!"
    ],
    [ChatContext.CONFIDENT]: [
      "I own this table!",
      "Unstoppable!",
      "This is my game!",
      "Easy money!"
    ],
    [ChatContext.CAUTIOUS]: [
      "Even I need to think sometimes.",
      "Strategic pause.",
      "Calculating my next move.",
      ""
    ]
  },

  [PersonalityType.BALANCED]: {
    [ChatContext.GAME_START]: [
      "Good luck everyone!",
      "Let's have a good game.",
      "May the best hand win.",
      "Ready to play.",
      "Let's do this!"
    ],
    [ChatContext.STRONG_HAND]: [
      "This looks good.",
      "I like these cards.",
      "Worth playing.",
      "Solid hand."
    ],
    [ChatContext.WEAK_HAND]: [
      "Not ideal, but manageable.",
      "Let's see how this plays out.",
      "Could be worse.",
      "I'll work with this."
    ],
    [ChatContext.BIG_WIN]: [
      "Nice! Great round!",
      "That went well!",
      "Solid win!",
      "Good game!"
    ],
    [ChatContext.BIG_LOSS]: [
      "Tough break.",
      "That happens.",
      "On to the next one.",
      "Can't win them all."
    ],
    [ChatContext.FOLD]: [
      "I'm out this round.",
      "Folding.",
      "Not worth it.",
      "I'll pass."
    ],
    [ChatContext.RAISE]: [
      "Let's raise it up.",
      "Adding more to the pot.",
      "Raising the stakes.",
      "Increasing my bet."
    ],
    [ChatContext.BLUFF]: [
      "Interesting...",
      "Let's see...",
      "Hmm.",
      ""
    ],
    [ChatContext.SIDE_SHOW]: [
      "Let's compare.",
      "Show your hand.",
      "Side show time.",
      "Let's see who wins."
    ],
    [ChatContext.SHOW]: [
      "Here's my hand.",
      "Showing cards.",
      "Time to reveal.",
      "Let's see..."
    ],
    [ChatContext.OPPONENT_FOLD]: [
      "Alright.",
      "Moving on.",
      "Next round.",
      ""
    ],
    [ChatContext.LOW_CHIPS]: [
      "Need to play smart.",
      "Running low on chips.",
      "Time to be strategic.",
      "Playing carefully."
    ],
    [ChatContext.CONFIDENT]: [
      "Feeling good.",
      "This is promising.",
      "I like my odds.",
      ""
    ],
    [ChatContext.CAUTIOUS]: [
      "Being careful here.",
      "Taking my time.",
      "Thinking it through.",
      ""
    ]
  },

  [PersonalityType.BEGINNER]: {
    [ChatContext.GAME_START]: [
      "Still learning, go easy on me! 😅",
      "Hope I don't mess up!",
      "Let's see how this goes...",
      "Wish me luck!",
      "Is it my turn yet?"
    ],
    [ChatContext.STRONG_HAND]: [
      "Are these good cards?",
      "I think I have something!",
      "This might be good!",
      "Is this a strong hand?"
    ],
    [ChatContext.WEAK_HAND]: [
      "I don't think these are good...",
      "Uh oh, not sure about this.",
      "These don't look great.",
      "What do I do with these?"
    ],
    [ChatContext.BIG_WIN]: [
      "OMG I won! 🎉",
      "Really? I won?!",
      "I can't believe it!",
      "Was that good?",
      "Yay!"
    ],
    [ChatContext.BIG_LOSS]: [
      "Oops...",
      "What did I do wrong?",
      "I'll try better next time.",
      "Sorry, still learning!"
    ],
    [ChatContext.FOLD]: [
      "I think I should fold...",
      "Is folding okay here?",
      "I'm out.",
      "Too risky for me."
    ],
    [ChatContext.RAISE]: [
      "Um... raising?",
      "Hope this is right...",
      "Let me try raising.",
      "Is this too much?"
    ],
    [ChatContext.BLUFF]: [
      "...",
      "Umm...",
      "Uh...",
      ""
    ],
    [ChatContext.SIDE_SHOW]: [
      "Can we compare cards?",
      "Side show, right?",
      "Let's see who has better cards.",
      "Is this how it works?"
    ],
    [ChatContext.SHOW]: [
      "Here are my cards!",
      "Am I doing this right?",
      "Showing now!",
      "Hope these are good!"
    ],
    [ChatContext.OPPONENT_FOLD]: [
      "Did I do something?",
      "Oh, okay!",
      "Yay?",
      ""
    ],
    [ChatContext.LOW_CHIPS]: [
      "Running out of chips! 😰",
      "Is this bad?",
      "Need more chips...",
      "What do I do?"
    ],
    [ChatContext.CONFIDENT]: [
      "I think I'm doing okay!",
      "Maybe I'm getting better?",
      "This feels good!",
      ""
    ],
    [ChatContext.CAUTIOUS]: [
      "Should I be worried?",
      "Let me think...",
      "Not sure about this...",
      ""
    ]
  }
};

/**
 * BotChatService - Generates personality-based chat messages for bots
 */
class BotChatService {
  /**
   * Determine personality type from behavior profile
   */
  private getPersonalityType(profile: BehaviorProfile): PersonalityType {
    // Beginner: low skill level (< 35)
    if (profile.skill_level < 35) {
      return PersonalityType.BEGINNER;
    }

    // Aggressive: high aggressiveness (> 60)
    if (profile.aggressiveness > 60) {
      return PersonalityType.AGGRESSIVE;
    }

    // Conservative: low aggressiveness (< 40) and low risk tolerance (< 45)
    if (profile.aggressiveness < 40 && profile.risk_tolerance < 45) {
      return PersonalityType.CONSERVATIVE;
    }

    // Default: Balanced
    return PersonalityType.BALANCED;
  }

  /**
   * Generate a chat message based on context and personality
   */
  generateMessage(
    profile: BehaviorProfile,
    context: ChatContext,
    options?: {
      customProbability?: number; // 0-100, default varies by context
      forceMessage?: boolean; // Always return a message even if empty string is selected
    }
  ): string | null {
    const personality = this.getPersonalityType(profile);
    const templates = MESSAGE_TEMPLATES[personality][context];

    if (!templates || templates.length === 0) {
      return null;
    }

    // Determine if bot should send a message
    const probability = options?.customProbability ?? this.getDefaultProbability(context);
    const shouldSendMessage = Math.random() * 100 < probability;

    if (!shouldSendMessage && !options?.forceMessage) {
      return null;
    }

    // Select random message from templates
    const randomIndex = Math.floor(Math.random() * templates.length);
    const message = templates[randomIndex];

    // Return null if empty string (bot chooses to stay silent)
    return message === '' ? null : message;
  }

  /**
   * Get default probability for sending a message in this context
   */
  private getDefaultProbability(context: ChatContext): number {
    const probabilities: Record<ChatContext, number> = {
      [ChatContext.GAME_START]: 30,
      [ChatContext.STRONG_HAND]: 40,
      [ChatContext.WEAK_HAND]: 15,
      [ChatContext.BIG_WIN]: 70,
      [ChatContext.BIG_LOSS]: 40,
      [ChatContext.FOLD]: 20,
      [ChatContext.RAISE]: 50,
      [ChatContext.BLUFF]: 60,
      [ChatContext.SIDE_SHOW]: 55,
      [ChatContext.SHOW]: 45,
      [ChatContext.OPPONENT_FOLD]: 25,
      [ChatContext.LOW_CHIPS]: 35,
      [ChatContext.CONFIDENT]: 50,
      [ChatContext.CAUTIOUS]: 20
    };

    return probabilities[context] || 30;
  }

  /**
   * Generate multiple message options for preview/testing
   */
  getMessageOptions(
    profile: BehaviorProfile,
    context: ChatContext,
    count: number = 3
  ): string[] {
    const personality = this.getPersonalityType(profile);
    const templates = MESSAGE_TEMPLATES[personality][context];

    if (!templates || templates.length === 0) {
      return [];
    }

    // Shuffle templates and take 'count' messages
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, templates.length)).filter(msg => msg !== '');
  }

  /**
   * Get all available contexts
   */
  getAvailableContexts(): ChatContext[] {
    return Object.values(ChatContext);
  }

  /**
   * Get personality type for a given behavior profile (for debugging)
   */
  getPersonalityTypeName(profile: BehaviorProfile): string {
    return this.getPersonalityType(profile);
  }
}

export default new BotChatService();
