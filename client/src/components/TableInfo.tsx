import type { TableState } from '../types/game.types';
import './TableInfo.css';

interface TableInfoProps {
  table: TableState;
}

function TableInfo({ table }: TableInfoProps) {
  if (!table) return null;

  return (
    <div className="table-info-container">
      <div className="info-item">
        <span className="info-label">Boot Amount:</span>
        <span className="info-value">${table.config.bootAmount}</span>
      </div>
      <div className="info-item">
        <span className="info-label">Min Bet:</span>
        <span className="info-value">${table.config.minBet}</span>
      </div>
      <div className="info-item">
        <span className="info-label">Max Bet:</span>
        <span className="info-value">${table.config.maxBet}</span>
      </div>
      <div className="info-item highlight">
        <span className="info-label">Current Pot:</span>
        <span className="info-value pot-amount">${table.pot.toLocaleString()}</span>
      </div>
      <div className="info-item">
        <span className="info-label">Round:</span>
        <span className="info-value">#{table.roundCount}</span>
      </div>
    </div>
  );
}

export default TableInfo;
