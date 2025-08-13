import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function AppMinimal() {
  return (
    <Router>
      <div>
        <h1>AquaRide Test</h1>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/captain" element={<div>Captain Dashboard</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppMinimal;