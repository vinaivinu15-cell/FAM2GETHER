import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import UserList from '../components/UserList';
import SessionTimer from '../components/SessionTimer';
import './RoomPage.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function RoomPage() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  
  const [username] = useState(location.state?.username || 'Anonymous');
  const [users, setUsers] = useState([]);
  const [videoId, setVideoId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [sessionTime, setSessionTime] = useState({});

  useEffect(() => {
    // Connect to Socket.io
    socketRef.current = io(API_BASE);

    socketRef.current.emit('join-room', {
      roomCode,
      username
    });

    socketRef.current.on('room-joined', (data) => {
      setIsConnected(true);
      setUsers(data.users);
      if (data.videoState.videoId) {
        setVideoId(data.videoState.videoId);
      }
    });

    socketRef.current.on('user-joined', (data) => {
      setUsers(data.users);
    });

    socketRef.current.on('user-left', (data) => {
      setUsers(data.users);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message);
      navigate('/');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomCode, username, navigate]);

  const handleVideoChange = (newVideoId) => {
    setVideoId(newVideoId);
    if (socketRef.current) {
      socketRef.current.emit('video-change', { videoId: newVideoId });
    }
  };

  const handleVideoPlay = (currentTime) => {
    if (socketRef.current) {
      socketRef.current.emit('video-play', { currentTime });
    }
  };

  const handleVideoPause = (currentTime) => {
    if (socketRef.current) {
      socketRef.current.emit('video-pause', { currentTime });
    }
  };

  const handleVideoSeek = (currentTime) => {
    if (socketRef.current) {
      socketRef.current.emit('video-seek', { currentTime });
    }
  };

  const checkSessionTime = () => {
    if (socketRef.current) {
      socketRef.current.emit('check-session-time', (data) => {
        setSessionTime(data);
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="room-page">
        <div className="loading">Connecting to room...</div>
      </div>
    );
  }

  return (
    <div className="room-page">
      <div className="room-header">
        <h2>FamilyView Room: {roomCode}</h2>
        <SessionTimer 
          onTimeCheck={checkSessionTime}
          sessionTime={sessionTime}
        />
      </div>

      <div className="room-content">
        <div className="video-section">
          <VideoPlayer
            videoId={videoId}
            onVideoChange={handleVideoChange}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onSeek={handleVideoSeek}
            socket={socketRef.current}
          />
        </div>

        <div className="sidebar">
          <UserList users={users} />
          <Chat socket={socketRef.current} username={username} />
        </div>
      </div>
    </div>
  );
}

export default RoomPage;