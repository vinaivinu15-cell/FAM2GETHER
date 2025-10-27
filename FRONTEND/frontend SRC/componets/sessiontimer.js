import React, { useState, useEffect } from 'react';
import './SessionTimer.css';

function SessionTimer({ onTimeCheck, sessionTime }) {
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds

  useEffect(() => {
    if (sessionTime.freeTimeRemaining) {
      setTimeRemaining(Math.floor(sessionTime.freeTimeRemaining / 1000));
    }
  }, [sessionTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      onTimeCheck();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [onTimeCheck]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const requiresPayment = sessionTime.requiresPayment;

  return (
    <div className="session-timer">
      <div className={`timer-display ${requiresPayment ? 'expired' : ''}`}>
        {requiresPayment ? (
          <div className="payment-required">
            <strong>Time's up! Please pay to continue.</strong>
          </div>
        ) : (
          <div className="time-remaining">
            Free time remaining: <strong>{formatTime(timeRemaining)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionTimer;