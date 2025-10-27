import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function LandingPage() {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!username.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setIsCreating(true);
      const response = await axios.post(`${API_BASE}/api/rooms/create`);
      const newRoomCode = response.data.roomCode;
      navigate(`/room/${newRoomCode}`, { state: { username } });
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim() || !username.trim()) {
      alert('Please enter both room code and your name');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/rooms/${roomCode}/exists`);
      if (response.data.exists) {
        navigate(`/room/${roomCode}`, { state: { username } });
      } else {
        alert('Room not found. Please check the code.');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please try again.');
    }
  };

  return (
    <div className="landing-page">
      <div className="container">
        <h1>FamilyView</h1>
        <p className="subtitle">Watch videos together with family and friends</p>
        
        <div className="input-section">
          <input
            type="text"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="action-buttons">
          <button 
            onClick={createRoom} 
            disabled={isCreating}
            className="btn btn-primary"
          >
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>
          
          <div className="divider">OR</div>
          
          <div className="join-section">
            <input
              type="text"
              placeholder="Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="input-field"
              style={{ marginBottom: '10px' }}
            />
            <button onClick={joinRoom} className="btn btn-secondary">
              Join Existing Room
            </button>
          </div>
        </div>

        <div className="features">
          <h3>Features:</h3>
          <ul>
            <li>✅ Synchronized video playback</li>
            <li>✅ Real-time chat</li>
            <li>✅ No registration required</li>
            <li>✅ Private and secure</li>
            <li>✅ 30 minutes free</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;