import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import './AdminTips.css';

interface Tip {
  tipId: string;
  tableId: number;
  playerId: string;
  playerName: string;
  amount: number;
  gameMode: 'trial' | 'token';
  roundNumber: number;
  timestamp: string;
  cardQuality?: string;
}

const AdminTips: React.FC = () => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // Pagination calculations
  const totalPages = Math.ceil(tips.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTips = tips.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const tips = await apiFetch('/admin/tips?limit=100');
      
      setTips(tips);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching tips:', err);
      setError(err.response?.data?.error || 'Failed to fetch tips');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString();
  };

  if (loading) {
    return <div className="admin-tips-loading">Loading tips...</div>;
  }

  if (error) {
    return <div className="admin-tips-error">Error: {error}</div>;
  }

  return (
    <div className="admin-tips-container">
      <h1>💰 Tips & Earnings Management</h1>

      {/* Tips Table */}
      <div className="tips-section">
        <h2>Tips History ({tips.length})</h2>
        {tips.length === 0 ? (
          <p className="no-tips">No tips received yet</p>
        ) : (
          <>
            <div className="tips-table-container">
              <table className="tips-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Player Name</th>
                    <th>Player ID</th>
                    <th>Amount</th>
                    <th>Game Mode</th>
                    <th>Table ID</th>
                    <th>Round</th>
                    <th>Card Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTips.map((tip) => (
                    <tr key={tip.tipId}>
                      <td>{formatDate(tip.timestamp)}</td>
                      <td className="player-name">{tip.playerName}</td>
                      <td className="player-id">{tip.playerId.substring(0, 8)}...</td>
                      <td className="tip-amount">₹{formatCurrency(tip.amount)}</td>
                      <td>
                        <span className={`mode-badge ${tip.gameMode}`}>
                          {tip.gameMode.toUpperCase()}
                        </span>
                      </td>
                      <td>{tip.tableId}</td>
                      <td>{tip.roundNumber}</td>
                      <td>
                        <span className="card-quality">{tip.cardQuality || 'regular'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                <div className="page-info">
                  Page {currentPage} of {totalPages} ({tips.length} total)
                </div>
                
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminTips;
