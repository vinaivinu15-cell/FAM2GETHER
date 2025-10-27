import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoomPage from './pages/RoomPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room/:roomCode" element={<RoomPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;