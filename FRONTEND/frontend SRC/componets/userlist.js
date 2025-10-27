import React from 'react';
import './UserList.css';

function UserList({ users }) {
  return (
    <div className="user-list">
      <h3>Online Users ({users.length})</h3>
      <div className="users">
        {users.map(user => (
          <div key={user.id} className="user">
            <div className="user-status"></div>
            <span>{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserList;