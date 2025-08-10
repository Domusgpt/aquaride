import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const Map = () => {
  const position = [51.505, -0.09]; // Default position
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Any');
  const [requestStatus, setRequestStatus] = useState('');

  const handleRequestRide = (e) => {
    e.preventDefault();
    setRequestStatus('Requesting ride...');
    // Here you would typically send this data to a Firebase Cloud Function
    console.log('Ride Request:', { pickup, dropoff, boatType });
    setTimeout(() => {
      setRequestStatus('Ride requested! Waiting for captain...');
    }, 2000);
  };

  return (
    <div className="map-container">
      <div className="map-overlay"></div>
      <div className="map-controls">
        <h3>Request a Ride</h3>
        <form onSubmit={handleRequestRide}>
          <div className="form-group">
            <label>Pickup</label>
            <input type="text" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Enter pickup location" />
          </div>
          <div className="form-group">
            <label>Dropoff</label>
            <input type="text" value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="Enter dropoff location" />
          </div>
          <div className="form-group">
            <label>Boat Type</label>
            <select value={boatType} onChange={(e) => setBoatType(e.target.value)}>
              <option value="Any">Any</option>
              <option value="Speedboat">Speedboat</option>
              <option value="Yacht">Yacht</option>
              <option value="Sailboat">Sailboat</option>
            </select>
          </div>
          <button type="submit" className="cyber-button">Find a Ride</button>
        </form>
        {requestStatus && <p className="request-status">{requestStatus}</p>}
      </div>
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Map;
