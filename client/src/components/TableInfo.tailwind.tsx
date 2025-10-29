import type { TableState } from '../types/game.types';
import { tableStyles, cn } from '../utils/tailwindClasses';

interface TableInfoProps {
  table: TableState;
}

/**
 * TableInfo Component - Tailwind CSS Version
 * Shows game configuration and current state
 */
function TableInfo({ table }: TableInfoProps) {
  if (!table) return null;

  return (
    <div className={cn(
      tableStyles.infoPanel,
      "space-y-3"
    )}>
      {/* Boot Amount */}
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">Boot Amount:</span>
        <span className="text-white font-bold text-lg">${table.config.bootAmount}</span>
      </div>

      {/* Min Bet */}
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">Min Bet:</span>
        <span className="text-white font-bold text-lg">${table.config.minBet}</span>
      </div>

      {/* Max Bet */}
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">Max Bet:</span>
        <span className="text-white font-bold text-lg">${table.config.maxBet}</span>
      </div>

      {/* Current Pot - Highlighted */}
      <div className={cn(
        "flex justify-between items-center",
        "bg-gradient-to-r from-yellow-600/20 to-yellow-700/20",
        "p-3 -mx-2 rounded-lg border border-casino-gold/30"
      )}>
        <span className="text-casino-gold text-sm font-semibold">Current Pot:</span>
        <span className="text-casino-gold font-bold text-2xl drop-shadow-glow">
          ${table.pot.toLocaleString()}
        </span>
      </div>

      {/* Round Number */}
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">Round:</span>
        <span className="text-white font-bold text-lg">#{table.roundCount}</span>
      </div>
    </div>
  );
}

export default TableInfo;
