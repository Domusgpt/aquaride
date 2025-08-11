import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import GoogleMap from './GoogleMap';
import TestGoogleMaps from './TestGoogleMaps';
import Map from './Map';
import Login from './Login';
import Register from './Register';
import './App.css';

function App() {
  return (
    <Router>
      <div>
        <nav className="navbar">
          <div className="navbar-title">AquaRide</div>
          <ul className="navbar-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/map">Google Map</Link>
            </li>
            <li>
              <Link to="/test">Test Maps</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<TestGoogleMaps />} />
          <Route path="/map" element={<GoogleMap />} />
          <Route path="/test" element={<TestGoogleMaps />} />
          <Route path="/leaflet" element={<Map />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
