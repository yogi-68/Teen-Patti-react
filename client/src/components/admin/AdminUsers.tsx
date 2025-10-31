import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UserItem {
  _id: string;
  username: string;
  email: string;
  coins: number;
  cashBalance: number;
  isAdmin?: boolean;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/admin/users`, {
      headers: {
        'x-user-id': localStorage.getItem('userId') || '',
      },
    })
      .then(r => r.json())
      .then(data => setUsers(data.users || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="admin-users">
      <h2>Users</h2>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Coins</th>
            <th>Cash</th>
            <th>Admin</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.coins}</td>
              <td>₹{u.cashBalance}</td>
              <td>{u.isAdmin ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
