import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/tables
 * Get available game tables
 * Query params: mode=practice|real
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { mode } = req.query as { mode?: string };

    if (!mode) {
      return res.status(400).json({ error: 'Missing mode. Use "coins"|"cash" (or legacy "practice"|"real")' });
    }

    // Accept both new (coins/cash) and legacy (practice/real) names
    const normalized =
      mode === 'coins' ? 'coins' :
      mode === 'cash' ? 'cash' :
      mode === 'practice' ? 'coins' :
      mode === 'real' ? 'cash' :
      null;

    if (!normalized) {
      return res.status(400).json({ error: 'Invalid mode. Use "coins" or "cash"' });
    }

    // For now, return mock data
    // TODO: Later integrate with actual game tables from database
    const isCoins = normalized === 'coins';
    const tables = [
      {
        id: `${normalized}-1`,
        name: `Teen Patti ${isCoins ? 'Coins' : 'Cash'}`,
        bootAmount: 1,
        minBet: 1,
        maxBet: 128,
        players: 0,
        maxPlayers: 5,
        gameMode: normalized, // coins | cash
        status: 'waiting',
      },
    ];

    res.json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

/**
 * GET /api/tables/:tableId
 * Get specific table details
 */
router.get('/:tableId', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    
    // TODO: Fetch from database
    // For now, return mock data
    const table = {
      id: tableId,
      name: `Table ${tableId}`,
      bootAmount: 100,
      minBet: 100,
      maxBet: 10000,
      players: 0,
      maxPlayers: 5,
      gameMode: 'practice',
      status: 'waiting',
    };

    res.json({ table });
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

export default router;
