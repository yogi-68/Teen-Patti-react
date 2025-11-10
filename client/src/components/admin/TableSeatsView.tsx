/**
 * TableSeatsView Component
 * Displays tables with 6 seat slots showing occupant details
 */

import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

interface Seat {
  seat_index: number;
  occupant_type: 'empty' | 'human' | 'bot';
  occupant_id: string | null;
  occupant_name: string | null;
  occupant_avatar: string | null;
  version: number;
  locked_until?: Date | null;
  lock_token?: string | null;
}

interface TableStats {
  empty: number;
  human: number;
  bot: number;
  total: number;
}

interface Table {
  table_id: number;
  seats: Seat[];
  stats: TableStats;
}

const TableSeatsView: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  useEffect(() => {
    fetchTables();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/tables`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTables(data.tables || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tables');
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeatColor = (occupant_type: string): string => {
    switch (occupant_type) {
      case 'empty':
        return 'bg-gray-200 border-gray-300';
      case 'human':
        return 'bg-blue-100 border-blue-400';
      case 'bot':
        return 'bg-green-100 border-green-400';
      default:
        return 'bg-gray-200 border-gray-300';
    }
  };

  const getSeatIcon = (occupant_type: string): string => {
    switch (occupant_type) {
      case 'human':
        return '👤';
      case 'bot':
        return '🤖';
      default:
        return '⚪';
    }
  };

  const renderSeat = (seat: Seat, tableId: number) => {
    const isLocked = !!(seat.locked_until && new Date(seat.locked_until) > new Date());
    
    return (
      <div
        key={seat.seat_index}
        className={`relative p-4 rounded-lg border-2 ${getSeatColor(seat.occupant_type)} transition-all hover:shadow-md`}
      >
        {/* Seat Number */}
        <div className="absolute top-1 left-2 text-xs font-bold text-gray-500">
          #{seat.seat_index}
        </div>

        {/* Lock Indicator */}
        {isLocked && (
          <div className="absolute top-1 right-2 text-red-500" title="Seat is locked">
            🔒
          </div>
        )}

        {/* Occupant Info */}
        <div className="flex flex-col items-center space-y-2 mt-2">
          {/* Avatar */}
          {seat.occupant_avatar ? (
            <img
              src={seat.occupant_avatar}
              alt={seat.occupant_name || 'Avatar'}
              className="w-16 h-16 rounded-full border-2 border-gray-300"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/64?text=NA';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-3xl">
              {getSeatIcon(seat.occupant_type)}
            </div>
          )}

          {/* Name */}
          <div className="text-center">
            <p className="font-semibold text-sm">
              {seat.occupant_name || 'Empty Seat'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {seat.occupant_type}
            </p>
          </div>

          {/* Version */}
          <div className="text-xs text-gray-400">
            v{seat.version}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {seat.occupant_type === 'empty' && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('assignBot', { 
                detail: { tableId, seatIndex: seat.seat_index }
              }))}
              className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              disabled={isLocked}
            >
              + Bot
            </button>
          )}
          
          {seat.occupant_type === 'bot' && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('removeBot', { 
                detail: { tableId, seatIndex: seat.seat_index }
              }))}
              className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              disabled={isLocked}
            >
              Remove
            </button>
          )}

          {seat.occupant_type === 'bot' && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('rotateIdentity', { 
                detail: { tableId, seatIndex: seat.seat_index, botId: seat.occupant_id }
              }))}
              className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              disabled={isLocked}
              title="Rotate bot identity"
            >
              🔄
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTable = (table: Table) => {
    return (
      <div
        key={table.table_id}
        className={`bg-white rounded-lg shadow-lg p-6 border-2 ${
          selectedTable === table.table_id ? 'border-blue-500' : 'border-gray-200'
        }`}
        onClick={() => setSelectedTable(table.table_id)}
      >
        {/* Table Header */}
        <div className="mb-4 pb-3 border-b">
          <h3 className="text-xl font-bold flex items-center justify-between">
            <span>Table #{table.table_id}</span>
            <div className="flex gap-2 text-sm font-normal">
              <span className="px-2 py-1 bg-gray-100 rounded">
                Empty: {table.stats.empty}
              </span>
              <span className="px-2 py-1 bg-blue-100 rounded">
                Human: {table.stats.human}
              </span>
              <span className="px-2 py-1 bg-green-100 rounded">
                Bot: {table.stats.bot}
              </span>
            </div>
          </h3>
        </div>

        {/* Seats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {table.seats.map((seat) => renderSeat(seat, table.table_id))}
        </div>

        {/* Table Actions */}
        <div className="mt-4 pt-3 border-t flex gap-2">
          <button
            onClick={() => fetchTables()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('fillTable', { 
              detail: { tableId: table.table_id }
            }))}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={table.stats.bot >= 4}
          >
            Fill with Bots
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('clearBots', { 
              detail: { tableId: table.table_id }
            }))}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={table.stats.bot === 0}
          >
            Clear All Bots
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button
          onClick={fetchTables}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold mb-2">Table Management</h2>
        <p className="text-gray-600">
          Manage bot assignments across all tables. Click on seats to view details.
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></div>
            <span>Human</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
            <span>Bot</span>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {tables.length === 0 ? (
          <div className="col-span-full bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">No tables found. Initialize tables first.</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('initializeTables'))}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Initialize Tables
            </button>
          </div>
        ) : (
          tables.map(renderTable)
        )}
      </div>
    </div>
  );
};

export default TableSeatsView;
