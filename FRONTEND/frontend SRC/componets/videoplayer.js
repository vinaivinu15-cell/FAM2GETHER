import React, { useState, useRef, useEffect } from 'react';
import './VideoPlayer.css';

function VideoPlayer({ videoId, onVideoChange, onPlay, onPause, onSeek, socket }) {
  const [inputVideoId, setInputVideoId] = useState('');
  const playerRef = useRef(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handleVideoPlay = (data) => {
      if (data.triggeredBy === socket.id) return;
      
      isSyncingRef.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = data.currentTime;
        playerRef.current.play().catch(console.error);
      }
      setTimeout(() => { isSyncingRef.current = false; }, 100);
    };

    const handleVideoPause = (data) => {
      if (data.triggeredBy === socket.id) return;
      
      isSyncingRef.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = data.currentTime;
        playerRef.current.pause();
      }
      setTimeout(() => { isSyncingRef.current = false; }, 100);
    };

    const handleVideoSeek = (data) => {
      if (data.triggeredBy === socket.id) return;
      
      isSyncingRef.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = data.currentTime;
      }
      setTimeout(() => { isSyncingRef.current = false; }, 100);
    };

    const handleVideoChange = (data) => {
      if (data.triggeredBy === socket.id) return;
      onVideoChange(data.videoId);
    };

    socket.on('video-play', handleVideoPlay);
    socket.on('video-pause', handleVideoPause);
    socket.on('video-seek', handleVideoSeek);
    socket.on('video-change', handleVideoChange);

    return () => {
      socket.off('video-play', handleVideoPlay);
      socket.off('video-pause', handleVideoPause);
      socket.off('video-seek', handleVideoSeek);
      socket.off('video-change', handleVideoChange);
    };
  }, [socket, onVideoChange]);

  const loadVideo = () => {
    if (inputVideoId.trim()) {
      onVideoChange(inputVideoId.trim());
      setInputVideoId('');
    }
  };

  const handlePlay = () => {
    if (isSyncingRef.current) return;
    if (playerRef.current) {
      onPlay(playerRef.current.currentTime);
    }
  };

  const handlePause = () => {
    if (isSyncingRef.current) return;
    if (playerRef.current) {
      onPause(playerRef.current.currentTime);
    }
  };

  const handleSeek = () => {
    if (isSyncingRef.current) return;
    if (playerRef.current) {
      onSeek(playerRef.current.currentTime);
    }
  };

  return (
    <div className="video-player">
      <div className="video-input">
        <input
          type="text"
          placeholder="Enter YouTube Video ID"
          value={inputVideoId}
          onChange={(e) => setInputVideoId(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && loadVideo()}
        />
        <button onClick={loadVideo}>Load Video</button>
      </div>

      {videoId && (
        <div className="video-container">
          <iframe
            ref={playerRef}
            width="100%"
            height="400"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onPlay={handlePlay}
            onPause={handlePause}
            onSeeked={handleSeek}
          ></iframe>
        </div>
      )}

      {!videoId && (
        <div className="video-placeholder">
          <p>Enter a YouTube Video ID above to start watching</p>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;